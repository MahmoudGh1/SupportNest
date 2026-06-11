import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "src/config/prisma.js";
import { runTier1Agent } from "../services/tier1.service.js";
import { loadMemory } from "../utils/conversationMemory.utils.js";
import { activeSockets } from "src/websocket/ws.map.js";

interface CustomerJwtPayload {
  sub: string;       // externalId — customer's ID in the org's system
  email?: string;
  name?: string;
  [key: string]: unknown;
}

// POST /widget/sessions/:conversationId/verify
// Called by the org's site after the customer logs in.
// Body: { token: "<signed JWT>" }
export async function verifyCustomerController(req: Request, res: Response): Promise<void> {
  // req.params values can be string or string[] depending on how Express parsed the route.
  // Normalize to a single string to satisfy Prisma's expectations.
  let conversationId = req.params.conversationId as string | string[] | undefined;
  if (Array.isArray(conversationId)) conversationId = conversationId[0];
  const { token } = req.body;

  if (!token || typeof token !== "string") {
    res.status(400).json({ message: "token is required." });
    return;
  }
  if (!conversationId) {
    res.status(400).json({ message: "conversationId is required." });
    return;
  }

  try {
    // 1. Load conversation and resolve organization widgetSecret
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId as string },
    });

    if (!conversation) {
      res.status(404).json({ message: "Conversation not found." });
      return;
    }

    const organization = await prisma.organization.findUnique({
      where: { id: conversation.organizationId },
      select: { id: true, widgetSecret: true },
    });

    if (!organization) {
      res.status(404).json({ message: "Organization not found." });
      return;
    }

    // 2. Verify JWT using the org's widgetSecret
    let payload: CustomerJwtPayload;
    try {
      payload = jwt.verify(token, organization.widgetSecret) as CustomerJwtPayload;
    } catch {
      res.status(401).json({ message: "Invalid or expired token." });
      return;
    }

    if (!payload.sub) {
      res.status(400).json({ message: "Token missing sub claim (externalId)." });
      return;
    }

    // 3. Upsert identified customer row
    const identifiedCustomer = await prisma.customer.upsert({
      where: {
        organizationId_externalId: {
          organizationId: conversation.organizationId,
          externalId: payload.sub,
        },
      },
      update: {
        isAnonymous: false,
        email: payload.email ?? null,
        name: payload.name ?? null,
        metadata: JSON.stringify(payload),
      },
      create: {
        organizationId: conversation.organizationId,
        externalId: payload.sub,
        email: payload.email ?? null,
        name: payload.name ?? null,
        isAnonymous: false,
        metadata: JSON.stringify(payload),
      },
    });

    // 4. Point the conversation to the identified customer
    if (conversation.customerId !== identifiedCustomer.id) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { customerId: identifiedCustomer.id },
      });
    }

    // 5. Load Redis memory and find the last customer question to resume from
    const conversationHistory = await loadMemory(conversationId);
    const lastCustomerMessage = [...conversationHistory]
      .reverse()
      .find((m) => m.role === "customer");

    if (!lastCustomerMessage) {
      res.status(200).json({ message: "Verified. No pending question to resume." });
      return;
    }

    // 6. Re-run Tier 1 now that the customer is identified
    const tier1Result = await runTier1Agent(
      lastCustomerMessage.content,
      conversation.organizationId,
      conversationId,
      identifiedCustomer.id,
      conversationHistory,
    );

    // 7. Push result to the widget via WebSocket using activeSockets map
    const socket = activeSockets.get(conversationId);

    if (socket && socket.readyState === socket.OPEN) {
      if (tier1Result.action === "NEEDS_AUTH") {
        // Still anonymous somehow — shouldn't happen but handle gracefully
        socket.send(JSON.stringify({
          type: "needs_auth",
          payload: {
            message: tier1Result.responseText,
            loginUrl: tier1Result.loginUrl,
          },
        }));
      } else {
        socket.send(JSON.stringify({
          type: "message_ai",
          payload: {
            message: {
              role: "AI",
              content: tier1Result.responseText,
              tier: "TIER1",
            },
            action: tier1Result.action,
            toolsUsed: tier1Result.toolsUsed,
          },
        }));
      }
    } else {
      // Socket disconnected while customer was logging in — message is in DB anyway
      console.warn(`[Verify] Socket not found or closed for conversation: ${conversationId}`);
    }

    res.status(200).json({
      message: "Customer verified. Tier 1 resumed.",
      customerId: identifiedCustomer.id,
    });
  } catch (err) {
    console.error("[Verify Customer Error]:", err);
    res.status(500).json({
      message: "Internal Server Error",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}