import type { AdminOverview, AdminOrganizationsResponse, AdminOrganizationDetail, AdminOrganization, AdminUsersResponse, AdminUser, AdminEscalationsResponse, AdminCsatStats, AdminTicketStats, AdminConversationStats, AdminTierStats, WidgetConfig } from "@/types/types";
import { adminFetch } from "./client";

// ─── OVERVIEW ───────────────────────────────────────────────────────────────

export async function getAdminOverview(): Promise<AdminOverview> {
	return adminFetch<AdminOverview>("/overview");
}

// ─── ORGANIZATIONS ───────────────────────────────────────────────────────────

export async function getAdminOrganizations(params?: { search?: string; is_active?: boolean | ""; page?: number; limit?: number }): Promise<AdminOrganizationsResponse> {
	const query = new URLSearchParams();
	if (params?.search) query.set("search", params.search);
	if (params?.is_active !== undefined && params.is_active !== "") {
		query.set("is_active", String(params.is_active));
	}
	if (params?.page) query.set("page", String(params.page));
	if (params?.limit) query.set("limit", String(params.limit));
	const suffix = query.toString() ? `?${query.toString()}` : "";
	return adminFetch<AdminOrganizationsResponse>(`/organizations${suffix}`);
}

export async function getAdminOrganization(organizationId: string): Promise<AdminOrganizationDetail> {
	return adminFetch<AdminOrganizationDetail>(`/organizations/${organizationId}`);
}

export async function createAdminOrganization(data: { name: string; email: string; slug: string; plan_id?: string; widget_config?: Partial<WidgetConfig> }): Promise<AdminOrganization> {
	return adminFetch<AdminOrganization>("/organizations", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export async function updateAdminOrganization(
	organizationId: string,
	data: Partial<{
		name: string;
		email: string;
		is_active: boolean;
		plan_id: string;
		widget_config: Partial<WidgetConfig>;
	}>,
): Promise<AdminOrganization> {
	return adminFetch<AdminOrganization>(`/organizations/${organizationId}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	});
}

export async function suspendAdminOrganization(organizationId: string): Promise<void> {
	return adminFetch<void>(`/organizations/${organizationId}/suspend`, {
		method: "PATCH",
	});
}

export async function activateAdminOrganization(organizationId: string): Promise<void> {
	return adminFetch<void>(`/organizations/${organizationId}/activate`, {
		method: "PATCH",
	});
}

// ─── USERS ───────────────────────────────────────────────────────────────────

export async function getAdminAllUsers(params?: { role?: string; is_active?: boolean; search?: string; page?: number; limit?: number }): Promise<AdminUsersResponse> {
	const query = new URLSearchParams();
	if (params?.role) query.set("role", params.role);
	if (params?.is_active !== undefined) query.set("is_active", String(params.is_active));
	if (params?.search) query.set("search", params.search);
	if (params?.page) query.set("page", String(params.page));
	if (params?.limit) query.set("limit", String(params.limit));
	const suffix = query.toString() ? `?${query.toString()}` : "";
	return adminFetch<AdminUsersResponse>(`/users${suffix}`);
}

export async function getAdminOrgUsers(
	organizationId: string,
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
	return adminFetch<AdminUsersResponse>(`/organizations/${organizationId}/users${suffix}`);
}

export async function updateAdminOrgUser(organizationId: string, userId: string, data: Partial<Pick<AdminUser, "role" | "is_active">>): Promise<AdminUser> {
	return adminFetch<AdminUser>(`/organizations/${organizationId}/users/${userId}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	});
}

export async function removeAdminOrgUser(organizationId: string, userId: string): Promise<void> {
	return adminFetch<void>(`/organizations/${organizationId}/users/${userId}`, {
		method: "DELETE",
	});
}

// ─── STATS ───────────────────────────────────────────────────────────────────

export async function getAdminGlobalTierStats(params?: { from?: string; to?: string }): Promise<AdminTierStats> {
	const query = new URLSearchParams();
	if (params?.from) query.set("from", params.from);
	if (params?.to) query.set("to", params.to);
	const suffix = query.toString() ? `?${query.toString()}` : "";
	return adminFetch<AdminTierStats>(`/tier-stats${suffix}`);
}

export async function getAdminOrgTierStats(organizationId: string, params?: { from?: string; to?: string }): Promise<AdminTierStats> {
	const query = new URLSearchParams();
	if (params?.from) query.set("from", params.from);
	if (params?.to) query.set("to", params.to);
	const suffix = query.toString() ? `?${query.toString()}` : "";
	return adminFetch<AdminTierStats>(`/organizations/${organizationId}/tier-stats${suffix}`);
}

export async function getAdminOrgConversationStats(organizationId: string, params?: { from?: string; to?: string }): Promise<AdminConversationStats> {
	const query = new URLSearchParams();
	if (params?.from) query.set("from", params.from);
	if (params?.to) query.set("to", params.to);
	const suffix = query.toString() ? `?${query.toString()}` : "";
	return adminFetch<AdminConversationStats>(`/organizations/${organizationId}/conversation-stats${suffix}`);
}

export async function getAdminOrgTicketStats(organizationId: string, params?: { from?: string; to?: string }): Promise<AdminTicketStats> {
	const query = new URLSearchParams();
	if (params?.from) query.set("from", params.from);
	if (params?.to) query.set("to", params.to);
	const suffix = query.toString() ? `?${query.toString()}` : "";
	return adminFetch<AdminTicketStats>(`/organizations/${organizationId}/ticket-stats${suffix}`);
}

export async function getAdminOrgCsat(organizationId: string, params?: { from?: string; to?: string }): Promise<AdminCsatStats> {
	const query = new URLSearchParams();
	if (params?.from) query.set("from", params.from);
	if (params?.to) query.set("to", params.to);
	const suffix = query.toString() ? `?${query.toString()}` : "";
	return adminFetch<AdminCsatStats>(`/organizations/${organizationId}/csat${suffix}`);
}

// ─── ESCALATIONS ─────────────────────────────────────────────────────────────

export async function getAdminGlobalEscalations(params?: { priority?: string; status?: string; from?: string; to?: string; page?: number; limit?: number }): Promise<AdminEscalationsResponse> {
	const query = new URLSearchParams();
	if (params?.priority) query.set("priority", params.priority);
	if (params?.status) query.set("status", params.status);
	if (params?.from) query.set("from", params.from);
	if (params?.to) query.set("to", params.to);
	if (params?.page) query.set("page", String(params.page));
	if (params?.limit) query.set("limit", String(params.limit));
	const suffix = query.toString() ? `?${query.toString()}` : "";
	return adminFetch<AdminEscalationsResponse>(`/escalations${suffix}`);
}

export async function getAdminOrgEscalations(organizationId: string, params?: { from?: string; to?: string; page?: number; limit?: number }): Promise<AdminEscalationsResponse> {
	const query = new URLSearchParams();
	if (params?.from) query.set("from", params.from);
	if (params?.to) query.set("to", params.to);
	if (params?.page) query.set("page", String(params.page));
	if (params?.limit) query.set("limit", String(params.limit));
	const suffix = query.toString() ? `?${query.toString()}` : "";
	return adminFetch<AdminEscalationsResponse>(`/organizations/${organizationId}/escalations${suffix}`);
}
