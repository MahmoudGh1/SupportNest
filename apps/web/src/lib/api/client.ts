// "use server";
// import { getSession } from "@/lib/auth";
// import { cookies } from "next/headers";

// // ─── BASE URL ─────────────────────────────────────────────────────────────────

// function normalizeApiBaseUrl(rawBaseUrl?: string) {
// 	console.log(rawBaseUrl);
// 	const fallback =
// 		process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
// 	const base = (rawBaseUrl ?? fallback).trim().replace(/\/+$/, "");
// 	if (base.startsWith("/")) {
// 		return /\/api\/v1$/i.test(base) ? base : `${base}/api/v1`;
// 	}
// 	return /\/api\/v1$/i.test(base) ? base : `${base}/api/v1`;
// }

// export const BASE_URL = normalizeApiBaseUrl();

// // ─── CORE FETCHERS ────────────────────────────────────────────────────────────

// export async function apiFetch<T>(
//   path: string,
//   init?: RequestInit,
// ): Promise<T> {
//   const isServer = typeof window === "undefined";

//   const cookieHeader = isServer
//     ? (await cookies()).toString() // serializes all cookies as "key=value; key2=value2"
//     : undefined;

//   const response = await fetch(`${BASE_URL}${path}`, {
//     ...init,
//     credentials: "include",
//     headers: {
//       "Content-Type": "application/json",
//       ...(cookieHeader ? { Cookie: cookieHeader } : {}),
//       ...init?.headers,
//     },
//   });
//   const data = await response.json().catch(() => ({}));
//   if (!response.ok) {
//     throw new Error(data?.error ?? data?.message ?? "Request failed");
//   }
//   return data as T;
// }

// export async function adminFetch<T>(
//   path: string,
//   init?: RequestInit,
// ): Promise<T> {
//   const session = getSession();
//   const response = await fetch(`${BASE_URL}/admindashboard${path}`, {
//     ...init,
//     credentials: "include",
//     headers: {
//       "Content-Type": "application/json",
//       ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
//       ...init?.headers,
//     },
//   });
//   const data = await response.json().catch(() => ({}));
//   if (!response.ok) {
//     throw new Error(
//       data?.error?.message ?? data?.message ?? "Admin request failed",
//     );
//   }
//   return data as T;
// }

// export async function getErrorMessage(error: unknown): Promise<string> {
// 	return error instanceof Error ? error.message : "Unexpected error";
// }


import { getSession } from "@/lib/auth";
import type { ApiKey, OrgProfile, UserProfile } from "@/types/types";

// import { cookies } from "next/headers";

// ─── BASE URL ─────────────────────────────────────────────────────────────────

function normalizeApiBaseUrl(rawBaseUrl?: string) {
	console.log(rawBaseUrl);
	const fallback =
		process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
	const base = (rawBaseUrl ?? fallback).trim().replace(/\/+$/, "");
	if (base.startsWith("/")) {
		return /\/api\/v1$/i.test(base) ? base : `${base}/api/v1`;
	}
	return /\/api\/v1$/i.test(base) ? base : `${base}/api/v1`;
}

export const BASE_URL = normalizeApiBaseUrl();

// ─── CORE FETCHERS ────────────────────────────────────────────────────────────

export async function apiFetch<T>(
	path: string,
	init?: RequestInit,
): Promise<T> {
	const isServer = typeof window === "undefined";

	const cookieHeader = isServer
		? (await cookies()).toString() // serializes all cookies as "key=value; key2=value2"
		: undefined;

	const response = await fetch(`${BASE_URL}${path}`, {
		...init,
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...(cookieHeader ? { Cookie: cookieHeader } : {}),
			...init?.headers,
		},
	});
	const data = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(data?.error ?? data?.message ?? "Request failed");
	}
	return data as T;
}

export async function adminFetch<T>(
	path: string,
	init?: RequestInit,
): Promise<T> {
	const session = getSession();
	const response = await fetch(`${BASE_URL}/admindashboard${path}`, {
		...init,
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
			...init?.headers,
		},
	});
	const data = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(
			data?.error?.message ?? data?.message ?? "Admin request failed",
		);
	}
	return data as T;
}

// ─── NORMALIZERS ─────────────────────────────────────────────────────────────

type ApiRecord = Record<string, unknown>;

export function normalizeUserProfile(input: ApiRecord): UserProfile {
	return {
		id: String(input.id ?? ""),
		email: String(input.email ?? ""),
		first_name: String(input.first_name ?? input.firstName ?? ""),
		last_name: String(input.last_name ?? input.lastName ?? ""),
		role: String(
			input.role ?? "org_admin",
		).toLowerCase() as UserProfile["role"],
		organization_id: String(
			input.organization_id ?? input.organizationId ?? "",
		),
		is_active: Boolean(input.is_active ?? input.isActive ?? true),
		created_at: String(input.created_at ?? input.createdAt ?? ""),
	};
}

export function normalizeOrgProfile(input: ApiRecord): OrgProfile {
	const widget = (input.widget_config ??
		input.widgetConfig ??
		{}) as ApiRecord;
	return {
		id: String(input.id ?? ""),
		name: String(input.name ?? ""),
		slug: String(input.slug ?? ""),
		email: String(input.email ?? ""),
		widget_config: {
			color: String(widget.color ?? widget.accentColor ?? "#534AB7"),
			greeting: String(
				widget.greeting ?? widget.greetingMessage ?? "Hi! How can we help?",
			),
			title: String(widget.title ?? "Support"),
			position:
				(widget.position as OrgProfile["widget_config"]["position"]) ??
				"bottom-right",
		},
		plan_id: String(input.plan_id ?? input.planId ?? ""),
		is_active: Boolean(input.is_active ?? input.isActive ?? true),
		created_at: String(input.created_at ?? input.createdAt ?? ""),
		updated_at: String(input.updated_at ?? input.updatedAt ?? ""),
	};
}

export function normalizeApiKey(input: ApiRecord): ApiKey {
	return {
		id: String(input.id ?? ""),
		name: String(input.name ?? "Default"),
		key_prefix: String(input.key_prefix ?? input.keyPrefix ?? ""),
		allowed_origins: Array.isArray(
			input.allowed_origins ?? input.allowedOrigins,
		)
			? ((input.allowed_origins ?? input.allowedOrigins) as string[])
			: [],
		is_active: Boolean(input.is_active ?? input.isActive ?? true),
		last_used_at:
			typeof (input.last_used_at ?? input.lastUsedAt) === "string"
				? String(input.last_used_at ?? input.lastUsedAt)
				: null,
		created_at: String(
			input.created_at ?? input.createdAt ?? new Date().toISOString(),
		),
		raw_key: typeof input.raw_key === "string" ? input.raw_key : undefined,
	};
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : "Unexpected error";
}
