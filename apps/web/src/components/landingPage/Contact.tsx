"use client"

import { useState } from "react"
import { useInView } from "@/hooks/useInView"

const CHANNELS = [
  { icon: "ti-mail",           label: "Email us", val: "hello@supportnest.ai", color: "#534AB7" },
  { icon: "ti-brand-twitter",  label: "Twitter",  val: "@supportnest",         color: "#1DA1F2" },
  { icon: "ti-brand-linkedin", label: "LinkedIn", val: "SupportNest",          color: "#0A66C2" },
]

type FormState = { name: string; email: string; company: string; message: string }

const INITIAL_FORM: FormState = { name: "", email: "", company: "", message: "" }

const INPUT_CLS =
  "w-full box-border px-3.5 py-2.5 text-sm border-[1.5px] border-border rounded-lg outline-none font-[inherit] sn-page-text bg-surface transition-colors duration-150 focus:border-brand"

export default function Contact() {
  const { ref, visible } = useInView()
  const [form, setForm]       = useState<FormState>(INITIAL_FORM)
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k: keyof FormState) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    setLoading(true)
    // 🔁 Replace with real API call: POST /api/contact
    setTimeout(() => { setLoading(false); setSent(true) }, 1200)
  }

  return (
    <section id="contact" className="py-[90px] px-[5%]" style={{ background: "var(--surface-elevated)" }}>
      <div className="max-w-[1100px] mx-auto">
        {/* Heading */}
        <div className="text-center mb-13">
          <div className="inline-block bg-brand-faint text-brand text-xs font-bold px-3.5 py-1 rounded-full tracking-[.08em] uppercase mb-4">
            Get in touch
          </div>
          <h2
            className="font-extrabold sn-page-text tracking-[-0.025em] mb-3 mt-0"
            style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)" }}
          >
            We'd love to hear from you
          </h2>
          <p className="text-base sn-muted">
            Questions, demos, or custom enterprise plans — we reply within 24 hours.
          </p>
        </div>

        <div
          ref={ref}
          className="grid gap-8"
          style={{
            gridTemplateColumns: "1fr 1.6fr",
            opacity:    visible ? 1 : 0,
            transform:  visible ? "translateY(0)" : "translateY(24px)",
            transition: "all .6s ease",
          }}
        >
          {/* Left: info panel */}
          <div className="flex flex-col gap-4">
            <div className="bg-white border-[1.5px] border-[#e8e6f0] rounded-2xl p-7">
              <h3 className="text-base font-bold text-[#1a1830] mt-0 mb-1.5">Talk to sales</h3>
              <p className="text-[13px] text-[#64607a] leading-[1.7] mt-0 mb-5">
                Interested in SupportNest for your team? We'll walk you through a live demo and tailor a plan for your use case.
              </p>
              <div className="flex flex-col gap-3.5">
                {CHANNELS.map(ch => (
                  <div key={ch.label} className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                      style={{ background: `${ch.color}12` }}
                    >
                      <i className={`ti ${ch.icon} text-[18px]`} style={{ color: ch.color }} />
                    </div>
                    <div>
                      <div className="text-[11px] text-[#64607a] font-medium">{ch.label}</div>
                      <div className="text-[13px] font-semibold text-[#1a1830]">{ch.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reply-time badge */}
            <div className="bg-[#E1F5EE] border-[1.5px] border-[#1D9E75]/20 rounded-xl px-[18px] py-3.5 flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-[#1D9E75] shrink-0" />
              <span className="text-[13px] text-[#0F6E56] font-semibold">
                Average reply time: under 4 hours
              </span>
            </div>
          </div>

          {/* Right: form */}
          <div className="bg-white border-[1.5px] border-[#e8e6f0] rounded-2xl px-7 py-8">
            {sent ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-full bg-[#E1F5EE] flex items-center justify-center mx-auto mb-4">
                  <i className="ti ti-check text-[26px] text-[#1D9E75]" />
                </div>
                <h3 className="text-lg font-bold text-[#1a1830] mb-2">Message sent!</h3>
                <p className="text-sm text-[#64607a]">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[13px] font-medium text-[#1a1830] mb-1.5">Your name *</label>
                    <input
                      value={form.name}
                      onChange={e => set("name")(e.target.value)}
                      placeholder="Mohamed Rashad"
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#1a1830] mb-1.5">Work email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => set("email")(e.target.value)}
                      placeholder="you@company.com"
                      className={INPUT_CLS}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#1a1830] mb-1.5">Company</label>
                  <input
                    value={form.company}
                    onChange={e => set("company")(e.target.value)}
                    placeholder="Acme Corp"
                    className={INPUT_CLS}
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#1a1830] mb-1.5">Message *</label>
                  <textarea
                    value={form.message}
                    onChange={e => set("message")(e.target.value)}
                    placeholder="Tell us about your team size, current support setup, and what you're hoping to solve..."
                    rows={4}
                    className={`${INPUT_CLS} resize-y min-h-[100px]`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#534AB7] hover:bg-[#7F77DD] disabled:opacity-70 text-white text-sm font-semibold py-3 px-5 rounded-[10px] border-none cursor-pointer font-[inherit] transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? "Sending…" : <><i className="ti ti-send text-base" /> Send message</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}