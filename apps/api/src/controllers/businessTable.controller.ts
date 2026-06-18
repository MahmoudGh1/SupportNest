import type { Response, RequestHandler } from "express";
import type { AuthenticatedRequest } from "src/types/auth.types.js";
import AppError from "src/utils/appError.js";
import asyncHandler from "src/utils/asyncHandler.js";
import { HttpMethod } from "generated/prisma/enums.js";
import { fetchPreviewService, saveTableService, listTablesService, getTableRowsService, updateRowService, deleteRowService, deleteTableService } from "src/services/businessTable.service.js";

const VALID_METHODS: HttpMethod[] = [HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH, HttpMethod.DELETE];

export const fetchPreviewController: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
	const organizationId = req.user?.organizationId;
	if (!organizationId) throw new AppError("Unauthorized", 401);

	const { endpoint, method = "GET", toolDefinitionId, body } = req.body;

	if (!endpoint || typeof endpoint !== "string") {
		throw new AppError("endpoint is required.", 400);
	}

	const normalizedMethod = String(method).toUpperCase() as HttpMethod;
	if (!VALID_METHODS.includes(normalizedMethod)) {
		throw new AppError(`method must be one of: ${VALID_METHODS.join(", ")}`, 400);
	}

	const result = await fetchPreviewService({
		organizationId,
		endpoint,
		method: normalizedMethod,
		toolDefinitionId,
		body,
	});

	res.status(200).json(result);
});

export const saveTableController: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
	const organizationId = req.user?.organizationId;
	if (!organizationId) throw new AppError("Unauthorized", 401);

	const { name, endpoint, method, toolDefinitionId, columnConfig, rows } = req.body;

	if (!name || typeof name !== "string" || name.trim().length === 0) {
		throw new AppError("name is required.", 400);
	}

	if (!endpoint || typeof endpoint !== "string") {
		throw new AppError("endpoint is required.", 400);
	}

	if (!method) {
		throw new AppError("method is required.", 400);
	}

	const normalizedMethod = String(method).toUpperCase() as HttpMethod;
	if (!VALID_METHODS.includes(normalizedMethod)) {
		throw new AppError(`method must be one of: ${VALID_METHODS.join(", ")}`, 400);
	}

	if (!Array.isArray(columnConfig) || columnConfig.length === 0) {
		throw new AppError("columnConfig is required and must be a non-empty array.", 400);
	}

	if (!Array.isArray(rows) || rows.length === 0) {
		throw new AppError("rows is required and must be a non-empty array.", 400);
	}

	const result = await saveTableService({
		organizationId,
		name: name.trim(),
		endpoint,
		method: normalizedMethod,
		toolDefinitionId,
		columnConfig,
		rows,
	});

	res.status(201).json(result);
});

export const listTablesController: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
	const organizationId = req.user?.organizationId;
	if (!organizationId) throw new AppError("Unauthorized", 401);

	const tables = await listTablesService(organizationId);

	res.status(200).json({ tables });
});

export const getTableRowsController: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
	const organizationId = req.user?.organizationId;
	if (!organizationId) throw new AppError("Unauthorized", 401);

	const { tableId } = req.params as { tableId: string };

	const page = Math.max(1, parseInt(req.query.page as string) || 1);
	const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));

	const result = await getTableRowsService(organizationId, tableId, page, limit);

	res.status(200).json(result);
});

export const updateRowController: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
	const organizationId = req.user?.organizationId;
	if (!organizationId) throw new AppError("Unauthorized", 401);

	const { tableId, rowId } = req.params as { tableId: string; rowId: string };
	const { rowData } = req.body;

	if (!rowData || typeof rowData !== "object" || Array.isArray(rowData)) {
		throw new AppError("rowData is required and must be a plain object.", 400);
	}

	if (Object.keys(rowData).length === 0) {
		throw new AppError("rowData must contain at least one field to update.", 400);
	}

	const result = await updateRowService({
		organizationId,
		tableId,
		rowId,
		rowData,
	});

	res.status(200).json(result);
});

export const deleteRowController: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
	const organizationId = req.user?.organizationId;
	if (!organizationId) throw new AppError("Unauthorized", 401);

	const { tableId, rowId } = req.params as { tableId: string; rowId: string };

	const result = await deleteRowService(organizationId, tableId, rowId);

	res.status(200).json(result);
});

export const deleteTableController: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
	const organizationId = req.user?.organizationId;
	if (!organizationId) throw new AppError("Unauthorized", 401);

	const { tableId } = req.params as { tableId: string };

	const result = await deleteTableService(organizationId, tableId);

	res.status(200).json(result);
});
