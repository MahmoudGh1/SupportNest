/**
 * Admin organization controller.
 *
 * This controller exposes REST endpoints used by the admin dashboard to manage
 * organizations, inspect organization-level and global metrics, and delete
 * completed conversations safely.
 */
import type { Response } from "express";

import {
  listOrganizations,
  getOrganizationDetail,
  getGlobalOverview,
  buildTierStats,
  buildConversationStats,
  buildTicketStats,
  buildCsatSummary,
  buildRecentEscalations,
  deleteConversationService,
  getOrgConversationsService,
  getConversationByIdService,
  deleteOrganizationService,
} from "../../services/admin-dashboard/organization.service.js";
import {
  parsePagination,
  buildPaginatedResponse,
  notFound,
  badRequest,
  sendError,
} from "../../utils/helpers.js";
import { parseDateRange } from "../../utils/helpers.js";
import type { AuthenticatedRequest } from "src/types/auth.types.js";
import prisma from "src/config/prisma.js";

/**
 * Normalize a URL/query parameter value to a single string.
 *
 * This helper accepts string, string array, or object values and returns the
 * first string value when available.
 */
function getStringParam(
  value: string | string[] | Record<string, unknown> | undefined,
): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }
  return undefined;
}

/**
 * GET /admin/overview
 *
 * Return the overall global admin dashboard overview metrics.
 */
export async function getOverview(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const overview = await getGlobalOverview();
  res.json(overview);
}

/**
 * GET /admin/organizations
 *
 * List organizations with pagination, optional search, and optional active-state filter.
 */
export async function getOrganizations(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { page, limit, skip } = parsePagination(req.query);
  const search = getStringParam(req.query.search as string);
  const is_active =
    req.query.isActive !== undefined
      ? getStringParam(req.query.isActive as string) === "true"
      : undefined;

  const params: {
    page: number;
    limit: number;
    skip: number;
    search?: string;
    is_active?: boolean;
  } = {
    page,
    limit,
    skip,
  };

  if (search !== undefined) params.search = search;
  if (is_active !== undefined) params.is_active = is_active;

  const { data, total } = await listOrganizations(params);
  res.json(buildPaginatedResponse(data, total, page, limit));
}

/**
 * GET /admin/organizations/:orgId
 *
 * Return detailed organization data for the specified organization id.
 */
export async function getOrganization(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const orgId = getStringParam(req.params.orgId);
  if (!orgId) {
    badRequest(res, "Organization id is required.");
    return;
  }
  const detail = await getOrganizationDetail(orgId);
  if (!detail) {
    notFound(res, "Organization");
    return;
  }
  res.json(detail);
}

/**
 * POST /admin/organizations
 *
 * Create a new organization, validating required fields and slug uniqueness.
 */
export async function createOrganization(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { name, email, slug, plan_id, widget_config } = req.body;

  if (!name || !email || !slug) {
    badRequest(res, "name, email, and slug are required.");
    return;
  }

  const slugConflict = await prisma.organization.findUnique({
    where: { slug },
  });
  if (slugConflict) {
    sendError(
      res,
      409,
      "SLUG_CONFLICT",
      "An organization with this slug already exists.",
    );
    return;
  }

  const crypto = await import("crypto");
  const widgetSecret = crypto.randomBytes(32).toString("hex");

  const org = await prisma.organization.create({
    data: {
      name,
      email,
      slug,
      widgetSecret,
      widgetConfig: widget_config ?? {},
      planId: plan_id ?? null,
      isActive: true,
    },
    include: {
      plan: { select: { id: true, name: true, priceMonthly: true } },
    },
  });

  res.status(201).json({
    id: org.id,
    name: org.name,
    slug: org.slug,
    email: org.email,
    is_active: org.isActive,
    plan: org.plan
      ? {
          id: org.plan.id,
          name: org.plan.name,
          price_monthly: Number(org.plan.priceMonthly),
        }
      : null,
    created_at: org.createdAt.toISOString(),
  });
}

/**
 * PATCH /admin/organizations/:orgId
 *
 * Update allowed organization fields for the specified organization id.
 */
export async function updateOrganization(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const orgId = getStringParam(req.params.orgId);
  if (!orgId) {
    badRequest(res, "Organization id is required.");
    return;
  }
  const fieldMap: Record<string, string> = {
    name: "name",
    email: "email",
    is_active: "isActive",
    plan_id: "planId",
    widget_config: "widgetConfig",
  };
  const updates: Record<string, unknown> = {};

  for (const [field, prismaKey] of Object.entries(fieldMap)) {
    if (req.body[field] !== undefined) updates[prismaKey] = req.body[field];
  }

  if (Object.keys(updates).length === 0) {
    badRequest(res, "No valid fields provided for update.");
    return;
  }

  const exists = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!exists) {
    notFound(res, "Organization");
    return;
  }

  const org = await prisma.organization.update({
    where: { id: orgId },
    data: updates as any,
    include: {
      plan: { select: { id: true, name: true, priceMonthly: true } },
    },
  });

  res.json({
    id: org.id,
    name: org.name,
    slug: org.slug,
    email: org.email,
    is_active: org.isActive,
    widget_config: org.widgetConfig,
    plan: org.plan
      ? {
          id: org.plan.id,
          name: org.plan.name,
          price_monthly: Number(org.plan.priceMonthly),
        }
      : null,
    updated_at: org.updatedAt.toISOString(),
  });
}

