(function () {
	// ── 1. CONFIG ──────────────────────────────────────────────────────────────
	let CUSTOMER_TOKEN = null;
	let WIDGET_KEY = null;
	const BASE_URL =
		window.currentScript?.dataset?.baseUrl ?? "http://localhost:3001";

	// ── 2. STATE ───────────────────────────────────────────────────────────────
	let ws = null;
	let reconnectDelay = 1000;
	let widgetConfig = {};
	let isOpen = false;
	let isSending = false;
	let isAuthenticated = false;
	let isExpanded = false;
	let conversationId = null;

	function init(config) {
		WIDGET_KEY = config.widgetKey;
		CUSTOMER_TOKEN = config.customerToken || null;

		if (!WIDGET_KEY) {
			console.error("[SupportNest] No widgetKey provided to init()");
			return;
		}

		connect();
	}

	// Expose public API
	window.SupportNest = { init };

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
						customerJwt: CUSTOMER_TOKEN,
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

				const rating = new RatingWidget(
					{
						themeColor: widgetConfig.accentColor || "#6C63FF",
						submitEndpoint: `${BASE_URL}/api/v1/widget/conversations/${conversationId}/csat`,
					},
					{
						conversationId,
						apiKey: WIDGET_KEY,
						customerJwt: CUSTOMER_TOKEN,
						visitorId: getOrCreateVisitorId(),
					},
				);

				rating.init();

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
        
        display: grid;
        height: 100%;
        place-items: center;
        place-content: center;
        width: 42px;
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

         width: 18px;
         height: 18px;
         transform: translateX(0);
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

	function injectRatingWidgetStyles() {
		const style = document.createElement("style");
		style.textContent = `
    /* ============================================
   RATING COMPONENT - COMPLETE STYLES
   All classes prefixed with .rating- to avoid conflicts
   ============================================ */

/* ---------- ROOT CONTAINER ---------- */
.rating-widget {
	/* Position in chat flow - sits above input */
	position: relative;
	width: 100%;
	max-width: 340px;
	padding: 12px 16px 8px 16px;

	/* Flex layout for trigger alignment */
	display: flex;
	justify-content: flex-start;
	align-items: center;

	/* Visual separation from chat */
	border-top: 1px solid rgba(0, 0, 0, 0.06);
	margin-top: 4px;

	/* Ensures proper stacking context */
	z-index: 10;
}

/* 
   DESIGN DECISION: Why padding + border-top?
   - Creates natural separation from messages
   - Feels like a new section, not intrusive
   - The thin border is subtle but creates visual hierarchy
*/

/* ---------- TRIGGER BUTTON ---------- */
.rating-trigger {
	/* Pill button design */
	display: inline-flex;
	align-items: center;
	gap: 8px;

	/* Typography */
	font-family: inherit; /* Matches widget font */
	font-size: 14px;
	font-weight: 500;
	color: var(--rating-theme-color, #6c63ff);

	/* Button styling */
	background: rgba(108, 99, 255, 0.08);
	border: 2px solid var(--rating-theme-color, #6c63ff);
	border-radius: 50px; /* Pill shape */
	padding: 8px 18px;

	/* Interactive */
	cursor: pointer;
	transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

	/* Accessibility */
	outline: none;
	user-select: none;
}

/* 
   DESIGN DECISION: Why rgba for background?
   - Uses theme color but with transparency
   - Creates a subtle, modern look
   - Works on any background color
*/

.rating-trigger:hover {
	/* Hover effect - lift and scale */
	transform: translateY(-2px) scale(1.02);

	/* Intensify background on hover */
	background: rgba(108, 99, 255, 0.15);

	/* Slightly darker border for feedback */
	border-color: var(--rating-theme-color, #6c63ff);
}

.rating-trigger:active {
	/* Press effect - feels tactile */
	transform: scale(0.96);
}

.rating-trigger:focus-visible {
	/* Focus ring for keyboard navigation */
	box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.3);
}

.rating-trigger-icon {
	font-size: 16px;
	line-height: 1;
}

.rating-trigger-text {
	line-height: 1;
}

/* 
   DESIGN DECISION: Why cubic-bezier(0.34, 1.56, 0.64, 1)?
   - This is a "spring-like" easing
   - Makes the hover feel bouncy and playful
   - 1.56 gives it slight overshoot for energy
*/

/* ---------- RATING PANEL (Hidden by default) ---------- */
.rating-panel {
	/* Positioning - slides from side */
	position: absolute;
	bottom: 80px; /* Above the trigger button */
	right: -16px;
	left: 16x;

	/* Start hidden with animation */
	transform: translateX(120%) scale(0.8);
	opacity: 0;
	pointer-events: none;

	/* Transition for smooth open/close */
	transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

	/* Z-index to overlay chat content */
	z-index: 20;
}

/*
   DESIGN DECISION: Why transform: translateX(120%) scale(0.8)?
   - 120% pushes it completely off-screen to the right
   - scale(0.8) makes it shrink slightly during animation
   - Combined, this creates the "bounce in from side" effect
   - opacity: 0 ensures it's invisible when closed
   - pointer-events: none prevents interaction when hidden
*/

/* ---------- PANEL OPEN STATE ---------- */
.rating-panel.open {
	/* Visible state */
	transform: translateX(0) scale(1);
	opacity: 1;
	pointer-events: all;
}

/*
   DESIGN DECISION: Why separate open state?
   - Clean state management via JS adding/removing class
   - Transitions handle all animation automatically
   - No JavaScript animation needed
*/

/* ---------- PANEL CONTENT ---------- */
.rating-content {
	/* Card design */
	background: #ffffff;
	border-radius: 16px;
	padding: 20px 24px 24px 24px;

	/* Shadow for depth */
	box-shadow:
		0 8px 40px rgba(0, 0, 0, 0.12),
		0 2px 8px rgba(0, 0, 0, 0.06);

	/* Ensures content doesn't overflow */
	max-width: 100%;

	/* Small border for definition */
	border: 1px solid rgba(0, 0, 0, 0.04);
}

/*
   DESIGN DECISION: Why double shadow?
   - Large shadow (8px, 40px) creates floating effect
   - Small shadow (2px, 8px) adds micro-depth
   - Combined looks premium and modern
   - rgba values keep it lightweight
*/

/* ---------- HEADER ---------- */
.rating-header {
	display: flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 16px;
	padding-bottom: 12px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.rating-header-emoji {
	font-size: 22px;
	line-height: 1;
}

.rating-header-text {
	flex: 1;
	font-size: 16px;
	font-weight: 600;
	color: #1a1a2e;
	letter-spacing: -0.2px;
}

.rating-close {
	/* Close button - subtle X */
	background: transparent;
	border: none;
	font-size: 18px;
	color: #999;
	cursor: pointer;
	padding: 4px 8px;
	border-radius: 6px;
	transition: all 0.2s ease;
	line-height: 1;
}

.rating-close:hover {
	background: rgba(0, 0, 0, 0.05);
	color: #333;
}

.rating-close:focus-visible {
	outline: 2px solid var(--rating-theme-color, #6c63ff);
	outline-offset: 2px;
}

/*
   DESIGN DECISION: Why border-bottom in header?
   - Visually separates header from stars
   - Creates clear hierarchy
   - Subtle enough not to be distracting
*/

/* ---------- STARS CONTAINER ---------- */
.rating-stars {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 8px;
	padding: 4px 0;
	margin-bottom: 12px;
}

/* ---------- INDIVIDUAL STAR ---------- */
.star {
	/* SVG star button */
	background: transparent;
	border: none;
	cursor: pointer;
	padding: 4px;

	/* Size and positioning */
	width: 44px;
	height: 44px;

	/* SVG styling via color */
	color: #d1d5db; /* Default gray */
	transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

	/* Accessibility */
	outline: none;
}

/*
   DESIGN DECISION: Why 44px x 44px?
   - Minimum touch target size (Apple HIG, Material Design)
   - Accessible for mobile users
   - Stars themselves are ~32px inside with padding
*/

/* ---------- STAR STATES ---------- */
.star svg {
	width: 100%;
	height: 100%;
	display: block;
	transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.star:hover {
	/* Slight scale up on hover */
	transform: scale(1.15);
}

.star:hover svg {
	/* Preview fill with theme color */
	fill: var(--rating-theme-color, #6c63ff);
	color: var(--rating-theme-color, #6c63ff);
}

.star.active {
	/* Filled state */
	transform: scale(1);
}

.star.active svg {
	fill: var(--rating-theme-color, #6c63ff);
	color: var(--rating-theme-color, #6c63ff);
}

.star.active:hover {
	transform: scale(1.1);
}

.star:focus-visible {
	outline: 2px solid var(--rating-theme-color, #6c63ff);
	outline-offset: 4px;
	border-radius: 50%;
}

/*
   DESIGN DECISION: Why both fill and color?
   - fill controls SVG interior
   - color controls stroke (via currentColor)
   - Both need to match for solid stars
   - Using var(--rating-theme-color) for theming
*/

/* ---------- STAR SPARKLE ANIMATION ---------- */
.star.sparkle svg {
	animation: sparkle 0.6s ease forwards;
}

@keyframes sparkle {
	0% {
		transform: scale(1) rotate(0deg);
	}
	30% {
		transform: scale(1.3) rotate(10deg);
	}
	60% {
		transform: scale(0.9) rotate(-5deg);
	}
	100% {
		transform: scale(1) rotate(0deg);
	}
}

/*
   DESIGN DECISION: Why this sparkle animation?
   - "Playful" micro-interaction you requested
   - Scale+rotation = energetic feel
   - 0.6s is snappy but not rushed
   - Ease (default) gives natural deceleration
*/

/* ---------- FEEDBACK TEXT ---------- */
.rating-feedback {
	text-align: center;
	min-height: 28px;
	display: flex;
	justify-content: center;
	align-items: center;
	margin-bottom: 4px;
}

.rating-label {
	font-size: 14px;
	font-weight: 500;
	color: #6b7280;
	transition: all 0.3s ease;
}

.rating-label.highlight {
	color: var(--rating-theme-color, #6c63ff);
	font-weight: 600;
	transform: scale(1.05);
}

/*
   DESIGN DECISION: Why min-height on feedback?
   - Prevents layout shift when text changes
   - Keeps stars from jumping around
   - Better UX, no sudden movements
*/

/* ---------- THANK YOU MESSAGE ---------- */
.rating-thankyou {
	text-align: center;
	padding: 12px 0 4px 0;
	animation: fadeInUp 0.5s ease;
}

.thankyou-emoji {
	font-size: 32px;
	display: block;
	margin-bottom: 6px;
}

.thankyou-text {
	display: block;
	font-size: 18px;
	font-weight: 600;
	color: #1a1a2e;
	margin-bottom: 2px;
}

.thankyou-subtext {
	display: block;
	font-size: 14px;
	color: #6b7280;
}

/* ---------- ANIMATIONS ---------- */
@keyframes fadeInUp {
	from {
		opacity: 0;
		transform: translateY(12px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

/*
   DESIGN DECISION: Why separate animations?
   - Sparkle = playful feedback on click
   - FadeInUp = smooth thank you reveal
   - Each serves a different purpose
   - Easy to modify independently
*/

/* ---------- RESPONSIVE DESIGN ---------- */
@media (max-width: 480px) {
	.rating-widget {
		padding: 8px 12px 6px 12px;
	}

	.rating-trigger {
		font-size: 13px;
		padding: 6px 14px;
		gap: 6px;
	}

	.rating-trigger-icon {
		font-size: 14px;
	}

	.rating-panel {
		bottom: 70px;
		right: 0;
		left: 0;
	}

	.rating-content {
		padding: 16px 16px 20px 16px;
		border-radius: 12px;
	}

	.star {
		width: 38px;
		height: 38px;
	}

	.rating-header-text {
		font-size: 15px;
	}

	.rating-header-emoji {
		font-size: 18px;
	}

	.rating-label {
		font-size: 13px;
	}

	.thankyou-text {
		font-size: 16px;
	}
}

/*
   DESIGN DECISION: Why 480px breakpoint?
   - Standard mobile breakpoint
   - Covers most phones (iPhone SE to iPhone 14)
   - Adjusts sizing for smaller screens
   - Keeps touch targets (38px) still accessible
*/

/* ---------- DARK MODE SUPPORT ---------- */
@media (prefers-color-scheme: dark) {
	.rating-content {
		background: #1f2937;
		border-color: rgba(255, 255, 255, 0.06);
		box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
	}

	.rating-header {
		border-bottom-color: rgba(255, 255, 255, 0.06);
	}

	.rating-header-text {
		color: #f3f4f6;
	}

	.rating-close {
		color: #9ca3af;
	}

	.rating-close:hover {
		background: rgba(255, 255, 255, 0.05);
		color: #e5e7eb;
	}

	.rating-label {
		color: #9ca3af;
	}

	.rating-label.highlight {
		color: var(--rating-theme-color, #818cf8);
	}

	.star {
		color: #4b5563;
	}

	.thankyou-text {
		color: #f3f4f6;
	}

	.thankyou-subtext {
		color: #9ca3af;
	}

	.rating-trigger {
		color: var(--rating-theme-color, #818cf8);
		background: rgba(99, 102, 241, 0.12);
	}

	.rating-trigger:hover {
		background: rgba(99, 102, 241, 0.2);
	}
}

/*
   DESIGN DECISION: Why dark mode support?
   - Future-proofing for users with system dark mode
   - Respects user preferences
   - Uses more muted colors in dark mode
   - The theme color is slightly adjusted for readability
*/

/* ---------- REDUCED MOTION SUPPORT ---------- */
@media (prefers-reduced-motion: reduce) {
	.rating-trigger,
	.rating-panel,
	.star,
	.rating-label,
	.rating-thankyou {
		transition-duration: 0.01ms !important;
		animation-duration: 0.01ms !important;
	}

	.rating-trigger:hover {
		transform: none !important;
	}

	.star:hover {
		transform: none !important;
	}

	.star.sparkle svg {
		animation: none !important;
	}
}

/*
   DESIGN DECISION: Why reduced motion?
   - Accessibility for vestibular disorders
   - Respects user's system preferences
   - Removes all animations and transitions
   - Still functional, just without motion
*/

/* ---------- CSS CUSTOM PROPERTIES ---------- */
.rating-widget {
	--rating-theme-color: #6c63ff; /* Default fallback */
}

.rating-trigger {
	color: var(--rating-theme-color, #6c63ff);
	border-color: var(--rating-theme-color, #6c63ff);
}

.rating-trigger:hover {
	border-color: var(--rating-theme-color, #6c63ff);
}

.rating-trigger:focus-visible {
	box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.3);
}

.star:hover svg,
.star.active svg {
	fill: var(--rating-theme-color, #6c63ff);
	color: var(--rating-theme-color, #6c63ff);
}

.rating-label.highlight {
	color: var(--rating-theme-color, #6c63ff);
}

.rating-close:focus-visible {
	outline-color: var(--rating-theme-color, #6c63ff);
}

/*
   DESIGN DECISION: Why CSS custom properties?
   - Theme color passed via JavaScript
   - Using var(--rating-theme-color, #fallback)
   - Fallback ensures it works without JS
   - All dynamic colors use this single variable
*/

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
      <div class="rating-widget">
      <button class="rating-trigger">
        <span class="rating-trigger-icon">⭐</span>
        <span class="rating-trigger-text">Rate this chat</span>
      </button>
      <div class="rating-panel">
        <div class="rating-content">
          <div class="rating-header">
            <span class="rating-header-emoji">🌟</span>
            <span class="rating-header-text">How was your experience?</span>
            <button class="rating-close">✕</button>
          </div>
          <div class="rating-stars">
            <button class="star" data-value="1" aria-label="1 star">
              <svg viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2"/></svg>
            </button>
            <button class="star" data-value="2" aria-label="2 stars">
              <svg viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2"/></svg>
            </button>
            <button class="star" data-value="3" aria-label="3 stars">
              <svg viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2"/></svg>
            </button>
            <button class="star" data-value="4" aria-label="4 stars">
              <svg viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2"/></svg>
            </button>
            <button class="star" data-value="5" aria-label="5 stars">
              <svg viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2"/></svg>
            </button>
          </div>
          <div class="rating-feedback">
            <span class="rating-label">Select a rating</span>
          </div>
          <div class="rating-thankyou" hidden>
            <span class="thankyou-emoji">🎉</span>
            <span class="thankyou-text">Thanks for your feedback!</span>
            <span class="thankyou-subtext">We appreciate you 💙</span>
          </div>
        </div>
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
		injectRatingWidgetStyles();
		buildDOM();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", boot);
	} else {
		boot();
	}

	// ---------------------------------------------------------- //
	//                    Rating Widget Class
	// ----------------------------------------------------------//
	/**
	 * ============================================
	 * RATING WIDGET - CLASS-BASED COMPONENT
	 * ============================================
	 *
	 * Features:
	 * - Click to expand/collapse
	 * - Star hover preview with labels
	 * - Click to rate with sparkle animation
	 * - Auto-submit to server
	 * - Thank you message with auto-close
	 * - Theme color injection
	 * - Error handling
	 *
	 * Usage:
	 *   const rating = new RatingWidget({
	 *     themeColor: '#FF6B6B',
	 *     submitEndpoint: '/api/ratings'
	 *   });
	 *   rating.init();
	 * ============================================
	 */

	class RatingWidget {
		/**
		 * ==========================================
		 * CONSTRUCTOR - Initialize the component
		 * ==========================================
		 */
		constructor(config = {}, requestContext = {}) {
			// Configuration with defaults
			this.config = {
				themeColor: config.themeColor || "#6C63FF",
				submitEndpoint: config.submitEndpoint || "/api/ratings",
				autoCloseDelay: config.autoCloseDelay || 2000, // 2 seconds
				labels: config.labels || {
					1: "Needs improvement",
					2: "Okay",
					3: "Good",
					4: "Great",
					5: "Amazing!",
				},
			};

			// State management
			this.state = {
				isOpen: false,
				selectedRating: 0,
				isSubmitted: false,
				isSubmitting: false,
			};

			// DOM references (populated in init)
			this.elements = {};

			// Bind methods to maintain 'this' context
			this.handleTriggerClick = this.handleTriggerClick.bind(this);
			this.handleStarClick = this.handleStarClick.bind(this);
			this.handleStarHover = this.handleStarHover.bind(this);
			this.handleStarLeave = this.handleStarLeave.bind(this);
			this.handleClose = this.handleClose.bind(this);
			this.handleOutsideClick = this.handleOutsideClick.bind(this);
			this.handleEscape = this.handleEscape.bind(this);

			// Request/identity context — separate from visual config
			this.requestContext = {
				conversationId: requestContext.conversationId || null,
				apiKey: requestContext.apiKey || null,
				customerJwt: requestContext.customerJwt || null,
				visitorId: requestContext.visitorId || null,
			};

			console.log(
				"⭐ Rating Widget initialized with theme:",
				this.config.themeColor,
			);
		}

		/**
		 * ==========================================
		 * INIT - Find DOM elements and set up event listeners
		 * ==========================================
		 */
		init() {
			// Find all required DOM elements
			this.elements = {
				widget: document.querySelector(".rating-widget"),
				trigger: document.querySelector(".rating-trigger"),
				panel: document.querySelector(".rating-panel"),
				close: document.querySelector(".rating-close"),
				stars: document.querySelectorAll(".star"),
				feedback: document.querySelector(".rating-label"),
				thankYou: document.querySelector(".rating-thankyou"),
				content: document.querySelector(".rating-content"),
				starsContainer: document.querySelector(".rating-stars"),
			};

			// Validate all elements exist
			const missingElements = Object.entries(this.elements)
				.filter(([key, el]) => !el)
				.map(([key]) => key);

			if (missingElements.length > 0) {
				console.error("Rating Widget: Missing elements:", missingElements);
				return;
			}

			// Set initial theme color
			this.applyThemeColor();

			// Set up event listeners
			this.setupEventListeners();

			console.log("✅ Rating Widget ready!");
		}

		/**
		 * ==========================================
		 * APPLY THEME COLOR - Inject CSS variable
		 * ==========================================
		 */
		applyThemeColor() {
			const root = this.elements.widget;
			if (root) {
				root.style.setProperty("--rating-theme-color", this.config.themeColor);
			}
		}

		/**
		 * ==========================================
		 * SETUP EVENT LISTENERS
		 * ==========================================
		 */
		setupEventListeners() {
			// Trigger button
			this.elements.trigger.addEventListener("click", this.handleTriggerClick);

			// Close button
			this.elements.close.addEventListener("click", this.handleClose);

			// Star events
			this.elements.stars.forEach((star) => {
				star.addEventListener("click", this.handleStarClick);
				star.addEventListener("mouseenter", this.handleStarHover);
				star.addEventListener("mouseleave", this.handleStarLeave);
				star.addEventListener("touchstart", this.handleStarClick, {
					passive: true,
				});
			});

			// Keyboard events (Escape key)
			document.addEventListener("keydown", this.handleEscape);

			// Click outside to close (only when open)
			document.addEventListener("click", this.handleOutsideClick);
		}

		/**
		 * ==========================================
		 * HANDLE TRIGGER CLICK - Open/close panel
		 * ==========================================
		 */
		handleTriggerClick(e) {
			e.stopPropagation();

			if (this.state.isOpen) {
				this.close();
			} else {
				this.open();
			}
		}

		/**
		 * ==========================================
		 * OPEN PANEL - With bounce animation
		 * ==========================================
		 */
		open() {
			if (this.state.isOpen) return;

			this.state.isOpen = true;
			this.elements.panel.classList.add("open");

			// Set initial feedback text
			this.updateFeedback("Select a rating");

			// Reset any previous submission state
			this.elements.thankYou.hidden = true;
			this.elements.starsContainer.style.display = "flex";
			this.state.isSubmitted = false;

			// Log for analytics
			console.log("📊 Rating panel opened");
		}

		/**
		 * ==========================================
		 * CLOSE PANEL
		 * ==========================================
		 */
		close() {
			if (!this.state.isOpen) return;

			this.state.isOpen = false;
			this.elements.panel.classList.remove("open");

			// Reset star selection
			this.clearStars();
			this.state.selectedRating = 0;

			console.log("📊 Rating panel closed");
		}

		/**
		 * ==========================================
		 * HANDLE CLOSE BUTTON
		 * ==========================================
		 */
		handleClose(e) {
			e.stopPropagation();
			this.close();
		}

		/**
		 * ==========================================
		 * HANDLE STAR CLICK - Select rating and submit
		 * ==========================================
		 */
		async handleStarClick(e) {
			// If already submitted, ignore clicks
			if (this.state.isSubmitted) return;

			// Get rating value from data attribute
			const star = e.currentTarget;
			const rating = parseInt(star.dataset.value, 10);

			// If same star clicked, do nothing (already selected)
			if (this.state.selectedRating === rating && this.state.isSubmitting) {
				return;
			}

			// Update state
			this.state.selectedRating = rating;
			this.state.isSubmitting = true;

			// Visual feedback - highlight selected stars
			this.highlightStars(rating);

			// Show sparkle animation on clicked star
			this.sparkleStar(star);

			// Update feedback label
			this.updateFeedback(
				this.config.labels[rating] || `${rating} stars`,
				true,
			);

			// Submit the rating
			try {
				await this.submitRating(rating);

				// Success!
				this.state.isSubmitted = true;
				this.state.isSubmitting = false;

				// Show thank you message
				this.showThankYou();

				// Auto-close after delay
				setTimeout(() => {
					this.close();
				}, this.config.autoCloseDelay);
			} catch (error) {
				// Handle error
				this.state.isSubmitting = false;
				console.error("❌ Rating submission failed:", error);
				this.updateFeedback("Something went wrong. Please try again.", false);

				// Allow retry after 1 second
				setTimeout(() => {
					this.updateFeedback(
						this.config.labels[rating] || `${rating} stars`,
						true,
					);
				}, 1500);
			}
		}

		/**
		 * ==========================================
		 * HANDLE STAR HOVER - Preview rating
		 * ==========================================
		 */
		handleStarHover(e) {
			if (this.state.isSubmitted) return;

			const star = e.currentTarget;
			const rating = parseInt(star.dataset.value, 10);

			// Preview fill on hover
			this.previewStars(rating);

			// Show label preview
			this.updateFeedback(
				this.config.labels[rating] || `${rating} stars`,
				true,
			);
		}

		/**
		 * ==========================================
		 * HANDLE STAR LEAVE - Reset preview
		 * ==========================================
		 */
		handleStarLeave(e) {
			if (this.state.isSubmitted) return;

			// If nothing selected, reset to default
			if (this.state.selectedRating === 0) {
				this.clearStars();
				this.updateFeedback("Select a rating", false);
				return;
			}

			// Otherwise restore selection
			this.highlightStars(this.state.selectedRating);
			this.updateFeedback(
				this.config.labels[this.state.selectedRating] ||
					`${this.state.selectedRating} stars`,
				true,
			);
		}

		/**
		 * ==========================================
		 * HIGHLIGHT STARS - Fill stars up to rating
		 * ==========================================
		 */
		highlightStars(rating) {
			this.elements.stars.forEach((star) => {
				const value = parseInt(star.dataset.value, 10);
				if (value <= rating) {
					star.classList.add("active");
				} else {
					star.classList.remove("active");
				}
			});
		}

		/**
		 * ==========================================
		 * PREVIEW STARS - Hover preview (no commit)
		 * ==========================================
		 */
		previewStars(rating) {
			this.elements.stars.forEach((star) => {
				const value = parseInt(star.dataset.value, 10);
				if (value <= rating) {
					star.classList.add("active");
				} else {
					star.classList.remove("active");
				}
			});
		}

		/**
		 * ==========================================
		 * CLEAR STARS - Remove all active states
		 * ==========================================
		 */
		clearStars() {
			this.elements.stars.forEach((star) => {
				star.classList.remove("active");
			});
		}

		/**
		 * ==========================================
		 * SPARKLE STAR - Playful animation
		 * ==========================================
		 */
		sparkleStar(star) {
			// Remove any existing animation
			star.classList.remove("sparkle");

			// Trigger reflow to restart animation
			void star.offsetWidth;

			// Add animation
			star.classList.add("sparkle");

			// Remove class after animation completes
			setTimeout(() => {
				star.classList.remove("sparkle");
			}, 600);
		}

		/**
		 * ==========================================
		 * UPDATE FEEDBACK - Change label text
		 * ==========================================
		 */
		updateFeedback(text, isHighlighted = false) {
			const label = this.elements.feedback;
			if (!label) return;

			label.textContent = text;

			if (isHighlighted) {
				label.classList.add("highlight");
			} else {
				label.classList.remove("highlight");
			}
		}

		/**
		 * ==========================================
		 * SHOW THANK YOU - Replace stars with thanks
		 * ==========================================
		 */
		showThankYou() {
			// Hide stars
			this.elements.starsContainer.style.display = "none";

			// Hide feedback
			this.elements.feedback.style.display = "none";

			// Show thank you
			this.elements.thankYou.hidden = false;
		}

		/**
		 * ==========================================
		 * SUBMIT RATING - Send to server
		 * ==========================================
		 */
		async submitRating(rating) {
			// Prepare payload
			const payload = {
				rating: rating,
				timestamp: new Date().toISOString(),
				source: "chat_widget",
				userAgent: navigator.userAgent,
				conversationId: this.requestContext.conversationId,
				customerJwt: this.requestContext.customerJwt,
				visitorId: this.requestContext.visitorId,
			};

			console.log("📤 Submitting rating:", payload);
			// themeColor: widgetConfig.accentColor || "#6C63FF",
			// 		submitEndpoint: `${BASE_URL}/conversations/${conversationId}/csat`,
			// 		conversationId: conversationId,
			// 		apiKey: WIDGET_KEY,
			// 		customerJwt: CUSTOMER_TOKEN,
			// 		visitorId: getOrCreateVisitorId(),
			// Attempt submission
			const response = await fetch(this.config.submitEndpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					"x-api-key": this.requestContext.apiKey,
				},
				body: JSON.stringify(payload),
			});

			// Check response
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					`Server responded with ${response.status}: ${errorData.message || "Unknown error"}`,
				);
			}

			const result = await response.json().catch(() => ({}));
			console.log("✅ Rating submitted successfully:", result);

			return result;
		}

		/**
		 * ==========================================
		 * HANDLE OUTSIDE CLICK - Close panel when clicking outside
		 * ==========================================
		 */
		handleOutsideClick(e) {
			// If panel isn't open, ignore
			if (!this.state.isOpen) return;

			// Get the widget container
			const widget = this.elements.widget;

			// Check if click is inside the widget
			if (widget && !widget.contains(e.target)) {
				this.close();
			}
		}

		/**
		 * ==========================================
		 * HANDLE ESCAPE - Close panel on Escape key
		 * ==========================================
		 */
		handleEscape(e) {
			if (e.key === "Escape" && this.state.isOpen) {
				this.close();
				// Focus back on trigger
				this.elements.trigger.focus();
			}
		}

		/**
		 * ==========================================
		 * DESTROY - Clean up event listeners
		 * (Optional - for single-page apps)
		 * ==========================================
		 */
		destroy() {
			// Remove all event listeners
			this.elements.trigger.removeEventListener(
				"click",
				this.handleTriggerClick,
			);
			this.elements.close.removeEventListener("click", this.handleClose);

			this.elements.stars.forEach((star) => {
				star.removeEventListener("click", this.handleStarClick);
				star.removeEventListener("mouseenter", this.handleStarHover);
				star.removeEventListener("mouseleave", this.handleStarLeave);
			});

			document.removeEventListener("keydown", this.handleEscape);
			document.removeEventListener("click", this.handleOutsideClick);

			console.log("🗑️ Rating Widget destroyed");
		}
	}
})();
