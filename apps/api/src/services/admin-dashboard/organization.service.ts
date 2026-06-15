/**
 * Organization dashboard service.
 *
 * This module composes organization and global analytics for the admin dashboard,
 * including tier resolution metrics, conversation and ticket summaries, CSAT
 * aggregation, recent escalations, organization listing, and organization detail.
 *
 * It also exposes a transactional conversation deletion helper used by the
 * admin dashboard when removing completed conversations safely.
 */
import prisma from "src/config/prisma.js";
import { parseDateRange, round2, safeAvg } from "../../utils/helpers.js";
import {
  pricingSelect,
  userSelect,
  type ConversationRecord,
  type ConversationStats,
  type CsatSummary,
  type DeleteConversationResult,
  type DeleteOrgResult,
  type EscalationRecord,
  type GetConversationByIdResult,
  type GetConversationsResult,
  type OrgDetail,
  type OrgSummary,
  type TicketStats,
  type TierStats,
} from "src/types/admin-dashboard.types.js";
import type { promises } from "node:dns";
import {
  cancelOrgDeletion,
  isScheduled,
  scheduleOrgDeletion,
} from "src/queues/deletion.queue.js";
import {
  sendOrgDeletionCancelledEmail,
  sendOrgDeletionScheduledEmail,
} from "src/utils/mailer.js";

// ─── Build tier stats from agent_logs + conversation_analytics ────────────────

/**
 * Build tier-level resolution statistics for an organization or globally.
 *
 * The result includes counts and rates for tier 0/1/2 resolution, human escalations,
 * unresolved conversations, average latency, and total tokens consumed.
 *
 * @param orgId Optional organization id filter.
 * @param dateFilter Optional date range filter for analytics.
 * @returns Aggregated TierStats for the requested scope.
 */
async function buildTierStats(
  orgId?: string,
  dateFilter?: { gte?: Date; lte?: Date },
): Promise<TierStats> {
  const baseWhere = {
    ...(orgId ? { conversation: { is: { organizationId: orgId } } } : {}),
    ...(dateFilter ? { createdAt: dateFilter } : {}),
  };

  const analyticsWhere = {
    ...(orgId ? { organizationId: orgId } : {}),
    ...(dateFilter ? { createdAt: dateFilter } : {}),
  };

  const [tier0Count, tier1Count, tier2Count, humanCount, unresolvedCount] =
    await Promise.all([
      prisma.conversationAnalytics.count({
        where: { ...analyticsWhere, resolvedByTier: "TIER0" },
      }),
      prisma.conversationAnalytics.count({
        where: { ...analyticsWhere, resolvedByTier: "TIER1" },
      }),
      prisma.conversationAnalytics.count({
        where: { ...analyticsWhere, resolvedByTier: "TIER2" },
      }),
      prisma.conversationAnalytics.count({
        where: { ...analyticsWhere, resolvedByTier: "HUMAN" },
      }),
      prisma.conversationAnalytics.count({
        where: { ...analyticsWhere, resolvedByTier: "UNRESOLVED" },
      }),
    ]);

  const routerReceived =
    tier0Count + tier1Count + tier2Count + humanCount + unresolvedCount;

  const tier1Logs = await prisma.agentLog.aggregate({
    where: { ...baseWhere, tier: "TIER1" },
    _avg: { latencyMs: true },
    _sum: { tokensUsed: true },
  });

  const tier2Logs = await prisma.agentLog.aggregate({
    where: { ...baseWhere, tier: "TIER2" },
    _avg: { latencyMs: true },
    _sum: { tokensUsed: true },
  });

  const routerTokens = await prisma.agentLog.aggregate({
    where: { ...baseWhere, tier: "ROUTER" },
    _sum: { tokensUsed: true },
  });

  const totalTokens =
    (tier1Logs._sum?.tokensUsed ?? 0) +
    (tier2Logs._sum?.tokensUsed ?? 0) +
    (routerTokens._sum?.tokensUsed ?? 0);

  return {
    router_received: routerReceived,
    tier0_resolved: tier0Count,
    tier0_resolve_rate:
      routerReceived > 0 ? round2((tier0Count / routerReceived) * 100) : 0,
    tier1_resolved: tier1Count,
    tier1_resolve_rate:
      routerReceived > 0 ? round2((tier1Count / routerReceived) * 100) : 0,
    tier2_resolved: tier2Count,
    tier2_resolve_rate:
      routerReceived > 0 ? round2((tier2Count / routerReceived) * 100) : 0,
    human_escalated: humanCount,
    human_escalation_rate:
      routerReceived > 0 ? round2((humanCount / routerReceived) * 100) : 0,
    unresolved: unresolvedCount,
    avg_tier1_latency_ms: tier1Logs._avg?.latencyMs
      ? Math.round(tier1Logs._avg.latencyMs)
      : null,
    avg_tier2_latency_ms: tier2Logs._avg?.latencyMs
      ? Math.round(tier2Logs._avg.latencyMs)
      : null,
    total_tokens_used: totalTokens,
  };
}