/**
 * PATCH /admin/organizations/:orgId/suspend
 *
 * Suspend an organization by setting its active flag to false.
 */
export async function suspendOrganization(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const orgId = getStringParam(req.params.orgId);
  if (!orgId) {
    badRequest(res, "Organization id is required.");
    return;
  }
  const exists = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!exists) {
    notFound(res, "Organization");
    return;
  }

  await prisma.organization.update({
    where: { id: orgId },
    data: { isActive: false },
  });
  res.json({ message: "Organization suspended." });
}

/**
 * PATCH /admin/organizations/:orgId/activate
 *
 * Reactivate an organization by setting its active flag to true.
 */
export async function activateOrganization(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const orgId = getStringParam(req.params.orgId);
  if (!orgId) {
    badRequest(res, "Organization id is required.");
    return;
  }
  const exists = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!exists) {
    notFound(res, "Organization");
    return;
  }

  await prisma.organization.update({
    where: { id: orgId },
    data: { isActive: true },
  });
  res.json({ message: "Organization activated." });
}

export async function deleteOrganization(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { orgId } = req.params;

  const result = await deleteOrganizationService(orgId as string);

  if ("error" in result) {
    switch (result.error) {
      case "ORG_NOT_FOUND":
        notFound(res, "Organization");
        return;
      case "ORG_HAS_ACTIVE_CONVERSATIONS":
        sendError(
          res,
          400,
          "ORG_HAS_ACTIVE_CONVERSATIONS",
          "Cannot delete an organization with active conversations. Close them first.",
        );
        return;
    }
  }

  res.json({
    message: "Organization and all related data deleted successfully.",
    deleted: {
      organization_id: result.organization_id,
    },
  });
}
/**
 * GET /admin/organizations/:orgId/tier-stats
 *
 * Retrieve tier-level metrics for a specific organization, with optional date filtering.
 */
export async function getOrgTierStats(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const orgId = getStringParam(req.params.orgId);
  if (!orgId) {
    badRequest(res, "Organization id is required.");
    return;
  }
  const { from, to } = req.query as { from?: string; to?: string };
  const dateFilter = parseDateRange(from, to);

  const exists = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!exists) {
    notFound(res, "Organization");
    return;
  }

  const stats = await buildTierStats(
    orgId,
    Object.keys(dateFilter).length ? dateFilter : undefined,
  );
  res.json(stats);
}

/**
 * GET /admin/organizations/:orgId/conversation-stats
 *
 * Return conversation metrics for a specific organization, with optional date filtering.
 */
export async function getOrgConversationStats(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const orgId = getStringParam(req.params.orgId);
  if (!orgId) {
    badRequest(res, "Organization id is required.");
    return;
  }
  const { from, to } = req.query as { from?: string; to?: string };
  const dateFilter = parseDateRange(from, to);

  const exists = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!exists) {
    notFound(res, "Organization");
    return;
  }

  const stats = await buildConversationStats(
    orgId,
    Object.keys(dateFilter).length ? dateFilter : undefined,
  );
  res.json(stats);
}

/**
 * GET /admin/organizations/:orgId/ticket-stats
 *
 * Retrieve ticket statistics for a specific organization, with optional date filtering.
 */
export async function getOrgTicketStats(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const orgId = getStringParam(req.params.orgId);
  if (!orgId) {
    badRequest(res, "Organization id is required.");
    return;
  }
  const { from, to } = req.query as { from?: string; to?: string };
  const dateFilter = parseDateRange(from, to);

  const exists = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!exists) {
    notFound(res, "Organization");
    return;
  }

  const stats = await buildTicketStats(
    orgId,
    Object.keys(dateFilter).length ? dateFilter : undefined,
  );
  res.json(stats);
}

/**
 * GET /admin/organizations/:orgId/csat
 *
 * Return customer satisfaction summary data for a specific organization.
 */
export async function getOrgCsat(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const orgId = getStringParam(req.params.orgId);
  if (!orgId) {
    badRequest(res, "Organization id is required.");
    return;
  }
  const { from, to } = req.query as { from?: string; to?: string };
  const dateFilter = parseDateRange(from, to);

  const exists = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!exists) {
    notFound(res, "Organization");
    return;
  }

  const stats = await buildCsatSummary(
    orgId,
    Object.keys(dateFilter).length ? dateFilter : undefined,
  );
  res.json(stats);
}

