import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import type { ApiKey, OrgProfile, UserProfile } from "@/types/types";

// ─── BASE URL ─────────────────────────────────────────────────────────────────

function normalizeApiBaseUrl(rawBaseUrl?: string) {
  const fallback =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
  const base = (rawBaseUrl ?? fallback).trim().replace(/\/+$/, "");
  return /\/api\/v1$/i.test(base) ? base : `${base}/api/v1`;
}

export const BASE_URL = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE,
);

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
  const widget = (input.widget_config ?? input.widgetConfig ?? {}) as ApiRecord;
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
