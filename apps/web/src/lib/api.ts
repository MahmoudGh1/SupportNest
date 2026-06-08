// src/lib/mock-api.ts
// ─── ALL MOCK ENDPOINTS HERE ──────────────────────────────────────────────────
// When backend is ready: replace each function body with a real fetch() call.
// The function signatures stay exactly the same — nothing else in the app changes.

import { getSession } from "@/lib/auth";
import {
	AuthUser,
	DashboardStats,
	GetKnowledgeDocsResponse,
	getKnowledgeDocsResponse,
	KnowledgeDocument,
	LoginResponse,
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

const mockDelay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

const mockUsers = [
	{
		id: "u1",
		email: "admin@acme.com",
		password: "password",
		firstName: "Mohamed",
		lastName: "Rashad",
		role: "org_admin",
		orgId: "org1",
		orgName: "Acme Corp",
		onboarded: true,
	},
];

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
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const api = {
	async login(email: string, password: string): Promise<LoginResponse> {
		const res = await fetch("http://localhost:3001/api/v1/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
			credentials: "include",
		});

		const data = await res.json();
		if (!res.ok) {
			throw new Error("Login failed");
		}

		const {
			id,
			email: orgEmail,
			firstName,
			lastName,
			role,
			organizationId,
			onboarded,
		} = data.result;
		const user: AuthUser = {
			id,
			email: orgEmail,
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
		planId: string;
	}): Promise<LoginResponse> {
		const res = await fetch("http://localhost:3001/api/v1/auth/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
			credentials: "include",
		});
		const body = await res.json();

		if (!res.ok) {
			throw new Error("Registration failed");
		}

		return api.login(data.email, data.password);
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
					tier: "Tier 1",
					time: "2m ago",
				},
				{
					id: 2,
					customer: "James O.",
					status: "ESCALATED",
					tier: "Human",
					time: "8m ago",
				},
				{
					id: 3,
					customer: "Lena M.",
					status: "CLOSED",
					tier: "Tier 2",
					time: "15m ago",
				},
				{
					id: 4,
					customer: "Tom B.",
					status: "ACTIVE",
					tier: "Tier 1",
					time: "21m ago",
				},
				{
					id: 5,
					customer: "Aisha F.",
					status: "CLOSED",
					tier: "Tier 1",
					time: "34m ago",
				},
			],
			resolutionByTier: { tier1: 58, tier2: 23, human: 19 },
		};
	},

	// ─── KNOWLEDGE BASE ─────────────────────────────────────────────────────────

	async getKnowledgeDocs(): Promise<GetKnowledgeDocsResponse> {
		const session = getSession();

		const user = session?.user;
		if (!user) {
			throw new Error("User not found");
		}
		const response = await fetch(
			`http://localhost:3001/api/v1/organizations/${user.orgId}/knowledge`,
			{
				credentials: "include",
			},
		);
		if (!response.ok) throw new Error(response.statusText);

		return response.json();
	},

	async uploadPdf(
		input: UploadPdfInput,
	): Promise<{ document: KnowledgeDocument }> {
		const session = getSession();

		const user = session?.user;
		if (!user) {
			throw new Error("User not found");
		}
		const formData = new FormData();
		formData.append("file", input.file);
		formData.append("title", input.title);
		formData.append("type", "PDF");

		const response = await fetch(
			`http://localhost:3001/api/v1/organizations/${user.orgId}/knowledge`,
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

		return response.json(); // expects { document: KnowledgeDocument }
	},

	// async uploadFaq(
	// 	input: UploadFaqInput,
	// ): Promise<{ document: KnowledgeDocument }> {
	// 	await mockDelay(600);
	// 	const newDoc: KnowledgeDocument = {
	// 		id: "doc_" + Date.now(),
	// 		organization_id: "org1",
	// 		title: input.title,
	// 		type: "faq",
	// 		storagePath: input.storagePath,
	// 		status: "processing",
	// 		metadata: {
	// 			faqCategory: input.faqCategory,
	// 		},
	// 		created_by: "u1",
	// 		created_at: new Date().toISOString(),
	// 		updated_at: new Date().toISOString(),
	// 	};
	// 	mockDocs = [newDoc, ...mockDocs];

	// 	// Simulate background job: flip to ready after 3s
	// 	setTimeout(() => {
	// 		mockDocs = mockDocs.map((d) =>
	// 			d.id === newDoc.id ? { ...d, status: "ready" } : d,
	// 		);
	// 	}, 3000);

	// 	return { document: newDoc };
	// },

	async deleteKnowledgeDoc(id: string): Promise<{ success: boolean }> {
		const session = getSession();

		const user = session?.user;
		if (!user) {
			throw new Error("User not found");
		}
		try {
			const response = await fetch(
				`http://localhost:3001/api/v1/organizations/${user.orgId}/knowledge/${id}`,
				{
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
						credentials: "include",
					},
				},
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "Something went wrong");
			}

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
		await mockDelay(600);
		if (!input.email) throw new Error("Email is required.");
		if (!/\S+@\S+\.\S+/.test(input.email))
			throw new Error("Enter a valid email.");
		mockUserProfile = {
			...mockUserProfile,
			...input,
			updated_at: new Date().toISOString(),
		} as any;
		return { user: { ...mockUserProfile } };
	},

	async updatePassword(
		input: UpdatePasswordInput,
	): Promise<{ success: boolean }> {
		await mockDelay(700);
		// Mock: only accept "password" as current password (matches mock user)
		if (input.current_password !== "password")
			throw new Error("Current password is incorrect.");
		if (input.new_password.length < 8)
			throw new Error("New password must be at least 8 characters.");
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
		const response = await fetch(
			"http://localhost:3001/api/v1/dashboard/apiKey/keys",
			{
				credentials: "include",
				headers: {
					Authorization: `Bearer ${getSession()?.token ?? ""}`, // ← add this
				},
			},
		);

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
		const response = await fetch(
			"http://localhost:3001/api/v1/dashboard/apiKey/create",
			{
				method: "POST",

				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${getSession()?.token ?? ""}`,
					credentials: "include",
				},
				body: JSON.stringify({ allowedOrigins }),
			},
		);

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
			`http://localhost:3001/api/v1/dashboard/api-keys/${id}/revoke`,
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
};
