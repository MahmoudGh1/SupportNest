// src/lib/mock-api.ts
// ─── ALL MOCK ENDPOINTS HERE ──────────────────────────────────────────────────
// When backend is ready: replace each function body with a real fetch() call.
// The function signatures stay exactly the same — nothing else in the app changes.

import { getSession } from "@/lib/auth";
import {
	AuthUser,
	DashboardStats,
	GetKnowledgeDocsResponse,
	KnowledgeDocument,
	LoginResponse,
	OrgProfile,
	OrgSetupData,
	UpdatePasswordInput,
	UpdateProfileInput,
	UpdateWidgetConfigInput,
	UploadPdfInput,
	UserProfile,
	ApiKey,
	AdminOrganizationsResponse,
	AdminOverview,
} from "@/types/types";

const mockDelay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

// ─── KB MOCK DATA STORE ───────────────────────────────────────────────────────
// Mutable in-memory store — simulates the database for this session

// ─── SETTINGS MOCK DATA ───────────────────────────────────────────────────────
let mockOrgProfile: OrgProfile = {
	id: "org1",
	name: "Acme Corp",
	slug: "acme-corp",
	email: "support@acme.com",
	widget_config: {
		color: "#534AB7",
		greeting: "Hi! How can we help you today?",
		position: "bottom-right",
	},
	plan_id: "plan_starter",
	is_active: true,
	created_at: "2024-01-15T10:00:00Z",
	updated_at: "2024-01-15T10:00:00Z",
};

const mockUserProfile: UserProfile = {
	id: "u1",
	email: "admin@acme.com",
	first_name: "Mohamed",
	last_name: "Rashad",
	role: "org_admin",
	organization_id: "org1",
	is_active: true,
	created_at: "2024-01-15T10:00:00Z",
};

