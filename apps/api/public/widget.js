(function () {
	// ── 1. CONFIG ──────────────────────────────────────────────────────────────
	const config = window.SupportNestConfig || {};
	const CUSTOMER_TOKEN = config.customerToken || null;
	const currentScript = document.currentScript;
	const WIDGET_KEY = currentScript?.dataset?.widgetKey;
	const BASE_URL = currentScript?.dataset?.baseUrl ?? "http://localhost:3002";

	if (!WIDGET_KEY) {
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
	let isExpanded = false;
	let conversationId = null;

	function getOrCreateVisitorId() {
		var key = "sn_visitor_id";
		var id = localStorage.getItem(key);
		if (!id) {
			id = "anon_" + crypto.randomUUID();
			localStorage.setItem(key, id);
		}
		return id;
	}

	// ── 3. WEBSOCKET ───────────────────────────────────────────────────────────
	function connect() {
		const wsUrl = BASE_URL.replace(/^http/, "ws");
		ws = new WebSocket(`${wsUrl}/widget/ws`);

		ws.onopen = function () {
			reconnectDelay = 1000;
			ws.send(
				JSON.stringify({
					type: "auth",
					payload: {
						apiKey: WIDGET_KEY,
						customerJwt: CUSTOMER_TOKEN || null,
						visitorId: getOrCreateVisitorId(),
					},
				}),
			);
		};

		ws.onmessage = function (event) {
			try {
				const msg = JSON.parse(event.data);
				handleEvent(msg);
			} catch (e) {
				console.error("[SupportNest] Failed to parse message:", e);
			}
		};

		ws.onclose = function () {
			isAuthenticated = false;
			setTimeout(connect, reconnectDelay);
			reconnectDelay = Math.min(reconnectDelay * 2, 30000);
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
	function handleEvent(msg) {
		const { type, payload } = msg;

		switch (type) {
			case "auth_ack": {
				isAuthenticated = true;
				conversationId = payload.conversationId;
				if (payload.widgetConfig) {
					widgetConfig = payload.widgetConfig;
					applyWidgetConfig();
				}
				loadHistory(payload.history || []);
				setInputDisabled(false);
				updateStatus("online");
				break;
			}
			case "typing": {
				showTyping();
				break;
			}
			case "message_ai": {
				hideTyping();
				appendMessage("ai", payload.message.content);
				isSending = false;
				var sendBtn = document.getElementById("sn-send-btn");
				var input = document.getElementById("sn-input");
				if (sendBtn && input) sendBtn.disabled = !input.value.trim();
				break;
			}
			case "escalated": {
				hideTyping();
				isSending = false;
				appendSystemMessage("You're now connected with a human agent.");
				break;
			}
			case "error": {
				console.error("[SupportNest] Server error:", payload.message);
				hideTyping();
				isSending = false;
				appendSystemMessage("Something went wrong. Please try again.");
				var sendBtnErr = document.getElementById("sn-send-btn");
				var inputErr = document.getElementById("sn-input");
				if (sendBtnErr && inputErr)
					sendBtnErr.disabled = !inputErr.value.trim();
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
			if (msg.role === "CUSTOMER") appendMessage("customer", msg.content);
			else if (msg.role === "AI" || msg.role === "HUMAN_AGENT")
				appendMessage("ai", msg.content);
		});
	}

	// ── 6. STYLES ──────────────────────────────────────────────────────────────
	function injectStyles() {
		var style = document.createElement("style");
		style.textContent = `
      :root {
        --sn-font: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        --sn-accent: #5b4eff;
        --sn-accent-light: #ede9ff;
        --sn-accent-mid: rgba(91,78,255,0.12);
        --sn-radius-lg: 24px;
        --sn-radius-md: 16px;
        --sn-radius-sm: 10px;
        --sn-shadow-panel: 0 32px 80px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04);
        --sn-shadow-btn: 0 8px 24px rgba(91,78,255,0.32), 0 2px 8px rgba(0,0,0,0.08);
        --sn-surface: #ffffff;
        --sn-bg: #f6f7fb;
        --sn-border: rgba(0,0,0,0.06);
        --sn-text: #0d0f1a;
        --sn-subtext: #7a7f96;
        --sn-bubble-out: var(--sn-accent);
        --sn-bubble-in: #ffffff;
      }

      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

      /* ── LAUNCHER BUTTON ── */
      #sn-btn {
        position: fixed;
        bottom: 28px;
        right: 28px;
        width: 56px;
        height: 56px;
        border-radius: 18px;
        background: var(--sn-accent);
        border: none;
        cursor: pointer;
        box-shadow: var(--sn-shadow-btn);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483647;
        transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, border-radius 0.3s ease;
        outline: none;
      }
      #sn-btn:hover {
        transform: scale(1.07) translateY(-1px);
        box-shadow: 0 14px 36px rgba(91,78,255,0.38), 0 4px 12px rgba(0,0,0,0.1);
      }
      #sn-btn:active { transform: scale(0.94); }
      #sn-btn.sn-active {
        border-radius: 14px;
      }
      #sn-btn svg {
        width: 22px;
        height: 22px;
        fill: none;
        stroke: #fff;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
        position: absolute;
        transition: opacity 0.2s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
      }
      #sn-btn .sn-icon-close { opacity: 0; transform: rotate(-90deg) scale(0.7); }
      #sn-btn.sn-active .sn-icon-chat { opacity: 0; transform: rotate(90deg) scale(0.7); }
      #sn-btn.sn-active .sn-icon-close { opacity: 1; transform: rotate(0deg) scale(1); }

      /* Notification dot */
      #sn-notif-dot {
        position: absolute;
        top: -3px;
        right: -3px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #ff4757;
        border: 2.5px solid white;
        opacity: 0;
        transform: scale(0);
        transition: opacity 0.2s, transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
      }
      #sn-notif-dot.sn-visible { opacity: 1; transform: scale(1); }

      /* ── PANEL ── */
      #sn-panel {
        position: fixed;
        bottom: 96px;
        right: 28px;
        width: 390px;
        height: 620px;
        max-height: calc(100dvh - 120px);
        border-radius: var(--sn-radius-lg);
        background: var(--sn-bg);
        box-shadow: var(--sn-shadow-panel);
        display: flex;
        flex-direction: column;
        z-index: 2147483646;
        overflow: hidden;
        font-family: var(--sn-font);
        font-size: 14px;
        line-height: 1.55;
        opacity: 0;
        transform: translateY(20px) scale(0.95);
        pointer-events: none;
        transition: opacity 0.28s cubic-bezier(0.22,1,0.36,1), transform 0.35s cubic-bezier(0.22,1,0.36,1), width 0.35s cubic-bezier(0.22,1,0.36,1), height 0.35s cubic-bezier(0.22,1,0.36,1), top 0.35s cubic-bezier(0.22,1,0.36,1), left 0.35s cubic-bezier(0.22,1,0.36,1), right 0.35s cubic-bezier(0.22,1,0.36,1), bottom 0.35s cubic-bezier(0.22,1,0.36,1), border-radius 0.35s ease;
        border: 1px solid var(--sn-border);
      }
      #sn-panel.sn-open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: all;
      }

      /* ── HEADER ── */
      #sn-header {
        background: var(--sn-surface);
        padding: 18px 20px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
        border-bottom: 1px solid var(--sn-border);
        position: relative;
      }

      #sn-avatar {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        background: var(--sn-accent-mid);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        position: relative;
      }
      #sn-avatar svg { width: 20px; height: 20px; }

      #sn-status-ring {
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #c9ced8;
        border: 2.5px solid var(--sn-surface);
        transition: background 0.3s ease;
      }
      #sn-status-ring.online { background: #22c55e; }
      #sn-status-ring.pulse {
        background: #22c55e;
        animation: snPulse 2s infinite;
      }
      @keyframes snPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
        50% { box-shadow: 0 0 0 4px rgba(34,197,94,0); }
      }

      #sn-header-meta { flex: 1; min-width: 0; }
      #sn-header-title {
        color: var(--sn-accent);
        font-weight: 600;
        font-size: 15px;
        letter-spacing: -0.02em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      #sn-header-subtitle {
        color: var(--sn-subtext);
        font-size: 12px;
        margin-top: 1px;
        font-weight: 400;
      }

      #sn-close-btn {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        background: transparent;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background 0.15s;
        outline: none;
      }
      #sn-close-btn:hover { background: var(--sn-bg); }
      #sn-close-btn svg {
        width: 16px;
        height: 16px;
        stroke: var(--sn-subtext);
        stroke-width: 2;
        stroke-linecap: round;
        fill: none;
      }

      /* ── CONNECTING BAR ── */
      #sn-connecting {
        text-align: center;
        padding: 7px 16px;
        font-size: 11.5px;
        font-weight: 500;
        color: var(--sn-accent);
        background: var(--sn-accent-light);
        display: none;
        letter-spacing: 0.01em;
      }
      #sn-connecting.sn-visible { display: block; }

      /* ── MESSAGES AREA ── */
      #sn-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px 16px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        scroll-behavior: smooth;
        background: var(--sn-bg);
      }
      #sn-messages::-webkit-scrollbar { width: 4px; }
      #sn-messages::-webkit-scrollbar-track { background: transparent; }
      #sn-messages::-webkit-scrollbar-thumb { background: #dde1ea; border-radius: 99px; }

      /* Group spacing */
      .sn-bubble + .sn-bubble.ai,
      .sn-bubble + .sn-bubble.human_agent { margin-top: 2px; }
      .sn-bubble.customer + .sn-bubble.ai,
      .sn-bubble.ai + .sn-bubble.customer,
      .sn-bubble.customer + .sn-bubble.human_agent { margin-top: 12px; }

      .sn-bubble {
        max-width: 82%;
        padding: 11px 15px;
        border-radius: 18px;
        word-wrap: break-word;
        font-size: 14px;
        animation: snFadeUp 0.24s cubic-bezier(0.22,1,0.36,1) forwards;
        will-change: transform, opacity;
        unicode-bidi: plaintext;
        direction: ltr;
      }
      .sn-bubble[dir="rtl"], .sn-bubble:dir(rtl) {
        direction: rtl;
        text-align: right;
      }
      @keyframes snFadeUp {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .sn-bubble.customer {
        background: var(--sn-accent);
        color: #fff;
        align-self: flex-end;
        border-bottom-right-radius: 5px;
        box-shadow: 0 2px 12px rgba(91,78,255,0.18);
      }
      .sn-bubble.ai,
      .sn-bubble.human_agent {
        background: var(--sn-bubble-in);
        color: var(--sn-text);
        align-self: flex-start;
        border-bottom-left-radius: 5px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04);
      }
      .sn-bubble.system {
        background: transparent;
        color: var(--sn-subtext);
        font-size: 11.5px;
        font-weight: 500;
        align-self: center;
        text-align: center;
        padding: 6px 14px;
        max-width: 100%;
        box-shadow: none;
        letter-spacing: 0.01em;
        border-radius: 99px;
        background: rgba(0,0,0,0.03);
        margin: 8px 0;
      }

      /* Timestamps */
      .sn-timestamp {
        font-size: 10.5px;
        color: var(--sn-subtext);
        text-align: center;
        align-self: center;
        padding: 4px 0 8px;
        opacity: 0.7;
      }

      /* ── TYPING INDICATOR ── */
      #sn-typing {
        display: none;
        align-self: flex-start;
        background: var(--sn-bubble-in);
        border-radius: 18px;
        border-bottom-left-radius: 5px;
        padding: 13px 18px;
        gap: 4px;
        align-items: center;
        box-shadow: 0 1px 4px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04);
        margin-top: 4px;
      }
      #sn-typing.sn-visible { display: flex; }
      .sn-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #bcc0ce;
        animation: snBounce 1.3s infinite ease-in-out;
      }
      .sn-dot:nth-child(2) { animation-delay: 0.18s; }
      .sn-dot:nth-child(3) { animation-delay: 0.36s; }
      @keyframes snBounce {
        0%, 60%, 100% { transform: translateY(0); background: #bcc0ce; }
        30%           { transform: translateY(-5px); background: var(--sn-accent); }
      }

      /* ── INPUT ROW ── */
      #sn-input-row {
        padding: 12px 14px 14px;
        border-top: 1px solid var(--sn-border);
        background: var(--sn-surface);
        flex-shrink: 0;
      }

      #sn-input-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
        background: var(--sn-bg);
        border: 1.5px solid var(--sn-border);
        border-radius: 16px;
        padding: 10px 12px 10px 16px;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      #sn-input-wrap:focus-within {
        border-color: var(--sn-accent);
        box-shadow: 0 0 0 3px rgba(91,78,255,0.1);
        background: var(--sn-surface);
      }

      #sn-input {
        flex: 1;
        border: none;
        background: transparent;
        padding: 0;
        font-size: 14px;
        font-family: var(--sn-font);
        line-height: 1.48;
        resize: none;
        outline: none;
        max-height: 110px;
        color: var(--sn-text);
        min-height: 22px;
        display: block;
        vertical-align: middle;
      }
      #sn-input::placeholder { color: var(--sn-subtext); }
      #sn-input:disabled { cursor: not-allowed; color: var(--sn-subtext); }

      #sn-send-btn {
        width: 34px;
        height: 34px;
        border-radius: 11px;
        background: var(--sn-accent);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background 0.15s, transform 0.15s, opacity 0.2s;
        outline: none;
      }
      #sn-send-btn:hover:not(:disabled) {
        background: #4a3de0;
        transform: scale(1.05);
      }
      #sn-send-btn:active:not(:disabled) { transform: scale(0.94); }
      #sn-send-btn:disabled { opacity: 0.28; cursor: not-allowed; }
      #sn-send-btn svg {
        width: 16px;
        height: 16px;
        fill: none;
        stroke: white;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
        transform: translateX(1px);
      }

      /* ── FOOTER BRANDING ── */
      #sn-footer {
        text-align: center;
        padding: 6px 0 2px;
        font-size: 11px;
        color: #b0b5c6;
        letter-spacing: 0.01em;
      }
      #sn-footer a {
        color: inherit;
        text-decoration: none;
        font-weight: 500;
      }
      #sn-footer a:hover { color: var(--sn-accent); }

      /* ── EXPAND TOGGLE BUTTON ── */
      #sn-expand-btn {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        background: transparent;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background 0.15s;
        outline: none;
        margin-right: 2px;
      }
      #sn-expand-btn:hover { background: var(--sn-bg); }
      #sn-expand-btn svg {
        width: 15px;
        height: 15px;
        stroke: var(--sn-subtext);
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
        fill: none;
        transition: transform 0.3s cubic-bezier(0.22,1,0.36,1);
      }

      /* ── EXPANDED STATE ── */
      #sn-panel.sn-expanded {
        top: 50%;
        left: 50%;
        right: auto;
        bottom: auto;
        transform: translate(-50%, -50%) scale(1) !important;
        width: min(780px, calc(100vw - 48px));
        height: min(640px, calc(100dvh - 48px));
        max-height: none;
        border-radius: 20px;
      }
      #sn-panel.sn-expanded.sn-open {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1) !important;
      }

      /* Backdrop */
      #sn-backdrop {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.28);
        z-index: 2147483645;
        opacity: 0;
        transition: opacity 0.25s ease;
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
      }
      #sn-backdrop.sn-visible { display: block; }
      #sn-backdrop.sn-fade { opacity: 1; }

      /* ── MOBILE RESPONSIVE ── */
      @media (max-width: 480px) {
        #sn-panel {
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          max-height: 100%;
          border-radius: 0;
          border-radius: 24px 24px 0 0;
        }
        #sn-btn { bottom: 20px; right: 20px; }
      }

      /* ── REDUCED MOTION ── */
      @media (prefers-reduced-motion: reduce) {
        #sn-panel, #sn-btn, .sn-bubble, .sn-dot { animation: none; transition: none; }
      }
    `;
		document.head.appendChild(style);
	}

	// ── 7. BUILD DOM ───────────────────────────────────────────────────────────
	function buildDOM() {
		document.documentElement.style.setProperty("--sn-accent", "#5b4eff");

		// Launcher
		var btn = document.createElement("button");
		btn.id = "sn-btn";
		btn.setAttribute("aria-label", "Open support chat");
		btn.innerHTML = `
      <svg class="sn-icon-chat" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <svg class="sn-icon-close" viewBox="0 0 24 24">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
      <div id="sn-notif-dot"></div>
    `;
		btn.addEventListener("click", togglePanel);
		document.body.appendChild(btn);

		// Panel
		var panel = document.createElement("div");
		panel.id = "sn-panel";
		panel.setAttribute("role", "dialog");
		panel.setAttribute("aria-label", "Support chat");
		panel.innerHTML = `
      <div id="sn-header">
        <div id="sn-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--sn-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <div id="sn-status-ring"></div>
        </div>
        <div id="sn-header-meta">
          <div id="sn-header-title">Support</div>
          <div id="sn-header-subtitle">Connecting…</div>
        </div>
        <button id="sn-expand-btn" aria-label="Expand chat">
          <svg class="sn-icon-expand" viewBox="0 0 24 24">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
          <svg class="sn-icon-shrink" viewBox="0 0 24 24" style="display:none">
            <polyline points="4 14 10 14 10 20"></polyline>
            <polyline points="20 10 14 10 14 4"></polyline>
            <line x1="10" y1="14" x2="3" y2="21"></line>
            <line x1="21" y1="3" x2="14" y2="10"></line>
          </svg>
        </button>
        <button id="sn-close-btn" aria-label="Close chat">
          <svg viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div id="sn-connecting" class="sn-visible">Establishing secure connection…</div>

      <div id="sn-messages">
        <div id="sn-typing">
          <div class="sn-dot"></div>
          <div class="sn-dot"></div>
          <div class="sn-dot"></div>
        </div>
      </div>

      <div id="sn-input-row">
        <div id="sn-input-wrap">
          <textarea
            id="sn-input"
            rows="1"
            placeholder="Message…"
            aria-label="Message"
            dir="auto"
            disabled
          ></textarea>
          <button id="sn-send-btn" aria-label="Send" disabled>
            <svg viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
        <div id="sn-footer">Powered by <a href="http://localhost:3000" target="_blank" tabindex="-1">SupportNest</a></div>
      </div>
    `;
		var backdrop = document.createElement("div");
		backdrop.id = "sn-backdrop";
		document.body.appendChild(backdrop);
		document.body.appendChild(panel);

		document
			.getElementById("sn-close-btn")
			.addEventListener("click", togglePanel);
		document
			.getElementById("sn-expand-btn")
			.addEventListener("click", toggleExpand);
		document
			.getElementById("sn-backdrop")
			.addEventListener("click", function () {
				if (isExpanded) toggleExpand();
			});
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
		if (titleEl && widgetConfig.title)
			titleEl.textContent = widgetConfig.title;

		var inputEl = document.getElementById("sn-input");
		if (inputEl && widgetConfig.placeholder)
			inputEl.placeholder = widgetConfig.placeholder;

		var connectingEl = document.getElementById("sn-connecting");
		if (connectingEl) connectingEl.classList.remove("sn-visible");
	}

	// ── 9. STATUS ──────────────────────────────────────────────────────────────
	function updateStatus(state) {
		var ring = document.getElementById("sn-status-ring");
		var subtitle = document.getElementById("sn-header-subtitle");
		if (state === "online") {
			if (ring) {
				ring.className = "online pulse";
			}
			if (subtitle)
				subtitle.textContent = "Online · Typically replies instantly";
		} else {
			if (ring) ring.className = "";
			if (subtitle) subtitle.textContent = "Connecting…";
		}
	}

	// ── 10. EVENTS ─────────────────────────────────────────────────────────────
	function wireEvents() {
		var input = document.getElementById("sn-input");
		var sendBtn = document.getElementById("sn-send-btn");

		input.addEventListener("input", function () {
			sendBtn.disabled = !input.value.trim() || isSending || !isAuthenticated;
			input.style.height = "auto";
			input.style.height = Math.min(input.scrollHeight, 110) + "px";
		});

		input.addEventListener("keydown", function (e) {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				if (!sendBtn.disabled) handleSend();
			}
		});

		sendBtn.addEventListener("click", handleSend);
	}

	// ── 11. UI HELPERS ─────────────────────────────────────────────────────────
	function formatTime(date) {
		return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	}

	var lastTimestamp = null;

	function appendMessage(role, content) {
		console.log("[appendMessage] content:", content);
		var messages = document.getElementById("sn-messages");
		var typing = document.getElementById("sn-typing");

		// Insert time separator if >5min since last message
		var now = new Date();
		if (!lastTimestamp || now - lastTimestamp > 5 * 60 * 1000) {
			var ts = document.createElement("div");
			ts.className = "sn-timestamp";
			ts.textContent = formatTime(now);
			messages.insertBefore(ts, typing);
		}
		lastTimestamp = now;

		var bubble = document.createElement("div");
		bubble.className = "sn-bubble " + role;

		const imageMatch = content.match(/\[IMAGE:\s*(https?:\/\/[^\]]+)\]/);
		if (imageMatch) {
			const textPart = content
				.replace(/\[IMAGE:\s*https?:\/\/[^\]]+\]/, "")
				.trim();
			if (textPart) {
				const textNode = document.createElement("span");
				textNode.textContent = textPart;
				bubble.appendChild(textNode);
				bubble.appendChild(document.createElement("br"));
			}
			const img = document.createElement("img");
			img.src = imageMatch[1];
			img.style.cssText =
				"max-width:100%;border-radius:10px;margin-top:6px;display:block;";
			img.onerror = function () {
				this.style.display = "none";
				const alt = document.createElement("div");
				alt.textContent = "🖼️ Image unavailable";
				alt.style.cssText = "font-size:12px;color:#999;margin-top:4px;";
				this.parentNode.appendChild(alt);
			};
			bubble.appendChild(img);
		} else {
			bubble.textContent = content;
		}
		// Auto-detect RTL languages (Arabic, Hebrew, Persian, etc.)
		if (
			/[\u0600-\u06FF\u0750-\u077F\u0590-\u05FF\u08A0-\u08FF]/.test(content)
		) {
			bubble.setAttribute("dir", "rtl");
		}
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
		if (sendBtn) sendBtn.disabled = true;
	}

	// ── 12. SEND FLOW ──────────────────────────────────────────────────────────
	function handleSend() {
		var input = document.getElementById("sn-input");
		var sendBtn = document.getElementById("sn-send-btn");
		var content = input.value.trim();
		if (!content || isSending || !isAuthenticated) return;

		isSending = true;
		sendBtn.disabled = true;
		input.value = "";
		input.style.height = "auto";

		appendMessage("customer", content);
		showTyping();

		var sent = sendWs("message_send", { content });
		if (!sent) {
			hideTyping();
			isSending = false;
			appendSystemMessage("Not connected. Please wait and try again.");
			sendBtn.disabled = !input.value.trim();
		}
	}

	// ── 13. TOGGLE PANEL ──────────────────────────────────────────────────────
	function togglePanel() {
		isOpen = !isOpen;
		var panel = document.getElementById("sn-panel");
		var btn = document.getElementById("sn-btn");
		var dot = document.getElementById("sn-notif-dot");

		panel.classList.toggle("sn-open", isOpen);
		btn.classList.toggle("sn-active", isOpen);

		if (!isOpen && isExpanded) {
			toggleExpand();
		}

		if (isOpen) {
			if (dot) dot.classList.remove("sn-visible");
			if (isAuthenticated && widgetConfig.greetingMessage) {
				var bubbles = document.querySelectorAll(".sn-bubble");
				if (bubbles.length === 0)
					appendMessage("ai", widgetConfig.greetingMessage);
			}
			var input = document.getElementById("sn-input");
			if (input && !input.disabled) input.focus();
		}
	}

	// ── 13b. TOGGLE EXPAND ────────────────────────────────────────────────────
	function toggleExpand() {
		isExpanded = !isExpanded;
		var panel = document.getElementById("sn-panel");
		var backdrop = document.getElementById("sn-backdrop");
		var iconExpand = document.querySelector("#sn-expand-btn .sn-icon-expand");
		var iconShrink = document.querySelector("#sn-expand-btn .sn-icon-shrink");

		if (isExpanded) {
			panel.classList.add("sn-expanded");
			backdrop.classList.add("sn-visible");
			requestAnimationFrame(function () {
				backdrop.classList.add("sn-fade");
			});
			if (iconExpand) iconExpand.style.display = "none";
			if (iconShrink) iconShrink.style.display = "block";
		} else {
			panel.classList.remove("sn-expanded");
			backdrop.classList.remove("sn-fade");
			if (iconExpand) iconExpand.style.display = "block";
			if (iconShrink) iconShrink.style.display = "none";
			setTimeout(function () {
				backdrop.classList.remove("sn-visible");
			}, 250);
		}

		// Scroll messages to bottom after resize
		setTimeout(function () {
			var messages = document.getElementById("sn-messages");
			if (messages) messages.scrollTop = messages.scrollHeight;
		}, 300);
	}

	// ── 14. BOOT ───────────────────────────────────────────────────────────────
	function boot() {
		injectStyles();
		buildDOM();
		connect();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", boot);
	} else {
		boot();
	}
})();
