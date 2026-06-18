import { apiFetch } from "./client";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface OrgTool {
	id: string;
	name: string;
	description: string;
	method: string;
	path: string;
	isActive: boolean;
	createdAt: string;
	document: { title: string; type: string } | null;
}

export interface ApiConfig {
	id?: string;
	baseUrl?: string;
	authType?: string;
	headerName?: string;
	isVerified?: boolean;
	lastVerifiedAt?: string;
	configured?: boolean;
}

// ─── TOOLS ────────────────────────────────────────────────────────────────────

export async function getAllOrgTools(): Promise<{ tools: OrgTool[] }> {
	return apiFetch<{ tools: OrgTool[] }>("/organizations/tools/all");
}

export async function toggleOrgTool(
	toolId: string,
): Promise<{ id: string; isActive: boolean }> {
	return apiFetch(`/organizations/tools/${toolId}/toggle`, { method: "PATCH" });
}

// ─── API CONFIG ───────────────────────────────────────────────────────────────

export async function getApiConfig(): Promise<ApiConfig> {
	const data = await apiFetch<Record<string, unknown>>("/organizations/api-config");
	return data.id ? { ...data as ApiConfig, configured: true } : { configured: false };
}

export async function saveApiConfig(input: {
	baseUrl: string;
	authType: string;
	authValue: string;
	headerName?: string;
}): Promise<{ id: string; isVerified: boolean }> {
	return apiFetch("/organizations/api-config", {
		method: "POST",
		body: JSON.stringify(input),
	});
}

export async function verifyApiConfig(): Promise<{ isVerified: boolean; message: string }> {
	return apiFetch("/organizations/api-config/verify", { method: "POST" });
}