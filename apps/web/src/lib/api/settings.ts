import type { UserProfile, OrgProfile, UpdateProfileInput, UpdatePasswordInput } from "@/types/types";
import { apiFetch, normalizeUserProfile, normalizeOrgProfile } from "./client";

// ─── USER PROFILE ─────────────────────────────────────────────────────────────

export async function getUserProfile(): Promise<{ user: UserProfile }> {
	const data = await apiFetch<{ result: Record<string, unknown> }>("/users/me");
	return { user: normalizeUserProfile(data.result) };
}

export async function updateUserProfile(input: UpdateProfileInput): Promise<{ user: UserProfile }> {
	const data = await apiFetch<{ result: Record<string, unknown> }>("/users/me", {
		method: "PATCH",
		body: JSON.stringify({
			firstName: input.first_name,
			lastName: input.last_name,
			email: input.email,
		}),
	});
	return { user: normalizeUserProfile(data.result) };
}

export async function updatePassword(input: UpdatePasswordInput): Promise<{ success: boolean }> {
	await apiFetch("/users/me/password", {
		method: "PATCH",
		body: JSON.stringify({
			current_password: input.current_password,
			new_password: input.new_password,
		}),
	});
	return { success: true };
}

export async function deleteAccount(data: { fullName: string; orgName: string }): Promise<void> {
	await apiFetch("/users/me", {
		method: "DELETE",
		body: JSON.stringify(data),
	});
}

// ─── ORGANIZATION PROFILE ─────────────────────────────────────────────────────

export async function getOrgProfile(): Promise<{ organization: OrgProfile }> {
	const data = await apiFetch<Record<string, unknown>>("/organizations/me");
	return { organization: normalizeOrgProfile(data) };
}

export async function updateOrgProfile(input: { name: string; email: string }): Promise<{ organization: OrgProfile }> {
	if (!input.name.trim()) throw new Error("Organization name is required.");
	if (!input.email.trim()) throw new Error("Organization email is required.");
	const data = await apiFetch<Record<string, unknown>>("/organizations/me", {
		method: "PATCH",
		body: JSON.stringify({ name: input.name, email: input.email }),
	});
	return { organization: normalizeOrgProfile(data) };
}

export async function updateWidgetConfig(input: { title: string; greetingMessage: string; accentColor: string; placeholder: string }): Promise<{ organization: OrgProfile }> {
	const data = await apiFetch<Record<string, unknown>>("/organizations/widget-config", {
		method: "PATCH",
		body: JSON.stringify(input),
	});
	return { organization: normalizeOrgProfile(data) };
}
