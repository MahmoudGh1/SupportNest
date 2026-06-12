import type { Response } from "express";

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export function parsePagination(query: { page?: string; limit?: string }) {
  const page = Math.max(1, parseInt(query.page ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "20", 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    },
  };
}

// ─── Error responses ──────────────────────────────────────────────────────────

export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
): void {
  const body: ApiError = { error: { code, message } };
  res.status(status).json(body);
}

export function notFound(res: Response, resource: string): void {
  sendError(
    res,
    404,
    `${resource.toUpperCase()}_NOT_FOUND`,
    `${resource} not found.`,
  );
}

export function forbidden(res: Response): void {
  sendError(
    res,
    403,
    "FORBIDDEN",
    "You do not have permission to perform this action.",
  );
}

export function badRequest(res: Response, message: string): void {
  sendError(res, 400, "BAD_REQUEST", message);
}

// ─── Date range helper ────────────────────────────────────────────────────────

export function parseDateRange(
  from?: string,
  to?: string,
): { gte?: Date; lte?: Date } {
  const filter: { gte?: Date; lte?: Date } = {};
  if (from) {
    const d = new Date(from);
    if (!isNaN(d.getTime())) filter.gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      filter.lte = d;
    }
  }
  return filter;
}

// ─── Safe average ─────────────────────────────────────────────────────────────

export function safeAvg(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

// ─── Round to 2 decimal places ────────────────────────────────────────────────

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
