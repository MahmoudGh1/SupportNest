export interface AssignedTo {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
}

export interface Ticket {
	id: string;
	conversationId: string;
	organizationId: string;
	assignedToId: string | null;
	assignedTo: AssignedTo | null;
	status: TicketStatus;
	priority: TicketPriority;
	resolutionNote: string | null;
	resolvedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface Message {
	id: string;
	conversationId: string;
	role: "customer" | "ai" | "human_agent";
	content: string;
	tier: "tier1" | "tier2" | null;
	createdAt: string;
}

export interface Meta {
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export type AgentLite = {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
};

export type TicketDetail = {
	id: string;
	status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
	priority: "LOW" | "MEDIUM" | "HIGH";
	resolutionNote: string | null;
	resolvedAt: string | null;
	agentAttempts: number;
	createdAt: string;
	updatedAt: string;
	assignedTo: AgentLite | null;
};

export type ConversationLite = {
	id: string;
	conversationStatus: "ACTIVE" | "ESCALATED" | "CLOSED";
	closedAt: string | null;
	createdAt: string;
};

export type CustomerLite = {
	id: string;
	externalId: string | null;
	email: string | null;
	name: string | null;
	isAnonymous: boolean;
	metadata: Record<string, unknown>;
};

export type MessageLite = {
	id: string;
	role: "CUSTOMER" | "AI" | "HUMAN_AGENT";
	content: string;
	tier: "TIER0" | "TIER1" | "TIER2" | null;
	createdAt: string;
};

export type ReportLite = {
	summary: string;
	issueType: string;
	resolution: string;
	language: string;
	sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
	tiersVisited: ("ROUTER" | "TIER0" | "TIER1" | "TIER2")[];
	wasEscalated: boolean;
	resolvedByAi: boolean;
	tokensUsed: number;
} | null;

export type TicketContext = {
	ticket: TicketDetail;
	conversation: ConversationLite;
	customer: CustomerLite;
	messages: MessageLite[];
	report: ReportLite;
};

export type ApiEnvelope<T> = {
	success: boolean;
	message: string;
	data: T;
};

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH";
export type ConversationStatus = "ACTIVE" | "ESCALATED" | "CLOSED";
export type MessageRole = "CUSTOMER" | "AI" | "HUMAN_AGENT";
export type MessageTier = "TIER0" | "TIER1" | "TIER2";
export type AgentTier = "ROUTER" | "TIER0" | "TIER1" | "TIER2";

export interface TicketDetailResponse {
	ticket: {
		id: string;
		status: TicketStatus;
		priority: TicketPriority;
		resolutionNote: string | null;
		resolvedAt: string | null;
		agentAttempts: number;
		createdAt: string;
		updatedAt: string;
		assignedTo: {
			id: string;
			firstName: string;
			lastName: string;
			email: string;
		} | null;
	};
	conversation: {
		id: string;
		conversationStatus: ConversationStatus;
		closedAt: string | null;
		createdAt: string;
	};
	customer: {
		id: string;
		externalId: string | null;
		email: string | null;
		name: string | null;
		isAnonymous: boolean;
		metadata: Record<string, unknown>;
	};
	messages: {
		id: string;
		role: MessageRole;
		content: string;
		tier: MessageTier | null;
		createdAt: string;
	}[];
	report: {
		summary: string;
		issueType: string;
		resolution: string;
		language: string;
		sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
		tiersVisited: AgentTier[];
		wasEscalated: boolean;
		resolvedByAi: boolean;
		tokensUsed: number;
		createdAt: string;
	} | null;
}
