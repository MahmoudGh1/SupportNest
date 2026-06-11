import prisma from "src/config/prisma.js";
import crypto from "crypto";

async function main() {
  // 1. Create a default pricing plan so the organization can be created with a required planId
  const freePlan =
    (await prisma.pricing.findFirst({ where: { name: "Free" } })) ??
    (await prisma.pricing.create({
      data: {
        name: "Free",
        priceMonthly: "0",
        features: {},
      },
    }));

  // 2. Create organization
  const org = await prisma.organization.create({
    data: {
      name: "Test Shop",
      slug: "test-shop",
      email: "admin@testshop.com",
      widgetSecret: "my-super-secret-widget-key",
      widgetConfig: {
        primaryColor: "#000000",
        greeting: "Hi! How can I help?",
      },
      planId: freePlan.id,
      isActive: true,
    },
  });
  console.log("✅ Org created:", org.id);

  // 2. Create API key
  const rawKey = "sk_test_1234567890abcdef";
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  const apiKey = await prisma.apiKey.create({
    data: {
      organizationId: org.id,
      keyHash,
      keyPrefix: rawKey.slice(0, 8),
      name: "Test Key",
      allowedOrigins: ["http://localhost:3000"],
      isActive: true,
    },
  });
  console.log("✅ API key created — use this in WebSocket auth:", rawKey);

  // 3. Create BusinessApiConfig
  // This points to a mock API server (we'll use jsonplaceholder or a local mock)
  const apiConfig = await prisma.businessApiConfig.create({
    data: {
      organizationId: org.id,
      baseUrl: "https://jsonplaceholder.typicode.com", // free mock REST API
      authType: "API_KEY",
      authValue: "mock-api-key-value",
      headerName: "x-api-key",
    },
  });
  console.log("✅ BusinessApiConfig created:", apiConfig.id);

  // 4. Create ToolDefinitions
  // Tool 1 — get order (maps to GET /todos/:id on jsonplaceholder)
  await prisma.toolDefinition.create({
    data: {
      organizationId: org.id,
      apiConfigId: apiConfig.id,
      name: "get_order",
      description: "Fetch a customer's order details by order ID",
      method: "GET",
      path: "/todos/{orderId}",
      parameters: [
        {
          name: "orderId",
          type: "string",
          required: true,
          location: "path",
          description: "The order ID to look up",
        },
      ],
      responseSchema: {},
      isActive: true,
    },
  });

  // Tool 2 — get user account (maps to GET /users/:id)
  await prisma.toolDefinition.create({
    data: {
      organizationId: org.id,
      apiConfigId: apiConfig.id,
      name: "get_account",
      description: "Fetch customer account information by customer ID",
      method: "GET",
      path: "/users/{customerId}",
      parameters: [
        {
          name: "customerId",
          type: "string",
          required: true,
          location: "path",
          description: "The customer ID",
        },
      ],
      responseSchema: {},
      isActive: true,
    },
  });

  // Tool 3 — login tool (tagged x-supportnest-type: login)
  await prisma.toolDefinition.create({
    data: {
      organizationId: org.id,
      apiConfigId: apiConfig.id,
      name: "login",
      description: "Login URL for customer identity verification",
      method: "GET",
      path: "/login",
      parameters: [
        {
          name: "loginUrl",
          type: "string",
          required: false,
          location: "query",
          description: "Login endpoint",
          "x-supportnest-type": "login",
        },
      ],
      responseSchema: {},
      isActive: true,
    },
  });

  console.log("✅ ToolDefinitions created");
  console.log("\n── COPY THESE FOR TESTING ──────────────────────");
  console.log("orgId:         ", org.id);
  console.log("widgetSecret:  ", "my-super-secret-widget-key");
  console.log("rawApiKey:     ", rawKey);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
