import prisma from "src/config/prisma.js";
import { parseDateRange, round2, safeAvg } from "../../utils/helpers.js";

type TierStats = {
	router_received: number;
	tier0_resolved: number;
	tier0_resolve_rate: number;
	tier1_resolved: number;
	tier1_resolve_rate: number;
	tier2_resolved: number;
	tier2_resolve_rate: number;
	human_escalated: number;
	human_escalation_rate: number;
	unresolved: number;
	avg_tier1_latency_ms: number | null;
	avg_tier2_latency_ms: number | null;
	total_tokens_used: number;
};

type ConversationStats = {
	total: number;
	active: number;
	escalated: number;
	closed: number;
	avg_resolution_time_ms: number | null;
	avg_first_response_time_ms: number | null;
};

type TicketStats = {
	total: number;
	open: number;
	in_progress: number;
	resolved: number;
	by_priority: {
		low: number;
		medium: number;
		high: number;
	};
};

type CsatSummary = {
	avg_score: number | null;
	total_ratings: number;
	distribution: Array<{ score: number; count: number }>;
};

type EscalationRecord = {
	ticket_id: string;
	conversation_id: string;
	organization_id: string;
	organization_name: string;
	priority: string;
	status: string;
	assigned_to: { id: string; full_name: string } | null;
	created_at: string;
	resolved_at: string | null;
};

type OrgSummary = {
	id: string;
	name: string;
	slug: string;
	email: string;
	is_active: boolean;
	plan: {
		id: string;
		name: string;
		price_monthly: number;
	} | null;
	created_at: string;
	stats: {
		total_users: number;
		total_conversations: number;
		active_conversations: number;
		total_tickets: number;
		open_tickets: number;
		escalated_tickets: number;
		resolved_tickets: number;
	};
};

type OrgDetail = {
	id: string;
	name: string;
	slug: string;
	email: string;
	is_active: boolean;
	widget_config: Record<string, unknown>;
	plan: {
		id: string;
		name: string;
		price_monthly: number;
	} | null;
	created_at: string;
	stats: {
		total_users: number;
		total_conversations: number;
		active_conversations: number;
		total_tickets: number;
		open_tickets: number;
		escalated_tickets: number;
		resolved_tickets: number;
	};
	users: Array<{
		id: string;
		email: string;
		first_name: string;
		last_name: string;
		role: string;
		is_active: boolean;
		created_at: string;
		assigned_tickets_count: number;
	}>;
	tier_stats: TierStats;
	conversation_stats: ConversationStats;
	ticket_stats: TicketStats;
	csat: CsatSummary;
	recent_escalations: EscalationRecord[];
};

const pricingSelect = {
	id: true,
	name: true,
	priceMonthly: true,
} as const;

// ─── Shared selects ───────────────────────────────────────────────────────────

const userSelect = {
	id: true,
	email: true,
	firstName: true,
	lastName: true,
	role: true,
	isActive: true,
	createdAt: true,
	_count: { select: { assignedTickets: true } },
} as const;

// ─── Build tier stats from agent_logs + conversation_analytics ────────────────

