import prisma from "src/config/prisma.js";
import AppError from "src/utils/appError.js";
import { HttpMethod } from "generated/prisma/enums.js";
import type { ColumnConfig, FetchPreviewInput, SaveTableInput, UpdateRowInput } from "src/types/businessTable.types.js";
import { buildAuthHeaders, detectColumns, getBaseUrl, validateRowAgainstSchema } from "src/utils/businessTable.utils.js";

export async function fetchPreviewService(input: FetchPreviewInput) {
	const { organizationId, endpoint, method, toolDefinitionId, body } = input;

	if (toolDefinitionId) {
		const tool = await prisma.toolDefinition.findUnique({
			where: { id: toolDefinitionId },
			select: { organizationId: true, path: true, method: true },
		});

		if (!tool || tool.organizationId !== organizationId) {
			throw new AppError("Tool not found.", 404);
		}
	}

	const [baseUrl, headers] = await Promise.all([getBaseUrl(organizationId), buildAuthHeaders(organizationId)]);

	const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
	const url = `${baseUrl}${normalizedEndpoint}`;

	let response: Response;
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 10000);

		response = await fetch(url, {
			method,
			headers,
			signal: controller.signal,
			...(body && method !== HttpMethod.GET ? { body: JSON.stringify(body) } : {}),
		});

		clearTimeout(timeout);
	} catch (err: any) {
		if (err.name === "AbortError") {
			throw new AppError("Request timed out after 10 seconds. Check that your API is reachable.", 408);
		}
		throw new AppError(`Could not reach your API: ${err.message}`, 502);
	}

	if (!response.ok) {
		throw new AppError(`Your API returned ${response.status}. Make sure the endpoint is correct and returns data.`, 400);
	}

	let data: any;
	try {
		data = await response.json();
	} catch {
		throw new AppError("Your API did not return valid JSON. Business Tables only supports JSON responses.", 400);
	}

	const rows: any[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : Array.isArray(data?.results) ? data.results : Array.isArray(data?.items) ? data.items : null;

	if (!rows) {
		throw new AppError("Could not detect a row array in the response. Expected the response (or a .data / .results / .items field) to be an array.", 400);
	}

	if (rows.length === 0) {
		throw new AppError("Your API returned an empty array. Add some data first then try again.", 400);
	}

	const columnConfig = detectColumns(rows);

	return {
		rows,
		columnConfig,
		totalRows: rows.length,
		endpoint: normalizedEndpoint,
		method,
	};
}

export async function saveTableService(input: SaveTableInput) {
	const { organizationId, name, endpoint, method, toolDefinitionId, columnConfig, rows } = input;

	const existing = await prisma.businessTable.findFirst({
		where: { organizationId, name },
		select: { id: true },
	});

	if (existing) {
		throw new AppError(`A table named "${name}" already exists. Please choose a different name.`, 409);
	}

	const table = await prisma.businessTable.create({
		data: {
			organizationId,
			name,
			endpoint,
			method,
			toolDefinitionId: toolDefinitionId ?? null,
			columnConfig: columnConfig as any,
			lastFetchedAt: new Date(),
		},
	});

	const ID_KEYS = ["id", "_id", "uuid", "ID"];

	await prisma.businessTableRow.createMany({
		data: rows.map((row) => {
			const externalIdKey = ID_KEYS.find((k) => row[k] !== undefined && row[k] !== null);
			const externalId = externalIdKey ? String(row[externalIdKey]) : null;

			return {
				tableId: table.id,
				organizationId,
				externalId,
				rowData: row,
			};
		}),
	});

	return {
		id: table.id,
		name: table.name,
		endpoint: table.endpoint,
		method: table.method,
		columnConfig: table.columnConfig,
		rowCount: rows.length,
		createdAt: table.createdAt,
	};
}

