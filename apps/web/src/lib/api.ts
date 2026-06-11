import { getSession } from "@/lib/auth";
import { mapApiUser } from "@/lib/map-user";
import {
	AuthUser,
	DashboardStats,
	GetKnowledgeDocsResponse,
	getKnowledgeDocsResponse,
	KnowledgeDocument,
	LoginResponse,
	PricingPlan,
	OrgProfile,
	OrgSetupData,
	UpdatePasswordInput,
	UpdateProfileInput,
	UpdateWidgetConfigInput,
	UploadFaqInput,
	UploadPdfInput,
	UserProfile,
	ApiKey,
	CreateApiKeyInput,
} from "@/types/types";

// ─── API FUNCTIONS ────────────────────────────────────────────────────────────
const BASE_URL =
	process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

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

	async register(data: {
		email: string;
		password: string;
		firstName: string;
		lastName: string;
		businessName: string;
		planId: string;
	}): Promise<LoginResponse> {
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

	async completePayment(data: {
		pricingId: string;
		amount: number;
		currency?: string;
		isAnnual: boolean;
	}): Promise<{ paymentId: string; billingPeriodEnd: string }> {
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

	async logout(): Promise<void> {
		await fetch(`${BASE_URL}/auth/logout`, {
			method: "POST",
			credentials: "include",
		});
	},

	async setupOrg(
		data: OrgSetupData,
	): Promise<{ orgId: string } & OrgSetupData> {
		throw new Error("Organization setup is not available.");
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

	async getKnowledgeDocs(
		filterState: any,
	): Promise<GetKnowledgeDocsResponse | null> {
		const session = getSession();
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
		} catch (error: any) {
			console.log(error.message);
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
		const res = await fetch(`${BASE_URL}/users/me`, {
			credentials: "include",
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error ?? "Failed to load profile");
		return { user: data.result };
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
		const res = await fetch(`${BASE_URL}/organizations/me`, {
			credentials: "include",
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error ?? "Failed to load organization");
		return { organization: data.result };
	},

	async updateOrgProfile(
		input: UpdateWidgetConfigInput,
	): Promise<{ organization: OrgProfile }> {
		if (!input.name.trim()) throw new Error("Organization name is required.");
		if (!input.email.trim())
			throw new Error("Organization email is required.");
		const res = await fetch(`${BASE_URL}/organizations/me`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({
				name: input.name,
				email: input.email,
				widget_config: input.widget_config,
			}),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error ?? "Failed to update organization");
		return { organization: data.result };
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
