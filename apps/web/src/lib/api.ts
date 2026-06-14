import { getSession } from "@/lib/auth";
import { mapApiUser } from "@/lib/map-user";
import {
	AuthUser,
	DashboardStats,
	GetKnowledgeDocsResponse,
	KnowledgeDocument,
	LoginResponse,
	PricingPlan,
	OrgProfile,
	OrgSetupData,
	UpdatePasswordInput,
	UpdateProfileInput,
	UploadPdfInput,
	UserProfile,
	ApiKey,
	AdminOverview,
	AdminOrganizationsResponse,
	AdminUser,
	AdminUsersResponse,
	AdminEscalationsResponse,
	AdminCsatStats,
	AdminTicketStats,
	AdminConversationStats,
	AdminTierStats,
	AdminOrganization,
	WidgetConfig,
	AdminOrganizationDetail,
} from "@/types/types";

// ─── API FUNCTIONS ────────────────────────────────────────────────────────────
function normalizeApiBaseUrl(rawBaseUrl?: string) {
	const fallback = "https://api-production-e60c.up.railway.app/api/v1";
	const base = (rawBaseUrl ?? fallback).trim().replace(/\/+$/, "");
	return /\/api\/v1$/i.test(base) ? base : `${base}/api/v1`;
}

const BASE_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE);

type ApiRecord = Record<string, unknown>;

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : "Unexpected error";
}

function normalizeUserProfile(input: ApiRecord): UserProfile {
	return {
		id: String(input.id ?? ""),
		email: String(input.email ?? ""),
		first_name: String(input.first_name ?? input.firstName ?? ""),
		last_name: String(input.last_name ?? input.lastName ?? ""),
		role: String(input.role ?? "org_admin").toLowerCase() as UserProfile["role"],
		organization_id: String(input.organization_id ?? input.organizationId ?? ""),
		is_active: Boolean(input.is_active ?? input.isActive ?? true),
		created_at: String(input.created_at ?? input.createdAt ?? ""),
	};
}

function normalizeOrgProfile(input: ApiRecord): OrgProfile {
	const widget = (input.widget_config ?? input.widgetConfig ?? {}) as ApiRecord;
	return {
		id: String(input.id ?? ""),
		name: String(input.name ?? ""),
		slug: String(input.slug ?? ""),
		email: String(input.email ?? ""),
		widget_config: {
			color: String(widget.color ?? widget.accentColor ?? "#534AB7"),
			greeting: String(widget.greeting ?? widget.greetingMessage ?? "Hi! How can we help?"),
			title: String(widget.title ?? "Support"),
			position: (widget.position as OrgProfile["widget_config"]["position"]) ?? "bottom-right",
		},
		plan_id: String(input.plan_id ?? input.planId ?? ""),
		is_active: Boolean(input.is_active ?? input.isActive ?? true),
		created_at: String(input.created_at ?? input.createdAt ?? ""),
		updated_at: String(input.updated_at ?? input.updatedAt ?? ""),
	};
}

function normalizeApiKey(input: ApiRecord): ApiKey {
	return {
		id: String(input.id ?? ""),
		name: String(input.name ?? "Default"),
		key_prefix: String(input.key_prefix ?? input.keyPrefix ?? ""),
		allowed_origins: Array.isArray(input.allowed_origins ?? input.allowedOrigins) ? ((input.allowed_origins ?? input.allowedOrigins) as string[]) : [],
		is_active: Boolean(input.is_active ?? input.isActive ?? true),
		last_used_at: typeof (input.last_used_at ?? input.lastUsedAt) === "string" ? String(input.last_used_at ?? input.lastUsedAt) : null,
		created_at: String(input.created_at ?? input.createdAt ?? new Date().toISOString()),
		raw_key: typeof input.raw_key === "string" ? input.raw_key : undefined,
	};
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
	const session = getSession();
	const response = await fetch(`${BASE_URL}/admindashboard${path}`, {
		...init,
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
			...init?.headers,
		},
	});
	const data = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(data?.error?.message ?? data?.message ?? "Admin request failed");
	}
	return data as T;
}