// ─── API FUNCTIONS ────────────────────────────────────────────────────────────
const BASE_URL =
	process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
	const session = getSession();
	const response = await fetch(`${BASE_URL}/admin${path}`, {
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
		throw new Error(
			data?.error?.message ?? data?.message ?? "Admin request failed",
		);
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
		if (!res.ok) throw new Error(data.error ?? "Login failed");

		const {
			id,
			email: userEmail,
			firstName,
			lastName,
			role,
			organizationId,
			onboarded,
		} = data.result;
		const user: AuthUser = {
			id,
			email: userEmail,
			firstName,
			lastName,
			role,
			orgId: organizationId,
			onboarded,
		};
		return { user };
	},

	async register(data: {
		email: string;
		password: string;
		firstName: string;
		lastName: string;
		businessName: string;
		planId: string;
	}): Promise<LoginResponse> {
		const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
			credentials: "include",
		});
		const body = await res.json();
		if (!res.ok) throw new Error(body.error ?? "Registration failed");
		return body;
	},

	async getMe(): Promise<AuthUser> {
		const res = await fetch(`${BASE_URL}/auth/me`, {
			credentials: "include",
		});
		if (!res.ok) throw new Error("No active session");
		const data = await res.json();
		const { id, email, firstName, lastName, role, organizationId, onboarded } =
			data.result;
		return {
			id,
			email,
			firstName,
			lastName,
			role,
			orgId: organizationId,
			onboarded,
		};
	},

	async logout(): Promise<void> {
		await fetch(`${BASE_URL}/auth/logout`, {
			method: "POST",
			credentials: "include",
		});
	},

	async setupOrg(
		data: OrgSetupData,
	): Promise<{ orgId: string } & OrgSetupData> {
		await mockDelay(1000);
		return { orgId: "org-" + Date.now(), ...data };
	},

	async getDashboardStats(): Promise<DashboardStats> {
		await mockDelay(500);
		return {
			totalConversations: 1284,
			aiResolutionRate: 81,
			avgResponseTime: "1.4s",
			csatScore: 4.7,
			recentConversations: [
				{
					id: 1,
					customer: "Sarah K.",
					status: "ACTIVE",
					tier: "TIER_1",
					timestamp: "2026-06-09T01:50:00Z",
				},
				{
					id: 2,
					customer: "James O.",
					status: "ESCALATED",
					tier: "HUMAN",
					timestamp: "2026-06-09T01:42:00Z",
				},
				{
					id: 3,
					customer: "Lena M.",
					status: "CLOSED",
					tier: "TIER_2",
					timestamp: "2026-06-09T01:35:00Z",
				},
				{
					id: 4,
					customer: "Tom B.",
					status: "ACTIVE",
					tier: "TIER_1",
					timestamp: "2026-06-09T01:50:00Z",
				},
				{
					id: 5,
					customer: "Aisha F.",
					status: "CLOSED",
					tier: "TIER_1",
					timestamp: "2026-06-09T01:50:00Z",
				},
			],
			resolutionByTier: { tier1: 58, tier2: 23, human: 19 },
		};
	},

	async getAdminOverview(): Promise<AdminOverview> {
		return adminFetch<AdminOverview>("/overview");
	},

	async getAdminOrganizations(params?: {
		search?: string;
		is_active?: boolean | "";
		page?: number;
		limit?: number;
	}): Promise<AdminOrganizationsResponse> {
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

	// ─── KNOWLEDGE BASE ─────────────────────────────────────────────────────────

	async getKnowledgeDocs(
		filterState: Record<string, unknown>,
	): Promise<GetKnowledgeDocsResponse | null> {
		const user = getSession();
		// const user = session?.user;
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
			const response = await fetch(
				`${BASE_URL}/organizations/${user.orgId}/knowledge?${params.toString()}`,
				{
					credentials: "include",
				},
			);
			console.log(response);
			if (!response.ok) throw new Error(response.statusText);

			return response.json();
		} catch (error) {
			console.log(error instanceof Error ? error.message : "Unknown error");
			return null;
		}
	},

	async uploadPdf(
		input: UploadPdfInput,
	): Promise<{ document: KnowledgeDocument }> {
		const user = getSession();
		if (!user) throw new Error("User not found");

		const formData = new FormData();
		formData.append("file", input.file);
		formData.append("title", input.title);
		formData.append("type", "PDF");

		const response = await fetch(
			`${BASE_URL}/organizations/${user.orgId}/knowledge`,
			{
				method: "POST",
				body: formData,
				credentials: "include",
			},
		);

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
			const response = await fetch(
				`${BASE_URL}/organizations/${user.orgId}/knowledge/${id}`,
				{
					method: "DELETE",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
				},
			);

			const data = await response.json();
			if (!response.ok)
				throw new Error(data.message || "Something went wrong");

			console.log("Success:", data.message);
			return { success: data.success };
		} catch (error) {
			if (error instanceof Error) {
				console.error("Error deleting item:", error.message);
			} else {
				console.log("An unexpected error occurred", error);
			}
			return { success: false };
		}
	},

	// ─── SETTINGS ───────────────────────────────────────────────────────────────

	async getUserProfile(): Promise<{ user: UserProfile }> {
		await mockDelay(300);
		return { user: { ...mockUserProfile } };
	},

	async updateUserProfile(
		input: UpdateProfileInput,
	): Promise<{ user: UserProfile }> {
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
		return { user: data.result };
	},

	async updatePassword(
		input: UpdatePasswordInput,
	): Promise<{ success: boolean }> {
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
		await mockDelay(300);
		return { organization: { ...mockOrgProfile } };
	},

	async updateOrgProfile(
		input: UpdateWidgetConfigInput,
	): Promise<{ organization: OrgProfile }> {
		await mockDelay(600);
		if (!input.name.trim()) throw new Error("Organization name is required.");
		if (!input.email.trim())
			throw new Error("Organization email is required.");
		mockOrgProfile = {
			...mockOrgProfile,
			name: input.name,
			email: input.email,
			widget_config: input.widget_config,
			updated_at: new Date().toISOString(),
		};
		return { organization: { ...mockOrgProfile } };
	},
	async getApiKeys(): Promise<ApiKey[]> {
		const response = await fetch(`${BASE_URL}/dashboard/apiKey/keys`, {
			credentials: "include",
			headers: {
				Authorization: `Bearer ${getSession()?.token ?? ""}`, // ← add this
			},
		});

		let data;

		try {
			data = await response.json();
		} catch {
			data = await response.text();
		}

		console.log("=== API KEYS DEBUG ===");
		console.log("Status:", response.status);
		console.log("OK:", response.ok);
		console.log("Response:", data);

		if (!response.ok) {
			// DON'T throw yet
			return [];
		}

		return data;
	},
	async createApiKey(allowedOrigins: string[]): Promise<string> {
		const response = await fetch(`${BASE_URL}/dashboard/apiKey/create`, {
			method: "POST",

			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${getSession()?.token ?? ""}`,
				credentials: "include",
			},
			body: JSON.stringify({ allowedOrigins }),
		});

		const data = await response.json();
		console.log("STATUS:", response.status);
		console.log("BODY:", data); // ← add this

		if (!response.ok) {
			console.log("bvhjdhhdddddddddddd");
			throw new Error(data.error ?? "Failed to create API key");
		}

		return data;
	},
	async revokeApiKey(id: string) {
		const response = await fetch(
			`${BASE_URL}/dashboard/api-keys/${id}/revoke`,
			{
				method: "PATCH",
				credentials: "include",
				headers: {
					Authorization: `Bearer ${getSession()?.token ?? ""}`,
				},
			},
		);

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error ?? "Failed to revoke API key");
		}

		return data;
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
