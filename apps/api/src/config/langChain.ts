import * as langChain from "@langchain/google-genai";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";
import "dotenv/config";
import { Embeddings } from "node_modules/@langchain/core/dist/embeddings.js";

export const checkpointer = PostgresSaver.fromConnString(
	process.env.DATABASE_URL!,
);

export const model = new langChain.ChatGoogleGenerativeAI({
	model: "gemini-2.5-flash",
	apiKey: process.env.GOOGLE_API_KEY!,
});

// pnpm add @langchain/openai @langchain/core @langchain/langgraph-checkpoint-postgres @langchain/google-genai @google/generative-ai