export const api = {
	async login(email: string, password: string): Promise<LoginResponse> {
		const res = await fetch(`${BASE_URL}/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
			credentials: "include",
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error ?? data.message ?? "Login failed");
		return { user: mapApiUser(data.result) };
	},

	async register(data: { email: string; password: string; firstName: string; lastName: string; businessName: string; planId: string }): Promise<LoginResponse> {
		const res = await fetch(`${BASE_URL}/auth/register`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
			credentials: "include",
		});
		const body = await res.json();
		if (!res.ok) throw new Error(body.error ?? "Registration failed");
		return body;
	},

	async registerPaid(data: { email: string; password: string; firstName: string; lastName: string; businessName: string; planId: string; amount: number; currency?: string; isAnnual: boolean }): Promise<LoginResponse> {
		const res = await fetch(`${BASE_URL}/auth/register-paid`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
			credentials: "include",
		});
		const body = await res.json();
		if (!res.ok) throw new Error(body.error ?? "Checkout registration failed");
		return { user: mapApiUser(body.result) };
	},

	async getPlans(): Promise<PricingPlan[]> {
		const res = await fetch(`${BASE_URL}/pricing`, {
			credentials: "include",
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error ?? "Failed to load plans");
		return data;
	},

	async getMe(): Promise<AuthUser> {
		const res = await fetch(`${BASE_URL}/auth/me`, {
			credentials: "include",
		});
		if (!res.ok) throw new Error("No active session");
		const data = await res.json();
		return mapApiUser(data.result);
	},

	async refreshToken(): Promise<void> {
		const res = await fetch(`${BASE_URL}/auth/refresh`, {
			method: "POST",
			credentials: "include",
		});
		if (!res.ok) {
			const data = await res.json().catch(() => ({}));
			throw new Error(data.error ?? "Session expired");
		}
	},

	async loginWithGoogle(idToken: string): Promise<LoginResponse> {
		const res = await fetch(`${BASE_URL}/auth/google`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ idToken }),
			credentials: "include",
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error ?? data.message ?? "Google login failed");

		return { user: mapApiUser(data.result) };
	},

	async completePayment(data: { pricingId: string; amount: number; currency?: string; isAnnual: boolean }): Promise<{ paymentId: string; billingPeriodEnd: string }> {
		const res = await fetch(`${BASE_URL}/payments/complete`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(data),
		});
		const body = await res.json();
		if (!res.ok) throw new Error(body.error ?? "Payment failed");
		return body;
	},

	async confirmPayment(paymentId: string): Promise<{ ok: boolean }> {
		const res = await fetch(`${BASE_URL}/payments/confirm`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ paymentId }),
			credentials: "include",
		});
		const body = await res.json();
		if (!res.ok) throw new Error(body.error ?? "Failed to confirm payment");
		return body;
	},

	async logout(): Promise<void> {
		await fetch(`${BASE_URL}/auth/logout`, {
			method: "POST",
			credentials: "include",
		});
	},

	async setupOrg(_data: OrgSetupData): Promise<{ orgId: string } & OrgSetupData> {
		throw new Error("Organization setup is not available.");
	},

	async getAdminOverview(): Promise<AdminOverview> {
		return adminFetch<AdminOverview>("/overview");
	},

	async getAdminOrganizations(params?: { search?: string; is_active?: boolean | ""; page?: number; limit?: number }): Promise<AdminOrganizationsResponse> {
		const query = new URLSearchParams();
		if (params?.search) query.set("search", params.search);
		if (params?.is_active !== undefined && params.is_active !== "") {
			query.set("is_active", String(params.is_active));
		}
		if (params?.page) query.set("page", String(params.page));
		if (params?.limit) query.set("limit", String(params.limit));
		const suffix = query.toString() ? `?${query.toString()}` : "";
		return adminFetch<AdminOrganizationsResponse>(`/organizations${suffix}`);
	},

	async getAdminOrganization(orgId: string): Promise<AdminOrganizationDetail> {
		return adminFetch<AdminOrganizationDetail>(`/organizations/${orgId}`);
	},

	async createAdminOrganization(data: { name: string; email: string; slug: string; plan_id?: string; widget_config?: Partial<WidgetConfig> }): Promise<AdminOrganization> {
		return adminFetch<AdminOrganization>("/organizations", {
			method: "POST",
			body: JSON.stringify(data),
		});
	},

	async updateAdminOrganization(
		orgId: string,
		data: Partial<{
			name: string;
			email: string;
			is_active: boolean;
			plan_id: string;
			widget_config: Partial<WidgetConfig>;
		}>,
	): Promise<AdminOrganization> {
		return adminFetch<AdminOrganization>(`/organizations/${orgId}`, {
			method: "PATCH",
			body: JSON.stringify(data),
		});
	},

	async suspendAdminOrganization(orgId: string): Promise<void> {
		return adminFetch<void>(`/organizations/${orgId}/suspend`, {
			method: "PATCH",
		});
	},

	async activateAdminOrganization(orgId: string): Promise<void> {
		return adminFetch<void>(`/organizations/${orgId}/activate`, {
			method: "PATCH",
		});
	},

	async getAdminGlobalTierStats(params?: { from?: string; to?: string }): Promise<AdminTierStats> {
		const query = new URLSearchParams();
		if (params?.from) query.set("from", params.from);
		if (params?.to) query.set("to", params.to);
		const suffix = query.toString() ? `?${query.toString()}` : "";
		return adminFetch<AdminTierStats>(`/tier-stats${suffix}`);
	},

	async getAdminGlobalEscalations(params?: { priority?: string; status?: string; from?: string; to?: string; page?: number; limit?: number }): Promise<AdminEscalationsResponse> {
		const query = new URLSearchParams();
		if (params?.priority) query.set("priority", params.priority);
		if (params?.status) query.set("status", params.status);
		if (params?.from) query.set("from", params.from);
		if (params?.to) query.set("to", params.to);
		if (params?.page) query.set("page", String(params.page));
		if (params?.limit) query.set("limit", String(params.limit));
		const suffix = query.toString() ? `?${query.toString()}` : "";
		return adminFetch<AdminEscalationsResponse>(`/escalations${suffix}`);
	},

	async getAdminOrgTierStats(orgId: string, params?: { from?: string; to?: string }): Promise<AdminTierStats> {
		const query = new URLSearchParams();
		if (params?.from) query.set("from", params.from);
		if (params?.to) query.set("to", params.to);
		const suffix = query.toString() ? `?${query.toString()}` : "";
		return adminFetch<AdminTierStats>(`/organizations/${orgId}/tier-stats${suffix}`);
	},

	async getAdminOrgConversationStats(orgId: string, params?: { from?: string; to?: string }): Promise<AdminConversationStats> {
		const query = new URLSearchParams();
		if (params?.from) query.set("from", params.from);
		if (params?.to) query.set("to", params.to);
		const suffix = query.toString() ? `?${query.toString()}` : "";
		return adminFetch<AdminConversationStats>(`/organizations/${orgId}/conversation-stats${suffix}`);
	},

	async getAdminOrgTicketStats(orgId: string, params?: { from?: string; to?: string }): Promise<AdminTicketStats> {
		const query = new URLSearchParams();
		if (params?.from) query.set("from", params.from);
		if (params?.to) query.set("to", params.to);
		const suffix = query.toString() ? `?${query.toString()}` : "";
		return adminFetch<AdminTicketStats>(`/organizations/${orgId}/ticket-stats${suffix}`);
	},

	async getAdminOrgCsat(orgId: string, params?: { from?: string; to?: string }): Promise<AdminCsatStats> {
		const query = new URLSearchParams();
		if (params?.from) query.set("from", params.from);
		if (params?.to) query.set("to", params.to);
		const suffix = query.toString() ? `?${query.toString()}` : "";
		return adminFetch<AdminCsatStats>(`/organizations/${orgId}/csat${suffix}`);
	},

	async getAdminOrgEscalations(orgId: string, params?: { from?: string; to?: string; page?: number; limit?: number }): Promise<AdminEscalationsResponse> {
		const query = new URLSearchParams();
		if (params?.from) query.set("from", params.from);
		if (params?.to) query.set("to", params.to);
		if (params?.page) query.set("page", String(params.page));
		if (params?.limit) query.set("limit", String(params.limit));
		const suffix = query.toString() ? `?${query.toString()}` : "";
		return adminFetch<AdminEscalationsResponse>(`/organizations/${orgId}/escalations${suffix}`);
	},

	async getAdminAllUsers(params?: { role?: string; is_active?: boolean; search?: string; page?: number; limit?: number }): Promise<AdminUsersResponse> {
		const query = new URLSearchParams();
		if (params?.role) query.set("role", params.role);
		if (params?.is_active !== undefined) query.set("is_active", String(params.is_active));
		if (params?.search) query.set("search", params.search);
		if (params?.page) query.set("page", String(params.page));
		if (params?.limit) query.set("limit", String(params.limit));
		const suffix = query.toString() ? `?${query.toString()}` : "";
		return adminFetch<AdminUsersResponse>(`/users${suffix}`);
	},

	async getAdminOrgUsers(
		orgId: string,
		params?: {
			role?: string;
			is_active?: boolean;
			page?: number;
			limit?: number;
		},
	): Promise<AdminUsersResponse> {
		const query = new URLSearchParams();
		if (params?.role) query.set("role", params.role);
		if (params?.is_active !== undefined) query.set("is_active", String(params.is_active));
		if (params?.page) query.set("page", String(params.page));
		if (params?.limit) query.set("limit", String(params.limit));
		const suffix = query.toString() ? `?${query.toString()}` : "";
		return adminFetch<AdminUsersResponse>(`/organizations/${orgId}/users${suffix}`);
	},

	async getAdminOrgUser(orgId: string, userId: string): Promise<AdminUser> {
		return adminFetch<AdminUser>(`/organizations/${orgId}/users/${userId}`);
	},

	async createAdminOrgUser(
		orgId: string,
		data: {
			email: string;
			password?: string;
			first_name: string;
			last_name: string;
			role: string;
		},
	): Promise<AdminUser> {
		return adminFetch<AdminUser>(`/organizations/${orgId}/users`, {
			method: "POST",
			body: JSON.stringify(data),
		});
	},

	async updateAdminOrgUser(
		orgId: string,
		userId: string,
		data: Partial<{
			first_name: string;
			last_name: string;
			role: string;
			is_active: boolean;
		}>,
	): Promise<AdminUser> {
		return adminFetch<AdminUser>(`/organizations/${orgId}/users/${userId}`, {
			method: "PATCH",
			body: JSON.stringify(data),
		});
	},

	async removeAdminOrgUser(orgId: string, userId: string): Promise<void> {
		return adminFetch<void>(`/organizations/${orgId}/users/${userId}`, {
			method: "DELETE",
		});
	},

	async getDashboardStats(): Promise<DashboardStats> {
		return {
			totalConversations: 0,
			aiResolutionRate: 0,
			avgResponseTime: "—",
			csatScore: 0,
			recentConversations: [],
			resolutionByTier: { tier1: 0, tier2: 0, human: 0 },
		};
	},

	// ─── KNOWLEDGE BASE ─────────────────────────────────────────────────────────

	async getKnowledgeDocs(filterState: Record<string, string | number | undefined | null>): Promise<GetKnowledgeDocsResponse | null> {
		const user = getSession();
		if (!user) {
			throw new Error("User not found");
		}
		const params = new URLSearchParams();
		Object.entries(filterState).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				params.append(key, String(value));
			}
		});
		try {
			const response = await fetch(`${BASE_URL}/organizations/${user.orgId}/knowledge?${params.toString()}`, {
				credentials: "include",
			});
			if (!response.ok) throw new Error(response.statusText);

			return response.json();
		} catch (error: unknown) {
			console.log(getErrorMessage(error));
			return null;
		}
	},

	async uploadPdf(input: UploadPdfInput): Promise<{ document: KnowledgeDocument }> {
		const user = getSession();
		if (!user) throw new Error("User not found");

		const formData = new FormData();
		formData.append("file", input.file);
		formData.append("title", input.title);
		formData.append("type", "PDF");

		const response = await fetch(`${BASE_URL}/organizations/${user.orgId}/knowledge`, {
			method: "POST",
			body: formData,
			credentials: "include",
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({}));
			throw new Error(error.message ?? `Upload failed: ${response.status}`);
		}

		return response.json();
	},

	async deleteKnowledgeDoc(id: string): Promise<{ success: boolean }> {
		const user = getSession();
		if (!user) throw new Error("User not found");

		try {
			const response = await fetch(`${BASE_URL}/organizations/${user.orgId}/knowledge/${id}`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
			});

			const data = await response.json();
			if (!response.ok) throw new Error(data.message || "Something went wrong");

			return { success: data.success };
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error("Error deleting item:", error.message);
			} else {
				console.log("An unexpected error occurred", error);
			}
			return { success: false };
		}
	},

	// ─── BUSINESS API CONFIG ────────────────────────────────────────────────────

	async getApiConfig(): Promise<{
		id?: string;
		baseUrl?: string;
		authType?: string;
		headerName?: string;
		isVerified?: boolean;
		lastVerifiedAt?: string;
		configured: boolean;
	}> {
		const res = await fetch(`${BASE_URL}/organizations/api-config`, {
			credentials: "include",
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error ?? "Failed to load API config");
		return data.id ? { ...data, configured: true } : { configured: false };
	},

	async saveApiConfig(input: { baseUrl: string; authType: string; authValue: string; headerName?: string }): Promise<{ id: string; isVerified: boolean }> {
		const res = await fetch(`${BASE_URL}/organizations/api-config`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(input),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message ?? data.error ?? "Failed to save API config");
		return data;
	},

	async verifyApiConfig(): Promise<{ isVerified: boolean; message: string }> {
		const res = await fetch(`${BASE_URL}/organizations/api-config/verify`, {
			method: "POST",
			credentials: "include",
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message ?? data.error ?? "Verification failed");
		return data;
	},

	async submitSwaggerUrl(input: { title: string; swaggerUrl: string }): Promise<{ documentId: string; status: string }> {
		const user = getSession();
		if (!user) throw new Error("User not found");
		const res = await fetch(`${BASE_URL}/organizations/${user.orgId}/documents/swagger`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(input),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message ?? data.error ?? "Failed to submit Swagger URL");
		return data;
	},

	deleteAccount: (data: { fullName: string; organizationName: string }) =>
		fetch(`${BASE_URL}/users/me`, {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(data),
		}).then(async (res) => {
			const json = await res.json();
			if (!res.ok) throw new Error(json.error ?? "Failed to delete account.");
			return json;
		}),

	// ─── TOOLS ──────────────────────────────────────────────────────────────────

	async getAllOrgTools(): Promise<{
		tools: {
			id: string;
			name: string;
			description: string;
			method: string;
			path: string;
			isActive: boolean;
			createdAt: string;
			document: { title: string; type: string } | null;
		}[];
	}> {
		const res = await fetch(`${BASE_URL}/organizations/tools/all`, {
			credentials: "include",
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error ?? "Failed to load tools");
		return data;
	},

	async toggleOrgTool(toolId: string): Promise<{ id: string; isActive: boolean }> {
		const res = await fetch(`${BASE_URL}/organizations/tools/${toolId}/toggle`, {
			method: "PATCH",
			credentials: "include",
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error ?? "Failed to toggle tool");
		return data;
	},

	// ─── SETTINGS ───────────────────────────────────────────────────────────────

	async getUserProfile(): Promise<{ user: UserProfile }> {
		const res = await fetch(`${BASE_URL}/users/me`, {
			credentials: "include",
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error ?? "Failed to load profile");
		return { user: normalizeUserProfile(data.result) };
	},

	async updateUserProfile(input: UpdateProfileInput): Promise<{ user: UserProfile }> {
		const res = await fetch(`${BASE_URL}/users/me`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({
				firstName: input.first_name,
				lastName: input.last_name,
				email: input.email,
			}),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error ?? "Failed to update profile.");
		return { user: normalizeUserProfile(data.result) };
	},

	async updatePassword(input: UpdatePasswordInput): Promise<{ success: boolean }> {
		const res = await fetch(`${BASE_URL}/users/me/password`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({
				current_password: input.current_password,
				new_password: input.new_password,
			}),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error ?? "Failed to update password.");
		return { success: true };
	},

	async getOrgProfile(): Promise<{ organization: OrgProfile }> {
		const res = await fetch(`${BASE_URL}/organizations/me`, {
			credentials: "include",
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error ?? "Failed to load organization");
		return { organization: normalizeOrgProfile(data) };
	},

	async updateOrgProfile(input: { name: string; email: string }): Promise<{ organization: OrgProfile }> {
		if (!input.name.trim()) throw new Error("Organization name is required.");
		if (!input.email.trim()) throw new Error("Organization email is required.");
		const res = await fetch(`${BASE_URL}/organizations/me`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({
				name: input.name,
				email: input.email,
			}),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error ?? "Failed to update organization");
		return { organization: normalizeOrgProfile(data) };
	},
	async updateWidgetConfig(input: { title: string; greetingMessage: string; accentColor: string; placeholder: string }): Promise<{ organization: OrgProfile }> {
		const res = await fetch(`${BASE_URL}/organizations/widget-config`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(input),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error ?? "Failed to update widget config");
		return { organization: normalizeOrgProfile(data) };
	},
	async getApiKeys(): Promise<ApiKey[]> {
		const response = await fetch(`${BASE_URL}/dashboard/apikey/keys`, {
			credentials: "include",
		});

		const data = await response.json().catch(() => []);
		if (!response.ok) throw new Error(data.error ?? "Failed to load API keys");
		return Array.isArray(data) ? data.map(normalizeApiKey) : [];
	},
	async createApiKey(input: { name: string; allowedOrigins: string[] }): Promise<ApiKey> {
		const response = await fetch(`${BASE_URL}/dashboard/apikey/create`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ allowedOrigins: input.allowedOrigins }),
		});

		const data = await response.json();
		if (!response.ok) {
			throw new Error(data.error ?? "Failed to create API key");
		}

		const rawKey = typeof data === "string" ? data : (data.rawKey ?? data.raw_key ?? "");
		const keyPrefix = rawKey.slice(0, 8);
		const keys = await this.getApiKeys().catch(() => []);
		const createdKey =
			keys.find((key) => key.key_prefix === keyPrefix) ??
			normalizeApiKey({
				name: input.name,
				keyPrefix,
				allowedOrigins: input.allowedOrigins,
				raw_key: rawKey,
			});

		return { ...createdKey, raw_key: rawKey, name: createdKey.name || input.name };
	},
	async revokeApiKey(id: string) {
		const response = await fetch(`${BASE_URL}/dashboard/apikey/${id}/revoke`, {
			method: "PATCH",
			credentials: "include",
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error ?? "Failed to revoke API key");
		}

		return data;
	},
	async createPaymentIntention(data: {
		pricingId: string;
		amountCents: number;
		currency?: string;
		billingData: {
			firstName: string;
			lastName: string;
			email: string;
			phone: string;
		};
	}): Promise<{
		clientSecret: string;
		intentionId: string;
		paymentId: string;
		amount: number;
		currency: string;
	}> {
		const res = await fetch(`${BASE_URL}/payments/create-intention`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(data),
		});
		const body = await res.json();
		sessionStorage.setItem("paymentId", body?.paymentId);
		if (!res.ok) throw new Error(body.error ?? "Failed to initialize Paymob checkout");
		return body;
	},
	async getPaymentHistory(): Promise<Array<{ id: string; status: string }>> {
		const res = await fetch(`${BASE_URL}/payments/history`, {
			credentials: "include",
		});
		const data = await res.json().catch(() => []);
		if (!res.ok) throw new Error(data.error ?? "Failed to load payment history");
		if (!Array.isArray(data)) return [];
		return data.map((item) => ({
			id: String((item as ApiRecord).id ?? ""),
			status: String((item as ApiRecord).status ?? ""),
		}));
	},
	// ─── TEAM / INVITATIONS ─────────────────────────────────────────────────────

	async getTeam(): Promise<{
		members: {
			id: string;
			firstName: string;
			lastName: string;
			email: string;
			role: string;
			isActive: boolean;
			createdAt: string;
		}[];
		pendingInvitations: {
			id: string;
			email: string;
			role: string;
			status: string;
			createdAt: string;
			expiresAt: string;
			invitedBy: { firstName: string; lastName: string };
		}[];
	}> {
		const res = await fetch(`${BASE_URL}/invitations/team`, {
			credentials: "include",
		});
		if (!res.ok) throw new Error("Failed to fetch team");
		return res.json();
	},

	async sendInvitation(email: string): Promise<void> {
		const res = await fetch(`${BASE_URL}/invitations/invite`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email }),
			credentials: "include",
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message ?? "Failed to send invitation");
	},

	async revokeInvitation(id: string): Promise<void> {
		const res = await fetch(`${BASE_URL}/invitations/invitations/${id}`, {
			method: "DELETE",
			credentials: "include",
		});
		if (!res.ok) {
			throw new Error("Failed to revoke invitation");
		}
	},
};