// ─── Build conversation stats ─────────────────────────────────────────────────

/**
 * Build high-level conversation metrics for an organization or globally.
 *
 * Includes totals, active/escalated/closed counts, and average resolution + first response times.
 *
 * @param orgId Optional organization id filter.
 * @param dateFilter Optional date range filter for conversation records.
 * @returns Aggregated ConversationStats for the requested scope.
 */
async function buildConversationStats(
  orgId?: string,
  dateFilter?: { gte?: Date; lte?: Date },
): Promise<ConversationStats> {
  const where = {
    ...(orgId ? { organizationId: orgId } : {}),
    ...(dateFilter ? { createdAt: dateFilter } : {}),
  };

  const [total, active, escalated, closed] = await Promise.all([
    prisma.conversation.count({ where }),
    prisma.conversation.count({
      where: { ...where, conversationStatus: "ACTIVE" },
    }),
    prisma.conversation.count({
      where: { ...where, conversationStatus: "ESCALATED" },
    }),
    prisma.conversation.count({
      where: { ...where, conversationStatus: "CLOSED" },
    }),
  ]);

  const analyticsWhere = {
    ...(orgId ? { organizationId: orgId } : {}),
    ...(dateFilter ? { createdAt: dateFilter } : {}),
  };

  const analytics = await prisma.conversationAnalytics.aggregate({
    where: analyticsWhere,
    _avg: {
      resolutionTimeMs: true,
      firstResponseTimeMs: true,
    },
  });

  const avg = analytics._avg ?? {
    resolutionTimeMs: null,
    firstResponseTimeMs: null,
  };

  return {
    total,
    active,
    escalated,
    closed,
    avg_resolution_time_ms: avg.resolutionTimeMs
      ? Math.round(avg.resolutionTimeMs)
      : null,
    avg_first_response_time_ms: avg.firstResponseTimeMs
      ? Math.round(avg.firstResponseTimeMs)
      : null,
  };
}

// ─── Build ticket stats ───────────────────────────────────────────────────────

/**
 * Build ticket statistics for an organization or globally.
 *
 * Includes total tickets, status-based counts, and priority distribution.
 *
 * @param orgId Optional organization id filter.
 * @param dateFilter Optional date range filter for ticket records.
 * @returns Aggregated TicketStats for the requested scope.
 */
async function buildTicketStats(
  orgId?: string,
  dateFilter?: { gte?: Date; lte?: Date },
): Promise<TicketStats> {
  const where = {
    ...(orgId ? { organizationId: orgId } : {}),
    ...(dateFilter ? { createdAt: dateFilter } : {}),
  };

  const [total, open, in_progress, resolved, low, medium, high] =
    await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.count({ where: { ...where, status: "OPEN" } }),
      prisma.ticket.count({ where: { ...where, status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { ...where, status: "RESOLVED" } }),
      prisma.ticket.count({ where: { ...where, priority: "LOW" } }),
      prisma.ticket.count({ where: { ...where, priority: "MEDIUM" } }),
      prisma.ticket.count({ where: { ...where, priority: "HIGH" } }),
    ]);

  return {
    total,
    open,
    in_progress,
    resolved,
    by_priority: { low, medium, high },
  };
}

// ─── Build CSAT summary ───────────────────────────────────────────────────────

