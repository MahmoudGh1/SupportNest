import type { AuthUser } from "@/types/types";

const KEY = "sn_user";

export function saveSession(user: AuthUser) {
  sessionStorage.setItem(KEY, JSON.stringify(user));
}

export function getSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUser; } catch { return null; }
}

export function clearSession() {
  sessionStorage.removeItem(KEY);
}