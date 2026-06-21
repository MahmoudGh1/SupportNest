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

// ---- Chat models ----
function createChatModel(): BaseChatModel {
	if (AI_PROVIDER === "openai") {
		const apiKey = process.env.OPENAI_API_KEY;
		if (!apiKey) throw new AppError("OPENAI_API_KEY is not set");

		return new ChatOpenAI({
			model: "gpt-4o-mini",
			apiKey,
		}) as unknown as BaseChatModel;
	}

	const apiKey = process.env.GOOGLE_API_KEY;
	if (!apiKey) throw new AppError("GOOGLE_API_KEY is not set");

	return new googleLC.ChatGoogleGenerativeAI({
		model: "gemini-2.5-flash",
		apiKey,
	}) as unknown as BaseChatModel;
}

export const fastModel = createChatModel();
export const model = createChatModel();

// pnpm add @langchain/openai @langchain/core @langchain/langgraph-checkpoint-postgres @langchain/google-genai @google/genai @google/generative-ai
