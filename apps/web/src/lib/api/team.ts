import { apiFetch } from "./client";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface TeamMember {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	role: string;
	isActive: boolean;
	createdAt: string;
}

export interface PendingInvitation {
	id: string;
	email: string;
	role: string;
	status: string;
	createdAt: string;
	expiresAt: string;
	invitedBy: { firstName: string; lastName: string };
}

export interface TeamResponse {
	members: TeamMember[];
	pendingInvitations: PendingInvitation[];
}

export interface InvitationDetails {
	email: string;
	orgName: string;
	role: string;
}

// ─── TEAM ─────────────────────────────────────────────────────────────────────

export async function getTeam(): Promise<TeamResponse> {
	return apiFetch<TeamResponse>("/invitations/team");
}

export async function sendInvitation(email: string): Promise<void> {
	await apiFetch("/invitations/invite", {
		method: "POST",
		body: JSON.stringify({ email }),
	});
}

export async function revokeInvitation(id: string): Promise<void> {
	await apiFetch(`/invitations/invitations/${id}`, { method: "DELETE" });
}

export async function validateInvitation(token: string): Promise<InvitationDetails> {
	return apiFetch<InvitationDetails>(`/invitations/accept/${token}`);
}

export async function acceptInvitation(token: string, firstName: string, lastName: string, password: string): Promise<{ message: string; email: string }> {
	return apiFetch(`/invitations/accept/${token}`, {
		method: "POST",
		body: JSON.stringify({ firstName, lastName, password }),
	});
}
