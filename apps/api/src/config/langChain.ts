import * as langChain from "@langchain/google-genai";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { TaskType } from "@google/generative-ai";
import "dotenv/config";
import { embeddings, GeminiEmbeddingsWithDimensions } from "./embeddings.js";
import AppError from "src/utils/appError.js";

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) throw new AppError("GOOGLE_API_KEY is not set");

const database_url = process.env.DATABASE_URL;
if (!database_url) throw new AppError("DATABASE_URL is not set");

export const checkpointer = PostgresSaver.fromConnString(database_url);

export const documentEmbeddings = new GeminiEmbeddingsWithDimensions({
	apiKey: apiKey,
	outputDimensionality: 1536,
	taskType: TaskType.RETRIEVAL_DOCUMENT,
});

export const queryEmbeddings = new GeminiEmbeddingsWithDimensions({
	apiKey: apiKey,
	outputDimensionality: 1536,
	taskType: TaskType.RETRIEVAL_QUERY,
});

export const fastModel = new langChain.ChatGoogleGenerativeAI({
	model: "gemini-2.5-flash-lite",
	apiKey: apiKey,
	// maxOutputTokens: 500,
});

export const model = new langChain.ChatGoogleGenerativeAI({
	model: "gemini-2.5-flash-lite",
	apiKey: apiKey,
});

// pnpm add @langchain/openai @langchain/core @langchain/langgraph-checkpoint-postgres @langchain/google-genai @google/genai
