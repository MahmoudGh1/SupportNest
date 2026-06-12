import { runRouter } from "./router.agent.js";
import type { PipelineContext } from "../types/agent.types.js";

async function test() {
	const context: PipelineContext = {
		conversationId: "01d6c5da-c2c2-48f6-a937-18d368f38e92", // put a real one from your DB
		organizationId: "85d6389a-bc26-4e1c-8c05-68f8b61d8241", // put a real one from your DB
		latestMessage: "can i ask about how can i cancel an order?",
		conversationHistory: [],
	};

	console.log("Running router...");
	const result = await runRouter(context);
	console.log("Router output:", JSON.stringify(result, null, 2));
}

test().catch(console.error);
