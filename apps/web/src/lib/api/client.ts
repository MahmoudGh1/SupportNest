"use server";
import { getSession } from "@/lib/auth";
import { cookies } from "next/headers";

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