/**
 * Build CSAT summary data for an organization or globally.
 *
 * Includes average score, total rating count, and score distribution.
 *
 * @param orgId Optional organization id filter.
 * @param dateFilter Optional date range filter for CSAT records.
 * @returns Aggregated CsatSummary for the requested scope.
 */
async function buildCsatSummary(
  orgId?: string,
  dateFilter?: { gte?: Date; lte?: Date },
): Promise<CsatSummary> {
  const where = {
    ...(orgId ? { organizationId: orgId } : {}),
    ...(dateFilter ? { createdAt: dateFilter } : {}),
  };

  const [agg, distribution] = await Promise.all([
    prisma.csatRating.aggregate({
      where,
      _avg: { score: true },
      _count: { id: true },
    }),
    prisma.csatRating.groupBy({
      by: ["score"],
      where,
      _count: { id: true },
      orderBy: { score: "asc" },
    }),
  ]);

  return {
    avg_score: agg._avg?.score != null ? round2(agg._avg.score) : null,
    total_ratings:
      agg._count && typeof agg._count === "object" ? (agg._count.id ?? 0) : 0,
    distribution: distribution.map((d) => ({
      score: d.score,
      count: d._count && typeof d._count === "object" ? (d._count.id ?? 0) : 0,
    })),
  };
}

// ─── Build recent escalations ─────────────────────────────────────────────────

/**
 * Build a list of recent active escalation tickets for an organization or globally.
 *
 * Returns a simplified record set containing ticket metadata, organization info,
 * assigned user details, and timestamp strings.
 *
 * @param orgId Optional organization id filter.
 * @param limit Maximum number of escalation records to return.
 * @returns EscalationRecord[] ordered by creation date descending.
 */
