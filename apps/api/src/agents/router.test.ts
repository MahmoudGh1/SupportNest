import { runRouter } from "./router.agent.js";
import type { PipelineContext } from "../types/agent.types.js";

async function test() {
	const context: PipelineContext = {
		conversationId: "66378af2-6f83-444f-907a-b0d39cb15563", // put a real one from your DB
		organizationId: "e11a17f2-dd8f-4a43-b515-9537c799ce47", // put a real one from your DB
		latestMessage: "Can I modify or cancel my order after it has been placed?",
		conversationHistory: [],
	};

	console.log("Running router...");
	const result = await runRouter(context);
	console.log("Router output:", JSON.stringify(result, null, 2));
}

test().catch(console.error);
