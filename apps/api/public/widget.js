(function () {
	// ── 1. CONFIG ──────────────────────────────────────────────────────────────
	const config = window.SupportNestConfig || {};
	const API_KEY = config.apiKey;
	const CUSTOMER_TOKEN = config.customerToken || null;
	const BASE_URL = config.baseUrl || "http://localhost:3001";

	if (!API_KEY) {
		console.error("[SupportNest] No apiKey found in window.SupportNestConfig");
		return;
	}

	// ── 2. STATE ───────────────────────────────────────────────────────────────
	let ws = null;
	let reconnectDelay = 1000;
	let widgetConfig = {};
	let isOpen = false;
	let isSending = false;
	let isAuthenticated = false;

	// ── 3. WEBSOCKET ───────────────────────────────────────────────────────────
	function connect() {
		const wsUrl = BASE_URL.replace(/^http/, "ws");
		ws = new WebSocket(`${wsUrl}/widget/ws`);

		ws.onopen = function () {
			reconnectDelay = 1000;
			ws.send(
				JSON.stringify({
					type: "auth",
					payload: { apiKey: API_KEY, customerJwt: CUSTOMER_TOKEN || null },
				}),
			);
		};

		ws.onmessage = function (event) {
			try {
				const envelope = JSON.parse(event.data);
				handleEvent(envelope);
			} catch (e) {
				console.error("[SupportNest] Failed to parse message:", e);
			}
		};

		ws.onclose = function () {
			isAuthenticated = false;
			scheduleReconnect();
		};

		ws.onerror = function (err) {
			console.error("[SupportNest] WebSocket error:", err);
		};
	}

	function scheduleReconnect() {
		setTimeout(function () {
			connect();
		}, reconnectDelay);
		reconnectDelay = Math.min(reconnectDelay * 2, 30000);
	}

	function sendWs(type, payload) {
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			console.warn("[SupportNest] WebSocket not open, cannot send:", type);
			return false;
		}
		ws.send(JSON.stringify({ type, payload }));
		return true;
	}

	// ── 4. EVENT HANDLER ───────────────────────────────────────────────────────
	function handleEvent(envelope) {
		const { type, payload } = envelope;

		switch (type) {
			case "auth_ack": {
				isAuthenticated = true;
				// Apply widget config from server (colors, title, greeting, etc.)
				if (payload.widgetConfig) {
					widgetConfig = payload.widgetConfig;
					applyWidgetConfig();
				}
				// Load conversation history
				loadHistory(payload.history || []);
				// Enable input now that we are connected
				setInputDisabled(false);
				break;
			}

			case "typing": {
				showTyping();
				break;
			}

			case "message_ai": {
				hideTyping();
				appendMessage("ai", payload.message.content);
				// Reset sending state now that the full round-trip is done
				isSending = false;
				var sendBtn = document.getElementById("sn-send-btn");
				var input = document.getElementById("sn-input");
				if (sendBtn && input) {
					sendBtn.disabled = !input.value.trim();
				}
				break;
			}

			case "escalated": {
				hideTyping();
				isSending = false;
				appendSystemMessage("You are now connected with a human agent.");
				break;
			}

			case "error": {
				console.error("[SupportNest] Server error:", payload.message);
				hideTyping();
				isSending = false;
				appendSystemMessage("Something went wrong. Please try again.");
				var sendBtnErr = document.getElementById("sn-send-btn");
				var inputErr = document.getElementById("sn-input");
				if (sendBtnErr && inputErr) {
					sendBtnErr.disabled = !inputErr.value.trim();
				}
				break;
			}

			default:
				console.warn("[SupportNest] Unknown event type:", type);
		}
	}

	// ── 5. HISTORY ─────────────────────────────────────────────────────────────
	function loadHistory(messages) {
		if (!messages || messages.length === 0) return;
		messages.forEach(function (msg) {
			if (msg.role === "CUSTOMER") {
				appendMessage("customer", msg.content);
			} else if (msg.role === "AI" || msg.role === "HUMAN_AGENT") {
				appendMessage("ai", msg.content);
			}
		});
	}

	// ── 6. STYLES ──────────────────────────────────────────────────────────────
	function injectStyles() {
		var style = document.createElement("style");
		style.textContent = `
      #sn-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--sn-accent, #6366f1);
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483647;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      #sn-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 24px rgba(0,0,0,0.25);
      }
      #sn-btn svg { width: 26px; height: 26px; fill: white; }

      #sn-panel {
        position: fixed;
        bottom: 92px;
        right: 24px;
        width: 360px;
        height: 540px;
        border-radius: 16px;
        background: #ffffff;
        box-shadow: 0 8px 40px rgba(0,0,0,0.15);
        display: flex;
        flex-direction: column;
        z-index: 2147483646;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        opacity: 0;
        transform: scale(0.95) translateY(8px);
        pointer-events: none;
        transition: opacity 0.2s ease, transform 0.2s ease;
      }
      #sn-panel.sn-open {
        opacity: 1;
        transform: scale(1) translateY(0);
        pointer-events: all;
      }

      #sn-header {
        background: var(--sn-accent, #6366f1);
        padding: 14px 18px;
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }
      #sn-header-icon {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      #sn-header-icon svg { width: 18px; height: 18px; fill: white; }
      #sn-header-title { color: white; font-weight: 600; font-size: 15px; }
      #sn-header-subtitle { color: rgba(255,255,255,0.72); font-size: 12px; margin-top: 1px; }

      #sn-connecting {
        text-align: center;
        padding: 10px;
        font-size: 12px;
        color: #9ca3af;
        background: #fafafa;
        border-bottom: 1px solid #f3f4f6;
        display: none;
      }
      #sn-connecting.sn-visible { display: block; }

      #sn-messages {
        flex: 1;
        overflow-y: auto;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        scroll-behavior: smooth;
        background: #fafafa;
      }
      #sn-messages::-webkit-scrollbar { width: 4px; }
      #sn-messages::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 99px; }

      .sn-bubble {
        max-width: 78%;
        padding: 10px 14px;
        border-radius: 16px;
        word-wrap: break-word;
        animation: snFadeUp 0.18s ease;
      }
      @keyframes snFadeUp {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .sn-bubble.customer {
        background: var(--sn-accent, #6366f1);
        color: white;
        align-self: flex-end;
        border-bottom-right-radius: 4px;
      }
      .sn-bubble.ai, .sn-bubble.human_agent {
        background: #f3f4f6;
        color: #111827;
        align-self: flex-start;
        border-bottom-left-radius: 4px;
      }
      .sn-bubble.system {
        background: transparent;
        color: #9ca3af;
        font-size: 12px;
        align-self: center;
        text-align: center;
        padding: 4px 8px;
        max-width: 100%;
      }

      #sn-typing {
        display: none;
        align-self: flex-start;
        background: #f3f4f6;
        border-radius: 16px;
        border-bottom-left-radius: 4px;
        padding: 12px 16px;
        gap: 4px;
        align-items: center;
      }
      #sn-typing.sn-visible { display: flex; }
      .sn-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #9ca3af;
        animation: snBounce 1.2s infinite ease-in-out;
      }
      .sn-dot:nth-child(2) { animation-delay: 0.2s; }
      .sn-dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes snBounce {
        0%, 60%, 100% { transform: translateY(0); }
        30%           { transform: translateY(-6px); }
      }

      #sn-input-row {
        padding: 10px 12px;
        border-top: 1px solid #f3f4f6;
        display: flex;
        gap: 8px;
        align-items: flex-end;
        flex-shrink: 0;
        background: white;
      }
      #sn-input {
        flex: 1;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 9px 13px;
        font-size: 14px;
        font-family: inherit;
        line-height: 1.5;
        resize: none;
        outline: none;
        max-height: 100px;
        transition: border-color 0.15s;
        background: white;
        color: #111827;
      }
      #sn-input:focus { border-color: var(--sn-accent, #6366f1); }
      #sn-input::placeholder { color: #9ca3af; }
      #sn-input:disabled { background: #f9fafb; cursor: not-allowed; }

      #sn-send-btn {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: var(--sn-accent, #6366f1);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: opacity 0.15s;
      }
      #sn-send-btn:disabled { opacity: 0.35; cursor: not-allowed; }
      #sn-send-btn svg { width: 18px; height: 18px; fill: white; }
    `;
		document.head.appendChild(style);
	}

	// ── 7. BUILD DOM ───────────────────────────────────────────────────────────
	function buildDOM() {
		document.documentElement.style.setProperty("--sn-accent", "#6366f1");

		var btn = document.createElement("button");
		btn.id = "sn-btn";
		btn.setAttribute("aria-label", "Open support chat");
		btn.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/>
      </svg>
    `;
		btn.addEventListener("click", togglePanel);
		document.body.appendChild(btn);

		var panel = document.createElement("div");
		panel.id = "sn-panel";
		panel.setAttribute("role", "dialog");
		panel.setAttribute("aria-label", "Support chat");
		panel.innerHTML = `
      <div id="sn-header">
        <div id="sn-header-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/>
          </svg>
        </div>
        <div>
          <div id="sn-header-title">Support</div>
          <div id="sn-header-subtitle">We typically reply instantly</div>
        </div>
      </div>

      <div id="sn-connecting" class="sn-visible">Connecting...</div>

      <div id="sn-messages">
        <div id="sn-typing">
          <div class="sn-dot"></div>
          <div class="sn-dot"></div>
          <div class="sn-dot"></div>
        </div>
      </div>

      <div id="sn-input-row">
        <textarea
          id="sn-input"
          rows="1"
          placeholder="Type a message..."
          aria-label="Message"
          disabled
        ></textarea>
        <button id="sn-send-btn" aria-label="Send" disabled>
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    `;
		document.body.appendChild(panel);

		wireEvents();
	}

	// ── 8. APPLY SERVER CONFIG ─────────────────────────────────────────────────
	function applyWidgetConfig() {
		if (widgetConfig.accentColor) {
			document.documentElement.style.setProperty(
				"--sn-accent",
				widgetConfig.accentColor,
			);
		}
		var titleEl = document.getElementById("sn-header-title");
		if (titleEl && widgetConfig.title) {
			titleEl.textContent = widgetConfig.title;
		}
		var inputEl = document.getElementById("sn-input");
		if (inputEl && widgetConfig.placeholder) {
			inputEl.placeholder = widgetConfig.placeholder;
		}
		var connectingEl = document.getElementById("sn-connecting");
		if (connectingEl) {
			connectingEl.classList.remove("sn-visible");
		}
	}

	// ── 9. EVENTS ──────────────────────────────────────────────────────────────
	function wireEvents() {
		var input = document.getElementById("sn-input");
		var sendBtn = document.getElementById("sn-send-btn");

		input.addEventListener("input", function () {
			sendBtn.disabled = !input.value.trim() || isSending || !isAuthenticated;
			input.style.height = "auto";
			input.style.height = Math.min(input.scrollHeight, 100) + "px";
		});

		input.addEventListener("keydown", function (e) {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				if (!sendBtn.disabled) handleSend();
			}
		});

		sendBtn.addEventListener("click", handleSend);
	}

	// ── 10. UI HELPERS ─────────────────────────────────────────────────────────
	function appendMessage(role, content) {
		var messages = document.getElementById("sn-messages");
		var typing = document.getElementById("sn-typing");
		var bubble = document.createElement("div");
		bubble.className = "sn-bubble " + role;
		bubble.textContent = content;
		messages.insertBefore(bubble, typing);
		messages.scrollTop = messages.scrollHeight;
	}

	function appendSystemMessage(text) {
		appendMessage("system", text);
	}

	function showTyping() {
		var typing = document.getElementById("sn-typing");
		if (typing) typing.classList.add("sn-visible");
		var messages = document.getElementById("sn-messages");
		if (messages) messages.scrollTop = messages.scrollHeight;
	}

	function hideTyping() {
		var typing = document.getElementById("sn-typing");
		if (typing) typing.classList.remove("sn-visible");
	}

	function setInputDisabled(disabled) {
		var input = document.getElementById("sn-input");
		var sendBtn = document.getElementById("sn-send-btn");
		if (input) input.disabled = disabled;
		// send button stays disabled until user types something
		if (sendBtn) sendBtn.disabled = true;
	}

	// ── 11. SEND FLOW ──────────────────────────────────────────────────────────
	function handleSend() {
		var input = document.getElementById("sn-input");
		var sendBtn = document.getElementById("sn-send-btn");
		var content = input.value.trim();

		if (!content) return;
		if (isSending) return;
		if (!isAuthenticated) return;

		isSending = true;
		sendBtn.disabled = true;
		input.value = "";
		input.style.height = "auto";

		appendMessage("customer", content);
		showTyping();

		var sent = sendWs("message_send", { content: content });
		if (!sent) {
			// WS not open — show error immediately
			hideTyping();
			isSending = false;
			appendSystemMessage("Not connected. Please wait and try again.");
			sendBtn.disabled = !input.value.trim();
		}
		// If sent OK, isSending stays true until message_ai or error event arrives
	}

	// ── 12. TOGGLE PANEL ──────────────────────────────────────────────────────
	function togglePanel() {
		isOpen = !isOpen;
		var panel = document.getElementById("sn-panel");
		panel.classList.toggle("sn-open", isOpen);

		if (isOpen) {
			// Show greeting only once, only after auth
			if (isAuthenticated && widgetConfig.greetingMessage) {
				var bubbles = document.querySelectorAll(".sn-bubble");
				if (bubbles.length === 0) {
					appendMessage("ai", widgetConfig.greetingMessage);
				}
			}
			var input = document.getElementById("sn-input");
			if (input && !input.disabled) input.focus();
		}
	}

	// ── 13. BOOT ───────────────────────────────────────────────────────────────
	function boot() {
		injectStyles();
		buildDOM();
		connect(); // WS handles everything: auth → config → history → messaging
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", boot);
	} else {
		boot();
	}
})();
