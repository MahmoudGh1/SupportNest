import * as langChain from "@langchain/google-genai";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import "dotenv/config"

export const checkpointer = PostgresSaver.fromConnString(process.env.DATABASE_URL!);


export const model = new langChain.ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GOOGLE_API_KEY!
});

export const embeddings = new langChain.GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-001",
    apiKey: process.env.openai_api_key!,
    taskType: TaskType.RETRIEVAL_DOCUMENT
});


// pnpm add @langchain/openai @langchain/core @langchain/langgraph-checkpoint-postgres @langchain/google-genai @google/generative-ai 