async function buildTierStats(organizationId?: string, dateFilter?: { gte?: Date; lte?: Date }): Promise<TierStats> {
	const baseWhere = {
		...(organizationId ? { conversation: { is: { organizationId: organizationId } } } : {}),
		...(dateFilter ? { createdAt: dateFilter } : {}),
	};

	const analyticsWhere = {
		...(organizationId ? { organizationId: organizationId } : {}),
		...(dateFilter ? { createdAt: dateFilter } : {}),
	};

	const [tier0Count, tier1Count, tier2Count, humanCount, unresolvedCount] = await Promise.all([
		prisma.conversationAnalytics.count({ where: { ...analyticsWhere, resolvedByTier: "TIER0" } }),
		prisma.conversationAnalytics.count({ where: { ...analyticsWhere, resolvedByTier: "TIER1" } }),
		prisma.conversationAnalytics.count({ where: { ...analyticsWhere, resolvedByTier: "TIER2" } }),
		prisma.conversationAnalytics.count({ where: { ...analyticsWhere, resolvedByTier: "HUMAN" } }),
		prisma.conversationAnalytics.count({ where: { ...analyticsWhere, resolvedByTier: "UNRESOLVED" } }),
	]);

	const routerReceived = tier0Count + tier1Count + tier2Count + humanCount + unresolvedCount;

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

	const totalTokens = (tier1Logs._sum?.tokensUsed ?? 0) + (tier2Logs._sum?.tokensUsed ?? 0) + (routerTokens._sum?.tokensUsed ?? 0);

	return {
		router_received: routerReceived,
		tier0_resolved: tier0Count,
		tier0_resolve_rate: routerReceived > 0 ? round2((tier0Count / routerReceived) * 100) : 0,
		tier1_resolved: tier1Count,
		tier1_resolve_rate: routerReceived > 0 ? round2((tier1Count / routerReceived) * 100) : 0,
		tier2_resolved: tier2Count,
		tier2_resolve_rate: routerReceived > 0 ? round2((tier2Count / routerReceived) * 100) : 0,
		human_escalated: humanCount,
		human_escalation_rate: routerReceived > 0 ? round2((humanCount / routerReceived) * 100) : 0,
		unresolved: unresolvedCount,
		avg_tier1_latency_ms: tier1Logs._avg?.latencyMs ? Math.round(tier1Logs._avg.latencyMs) : null,
		avg_tier2_latency_ms: tier2Logs._avg?.latencyMs ? Math.round(tier2Logs._avg.latencyMs) : null,
		total_tokens_used: totalTokens,
	};
}

// ─── Build conversation stats ─────────────────────────────────────────────────

async function buildConversationStats(organizationId?: string, dateFilter?: { gte?: Date; lte?: Date }): Promise<ConversationStats> {
	const where = {
		...(organizationId ? { organizationId: organizationId } : {}),
		...(dateFilter ? { createdAt: dateFilter } : {}),
	};

	const [total, active, escalated, closed] = await Promise.all([prisma.conversation.count({ where }), prisma.conversation.count({ where: { ...where, conversationStatus: "ACTIVE" } }), prisma.conversation.count({ where: { ...where, conversationStatus: "ESCALATED" } }), prisma.conversation.count({ where: { ...where, conversationStatus: "CLOSED" } })]);

	const analyticsWhere = {
		...(organizationId ? { organizationId: organizationId } : {}),
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
		avg_resolution_time_ms: avg.resolutionTimeMs ? Math.round(avg.resolutionTimeMs) : null,
		avg_first_response_time_ms: avg.firstResponseTimeMs ? Math.round(avg.firstResponseTimeMs) : null,
	};
}

// ─── Build ticket stats ───────────────────────────────────────────────────────

