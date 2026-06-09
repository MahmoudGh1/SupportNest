import { getSession } from "@/lib/auth";
import { AuthUser, DashboardStats, GetKnowledgeDocsResponse, KnowledgeDocument, LoginResponse, OrgProfile, OrgSetupData, UpdatePasswordInput, UpdateProfileInput, UpdateWidgetConfigInput, UploadPdfInput, UserProfile, ApiKey } from "@/types/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const mockDelay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

// ─── MOCK DATA (settings + dashboard only) ────────────────────────────────────

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

let mockUserProfile: UserProfile = {
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

export const api = {
	async login(email: string, password: string): Promise<LoginResponse> {
		const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
			credentials: "include",
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error ?? "Login failed");

		const { id, email: userEmail, firstName, lastName, role, organizationId, onboarded } = data.result;
		const user: AuthUser = { id, email: userEmail, firstName, lastName, role, orgId: organizationId, onboarded };
		return { user };
	},

	async register(data: { email: string; password: string; firstName: string; lastName: string; businessName: string; planId: string }): Promise<LoginResponse> {
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
		const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
			credentials: "include",
		});
		if (!res.ok) throw new Error("No active session");
		const data = await res.json();
		const { id, email, firstName, lastName, role, organizationId, onboarded } = data.result;
		return { id, email, firstName, lastName, role, orgId: organizationId, onboarded };
	},

	async logout(): Promise<void> {
		await fetch(`${BASE_URL}/api/v1/auth/logout`, {
			method: "POST",
			credentials: "include",
		});
	},

	async setupOrg(data: OrgSetupData): Promise<{ orgId: string } & OrgSetupData> {
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
				{ id: 1, customer: "Sarah K.", status: "ACTIVE", tier: "Tier 1", time: "2m ago" },
				{ id: 2, customer: "James O.", status: "ESCALATED", tier: "Human", time: "8m ago" },
				{ id: 3, customer: "Lena M.", status: "CLOSED", tier: "Tier 2", time: "15m ago" },
				{ id: 4, customer: "Tom B.", status: "ACTIVE", tier: "Tier 1", time: "21m ago" },
				{ id: 5, customer: "Aisha F.", status: "CLOSED", tier: "Tier 1", time: "34m ago" },
			],
			resolutionByTier: { tier1: 58, tier2: 23, human: 19 },
		};
	},

	// ─── KNOWLEDGE ──────────────────────────────────────────────────────────────

	async getKnowledgeDocs(filterState: any): Promise<GetKnowledgeDocsResponse> {
		const user = getSession();
		if (!user) throw new Error("User not found");

		const params = new URLSearchParams();
		Object.entries(filterState).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				params.append(key, String(value));
			}
		});

		const response = await fetch(`${BASE_URL}/api/v1/organizations/${user.orgId}/knowledge?${params.toString()}`, { credentials: "include" });
		if (!response.ok) throw new Error(response.statusText);
		return response.json();
	},

	async uploadPdf(input: UploadPdfInput): Promise<{ document: KnowledgeDocument }> {
		const user = getSession();
		if (!user) throw new Error("User not found");

		const formData = new FormData();
		formData.append("file", input.file);
		formData.append("title", input.title);
		formData.append("type", "PDF");

		const response = await fetch(`${BASE_URL}/api/v1/organizations/${user.orgId}/knowledge`, {
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
			const response = await fetch(`${BASE_URL}/api/v1/organizations/${user.orgId}/knowledge/${id}`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
			});

			const data = await response.json();
			if (!response.ok) throw new Error(data.message || "Something went wrong");

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

	async updateUserProfile(input: UpdateProfileInput): Promise<{ user: UserProfile }> {
		await mockDelay(600);
		if (!input.email) throw new Error("Email is required.");
		if (!/\S+@\S+\.\S+/.test(input.email)) throw new Error("Enter a valid email.");
		mockUserProfile = {
			...mockUserProfile,
			...input,
			updated_at: new Date().toISOString(),
		} as any;
		return { user: { ...mockUserProfile } };
	},

	async updatePassword(input: UpdatePasswordInput): Promise<{ success: boolean }> {
		await mockDelay(700);
		if (input.current_password !== "password") throw new Error("Current password is incorrect.");
		if (input.new_password.length < 8) throw new Error("New password must be at least 8 characters.");
		return { success: true };
	},

	async getOrgProfile(): Promise<{ organization: OrgProfile }> {
		await mockDelay(300);
		return { organization: { ...mockOrgProfile } };
	},

	async updateOrgProfile(input: UpdateWidgetConfigInput): Promise<{ organization: OrgProfile }> {
		await mockDelay(600);
		if (!input.name.trim()) throw new Error("Organization name is required.");
		if (!input.email.trim()) throw new Error("Organization email is required.");
		mockOrgProfile = {
			...mockOrgProfile,
			name: input.name,
			email: input.email,
			widget_config: input.widget_config,
			updated_at: new Date().toISOString(),
		};
		return { organization: { ...mockOrgProfile } };
	},

	// ─── API KEYS ───────────────────────────────────────────────────────────────

	async getApiKeys(): Promise<ApiKey[]> {
		const response = await fetch(`${BASE_URL}/api/v1/dashboard/apiKey/keys`, {
			credentials: "include",
			headers: {
				Authorization: `Bearer ${getSession()?.token ?? ""}`,
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

		if (!response.ok) return [];
		return data;
	},

	async createApiKey(allowedOrigins: string[]): Promise<string> {
		const response = await fetch(`${BASE_URL}/api/v1/dashboard/apiKey/create`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${getSession()?.token ?? ""}`,
			},
			credentials: "include",
			body: JSON.stringify({ allowedOrigins }),
		});

		const data = await response.json();
		if (!response.ok) throw new Error(data.error ?? "Failed to create API key");
		return data;
	},

	async revokeApiKey(id: string) {
		const response = await fetch(`${BASE_URL}/api/v1/dashboard/api-keys/${id}/revoke`, {
			method: "PATCH",
			credentials: "include",
			headers: {
				Authorization: `Bearer ${getSession()?.token ?? ""}`,
			},
		});

		const data = await response.json();
		if (!response.ok) throw new Error(data.error ?? "Failed to revoke API key");
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
		const res = await fetch(`${BASE_URL}/api/v1/invitations/team`, {
			credentials: "include",
		});
		if (!res.ok) throw new Error("Failed to fetch team");
		return res.json();
	},

	async sendInvitation(email: string): Promise<void> {
		const res = await fetch(`${BASE_URL}/api/v1/invitations/invite`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email }),
			credentials: "include",
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message ?? "Failed to send invitation");
	},

	async revokeInvitation(id: string): Promise<void> {
		const res = await fetch(`${BASE_URL}/api/v1/invitations/invitations/${id}`, {
			method: "DELETE",
			credentials: "include",
		});
		if (!res.ok) {
			throw new Error("Failed to revoke invitation");
		}
	},
};
