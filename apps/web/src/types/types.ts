// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface AuthUser {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: Role;
	orgId: string | null;
	orgName?: string;
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
	role: "super_admin" | "org_admin" | "support_agent";
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
	success: Boolean;
	message: string;
	data: { documents: KnowledgeDocument[] };
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
