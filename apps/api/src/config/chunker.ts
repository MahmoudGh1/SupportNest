import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
export async function chunkText(text: string): Promise<string[]> {
	const splitter = new RecursiveCharacterTextSplitter({
		chunkSize: 512,
		chunkOverlap: 50,
	});
	return splitter.splitText(text);
}
