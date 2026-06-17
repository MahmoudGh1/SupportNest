import { parse } from "csv-parse/sync";

export async function extractRowsFromUrl(
	url: string,
): Promise<Record<string, string>[]> {
	const response = await fetch(url);
	const arrayBuffer = await response.arrayBuffer(); // generic binary representation
	const buffer = Buffer.from(arrayBuffer); // converts to Node's Buffer type

	const rows: Record<string, string>[] = parse(buffer, {
		columns: true,
		skip_empty_lines: true,
		trim: true,
	});
	/* 
  "Wireless Mouse,WM-220,25"
   into
    { "Product Name": "Wireless Mouse", "SKU": "WM-220", "Price": "25" }.
  */

	return rows;
}

export function rowToChunkText(row: Record<string, string>): string {
	return Object.entries(row)
		.map(([key, value]) => `${key}: ${value}`)
		.join(" | ");
	/*
    "Product Name: Wireless Mouse | Price: 25"
    */
}
