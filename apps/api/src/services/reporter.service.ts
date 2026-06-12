import prisma from "src/config/prisma.js";
import { model } from "src/config/langChain.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentTier } from "generated/prisma/enums.js";
import type { MemoryMessage } from "src/utils/conversationMemory.utils.js";

interface ReporterInput {
	conversationId: string;
	organizationId: string;
	conversationHistory: MemoryMessage[];
	tiersVisited: AgentTier[];
	wasEscalated: boolean;
	resolvedByAi: boolean;
	tokensUsed: number;
}

interface ReportData {
	summary: string;
	issueType: string;
	resolution: string;
	language: string;
	sentiment: "positive" | "neutral" | "negative";
}

export async function createReport(input: ReporterInput): Promise<void> {
	const { conversationId, organizationId, conversationHistory, tiersVisited, wasEscalated, resolvedByAi, tokensUsed } = input;

	if (!conversationHistory || conversationHistory.length === 0) {
		console.log("[Reporter] No history to report for conversation:", conversationId);
		return;
	}

	const reportData = await generateReportData(conversationHistory);

	await prisma.report.create({
		data: {
			organizationId,
			conversationId,
			summary: reportData.summary,
			issueType: reportData.issueType,
			resolution: reportData.resolution,
			language: reportData.language,
			sentiment: reportData.sentiment,
			tiersVisited,
			wasEscalated,
			resolvedByAi,
			tokensUsed,
		},
	});

	console.log("[Reporter] Report created for conversation:", conversationId);
}

async function generateReportData(conversationHistory: MemoryMessage[]): Promise<ReportData> {
	const formattedConversation = conversationHistory.map((msg) => `${msg.role === "customer" ? "Customer" : "Agent"}: ${msg.content}`).join("\n");

	const response = await model.invoke([
		new SystemMessage(`
        You are a support conversation analyst. 
        Analyze the provided customer support conversation and return a structured JSON report.

        Return ONLY a JSON object, no markdown, no code fences:
        {
            "summary": "2-3 sentence summary of what the customer needed and what happened",
            "issueType": "one of: product_inquiry, order_issue, account_issue, complaint, technical_issue, billing_issue, general_inquiry, other",
            "resolution": "what was resolved or suggested to the customer in one sentence",
            "language": "the language the customer wrote in e.g. English, Arabic, French",
            "sentiment": "one of: positive, neutral, negative — based on overall customer tone"
        }
    `),
		new HumanMessage(`Analyze this support conversation:\n\n${formattedConversation}`),
	]);

	const raw = typeof response.content === "string" ? response.content : (response.content[0] as { text: string }).text;

	let parsed: ReportData;
	try {
		const cleaned = raw.replace(/```json|```/g, "").trim();
		parsed = JSON.parse(cleaned);
	} catch {
		console.error("[Reporter] Failed to parse report data:", raw);
		parsed = {
			summary: "Conversation could not be automatically summarized.",
			issueType: "other",
			resolution: "Unknown",
			language: "Unknown",
			sentiment: "neutral",
		};
	}

	return parsed;
}
