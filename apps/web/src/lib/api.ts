// src/lib/mock-api.ts
// ─── ALL MOCK ENDPOINTS HERE ──────────────────────────────────────────────────
// When backend is ready: replace each function body with a real fetch() call.
// The function signatures stay exactly the same — nothing else in the app changes.

import {
	AuthUser,
	DashboardStats,
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
let mockDocs: KnowledgeDocument[] = [
	{
		id: "doc_001",
		organization_id: "org1",
		title: "Q3 Product FAQ",
		type: "pdf",
		storagePath: "https://storage.supabase.co/object/public/docs/q3-faq.pdf",
		status: "ready",
		metadata: { pageCount: 12, fileSize: 204800 },
		created_by: "u1",
		created_at: "2024-06-01T10:00:00Z",
		updated_at: "2024-06-01T10:02:00Z",
	},
	{
		id: "doc_002",
		organization_id: "org1",
		title: "Refund Policy",
		type: "faq",
		storagePath: "https://acme.com/refund-policy",
		status: "ready",
		metadata: { faqCategory: "Billing" },
		created_by: "u1",
		created_at: "2024-06-02T09:00:00Z",
		updated_at: "2024-06-02T09:01:00Z",
	},
	{
		id: "doc_003",
		organization_id: "org1",
		title: "Onboarding Guide v2",
		type: "pdf",
		storagePath:
			"https://storage.supabase.co/object/public/docs/onboarding-v2.pdf",
		status: "failed",
		metadata: { pageCount: 0, fileSize: 512000 },
		created_by: "u1",
		created_at: "2024-06-03T07:00:00Z",
		updated_at: "2024-06-03T07:01:00Z",
	},
];

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
					status: "active",
					tier: "Tier 1",
					time: "2m ago",
				},
				{
					id: 2,
					customer: "James O.",
					status: "escalated",
					tier: "Human",
					time: "8m ago",
				},
				{
					id: 3,
					customer: "Lena M.",
					status: "closed",
					tier: "Tier 2",
					time: "15m ago",
				},
				{
					id: 4,
					customer: "Tom B.",
					status: "active",
					tier: "Tier 1",
					time: "21m ago",
				},
				{
					id: 5,
					customer: "Aisha F.",
					status: "closed",
					tier: "Tier 1",
					time: "34m ago",
				},
			],
			resolutionByTier: { tier1: 58, tier2: 23, human: 19 },
		};
	},

	// ─── KNOWLEDGE BASE ─────────────────────────────────────────────────────────

	async getKnowledgeDocs(): Promise<{ documents: KnowledgeDocument[] }> {
		await mockDelay(500);
		return { documents: [...mockDocs] };
	},

	async uploadPdf(
		input: UploadPdfInput,
	): Promise<{ document: KnowledgeDocument }> {
		await mockDelay(800);
		const newDoc: KnowledgeDocument = {
			id: "doc_" + Date.now(),
			organization_id: "org1",
			title: input.title,
			type: "pdf",
			storagePath:
				"https://storage.supabase.co/object/public/docs/" + input.file.name,
			status: "processing",
			metadata: {
				fileSize: input.file.size,
				pageCount: 0,
			},
			created_by: "u1",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};
		mockDocs = [newDoc, ...mockDocs];

		// Simulate background job: flip to ready after 4s
		setTimeout(() => {
			mockDocs = mockDocs.map((d) =>
				d.id === newDoc.id
					? {
							...d,
							status: "ready",
							metadata: {
								...d.metadata,
								pageCount: Math.floor(Math.random() * 20) + 1,
							},
						}
					: d,
			);
		}, 4000);

		return { document: newDoc };
	},

	async uploadFaq(
		input: UploadFaqInput,
	): Promise<{ document: KnowledgeDocument }> {
		await mockDelay(600);
		const newDoc: KnowledgeDocument = {
			id: "doc_" + Date.now(),
			organization_id: "org1",
			title: input.title,
			type: "faq",
			storagePath: input.storagePath,
			status: "processing",
			metadata: {
				faqCategory: input.faqCategory,
			},
			created_by: "u1",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};
		mockDocs = [newDoc, ...mockDocs];

		// Simulate background job: flip to ready after 3s
		setTimeout(() => {
			mockDocs = mockDocs.map((d) =>
				d.id === newDoc.id ? { ...d, status: "ready" } : d,
			);
		}, 3000);

		return { document: newDoc };
	},

	async deleteKnowledgeDoc(id: string): Promise<{ success: boolean }> {
		await mockDelay(400);
		const exists = mockDocs.find((d) => d.id === id);
		if (!exists) throw new Error("Document not found.");
		mockDocs = mockDocs.filter((d) => d.id !== id);
		// document_chunks are deleted by backend cascade
		return { success: true };
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
};
