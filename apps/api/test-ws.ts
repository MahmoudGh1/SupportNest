// Run with: npx tsx test-ws.ts
// Tests the full WebSocket flow: connect → auth → send message → receive Tier 0/1 response

import WebSocket from "ws";
import jwt from "jsonwebtoken";

const WS_URL = "ws://localhost:3201/widget/ws"; // change to your server port/path
const API_KEY = "sk_test_1234567890abcdef";
const WIDGET_SECRET = "my-super-secret-widget-key";

// ── Test 1: Anonymous customer (no JWT) ───────────────────────────────────────
async function testAnonymousFlow() {
  console.log("\n🔵 TEST 1: Anonymous customer");
  const ws = new WebSocket(WS_URL);
  let anonymousConversationId: string | null = null;

  ws.on("open", () => {
    // Auth without customerJwt → anonymous customer
    ws.send(
      JSON.stringify({
        type: "auth",
        payload: {
          apiKey: API_KEY,
          visitorId: "visitor_test_001",
        },
      }),
    );
  });

  ws.on("message", async (raw) => {
    const msg = JSON.parse(raw.toString());
    console.log("[Anonymous]", msg.type, JSON.stringify(msg.payload, null, 2));

    if (msg.type === "auth_ack") {
      anonymousConversationId = msg.payload.conversationId;
      console.log("✅ Auth OK — conversationId:", anonymousConversationId);

      // Ask something account-related → should trigger NEEDS_AUTH
      ws.send(
        JSON.stringify({
          type: "message_send",
          payload: { content: "What is my order status?" },
        }),
      );
    }

    if (msg.type === "needs_auth") {
      console.log("✅ Got NEEDS_AUTH — loginUrl:", msg.payload.loginUrl);
      console.log("   → Now simulate org site callback (see testVerifyFlow)");
      if (anonymousConversationId) {
        await testVerifyFlow(anonymousConversationId);
      }
    }

    if (msg.type === "message_ai") {
      console.log("✅ Tier 0 answered from KB:", msg.payload.message.content);
      ws.close();
    }
  });

  ws.on("error", console.error);
}

// ── Test 2: Identified customer (with JWT) ────────────────────────────────────
async function testIdentifiedFlow() {
  console.log("\n🟢 TEST 2: Identified customer");

  // Sign a customer JWT with the widgetSecret
  const customerJwt = jwt.sign(
    {
      sub: "customer_ext_001",
      externalId: "customer_ext_001",
      email: "sara@test.com",
      name: "Sara Ahmed",
    },
    WIDGET_SECRET,
    { expiresIn: "1h" },
  );

  const ws = new WebSocket(WS_URL);

  ws.on("open", () => {
    ws.send(
      JSON.stringify({
        type: "auth",
        payload: {
          apiKey: API_KEY,
          customerJwt,
        },
      }),
    );
  });

  ws.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());
    console.log(
      "[Identified]",
      msg.type,
      msg.payload ? JSON.stringify(msg.payload, null, 2) : "",
    );

    if (msg.type === "auth_ack") {
      console.log("✅ Auth OK — conversationId:", msg.payload.conversationId);

      // Ask something account-related → Tier 1 should call get_account tool
      ws.send(
        JSON.stringify({
          type: "message_send",
          payload: { content: "Can you show me my account details?" },
        }),
      );
    }

    if (msg.type === "typing") {
      console.log("⏳ Agent is typing...");
    }

    if (msg.type === "message_ai") {
      console.log("✅ Got AI response:", msg.payload.message.content);
      console.log("   Tools used:", msg.payload.toolsUsed);
      console.log("   Action:", msg.payload.action);
      ws.close();
    }

    if (msg.type === "escalated_to_human") {
      console.log("🔴 Escalated to human:", msg.payload.message);
      ws.close();
    }
  });

  ws.on("error", console.error);
}

// ── Test 3: Verify callback (simulate org site posting JWT after login) ────────
async function testVerifyFlow(conversationId: string) {
  console.log("\n🟡 TEST 3: Verify callback for conversation:", conversationId);

  const customerJwt = jwt.sign(
    { sub: "customer_ext_002", email: "ahmed@test.com", name: "Ahmed Ali" },
    WIDGET_SECRET,
    { expiresIn: "5m" },
  );

  const response = await fetch(
    `http://localhost:3201/api/v1/widget/sessions/${conversationId}/verify`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: customerJwt }),
    },
  );

  const data = await response.json();
  console.log("✅ Verify response:", data);
}

// ── Run ───────────────────────────────────────────────────────────────────────
(async () => {
  await testAnonymousFlow();
  await new Promise((r) => setTimeout(r, 3000));
  await testIdentifiedFlow();
})();
