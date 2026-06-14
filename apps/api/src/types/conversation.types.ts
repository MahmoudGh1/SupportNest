import type { Message } from "generated/prisma/client.js";
import type { RouterOutput } from "src/types/agent.types.js";

export interface processPipelineTurnInput {
	conversationId: string;
	organizationId: string;
	customerId: string;
	content: string;
}

export interface processPipelineTurnOutput {
	routerOutput: RouterOutput;
	aiMessage: Message;
}

export interface startConversationInput {
	organizationId: string;
	customerId: string;
	apiKeyId: string;
}
