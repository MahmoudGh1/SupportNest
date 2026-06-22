// import * as googleLC from "@langchain/google-genai";
// import { ChatOpenAI } from "@langchain/openai";
// import { BaseChatModel } from "@langchain/core/language_models/chat_models";
// import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
// import { TaskType } from "@google/generative-ai";
// import dotenv from "dotenv";
// import { createEmbeddings } from "./embeddings.js";
// import AppError from "src/utils/appError.js";

// dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

// const AI_PROVIDER = (process.env.AI_PROVIDER ?? "google").toLowerCase(); // "google" | "openai"

// const database_url = process.env.DATABASE_URL;
// if (!database_url) throw new AppError("DATABASE_URL is not set");

// export const checkpointer = PostgresSaver.fromConnString(database_url);

// // ---- Embeddings ----
// export const documentEmbeddings = createEmbeddings({
// 	outputDimensionality: 1536,
// 	taskType: TaskType.RETRIEVAL_DOCUMENT,
// });

// export const queryEmbeddings = createEmbeddings({
// 	outputDimensionality: 1536,
// 	taskType: TaskType.RETRIEVAL_QUERY,
// });

// // ---- Chat models ----
// function createChatModel(): BaseChatModel {
// 	if (AI_PROVIDER === "openai") {
// 		const apiKey = process.env.OPENAI_API_KEY;
// 		if (!apiKey) throw new AppError("OPENAI_API_KEY is not set");

// 		return new ChatOpenAI({
// 			model: "gpt-4o-mini",
// 			apiKey,
// 		}) as unknown as BaseChatModel;
// 	}

// 	const apiKey = process.env.GOOGLE_API_KEY;
// 	if (!apiKey) throw new AppError("GOOGLE_API_KEY is not set");

// 	return new googleLC.ChatGoogleGenerativeAI({
// 		model: "gemini-2.5-flash",
// 		apiKey,
// 	}) as unknown as BaseChatModel;
// }

// export const fastModel = createChatModel();
// export const model = createChatModel();

// // pnpm add @langchain/openai @langchain/core @langchain/langgraph-checkpoint-postgres @langchain/google-genai @google/genai @google/generative-ai



import * as googleLC from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { TaskType } from "@google/generative-ai";
import dotenv from "dotenv";
import { createEmbeddings } from "./embeddings.js";
import AppError from "src/utils/appError.js";

dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

const AI_PROVIDER = (process.env.AI_PROVIDER ?? "google").toLowerCase(); // "google" | "openai"

const database_url = process.env.DATABASE_URL;
if (!database_url) throw new AppError("DATABASE_URL is not set");

export const checkpointer = PostgresSaver.fromConnString(database_url);

// ---- Embeddings ----
export const documentEmbeddings = createEmbeddings({
	outputDimensionality: 1536,
	taskType: TaskType.RETRIEVAL_DOCUMENT,
});

export const queryEmbeddings = createEmbeddings({
	outputDimensionality: 1536,
	taskType: TaskType.RETRIEVAL_QUERY,
});


type ChatModelRole = "router" | "tier0" | "tier1" | "tier2";

const GOOGLE_MODEL_NAME = "gemini-3.1-flash-lite";
const OPENAI_MODEL_NAME = "gpt-4o-mini";

function resolveGoogleApiKey(role: ChatModelRole): string {
	const roleKeyMap: Record<ChatModelRole, string | undefined> = {
		router: process.env.GOOGLE_API_KEY_ROUTER,
		tier0: process.env.GOOGLE_API_KEY_TIER0,
		tier1: process.env.GOOGLE_API_KEY_TIER1,
		tier2: process.env.GOOGLE_API_KEY_TIER2,
	};

	const apiKey = roleKeyMap[role] ?? process.env.GOOGLE_API_KEY;

	if (!apiKey) {
		throw new AppError(`No Google API key configured for "${role}" (expected GOOGLE_API_KEY_${role.toUpperCase()} or fallback GOOGLE_API_KEY)`);
	}

	return apiKey;
}

function createChatModel(role: ChatModelRole): BaseChatModel {
	if (AI_PROVIDER === "openai") {
		const apiKey = process.env.OPENAI_API_KEY;
		if (!apiKey) throw new AppError("OPENAI_API_KEY is not set");

		return new ChatOpenAI({
			model: OPENAI_MODEL_NAME,
			apiKey,
		}) as unknown as BaseChatModel;
	}

	const apiKey = resolveGoogleApiKey(role);

	return new googleLC.ChatGoogleGenerativeAI({
		model: GOOGLE_MODEL_NAME,
		apiKey,
	}) as unknown as BaseChatModel;
}

// Router (routing + review-loop LLM calls)
export const fastModel = createChatModel("router");

// Tier-specific models — each backed by its own API key/quota.
export const tier0Model = createChatModel("tier0");
export const tier1Model = createChatModel("tier1");
export const tier2Model = createChatModel("tier2");

export const model = tier0Model;

