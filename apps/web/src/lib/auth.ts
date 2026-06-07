// src/lib/auth.ts
// JWT helpers — swap mock token logic for real JWT decode when backend is ready

export function saveSession(user: object, token?: string) {
  sessionStorage.setItem("sn_session", JSON.stringify({ user, token }))
}

export function getSession(): { user: any; token?: string } | null {
  if (typeof window === "undefined") return null
  const raw = sessionStorage.getItem("sn_session")
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function getToken(): string {
  return getSession()?.token ?? ""
}

export function clearSession() {
  sessionStorage.removeItem("sn_session")
}
