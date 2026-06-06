"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Input, Btn } from "@/components/ui"

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()

  const [email,       setEmail]       = useState("")
  const [password,    setPassword]    = useState("")
  const [showPass,    setShowPass]    = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState("")
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
      router.push(user.onboarded ? "/dashboard/dashboard" : "/setup")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Heading */}
      <h1 className="text-xl font-semibold text-dark mb-1.5 mt-0">
        Welcome back
      </h1>
      <p className="text-sm text-body mb-7 mt-0">
        Secure access for agents and owners.
      </p>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-danger-bg border border-red-200 rounded-lg px-3.5 py-2.5 mb-4 text-sm text-danger">
          <i className="ti ti-alert-circle text-base shrink-0" />
          {error}
        </div>
      )}

      {/* Email field */}
      <Input
        label="Email address"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="admin@acme.com"
        icon="mail"
        error={fieldErrors.email}
      />

      {/* Password field */}
      <Input
        label="Password"
        type={showPass ? "text" : "password"}
        value={password}
        onChange={setPassword}
        placeholder="••••••••"
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

      {/* Forgot password */}
      <div className="flex justify-end -mt-2 mb-5">
        <button className="text-sm text-brand hover:text-brand-dark bg-transparent border-none cursor-pointer p-0 font-[inherit] transition-colors">
          Forgot password?
        </button>
      </div>

      {/* Submit */}
      <Btn onClick={handleSubmit} loading={loading} fullWidth>
        Sign in →
      </Btn>

      {/* Register link */}
      <div className="mt-5 text-center">
        <p className="text-sm text-body m-0">
          Don&apos;t have an account?{" "}
          <button
            onClick={() => router.push("/register")}
            className="text-sm text-brand font-medium hover:text-brand-dark bg-transparent border-none cursor-pointer p-0 font-[inherit] transition-colors"
          >
            Create one free →
          </button>
        </p>
      </div>

      {/* Demo hint */}
      <div className="mt-5 bg-brand-faint rounded-lg px-3.5 py-2.5 text-xs text-body">
        <strong className="text-dark">Demo:</strong> admin@acme.com / password
      </div>
    </>
  )
}