async function buildRecentEscalations(
  orgId?: string,
  limit = 10,
): Promise<EscalationRecord[]> {
  const tickets = await prisma.ticket.findMany({
    where: {
      status: { in: ["OPEN", "IN_PROGRESS"] },
      ...(orgId ? { organizationId: orgId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      organization: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return tickets.map((t) => ({
    ticket_id: t.id,
    conversation_id: t.conversationId,
    organization_id: t.organizationId,
    organization_name: t.organization.name,
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
}

// ─── Public service functions ─────────────────────────────────────────────────

/**
 * List organizations for the admin dashboard with summary counts and pagination.
 *
 * Supports text search on name/email/slug and optional active-state filtering.
 *
 * @param opts Pagination and filtering options.
 * @returns Paged organization summaries and total count.
 */
export async function listOrganizations(opts: {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  is_active?: boolean;
}): Promise<{ data: OrgSummary[]; total: number }> {
  const where = {
    ...(opts.search
      ? {
          OR: [
            { name: { contains: opts.search, mode: "insensitive" as const } },
            { email: { contains: opts.search, mode: "insensitive" as const } },
            { slug: { contains: opts.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(opts.is_active !== undefined ? { isActive: opts.is_active } : {}),
  };

  const [orgs, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      skip: opts.skip,
      take: opts.limit,
      orderBy: { createdAt: "desc" },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            priceMonthly: true,
          },
        },
        _count: {
          select: {
            users: true,
            conversations: true,
            tickets: true,
          },
        },
      },
    }),
    prisma.organization.count({ where }),
  ]);

  const orgIds = orgs.map((o) => o.id);

  const [
    activeConvCounts,
    openTicketCounts,
    escalatedTicketCounts,
    resolvedTicketCounts,
  ] = await Promise.all([
    prisma.conversation.groupBy({
      by: ["organizationId"],
      where: { organizationId: { in: orgIds }, conversationStatus: "ACTIVE" },
      _count: { id: true },
    }),
    prisma.ticket.groupBy({
      by: ["organizationId"],
      where: { organizationId: { in: orgIds }, status: "OPEN" },
      _count: { id: true },
    }),
    prisma.ticket.groupBy({
      by: ["organizationId"],
      where: {
        organizationId: { in: orgIds },
        status: { in: ["OPEN", "IN_PROGRESS"] },
        conversation: { conversationStatus: "ESCALATED" },
      },
      _count: { id: true },
    }),
    prisma.ticket.groupBy({
      by: ["organizationId"],
      where: { organizationId: { in: orgIds }, status: "RESOLVED" },
      _count: { id: true },
    }),
  ]);

  const byOrgId = <
    T extends { organizationId: string; _count: { id: number } },
  >(
    arr: T[],
  ) => Object.fromEntries(arr.map((r) => [r.organizationId, r._count.id]));

  const activeConvMap = byOrgId(activeConvCounts);
  const openTicketMap = byOrgId(openTicketCounts);
  const escalatedTicketMap = byOrgId(escalatedTicketCounts);
  const resolvedTicketMap = byOrgId(resolvedTicketCounts);

  const data: OrgSummary[] = orgs.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    email: o.email,
    is_active: o.isActive,
    plan: o.plan
      ? {
          id: o.plan.id,
          name: o.plan.name,
          price_monthly: Number(o.plan.priceMonthly),
        }
      : null,
    created_at: o.createdAt.toISOString(),
    stats: {
      total_users: o._count.users,
      total_conversations: o._count.conversations,
      active_conversations: activeConvMap[o.id] ?? 0,
      total_tickets: o._count.tickets,
      open_tickets: openTicketMap[o.id] ?? 0,
      escalated_tickets: escalatedTicketMap[o.id] ?? 0,
      resolved_tickets: resolvedTicketMap[o.id] ?? 0,
    },
  }));

  return { data, total };
}

/**
 * Retrieve detailed organization information for the admin dashboard.
 *
 * Includes plan data, users, counts, tier/conversation/ticket stats, CSAT summary,
 * and recent escalations.
 *
 * @param orgId Organization id to retrieve.
 * @returns OrgDetail or null if the organization is not found.
 */
export async function getOrganizationDetail(
  orgId: string,
): Promise<OrgDetail | null> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      plan: {
        select: pricingSelect,
      },
      users: {
        select: userSelect,
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: { conversations: true, tickets: true, users: true },
      },
    },
  });

  if (!org) return null;

  const [tierStats, convStats, ticketStats, csatSummary, recentEscalations] =
    await Promise.all([
      buildTierStats(orgId),
      buildConversationStats(orgId),
      buildTicketStats(orgId),
      buildCsatSummary(orgId),
      buildRecentEscalations(orgId, 5),
    ]);

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    email: org.email,
    is_active: org.isActive,
    widget_config: org.widgetConfig as Record<string, unknown>,
    plan: org.plan
      ? {
          id: org.plan.id,
          name: org.plan.name,
          price_monthly: Number(org.plan.priceMonthly),
        }
      : null,
    created_at: org.createdAt.toISOString(),
    stats: {
      total_users: org._count.users,
      total_conversations: org._count.conversations,
      active_conversations: convStats.active,
      total_tickets: org._count.tickets,
      open_tickets: ticketStats.open,
      escalated_tickets: ticketStats.in_progress,
      resolved_tickets: ticketStats.resolved,
    },
    users: org.users.map((u) => ({
      id: u.id,
      email: u.email,
      first_name: u.firstName,
      last_name: u.lastName,
      role: u.role as string,
      is_active: u.isActive,
      created_at: u.createdAt.toISOString(),
      assigned_tickets_count: u._count.assignedTickets,
    })),
    tier_stats: tierStats,
    conversation_stats: convStats,
    ticket_stats: ticketStats,
    csat: csatSummary,
    recent_escalations: recentEscalations,
  };
}

/**
 * Retrieve global dashboard overview metrics across all organizations.
 *
 * Includes organization counts, user counts, conversation/ticket totals, revenue,
 * CSAT, and overall AI resolution performance.
 *
 * @returns A summary object for the global admin overview.
 */
