"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Input, Btn } from "@/components/ui"

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", businessName: "" })
  const [showPass,    setShowPass]    = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState("")
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
  const strengthColor = [
    "",
    "text-red-500",
    "text-amber-500",
    "text-success",
    "text-success",
  ]
  const strengthBarColor = [
    "",
    "bg-red-500",
    "bg-amber-500",
    "bg-success",
    "bg-success",
  ]

  return (
    <>
      {/* Heading */}
      <h1 className="text-xl font-semibold text-dark mb-1.5 mt-0">
        Create your workspace
      </h1>
      <p className="text-sm text-body mb-7 mt-0">
        Get started — it only takes a minute.
      </p>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-danger-bg border border-red-200 rounded-lg px-3.5 py-2.5 mb-4 text-sm text-danger">
          <i className="ti ti-alert-circle text-base shrink-0" />
          {error}
        </div>
      )}

      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <Input label="First name" value={form.firstName} onChange={set("firstName")} placeholder="Mohamed" error={fieldErrors.firstName} />
        <Input label="Last name"  value={form.lastName}  onChange={set("lastName")}  placeholder="Rashad"   error={fieldErrors.lastName}  />
      </div>

      {/* Email */}
      <Input
        label="Work email"
        type="email"
        value={form.email}
        onChange={set("email")}
        placeholder="you@company.com"
        icon="mail"
        error={fieldErrors.email}
      />

      {/* Business name */}
      <Input
        label="Business Name"
        type="text"
        value={form.businessName}
        onChange={set("businessName")}
        placeholder="Your company name..."
        icon="building"
        error={fieldErrors.businessName}
      />

      {/* Password */}
      <Input
        label="Password"
        type={showPass ? "text" : "password"}
        value={form.password}
        onChange={set("password")}
        placeholder="Min. 8 characters"
        icon="lock"
        error={fieldErrors.password}
        rightEl={
          <button
            onClick={() => setShowPass(p => !p)}
            className="flex items-center text-body hover:text-dark bg-transparent border-none cursor-pointer p-0 transition-colors"
          >
            <i className={`ti ti-eye${showPass ? "-off" : ""} text-[17px]`} />
          </button>
        }
      />

      {/* Password strength meter */}
      {form.password && (
        <div className="-mt-2 mb-4">
          <div className="flex gap-1 mb-1">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`flex-1 h-[3px] rounded-sm transition-colors duration-200 ${
                  i <= strength ? strengthBarColor[strength] : "bg-border"
                }`}
              />
            ))}
          </div>
          <span className={`text-[11px] font-medium ${strengthColor[strength]}`}>
            {strengthLabel[strength]}
          </span>
        </div>
      )}

      {/* Submit */}
      <Btn onClick={handleSubmit} loading={loading} fullWidth>
        Create account →
      </Btn>

      {/* Terms */}
      <p className="text-[11px] text-body text-center mt-3 mb-0">
        By creating an account you agree to our{" "}
        <button className="text-[11px] text-brand hover:text-brand-dark bg-transparent border-none cursor-pointer p-0 font-[inherit] transition-colors">
          Terms
        </button>
        {" "}and{" "}
        <button className="text-[11px] text-brand hover:text-brand-dark bg-transparent border-none cursor-pointer p-0 font-[inherit] transition-colors">
          Privacy Policy
        </button>.
      </p>

      {/* Sign in link */}
      <div className="mt-5 text-center">
        <p className="text-sm text-body m-0">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-sm text-brand font-medium hover:text-brand-dark bg-transparent border-none cursor-pointer p-0 font-[inherit] transition-colors"
          >
            Sign in →
          </button>
        </p>
      </div>
    </>
  )
}
