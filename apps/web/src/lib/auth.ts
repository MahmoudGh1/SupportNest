// src/lib/auth.ts
// JWT helpers — swap mock token logic for real JWT decode when backend is ready

export function saveSession(token: string, user: object) {
  sessionStorage.setItem("sn_session", JSON.stringify({ token, user }))
}

export function getSession(): { token: string; user: any } | null {
  if (typeof window === "undefined") return null
  const raw = sessionStorage.getItem("sn_session")
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function clearSession() {
  sessionStorage.removeItem("sn_session")
}

export function getToken(): string | null {
  return getSession()?.token ?? null
}