export async function getGlobalOverview() {
  const [
    totalOrgs,
    activeOrgs,
    totalUsers,
    tierStats,
    convStats,
    ticketStats,
    csatSummary,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: { not: "SUPER_ADMIN" } } }),
    buildTierStats(),
    buildConversationStats(),
    buildTicketStats(),
    buildCsatSummary(),
  ]);

  const revenueAgg = await prisma.payment.aggregate({
    where: { status: "SUCCEEDED" },
    _sum: { amount: true },
  });

  const escalatedTickets = await prisma.ticket.count({
    where: {
      status: { in: ["OPEN", "IN_PROGRESS"] },
      conversation: { conversationStatus: "ESCALATED" },
    },
  });

  return {
    total_organizations: totalOrgs,
    active_organizations: activeOrgs,
    suspended_organizations: totalOrgs - activeOrgs,
    total_users: totalUsers,
    total_conversations: convStats.total,
    active_conversations: convStats.active,
    total_tickets: ticketStats.total,
    open_tickets: ticketStats.open,
    escalated_tickets: escalatedTickets,
    overall_ai_resolution_rate:
      tierStats.router_received > 0
        ? round2(
            ((tierStats.tier1_resolved + tierStats.tier2_resolved) /
              tierStats.router_received) *
              100,
          )
        : 0,
    avg_csat_score: csatSummary.avg_score,
    tier_breakdown: tierStats,
    total_revenue: Number(revenueAgg._sum.amount ?? 0),
  };
}

export async function getOrgConversationsService(
  orgId: string,
): Promise<GetConversationsResult> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true },
  });
  if (!org) return { error: "ORG_NOT_FOUND" };

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        organizationId: true,
        conversationStatus: true,
        createdAt: true,
        closedAt: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            isAnonymous: true,
          },
        },
        ticket: {
          select: {
            status: true,
            priority: true,
          },
        },
        csatRating: {
          select: { score: true },
        },
        _count: {
          select: { messages: true },
        },
      },
    }),
    prisma.conversation.count({ where: { organizationId: orgId } }),
  ]);

  const data: ConversationRecord[] = conversations.map((c) => ({
    id: c.id,
    organization_id: c.organizationId,
    status: c.conversationStatus,
    customer: {
      id: c.customer.id,
      name: c.customer.name,
      email: c.customer.email,
      is_anonymous: c.customer.isAnonymous,
    },
    total_messages: c._count.messages,
    has_ticket: c.ticket !== null,
    ticket_status: c.ticket?.status ?? null,
    ticket_priority: c.ticket?.priority ?? null,
    csat_score: c.csatRating?.score ?? null,
    created_at: c.createdAt.toISOString(),
    closed_at: c.closedAt?.toISOString() ?? null,
  }));

  return { success: true, data, total };
}

export async function getConversationByIdService(
  orgId: string,
  conversationId: string,
): Promise<GetConversationByIdResult> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true },
  });
  if (!org) return { error: "ORG_NOT_FOUND" };

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      organizationId: orgId,
    },
    select: {
      id: true,
      organizationId: true,
      conversationStatus: true,
      createdAt: true,
      closedAt: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          isAnonymous: true,
        },
      },
      messages: {
        select: {
          id: true,
          role: true,
          content: true,
          tier: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
      ticket: {
        select: {
          id: true,
          status: true,
          priority: true,
          createdAt: true,
          resolvedAt: true,
        },
      },
    },
  });

  if (!conversation) return { error: "CONVERSATION_NOT_FOUND" };

  return {
    success: true,
    data: {
      id: conversation.id,
      organization_id: conversation.organizationId,
      status: conversation.conversationStatus,
      customer: {
        id: conversation.customer.id,
        name: conversation.customer.name,
        email: conversation.customer.email,
        is_anonymous: conversation.customer.isAnonymous,
      },
      messages: conversation.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        tier: m.tier ?? null,
        created_at: m.createdAt.toISOString(),
      })),
      ticket: conversation.ticket
        ? {
            id: conversation.ticket.id,
            status: conversation.ticket.status,
            priority: conversation.ticket.priority,
            created_at: conversation.ticket.createdAt.toISOString(),
            resolved_at: conversation.ticket.resolvedAt?.toISOString() ?? null,
          }
        : null,

      created_at: conversation.createdAt.toISOString(),
      closed_at: conversation.closedAt?.toISOString() ?? null,
    },
  };
}

/**
 * Delete a completed conversation and its related records for an organization.
 *
 * Validates organization and conversation existence, prevents deletion of active conversations,
 * and removes analytics, CSAT, logs, messages, tickets, then the conversation record.
 *
 * @param orgId Organization id for ownership validation.
 * @param conversationId Conversation id to delete.
 * @returns Result object indicating success or a specific error code.
 */
