"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Input, Btn, S } from "@/components/ui"

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]  = useState(false)
  const [error, setError]      = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.firstName.trim()) errs.firstName = "Required."
    if (!form.lastName.trim())  errs.lastName  = "Required."
    if (!form.email)            errs.email     = "Email is required."
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email."
    if (!form.password)         errs.password  = "Password is required."
    else if (form.password.length < 8)          errs.password = "At least 8 characters."
    return errs
  }

  const handleSubmit = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({}); setError(""); setLoading(true)
    try {
      await register(form)
      router.push("/setup")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Password strength
  const strength = (() => {
    const p = form.password
    if (!p) return 0
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  })()
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"]
  const strengthColor = ["", "#E24B4A", "#EF9F27", S.green, S.green]

  return (
    <>
      <h1 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 600, color: S.dark }}>Create your workspace</h1>
      <p style={{ margin: "0 0 28px", fontSize: 13, color: S.textMuted }}>Get started — it only takes a minute.</p>

      {error && (
        <div style={{ background: S.dangerBg, border: "0.5px solid #F09595", borderRadius: 8, padding: "10px 14px", marginBottom: 18, fontSize: 13, color: S.danger, display: "flex", gap: 8, alignItems: "center" }}>
          <i className="ti ti-alert-circle" style={{ fontSize: 16 }} /> {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 0 }}>
        <Input label="First name" value={form.firstName} onChange={set("firstName")} placeholder="Mohamed" error={fieldErrors.firstName} />
        <Input label="Last name"  value={form.lastName}  onChange={set("lastName")}  placeholder="Rashad"   error={fieldErrors.lastName}  />
      </div>

      <Input label="Work email" type="email" value={form.email} onChange={set("email")}
        placeholder="you@company.com" icon="mail" error={fieldErrors.email} />

      <Input label="Password" type={showPass ? "text" : "password"} value={form.password}
        onChange={set("password")} placeholder="Min. 8 characters" icon="lock" error={fieldErrors.password}
        rightEl={
          <button onClick={() => setShowPass(p => !p)} style={{ background: "none", border: "none", cursor: "pointer", color: S.textMuted, padding: 0, display: "flex" }}>
            <i className={`ti ti-eye${showPass ? "-off" : ""}`} style={{ fontSize: 17 }} />
          </button>
        }
      />

      {/* Password strength meter */}
      {form.password && (
        <div style={{ marginTop: -8, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColor[strength] : S.border, transition: "background .2s" }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: strengthColor[strength] }}>{strengthLabel[strength]}</span>
        </div>
      )}

      <Btn onClick={handleSubmit} loading={loading} fullWidth>Create account →</Btn>

      <p style={{ fontSize: 11, color: S.textMuted, textAlign: "center", marginTop: 12, marginBottom: 0 }}>
        By creating an account you agree to our{" "}
        <button style={{ background: "none", border: "none", color: S.purple, fontSize: 11, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>Terms</button>
        {" "}and{" "}
        <button style={{ background: "none", border: "none", color: S.purple, fontSize: 11, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>Privacy Policy</button>.
      </p>

      <div style={{ marginTop: 20, textAlign: "center" }}>
        <p style={{ fontSize: 13, color: S.textMuted, margin: 0 }}>
          Already have an account?{" "}
          <button onClick={() => router.push("/login")} style={{ background: "none", border: "none", color: S.purple, fontSize: 13, cursor: "pointer", fontWeight: 500, padding: 0, fontFamily: "inherit" }}>
            Sign in →
          </button>
        </p>
      </div>
    </>
  )
}