/**
 * GET /admin/organizations/:orgId/escalations
 *
 * List active escalation tickets for a specific organization with pagination and optional date filtering.
 */
export async function getOrgEscalations(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const orgId = getStringParam(req.params.orgId);
  if (!orgId) {
    badRequest(res, "Organization id is required.");
    return;
  }
  const { page, limit, skip } = parsePagination(req.query);
  const { from, to } = req.query as { from?: string; to?: string };
  const dateFilter = parseDateRange(from, to);

  const exists = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!exists) {
    notFound(res, "Organization");
    return;
  }

  const where = {
    organizationId: orgId,
    status: { in: ["OPEN", "IN_PROGRESS"] as any },
    ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
  };

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        organization: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        conversation: {
          select: {
            id: true,
            conversationStatus: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  const data = tickets.map((t) => ({
    ticket_id: t.id,
    conversation_id: t.conversationId,
    organization_id: t.organizationId,
    organization_name: t.organization.name,
    conversation_status: t.conversation.conversationStatus,
    priority: t.priority,
    status: t.status,
    resolution_note: t.resolutionNote,
    assigned_to: t.assignedTo
      ? {
          id: t.assignedTo.id,
          full_name: `${t.assignedTo.firstName} ${t.assignedTo.lastName}`,
        }
      : null,
    created_at: t.createdAt.toISOString(),
    resolved_at: t.resolvedAt?.toISOString() ?? null,
  }));

  res.json(buildPaginatedResponse(data, total, page, limit));
}

/**
 * GET /admin/tier-stats
 *
 * Return global tier statistics across all organizations, with optional date filtering.
 */
export async function getGlobalTierStats(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { from, to } = req.query as { from?: string; to?: string };
  const dateFilter = parseDateRange(from, to);
  const stats = await buildTierStats(
    undefined,
    Object.keys(dateFilter).length ? dateFilter : undefined,
  );
  res.json(stats);
}

/**
 * GET /admin/escalations
 *
 * List global escalation tickets with pagination, filtering by priority/status/date.
 */
export async function getGlobalEscalations(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { page, limit, skip } = parsePagination(req.query);
  const { from, to, priority, status } = req.query as Record<
    string,
    string | undefined
  >;
  const dateFilter = parseDateRange(from, to);

  const where = {
    ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
    ...(priority ? { priority: priority.toUpperCase() as any } : {}),
    ...(status
      ? { status: status.toUpperCase() as any }
      : { status: { in: ["OPEN", "IN_PROGRESS"] as any } }),
  };

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        organization: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        conversation: { select: { id: true, conversationStatus: true } },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  const data = tickets.map((t) => ({
    ticket_id: t.id,
    conversation_id: t.conversationId,
    organization_id: t.organizationId,
    organization_name: t.organization.name,
    conversation_status: t.conversation.conversationStatus,
    priority: t.priority,
    status: t.status,
    assigned_to: t.assignedTo
      ? {
          id: t.assignedTo.id,
          full_name: `${t.assignedTo.firstName} ${t.assignedTo.lastName}`,
        }
      : null,
    created_at: t.createdAt.toISOString(),
    resolved_at: t.resolvedAt?.toISOString() ?? null,
  }));

  res.json(buildPaginatedResponse(data, total, page, limit));
}

export async function getOrgConversations(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { orgId } = req.params;

  const result = await getOrgConversationsService(orgId as string);

  if ("error" in result) {
    notFound(res, "Organization");
    return;
  }

  res.json({ data: result.data, total: result.total });
}

export async function getConversationById(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { orgId, conversationId } = req.params;

  const result = await getConversationByIdService(
    orgId as string,
    conversationId as string,
  );

  if ("error" in result) {
    switch (result.error) {
      case "ORG_NOT_FOUND":
        notFound(res, "Organization");
        return;
      case "CONVERSATION_NOT_FOUND":
        notFound(res, "Conversation");
        return;
    }
  }

  res.json(result.data);
}

/**
 * DELETE /admin/organizations/:orgId/conversations/:conversationId
 *
 * Delete a completed conversation and its related records for the specified organization.
 */
export async function deleteConversation(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { orgId, conversationId } = req.params;

  const result = await deleteConversationService(
    orgId as string,
    conversationId as string,
  );

  if ("error" in result) {
    switch (result.error) {
      case "ORG_NOT_FOUND":
        notFound(res, "Organization");
        return;
      case "CONVERSATION_NOT_FOUND":
        notFound(res, "Conversation");
        return;
      case "CONVERSATION_STILL_ACTIVE":
        sendError(
          res,
          400,
          "CONVERSATION_STILL_ACTIVE",
          "Cannot delete an active conversation. Close it first.",
        );
        return;
    }
  }

  res.json({
    message: "Conversation and all related data deleted successfully.",
    deleted: {
      conversation_id: result.conversation_id,
      organization_id: result.organization_id,
    },
  });
}