export async function listTablesService(organizationId: string) {
	const tables = await prisma.businessTable.findMany({
		where: { organizationId },
		orderBy: { createdAt: "asc" },
		select: {
			id: true,
			name: true,
			endpoint: true,
			method: true,
			columnConfig: true,
			lastFetchedAt: true,
			createdAt: true,
			toolDefinition: {
				select: { name: true, description: true },
			},
			_count: { select: { rows: true } },
		},
	});

	return tables.map((t) => ({
		...t,
		rowCount: t._count.rows,
		_count: undefined,
	}));
}

export async function getTableRowsService(organizationId: string, tableId: string, page: number = 1, limit: number = 50) {
	const table = await prisma.businessTable.findUnique({
		where: { id: tableId },
		select: { organizationId: true, columnConfig: true, name: true },
	});

	if (!table || table.organizationId !== organizationId) {
		throw new AppError("Table not found.", 404);
	}

	const [rows, total] = await Promise.all([
		prisma.businessTableRow.findMany({
			where: { tableId },
			orderBy: { createdAt: "asc" },
			skip: (page - 1) * limit,
			take: limit,
			select: {
				id: true,
				externalId: true,
				rowData: true,
				createdAt: true,
				updatedAt: true,
			},
		}),
		prisma.businessTableRow.count({ where: { tableId } }),
	]);

	return {
		tableName: table.name,
		columnConfig: table.columnConfig,
		rows,
		meta: {
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		},
	};
}

export async function updateRowService(input: UpdateRowInput) {
	const { organizationId, tableId, rowId, rowData } = input;

	const table = await prisma.businessTable.findUnique({
		where: { id: tableId },
		select: { organizationId: true, columnConfig: true },
	});

	if (!table || table.organizationId !== organizationId) {
		throw new AppError("Table not found.", 404);
	}

	const row = await prisma.businessTableRow.findUnique({
		where: { id: rowId },
		select: { tableId: true },
	});

	if (!row || row.tableId !== tableId) {
		throw new AppError("Row not found.", 404);
	}

	const columnConfig = table.columnConfig as unknown as ColumnConfig[];
	validateRowAgainstSchema(rowData, columnConfig);

	const updated = await prisma.businessTableRow.update({
		where: { id: rowId },
		data: {
			rowData: {
				...(row as any).rowData,
				...rowData,
			},
		},
		select: {
			id: true,
			externalId: true,
			rowData: true,
			updatedAt: true,
		},
	});

	return updated;
}

export async function deleteRowService(organizationId: string, tableId: string, rowId: string) {
	const table = await prisma.businessTable.findUnique({
		where: { id: tableId },
		select: { organizationId: true },
	});

	if (!table || table.organizationId !== organizationId) {
		throw new AppError("Table not found.", 404);
	}

	const row = await prisma.businessTableRow.findUnique({
		where: { id: rowId },
		select: { tableId: true },
	});

	if (!row || row.tableId !== tableId) {
		throw new AppError("Row not found.", 404);
	}

	await prisma.businessTableRow.delete({ where: { id: rowId } });

	return { deleted: true };
}

export async function deleteTableService(organizationId: string, tableId: string) {
	const table = await prisma.businessTable.findUnique({
		where: { id: tableId },
		select: { organizationId: true },
	});

	if (!table || table.organizationId !== organizationId) {
		throw new AppError("Table not found.", 404);
	}

	await prisma.businessTable.delete({ where: { id: tableId } });

	return { deleted: true };
}

export async function deleteExpiredTablesService() {
	const threeMonthsAgo = new Date();
	threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

	const lapsedOrgs = await prisma.organization.findMany({
		where: {
			isActive: true,
			payments: {
				none: {
					billingPeriodEnd: { gte: threeMonthsAgo },
					status: "SUCCEEDED",
				},
			},
			businessTables: { some: {} },
		},
		select: { id: true },
	});

	if (lapsedOrgs.length === 0) return { deleted: 0 };

	const orgIds = lapsedOrgs.map((o) => o.id);

	const { count } = await prisma.businessTable.deleteMany({
		where: { organizationId: { in: orgIds } },
	});

	console.log(`[TableCleanup] Deleted ${count} tables from ${orgIds.length} lapsed orgs.`);

	return { deleted: count };
}
