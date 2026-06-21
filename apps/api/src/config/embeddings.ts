import { Embeddings } from "@langchain/core/embeddings";
import { GoogleGenAI } from "@google/genai";
import { OpenAIEmbeddings } from "@langchain/openai";

const AI_PROVIDER = (process.env.AI_PROVIDER ?? "google").toLowerCase();

if (AI_PROVIDER === "google" && !process.env.GOOGLE_API_KEY) {
	console.log("Something went wrong. Google API Key not found");
}
if (AI_PROVIDER === "openai" && !process.env.OPENAI_API_KEY) {
	console.log("Something went wrong. OpenAI API Key not found");
}

export class GeminiEmbeddingsWithDimensions extends Embeddings {
	private ai: GoogleGenAI;
	private outputDimensionality: number;
	private taskType: string;

	constructor(config: { apiKey: string; outputDimensionality: number; taskType?: string }) {
		super({});
		this.ai = new GoogleGenAI({ apiKey: config.apiKey });
		this.outputDimensionality = config.outputDimensionality;
		this.taskType = config.taskType ?? "RETRIEVAL_DOCUMENT";
	}

	async embedQuery(text: string): Promise<number[]> {
		const result = await this.ai.models.embedContent({
			model: "gemini-embedding-001",
			contents: text,
			config: {
				taskType: this.taskType,
				outputDimensionality: this.outputDimensionality,
			},
		});

		const values = result.embeddings?.[0]?.values;

		if (!values || values.length === 0) {
			throw new Error(`Gemini embedContent returned no embedding values for text: "${text.slice(0, 50)}..."`);
		}

		return values;
	}

	async embedDocuments(documents: string[]): Promise<number[][]> {
		return Promise.all(documents.map((doc) => this.embedQuery(doc)));
	}
}

export function createEmbeddings(
	config: {
		outputDimensionality?: number;
		taskType?: string;
	} = {},
): Embeddings {
	const outputDimensionality = config.outputDimensionality ?? 1536;

	if (AI_PROVIDER === "openai") {
		return new OpenAIEmbeddings({
			apiKey: process.env.OPENAI_API_KEY!,
			model: "text-embedding-3-small",
			dimensions: outputDimensionality,
		});
	}

	return new GeminiEmbeddingsWithDimensions({
		apiKey: process.env.GOOGLE_API_KEY!,
		outputDimensionality,
		taskType: config.taskType ?? "RETRIEVAL_DOCUMENT",
	});
}

export const embeddings = createEmbeddings({
	outputDimensionality: 1536,
	taskType: "RETRIEVAL_DOCUMENT",
});
