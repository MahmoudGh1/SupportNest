import { BASE_URL } from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.constants";
import {
	AgentLite,
	ApiEnvelope,
	Message,
	Meta,
	Ticket,
	TicketContext,
	TicketDetail,
	TicketStatus,
} from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.types";

// ─── API CALLS ────────────────────────────────────────────────────────────────
export async function apiGetTickets(filters?: {
	status?: TicketStatus;
	page?: number;
	limit?: number;
}): Promise<{ tickets: Ticket[]; meta: Meta }> {
	const qs = new URLSearchParams();
	if (filters?.status) qs.set("status", filters.status);
	if (filters?.page) qs.set("page", String(filters.page));
	qs.set("limit", String(filters?.limit ?? 50));
	const res = await fetch(`${BASE_URL}/tickets?${qs}`, {
		credentials: "include",
	});
	const json = await res.json();
	if (!res.ok) throw new Error(json.message ?? "Failed to fetch tickets");
	return json.data;
}

export async function apiGetMessages(
	conversationId: string,
): Promise<Message[]> {
	const res = await fetch(
		`${BASE_URL}/widget/conversations/${conversationId}/messages`,
		{
			credentials: "include",
		},
	);
	const json = await res.json();
	if (!res.ok) throw new Error(json.message ?? "Failed to fetch messages");
	return json.data?.messages ?? json.data ?? [];
}

export async function apiStart(id: string): Promise<Ticket> {
	const res = await fetch(`${BASE_URL}/tickets/${id}/start`, {
		method: "PATCH",
		credentials: "include",
	});
	const json = await res.json();
	if (!res.ok) throw new Error(json.message ?? "Failed");
	return json.data?.ticket ?? json.data;
}

export async function apiResolve(id: string, note: string): Promise<Ticket> {
	const res = await fetch(`${BASE_URL}/tickets/${id}/resolve`, {
		method: "PATCH",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ resolutionNote: note }),
	});
	const json = await res.json();
	if (!res.ok) throw new Error(json.message ?? "Failed");
	return json.data?.ticket ?? json.data;
}

export async function getTicketById(ticketId: string): Promise<TicketContext> {
	const res = await fetch(`${BASE_URL}/tickets/${ticketId}`, {
		method: "GET",
		credentials: "include", // sends the httpOnly JWT cookie
		headers: { "Content-Type": "application/json" },
	});

	if (!res.ok) {
		const body = await res.json().catch(() => null);
		throw new Error(body?.message ?? `Failed to fetch ticket (${res.status})`);
	}

	const json: ApiEnvelope<TicketContext> = await res.json();
	return json.data;
}

export async function getAssignableAgents(): Promise<AgentLite[]> {
	const res = await fetch(`${BASE_URL}/users/agents`, {
		method: "GET",
		credentials: "include",
	});
	if (!res.ok) throw new Error("Failed to fetch agents");
	const json: ApiEnvelope<{ agents: AgentLite[] }> = await res.json();
	return json.data.agents;
}

export type UpdateTicketInput = {
	status?: TicketDetail["status"];
	priority?: TicketDetail["priority"];
	assignedToId?: string | null;
	resolutionNote?: string;
};

export async function updateTicket(
	ticketId: string,
	input: UpdateTicketInput,
): Promise<TicketDetail> {
	console.log(input);
	const res = await fetch(`${BASE_URL}/tickets/${ticketId}`, {
		method: "PATCH",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	if (!res.ok) {
		const body = await res.json().catch(() => null);
		throw new Error(
			body?.message ?? `Failed to update ticket (${res.status})`,
		);
	}
	const json: ApiEnvelope<{ ticket: TicketDetail }> = await res.json();
	return json.data.ticket;
}

export type TicketSummary = {
	id: string;
	status: TicketDetail["status"];
	priority: TicketDetail["priority"];
	resolvedAt: string | null;
	createdAt: string;
	updatedAt: string;
	assignedTo: AgentLite | null;
	conversation: {
		id: string;
		conversationStatus: "ACTIVE" | "ESCALATED" | "CLOSED";
		customer: {
			id: string;
			name: string | null;
			email: string | null;
			isAnonymous: boolean;
		};
		messages: { content: string }[]; // 0 or 1 item — the first customer message
	};
};

export type TicketCounts = {
	all: number;
	open: number;
	in_progress: number;
	resolved: number;
	mine: number;
	unassigned: number;
};

export type TicketListFilters = {
	status?: TicketDetail["status"];
	priority?: TicketDetail["priority"];
	assignedToId?: string; // pass "unassigned" as the sentinel value
	page?: number;
	limit?: number;
};

export async function getTickets(
	filters: TicketListFilters = {},
	signal?: AbortSignal,
): Promise<{
	tickets: TicketSummary[];
	meta: { total: number; page: number; limit: number; totalPages: number };
}> {
	const params = new URLSearchParams();
	if (filters.status) params.set("status", filters.status);
	if (filters.priority) params.set("priority", filters.priority);
	if (filters.assignedToId) params.set("assignedToId", filters.assignedToId);
	if (filters.page) params.set("page", String(filters.page));
	if (filters.limit) params.set("limit", String(filters.limit));

	const res = await fetch(`${BASE_URL}/tickets?${params.toString()}`, {
		method: "GET",
		credentials: "include",
		signal,
	});

	if (!res.ok) {
		const body = await res.json().catch(() => null);
		throw new Error(
			body?.message ?? `Failed to fetch tickets (${res.status})`,
		);
	}

	const json: ApiEnvelope<{
		tickets: TicketSummary[];
		meta: { total: number; page: number; limit: number; totalPages: number };
	}> = await res.json();
	return json.data;
}

export async function getTicketCounts(
	signal?: AbortSignal,
): Promise<TicketCounts> {
	const res = await fetch(`${BASE_URL}/tickets/counts`, {
		method: "GET",
		credentials: "include",
		signal,
	});

	if (!res.ok)
		throw new Error(`Failed to fetch ticket counts (${res.status})`);

	const json: ApiEnvelope<TicketCounts> = await res.json();
	return json.data;
}
