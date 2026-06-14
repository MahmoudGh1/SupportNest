export type TierStats = {
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

export type ConversationStats = {
  total: number;
  active: number;
  escalated: number;
  closed: number;
  avg_resolution_time_ms: number | null;
  avg_first_response_time_ms: number | null;
};

export type TicketStats = {
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

export type CsatSummary = {
  avg_score: number | null;
  total_ratings: number;
  distribution: Array<{ score: number; count: number }>;
};

export type EscalationRecord = {
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

export type OrgSummary = {
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

export type OrgDetail = {
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

export const pricingSelect = {
  id: true,
  name: true,
  priceMonthly: true,
} as const;

export type DeleteConversationResult =
  | { success: true; conversation_id: string; organization_id: string }
  | {
      error:
        | "ORG_NOT_FOUND"
        | "CONVERSATION_NOT_FOUND"
        | "CONVERSATION_STILL_ACTIVE";
    };

export type ConversationRecord = {
  id: string;
  organization_id: string;
  customer: {
    id: string;
    name: string | null;
    email: string | null;
    is_anonymous: boolean;
  };
  status: string;
  total_messages: number;
  has_ticket: boolean;
  ticket_status: string | null;
  ticket_priority: string | null;
  csat_score: number | null;
  created_at: string;
  closed_at: string | null;
};

export type GetConversationsResult =
  | { success: true; data: ConversationRecord[]; total: number }
  | { error: "ORG_NOT_FOUND" };

export type ConversationDetail = {
  id: string;
  organization_id: string;
  status: string;
  customer: {
    id: string;
    name: string | null;
    email: string | null;
    is_anonymous: boolean;
  };
  messages: {
    id: string;
    role: string;
    content: string;
    tier: string | null;
    created_at: string;
  }[];
  ticket: {
    id: string;
    status: string;
    priority: string;
    created_at: string;
    resolved_at: string | null;
  } | null;
  created_at: string;
  closed_at: string | null;
};
export type GetConversationByIdResult =
  | { success: true; data: ConversationDetail }
  | { error: "ORG_NOT_FOUND" | "CONVERSATION_NOT_FOUND" };

// ─── Shared selects ───────────

export const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  createdAt: true,
  _count: { select: { assignedTickets: true } },
} as const;

export type DeleteOrgResult =
  | { success: true; organization_id: string }
  | { error: "ORG_NOT_FOUND" | "ORG_HAS_ACTIVE_CONVERSATIONS" };
