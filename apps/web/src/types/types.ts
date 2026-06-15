// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface AuthUser {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: Role;
	orgId: string | null;
	orgName?: string;
	token?: string;
	onboarded: boolean;
	hasActiveSubscription?: boolean;
	currentPlanId?: string | null;
}

export enum Role {
	SUPER_ADMIN = "SUPER_ADMIN",
	ORG_ADMIN = "ORG_ADMIN",
	SUPPORT_AGENT = "SUPPORT_AGENT",
}

export interface LoginResponse {
	user: AuthUser;
}

export interface PricingPlan {
	id: string;
	name: string;
	priceMonthly: number;
	maxConversations: number;
	maxAgents: number;
	maxKnowledgeDocuments: number;
	features: string;
}

export interface OrgSetupData {
	name: string;
	industry: string;
	size: string;
}

// ─── SETTINGS TYPES ───────────────────────────────────────────────────────────
export interface WidgetConfig {
	color: string; // hex — widget primary color
	greeting: string; // first message shown to customer
	title?: string;
	position: "bottom-left" | "bottom-right";
}

export interface OrgProfile {
	id: string;
	name: string;
	slug: string;
	email: string;
	widget_config: WidgetConfig;
	plan_id: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface UserProfile {
	id: string;
	email: string;
	first_name: string; // snake_case — matches schema
	last_name: string;
	role: "SUPER_ADMIN" | "org_admin" | "support_agent";
	organization_id: string;
	is_active: boolean;
	created_at: string;
}

export interface UpdateProfileInput {
	first_name: string;
	last_name: string;
	email: string;
}

export interface UpdatePasswordInput {
	current_password: string;
	new_password: string;
}

export interface UpdateWidgetConfigInput {
	name: string;
	email: string;
	widget_config: WidgetConfig;
}

// ─── KNOWLEDGE BASE TYPES ─────────────────────────────────────────────────────
export type DocStatus = "PROCESSING" | "READY" | "FAILED";
export type DocType = "PDF" | "FAQ";

export interface KnowledgeDocument {
	id: string;
	organization_id: string;
	title: string;
	type: DocType;
	storagePath: string; // camelCase — matches schema exactly
	status: DocStatus;
	metadata: {
		pageCount?: number; // pdf only
		fileSize?: number; // bytes, pdf only
		faqCategory?: string; // faq only
	};
	createdBy: string;
	createdAt: string;
	updatedAt: string;
}

export interface UploadPdfInput {
	file: File;
	title: string;
}

export interface UploadFaqInput {
	title: string;
	storagePath: string; // the FAQ URL
	faqCategory?: string;
}
export type Tiers = "TIER_1" | "TIER_2" | "HUMAN";
export type DashboardStatsStatus = "ACTIVE" | "ESCALATED" | "CLOSED";

export interface DashboardStats {
	totalConversations: number;
	aiResolutionRate: number;
	avgResponseTime: string;
	csatScore: number;
	recentConversations: {
		id: number;
		customer: string;
		status: DashboardStatsStatus;
		tier: Tiers;
		timestamp: string;
	}[];
	resolutionByTier: { tier1: number; tier2: number; human: number };
}

export interface GetKnowledgeDocsResponse {
	success: boolean;
	message: string;
	data: { documents: KnowledgeDocument[] };
}

export interface DeleteAccountInput {
	organizationSlug: string;
}

export interface DeleteAccountResponse {
	success: boolean;
	message: string;
}

export interface DeleteAccountInput {
	fullName: string;
	organizationName: string;
}

export interface ApiKey {
	id: string;
	name: string;
	key_prefix: string;
	allowed_origins: string[];
	is_active: boolean;
	last_used_at: string | null;
	created_at: string;
	raw_key?: string;
}

export interface CreateApiKeyInput {
	allowedOrigins: string[];
}

export interface AdminTierBreakdown {
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
	avg_tier1_latency_ms: number;
	avg_tier2_latency_ms: number;
	total_tokens_used: number;
}

export interface AdminOverview {
	total_organizations: number;
	active_organizations: number;
	suspended_organizations: number;
	total_users: number;
	total_conversations: number;
	active_conversations: number;
	total_tickets: number;
	open_tickets: number;
	escalated_tickets: number;
	overall_ai_resolution_rate: number;
	avg_csat_score: number;
	tier_breakdown: AdminTierBreakdown;
}

export interface AdminPlan {
	id: string;
	name: string;
	price_monthly: number;
}

export interface AdminOrganizationStats {
	total_users: number;
	total_conversations: number;
	active_conversations: number;
	total_tickets: number;
	open_tickets: number;
	escalated_tickets: number;
	resolved_tickets: number;
}

export interface AdminOrganization {
	id: string;
	name: string;
	slug: string;
	email: string;
	is_active: boolean;
	scheduled_deletion_at?: string | null;
	plan: AdminPlan | null;
	created_at: string;
	stats: AdminOrganizationStats;
}

export interface AdminOrganizationDetail extends AdminOrganization {
	widget_config: WidgetConfig;
	stats: AdminOrganizationStats;
	users: AdminUser[];
}

export interface AdminUser {
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	role: "SUPER_ADMIN" | "org_admin" | "support_agent";
	is_active: boolean;
	organization_id: string;
	created_at: string;
	assigned_tickets_count?: number;
	organization?: {
		id: string;
		name: string;
	};
}

export interface AdminUsersResponse {
	data: AdminUser[];
	meta: {
		total: number;
		page: number;
		limit: number;
		total_pages: number;
	};
}

export interface AdminEscalation {
	id: string;
	conversation_id: string;
	priority: "low" | "medium" | "high" | "urgent";
	status: "open" | "resolved" | "closed";
	organization_id: string;
	created_at: string;
	organization_name?: string;
}

export interface AdminEscalationsResponse {
	data: AdminEscalation[];
	meta: {
		total: number;
		page: number;
		limit: number;
		total_pages: number;
	};
}

export interface AdminTierStats {
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
	avg_tier1_latency_ms: number;
	avg_tier2_latency_ms: number;
	total_tokens_used: number;
}

export interface AdminConversationStats {
	total: number;
	open: number;
	resolved: number;
	closed: number;
	avg_resolution_time_ms: number;
	avg_response_time_ms: number;
}

export interface AdminTicketStats {
	total: number;
	open: number;
	resolved: number;
	closed: number;
	priority_breakdown: {
		low: number;
		medium: number;
		high: number;
		urgent: number;
	};
}

export interface AdminCsatStats {
	avg_score: number;
	total_ratings: number;
	distribution: Record<string, number>;
}

export interface AdminOrganizationsResponse {
	data: AdminOrganization[];
	meta: {
		total: number;
		page: number;
		limit: number;
		total_pages: number;
	};
}
