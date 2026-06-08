import type {
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
  UploadFaqInput,
  UploadPdfInput,
  UserProfile,
} from "@/types/types";
import { getSession } from "@/lib/auth";

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

// ─── API ──────────────────────────────────────────────────────────────────────

export const api = {

  // AUTH
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

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    businessName: string;
    planId: string;
  }): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Registration failed");
    // register doesn't log in — user is redirected to login page after payment
  },

  async logout(): Promise<void> {
    await fetch(`${BASE_URL}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
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

  // DASHBOARD
  async getDashboardStats(): Promise<DashboardStats> {
    await mockDelay(500);
    return {
      totalConversations: 1284,
      aiResolutionRate: 81,
      avgResponseTime: "1.4s",
      csatScore: 4.7,
      recentConversations: [
        { id: 1, customer: "Sarah K.",  status: "active",    tier: "Tier 1", time: "2m ago"  },
        { id: 2, customer: "James O.",  status: "escalated", tier: "Human",  time: "8m ago"  },
        { id: 3, customer: "Lena M.",   status: "closed",    tier: "Tier 2", time: "15m ago" },
        { id: 4, customer: "Tom B.",    status: "active",    tier: "Tier 1", time: "21m ago" },
        { id: 5, customer: "Aisha F.",  status: "closed",    tier: "Tier 1", time: "34m ago" },
      ],
      resolutionByTier: { tier1: 58, tier2: 23, human: 19 },
    };
  },

  // KNOWLEDGE BASE
  async getKnowledgeDocs(): Promise<GetKnowledgeDocsResponse> {
    const user = getSession();
    if (!user) throw new Error("Not authenticated");
    const res = await fetch(`${BASE_URL}/api/v1/organizations/${user.orgId}/knowledge`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch documents");
    return res.json();
  },

  async uploadPdf(input: UploadPdfInput): Promise<{ document: KnowledgeDocument }> {
    const user = getSession();
    if (!user) throw new Error("Not authenticated");
    const formData = new FormData();
    formData.append("file", input.file);
    formData.append("title", input.title);
    formData.append("type", "PDF");
    const res = await fetch(`${BASE_URL}/api/v1/organizations/${user.orgId}/knowledge`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message ?? `Upload failed: ${res.status}`);
    }
    return res.json();
  },

  // SETTINGS (mock until backend is ready)
  async getUserProfile(): Promise<{ user: UserProfile }> {
    await mockDelay(300);
    return { user: { ...mockUserProfile } };
  },

  async updateUserProfile(input: UpdateProfileInput): Promise<{ user: UserProfile }> {
    await mockDelay(600);
    if (!input.email) throw new Error("Email is required.");
    if (!/\S+@\S+\.\S+/.test(input.email)) throw new Error("Enter a valid email.");
    mockUserProfile = { ...mockUserProfile, ...input } as any;
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
    mockOrgProfile = { ...mockOrgProfile, name: input.name, email: input.email, widget_config: input.widget_config };
    return { organization: { ...mockOrgProfile } };
  },
};