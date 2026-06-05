"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { api } from "@/lib/mock-api"
import { Input, Btn, S } from "@/components/ui"

const industries = ["SaaS", "E-commerce", "Healthcare", "Finance", "Education", "Other"]
const sizes      = ["1–10", "11–50", "51–200", "201–1000", "1000+"]

export default function SetupPage() {
  const { completeOnboarding } = useAuth()
  const router = useRouter()

  const [step, setStep]     = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm]     = useState({ name: "", industry: "", size: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }))
  const totalSteps = 3

  const validate1 = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = "Organization name is required."
    if (!form.industry)    e.industry = "Please select an industry."
    return e
  }
  const validate2 = () => {
    const e: Record<string, string> = {}
    if (!form.size) e.size = "Please select your team size."
    return e
  }

  const handleNext = async () => {
    if (step === 1) {
      const e = validate1()
      if (Object.keys(e).length) { setErrors(e); return }
      setErrors({}); setStep(2)
    } else if (step === 2) {
      const e = validate2()
      if (Object.keys(e).length) { setErrors(e); return }
      setErrors({}); setStep(3)
    } else {
      setLoading(true)
      const data = await api.setupOrg(form)
      completeOnboarding(data)
      router.push("/dashboard")
    }
  }

  return (
    <div style={{ maxWidth: 520, width: "100%", margin: "0 auto" }}>
      {/* Card - overrides the auth layout card, render directly */}
      <div>
        {/* Progress bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, flex: i < 3 ? 1 : "none" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: i < step ? S.green : i === step ? S.purple : S.border,
                fontSize: 12, fontWeight: 600,
                color: i <= step ? "#fff" : S.textMuted,
                transition: "all .2s", flexShrink: 0,
              }}>
                {i < step ? <i className="ti ti-check" style={{ fontSize: 13 }} /> : i}
              </div>
              {i < 3 && (
                <div style={{ flex: 1, height: 2, background: i < step ? S.green : S.border, borderRadius: 1, transition: "background .3s" }} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 — Org info */}
        {step === 1 && (
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 600, color: S.dark }}>Set up your organization</h2>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: S.textMuted }}>Tell us about your business so we can configure your workspace.</p>
            <Input label="Organization name" value={form.name} onChange={set("name")} placeholder="Acme Corp" icon="building" error={errors.name} />
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: S.dark, marginBottom: 8 }}>Industry</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                {industries.map(ind => (
                  <button key={ind} onClick={() => set("industry")(ind)} style={{
                    padding: "8px 6px", borderRadius: 8,
                    border: `1.5px solid ${form.industry === ind ? S.purple : S.border}`,
                    background: form.industry === ind ? S.purpleBg : "#fff",
                    color: form.industry === ind ? S.purple : S.textSecondary,
                    fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                    fontWeight: form.industry === ind ? 500 : 400,
                    transition: "all .15s",
                  }}>
                    {ind}
                  </button>
                ))}
              </div>
              {errors.industry && <p style={{ fontSize: 12, color: "#E24B4A", marginTop: 6 }}>{errors.industry}</p>}
            </div>
          </div>
        )}

        {/* Step 2 — Team size */}
        {step === 2 && (
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 600, color: S.dark }}>Team size</h2>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: S.textMuted }}>How many people are on your support team?</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sizes.map(sz => (
                <button key={sz} onClick={() => set("size")(sz)} style={{
                  padding: "12px 16px", borderRadius: 8,
                  border: `1.5px solid ${form.size === sz ? S.purple : S.border}`,
                  background: form.size === sz ? S.purpleBg : "#fff",
                  color: form.size === sz ? S.purple : S.dark,
                  fontSize: 14, cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  transition: "all .15s",
                }}>
                  <span>{sz} people</span>
                  {form.size === sz && <i className="ti ti-circle-check-filled" style={{ fontSize: 18, color: S.purple }} />}
                </button>
              ))}
            </div>
            {errors.size && <p style={{ fontSize: 12, color: "#E24B4A", marginTop: 8 }}>{errors.size}</p>}
          </div>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 600, color: S.dark }}>You're almost in!</h2>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: S.textMuted }}>Review your setup and launch your workspace.</p>
            <div style={{ background: S.bg, borderRadius: 10, padding: 16, marginBottom: 20, border: `0.5px solid ${S.border}` }}>
              {[
                { icon: "building",  label: "Organization", value: form.name },
                { icon: "briefcase", label: "Industry",     value: form.industry },
                { icon: "users",     label: "Team size",    value: form.size + " people" },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: `0.5px solid ${S.border}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: S.purpleBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className={`ti ti-${row.icon}`} style={{ fontSize: 16, color: S.purple }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: S.textMuted }}>{row.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: S.dark }}>{row.value}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: S.greenBg, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#0F6E56", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <i className="ti ti-sparkles" style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }} />
              <span>Your AI pipeline (Router → Tier 1 → Tier 2 → Human) will be ready immediately after launch.</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, alignItems: "center" }}>
          <div>
            {step > 1 && <Btn variant="ghost" onClick={() => setStep(s => s - 1)}>← Back</Btn>}
          </div>
          <Btn onClick={handleNext} loading={loading}>
            {step === totalSteps ? "Launch workspace →" : "Continue →"}
          </Btn>
        </div>
      </div>
    </div>
  )
}
