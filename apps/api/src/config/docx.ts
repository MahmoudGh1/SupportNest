import mammoth from "mammoth";

export async function extractTextFromDocxUrl(url: string): Promise<string> {
	console.log(url);
	const response = await fetch(url);

	const arrayBuffer = await response.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	const result = await mammoth.extractRawText({
		buffer,
	});

	return result.value;
}
