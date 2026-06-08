import type { StringFilter } from "generated/prisma/commonInputTypes.js";
import type { KnowledgeDocumentType } from "generated/prisma/enums.js";

export interface QueryParams {
	title?: string;
	type?: KnowledgeDocumentType;
	createdById?: string;
	createdAt?: string;
	page?: string;
	limit?: string;
}

export interface FilterObject {
	title?: string | StringFilter;
	type?: KnowledgeDocumentType;
	createdById?: string;
	createdAt?: Date;
}
export function buildFilter(query: QueryParams) {
	const filter: FilterObject = {};

	if (query.title)
		filter.title = { contains: query.title, mode: "insensitive" };
	if (query.type) filter.type = query.type as KnowledgeDocumentType;
	if (query.createdById) filter.createdById = query.createdById;
	if (query.createdAt) {
		const date = new Date(query.createdAt);
		if (!isNaN(date.getTime())) {
			filter.createdAt = date;
		}
	}

	return filter;
}

export function buildPagination(query: QueryParams) {
	const page = Math.max(1, parseInt(query.page ?? "1", 10));
	const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "10", 10)));
	const skip = (page - 1) * limit;
	return { page, limit, skip };
}
