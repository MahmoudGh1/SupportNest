// ─── CONSTANTS ────────────────────────────────────────────────────────────────

import { T } from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.theme";
import {
	TicketPriority,
	TicketStatus,
} from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.types";

export function normalizeApiBaseUrl(rawBaseUrl?: string) {
	const fallback =
		process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
	const base = (rawBaseUrl ?? fallback).trim().replace(/\/+$/, "");
	return /\/api\/v1$/i.test(base) ? base : `${base}/api/v1`;
}

export const BASE_URL = normalizeApiBaseUrl(
	process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE,
);

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
	HIGH: "High",
	MEDIUM: "Medium",
	LOW: "Low",
};

// Priority badge styles use theme tokens directly (inline) instead of hardcoded Tailwind hex classes
export const PRIORITY_STYLES: Record<
	TicketPriority,
	{ bg: string; color: string; border: string }
> = {
	HIGH: {
		bg: "color-mix(in srgb, var(--color-danger, #E24B4A) 12%, transparent)",
		color: T.danger,
		border:
			"color-mix(in srgb, var(--color-danger, #E24B4A) 30%, transparent)",
	},
	MEDIUM: {
		bg: "color-mix(in srgb, #d97706 12%, transparent)",
		color: "#d97706",
		border: "color-mix(in srgb, #d97706 30%, transparent)",
	},
	LOW: {
		bg: "color-mix(in srgb, var(--color-success, #0F6E56) 12%, transparent)",
		color: T.success,
		border:
			"color-mix(in srgb, var(--color-success, #0F6E56) 30%, transparent)",
	},
};

export const STATUS_STYLES: Record<
	TicketStatus,
	{ bg: string; color: string }
> = {
	OPEN: { bg: T.brandFaint, color: T.brand },
	IN_PROGRESS: {
		bg: "color-mix(in srgb, #d97706 12%, transparent)",
		color: "#d97706",
	},
	RESOLVED: {
		bg: "color-mix(in srgb, var(--color-success, #0F6E56) 12%, transparent)",
		color: T.success,
	},
};

export const STATUS_LABEL: Record<TicketStatus, string> = {
	OPEN: "Open",
	IN_PROGRESS: "In Progress",
	RESOLVED: "Resolved",
};
