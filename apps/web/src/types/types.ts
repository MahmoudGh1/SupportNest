// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface AuthUser {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: string;
	orgId: string | null;
	orgName?: string;
	onboarded: boolean;
}

export interface LoginResponse {
	user: AuthUser;
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
export type DocStatus = "processing" | "ready" | "failed";
export type DocType = "pdf" | "faq";

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
	created_by: string;
	created_at: string;
	updated_at: string;
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

export interface DashboardStats {
	totalConversations: number;
	aiResolutionRate: number;
	avgResponseTime: string;
	csatScore: number;
	recentConversations: {
		id: number;
		customer: string;
		status: "active" | "escalated" | "closed";
		tier: string;
		time: string;
	}[];
	resolutionByTier: { tier1: number; tier2: number; human: number };
}