export async function deleteConversationService(
  orgId: string,
  conversationId: string,
): Promise<DeleteConversationResult> {
  // Check org exists
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true },
  });
  if (!org) return { error: "ORG_NOT_FOUND" };

  // Check conversation exists and belongs to this org
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      organizationId: orgId,
    },
    select: {
      id: true,
      conversationStatus: true,
    },
  });
  if (!conversation) return { error: "CONVERSATION_NOT_FOUND" };

  // Block deletion if still active
  if (conversation.conversationStatus === "ACTIVE") {
    return { error: "CONVERSATION_STILL_ACTIVE" };
  }

  // Delete children first, then parent — order matters for FK constraints
  await prisma.$transaction([
    prisma.conversationAnalytics.deleteMany({ where: { conversationId } }),
    prisma.csatRating.deleteMany({ where: { conversationId } }),
    prisma.agentLog.deleteMany({ where: { conversationId } }),
    prisma.message.deleteMany({ where: { conversationId } }),
    prisma.ticket.deleteMany({ where: { conversationId } }),
    prisma.conversation.delete({ where: { id: conversationId } }),
  ]);

  return {
    success: true,
    conversation_id: conversationId,
    organization_id: orgId,
  };
}

async function hardDeleteOrg(orgId: string): Promise<void> {
  await prisma.$transaction([
    prisma.conversationAnalytics.deleteMany({
      where: { organizationId: orgId },
    }),
    prisma.csatRating.deleteMany({ where: { organizationId: orgId } }),
    prisma.agentLog.deleteMany({
      where: { conversation: { organizationId: orgId } },
    }),
    prisma.message.deleteMany({
      where: { conversation: { organizationId: orgId } },
    }),
    prisma.ticket.deleteMany({ where: { organizationId: orgId } }),
    prisma.conversation.deleteMany({ where: { organizationId: orgId } }),
    prisma.documentChunk.deleteMany({ where: { organizationId: orgId } }),
    prisma.knowledgeDocument.deleteMany({ where: { organizationId: orgId } }),
    prisma.apiKey.deleteMany({ where: { organizationId: orgId } }),
    prisma.customer.deleteMany({ where: { organizationId: orgId } }),
    prisma.payment.deleteMany({ where: { organizationId: orgId } }),
    prisma.user.deleteMany({ where: { organizationId: orgId } }),
    prisma.organization.delete({ where: { id: orgId } }),
  ]);

  console.log(`[Deletion] Org ${orgId} deleted successfully`);
}

export async function scheduleOrganizationDeletion(
  orgId: string,
): Promise<
  | { success: true; scheduled_at: string; deletes_at: string }
  | { error: "ORG_NOT_FOUND" | "ALREADY_SCHEDULED" }
> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, email: true },
  });
  if (!org) return { error: "ORG_NOT_FOUND" };
  if (isScheduled(orgId)) return { error: "ALREADY_SCHEDULED" };

  const deletesAt = new Date(Date.now() + 30 * 60 * 1000);

  // Schedule the deletion first
  scheduleOrgDeletion(orgId, () => hardDeleteOrg(orgId));

  // Send email — catch error so it never blocks the schedule
  try {
    await sendOrgDeletionScheduledEmail(org.email, org.name, deletesAt);
  } catch (err) {
    console.error("[Mailer] Failed to send deletion scheduled email:", err);
  }

  return {
    success: true,
    scheduled_at: new Date().toISOString(),
    deletes_at: deletesAt.toISOString(),
  };
}
export async function cancelOrganizationDeletion(
  orgId: string,
): Promise<{ success: true } | { error: "ORG_NOT_FOUND" | "NOT_SCHEDULED" }> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, email: true },
  });
  if (!org) return { error: "ORG_NOT_FOUND" };

  // cancelOrgDeletion now returns true if was ever scheduled
  const wasCancelled = cancelOrgDeletion(orgId);
  if (!wasCancelled) return { error: "NOT_SCHEDULED" };

  try {
    await sendOrgDeletionCancelledEmail(org.email, org.name);
  } catch (err) {
    console.error("[Mailer] Failed to send cancellation email:", err);
  }

  return { success: true };
}

export {
  buildTierStats,
  buildConversationStats,
  buildTicketStats,
  buildCsatSummary,
  buildRecentEscalations,
};