async function buildTicketStats(organizationId?: string, dateFilter?: { gte?: Date; lte?: Date }): Promise<TicketStats> {
	const where = {
		...(organizationId ? { organizationId: organizationId } : {}),
		...(dateFilter ? { createdAt: dateFilter } : {}),
	};

	const [total, open, in_progress, resolved, low, medium, high] = await Promise.all([
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

async function buildCsatSummary(organizationId?: string, dateFilter?: { gte?: Date; lte?: Date }): Promise<CsatSummary> {
	const where = {
		...(organizationId ? { organizationId: organizationId } : {}),
		...(dateFilter ? { createdAt: dateFilter } : {}),
	};

	const [agg, distribution] = await Promise.all([prisma.csatRating.aggregate({ where, _avg: { score: true }, _count: { id: true } }), prisma.csatRating.groupBy({ by: ["score"], where, _count: { id: true }, orderBy: { score: "asc" } })]);

	return {
		avg_score: agg._avg?.score != null ? round2(agg._avg.score) : null,
		total_ratings: agg._count && typeof agg._count === "object" ? (agg._count.id ?? 0) : 0,
		distribution: distribution.map((d) => ({
			score: d.score,
			count: d._count && typeof d._count === "object" ? (d._count.id ?? 0) : 0,
		})),
	};
}

// ─── Build recent escalations ─────────────────────────────────────────────────

async function buildRecentEscalations(organizationId?: string, limit = 10): Promise<EscalationRecord[]> {
	const tickets = await prisma.ticket.findMany({
		where: {
			status: { in: ["OPEN", "IN_PROGRESS"] },
			...(organizationId ? { organizationId: organizationId } : {}),
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
		assigned_to: t.assignedTo ? { id: t.assignedTo.id, full_name: `${t.assignedTo.firstName} ${t.assignedTo.lastName}` } : null,
		created_at: t.createdAt.toISOString(),
		resolved_at: t.resolvedAt?.toISOString() ?? null,
	}));
}

// ─── Public service functions ─────────────────────────────────────────────────

export async function listOrganizations(opts: { page: number; limit: number; skip: number; search?: string; is_active?: boolean }): Promise<{ data: OrgSummary[]; total: number }> {
	const where = {
		...(opts.search
			? {
					OR: [{ name: { contains: opts.search, mode: "insensitive" as const } }, { email: { contains: opts.search, mode: "insensitive" as const } }, { slug: { contains: opts.search, mode: "insensitive" as const } }],
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

	const organizationIds = orgs.map((o) => o.id);

	const [activeConvCounts, openTicketCounts, escalatedTicketCounts, resolvedTicketCounts] = await Promise.all([
		prisma.conversation.groupBy({
			by: ["organizationId"],
			where: { organizationId: { in: organizationIds }, conversationStatus: "ACTIVE" },
			_count: { id: true },
		}),
		prisma.ticket.groupBy({
			by: ["organizationId"],
			where: { organizationId: { in: organizationIds }, status: "OPEN" },
			_count: { id: true },
		}),
		prisma.ticket.groupBy({
			by: ["organizationId"],
			where: {
				organizationId: { in: organizationIds },
				status: { in: ["OPEN", "IN_PROGRESS"] },
				conversation: { conversationStatus: "ESCALATED" },
			},
			_count: { id: true },
		}),
		prisma.ticket.groupBy({
			by: ["organizationId"],
			where: { organizationId: { in: organizationIds }, status: "RESOLVED" },
			_count: { id: true },
		}),
	]);

	const byorganizationId = <T extends { organizationId: string; _count: { id: number } }>(arr: T[]) => Object.fromEntries(arr.map((r) => [r.organizationId, r._count.id]));

	const activeConvMap = byorganizationId(activeConvCounts);
	const openTicketMap = byorganizationId(openTicketCounts);
	const escalatedTicketMap = byorganizationId(escalatedTicketCounts);
	const resolvedTicketMap = byorganizationId(resolvedTicketCounts);

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

export async function getOrganizationDetail(organizationId: string): Promise<OrgDetail | null> {
	const org = await prisma.organization.findUnique({
		where: { id: organizationId },
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

	const [tierStats, convStats, ticketStats, csatSummary, recentEscalations] = await Promise.all([buildTierStats(organizationId), buildConversationStats(organizationId), buildTicketStats(organizationId), buildCsatSummary(organizationId), buildRecentEscalations(organizationId, 5)]);

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

export async function getGlobalOverview() {
	const [totalOrgs, activeOrgs, totalUsers, tierStats, convStats, ticketStats, csatSummary] = await Promise.all([prisma.organization.count(), prisma.organization.count({ where: { isActive: true } }), prisma.user.count({ where: { role: { not: "SUPER_ADMIN" } } }), buildTierStats(), buildConversationStats(), buildTicketStats(), buildCsatSummary()]);

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
		overall_ai_resolution_rate: tierStats.router_received > 0 ? round2(((tierStats.tier1_resolved + tierStats.tier2_resolved) / tierStats.router_received) * 100) : 0,
		avg_csat_score: csatSummary.avg_score,
		tier_breakdown: tierStats,
    total_revenue: Number(revenueAgg._sum.amount ?? 0),
	};
}

export { buildTierStats, buildConversationStats, buildTicketStats, buildCsatSummary, buildRecentEscalations };
