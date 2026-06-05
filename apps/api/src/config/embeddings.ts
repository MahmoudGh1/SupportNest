import { Embeddings } from "@langchain/core/embeddings";
import { TaskType } from "@google/generative-ai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiEmbeddingsWithDimensions extends Embeddings {
	private model: any;
	private outputDimensionality: number;
	private taskType: TaskType;

	constructor(config: {
		apiKey: string;
		outputDimensionality: number;
		taskType?: TaskType;
	}) {
		super({});
		const genAI = new GoogleGenerativeAI(config.apiKey);
		this.model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
		this.outputDimensionality = config.outputDimensionality;
		this.taskType = config.taskType ?? TaskType.RETRIEVAL_DOCUMENT;
	}
	async embedQuery(text: string): Promise<number[]> {
		const result = await this.model.embedContent({
			content: { parts: [{ text }], role: "user" },
			taskType: this.taskType,
			outputDimensionality: this.outputDimensionality,
		});
		return result.embedding.values;
	}

	async embedDocuments(documents: string[]): Promise<number[][]> {
		return Promise.all(documents.map((doc) => this.embedQuery(doc)));
	}
}

export const embeddings = new GeminiEmbeddingsWithDimensions({
	apiKey: process.env.GOOGLE_API_KEY!,
	outputDimensionality: 1536,
	taskType: TaskType.RETRIEVAL_DOCUMENT,
});
