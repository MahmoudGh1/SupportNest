import type { HttpMethod } from "generated/prisma/enums.js";

export interface ColumnConfig {
	key: string;
	type: "string" | "number" | "boolean" | "object" | "array" | "null";
}

export interface FetchPreviewInput {
	organizationId: string;
	endpoint: string;
	method: HttpMethod;
	toolDefinitionId?: string;
	body?: Record<string, any>;
}

export interface SaveTableInput {
	organizationId: string;
	name: string;
	endpoint: string;
	method: HttpMethod;
	toolDefinitionId?: string;
	columnConfig: ColumnConfig[];
	rows: any[];
}

export interface UpdateRowInput {
	organizationId: string;
	tableId: string;
	rowId: string;
	rowData: Record<string, any>;
}
