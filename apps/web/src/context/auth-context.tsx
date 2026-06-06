"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { api, AuthUser } from "@/lib/mock-api"
import { saveSession, getSession, clearSession } from "@/lib/auth"

interface AuthState {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<AuthUser>
  completeOnboarding: (orgData: { orgId: string; name: string }) => void
  logout: () => Promise<void>
}

const AuthCtx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Rehydrate from sessionStorage on mount
  useEffect(() => {
    const rehydrate = async () => {
      const session = getSession()
      if (session) {
        setUser(session.user)
        setLoading(false)
        return
      }

      try {
        const res = await fetch("http://localhost:3001/api/v1/auth/me", {
          credentials: "include",
        })
        if (res.ok) {
          const data = await res.json()
          setUser(data.result)
          saveSession(data.result)
        }
      } catch {} 
      finally {
        setLoading(false)
      }
    }

    rehydrate()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.login(email, password)
    setUser(data.user)
    saveSession(data.user)
    return data.user
  }, [])

  const register = useCallback(async (formData: {
    email: string; password: string; firstName: string; lastName: string
  }) => {
    const data = await api.register({...formData, planId: "c76ec77c-25de-4383-9d1a-986f70ef7694"})
    setUser(data.user)
    saveSession(data.user)
    return data.user
  }, [])

  const completeOnboarding = useCallback((orgData: { orgId: string; name: string }) => {
    setUser(prev => {
      if (!prev) return prev
      const updated = { ...prev, orgId: orgData.orgId, orgName: orgData.name, onboarded: true }
      saveSession(updated)
      return updated
    })
  }, [token])

  const logout = useCallback(async () => {
    await fetch("http://localhost:3001/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
    })
    setUser(null)
    setToken(null)
    clearSession()
  }, [])

  return (
    <AuthCtx.Provider value={{ user, token, loading, login, register, completeOnboarding, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
