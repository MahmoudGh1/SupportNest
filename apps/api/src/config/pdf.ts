import { PDFParse } from "pdf-parse";

export async function extractTextFromPdfUrl(url: string): Promise<string> {
	const response = await fetch(url);
	const arrayBuffer = await response.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	const parser = new PDFParse({ data: buffer });

	const result = await parser.getText();

	return result.text;
}
