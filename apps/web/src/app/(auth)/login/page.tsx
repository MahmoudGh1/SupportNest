"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Input, Btn, S } from "@/components/ui"

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()

  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!email) errs.email = "Email is required."
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Enter a valid email."
    if (!password) errs.password = "Password is required."
    return errs
  }

  const handleSubmit = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({}); setError(""); setLoading(true)
    try {
      const user = await login(email, password)
      router.push(user.onboarded ? "/dashboard" : "/setup")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 600, color: S.dark }}>Welcome back</h1>
      <p style={{ margin: "0 0 28px", fontSize: 13, color: S.textMuted }}>Secure access for agents and owners.</p>

      {error && (
        <div style={{ background: S.dangerBg, border: "0.5px solid #F09595", borderRadius: 8, padding: "10px 14px", marginBottom: 18, fontSize: 13, color: S.danger, display: "flex", gap: 8, alignItems: "center" }}>
          <i className="ti ti-alert-circle" style={{ fontSize: 16 }} /> {error}
        </div>
      )}

      <Input label="Email address" type="email" value={email} onChange={setEmail}
        placeholder="admin@acme.com" icon="mail" error={fieldErrors.email} />

      <Input label="Password" type={showPass ? "text" : "password"} value={password}
        onChange={setPassword} placeholder="••••••••" icon="lock" error={fieldErrors.password}
        rightEl={
          <button onClick={() => setShowPass(p => !p)} style={{ background: "none", border: "none", cursor: "pointer", color: S.textMuted, padding: 0, display: "flex" }}>
            <i className={`ti ti-eye${showPass ? "-off" : ""}`} style={{ fontSize: 17 }} />
          </button>
        }
      />

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -8, marginBottom: 20 }}>
        <button style={{ background: "none", border: "none", color: S.purple, fontSize: 13, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
          Forgot password?
        </button>
      </div>

      <Btn onClick={handleSubmit} loading={loading} fullWidth>Sign in →</Btn>

      <div style={{ marginTop: 20, textAlign: "center" }}>
        <p style={{ fontSize: 13, color: S.textMuted, margin: 0 }}>
          Don't have an account?{" "}
          <button onClick={() => router.push("/register")} style={{ background: "none", border: "none", color: S.purple, fontSize: 13, cursor: "pointer", fontWeight: 500, padding: 0, fontFamily: "inherit" }}>
            Create one free →
          </button>
        </p>
      </div>

      {/* Demo hint */}
      <div style={{ marginTop: 20, background: S.purpleBg, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: S.textSecondary }}>
        <strong style={{ color: S.dark }}>Demo:</strong> admin@acme.com / password
      </div>
    </>
  )
}
