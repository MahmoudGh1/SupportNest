"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import type { PricingPlan } from "@/types/types"
import { PaymentRoute } from "@/components/guest-only-route"
import { useAuth } from "@/context/auth-context"

// ─── TYPES ────────────────────────────────────────────────────────────────────
type PaymentMethod = "mastercard" | "vodafone" | "visa" | "instapay" | "fawry"
type Step = "method" | "details" | "processing" | "success"

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatCard(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim()
}
function formatExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4)
  return d.length >= 3 ? d.slice(0, 2) + "/" + d.slice(2) : d
}
function formatPhone(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
}

// ─── PAYMENT METHODS CONFIG ───────────────────────────────────────────────────
const METHODS = [
  {
    id: "mastercard" as PaymentMethod,
    label: "Mastercard",
    sub: "Credit or Debit card",
    logo: (
      <svg viewBox="0 0 48 32" width="48" height="32">
        <rect width="48" height="32" rx="4" fill="#1A1F36"/>
        <circle cx="18" cy="16" r="10" fill="#EB001B"/>
        <circle cx="30" cy="16" r="10" fill="#F79E1B"/>
        <path d="M24 8.3a10 10 0 0 1 0 15.4A10 10 0 0 1 24 8.3z" fill="#FF5F00"/>
      </svg>
    ),
  },
  {
    id: "visa" as PaymentMethod,
    label: "Visa",
    sub: "Credit or Debit card",
    logo: (
      <svg viewBox="0 0 48 32" width="48" height="32">
        <rect width="48" height="32" rx="4" fill="#1A1F71"/>
        <text x="8" y="22" fontSize="14" fontWeight="bold" fill="white" fontFamily="Arial">VISA</text>
      </svg>
    ),
  },
  {
    id: "vodafone" as PaymentMethod,
    label: "Vodafone Cash",
    sub: "Pay with your Vodafone wallet",
    logo: (
      <svg viewBox="0 0 48 32" width="48" height="32">
        <rect width="48" height="32" rx="4" fill="#E60000"/>
        <circle cx="24" cy="16" r="9" fill="white"/>
        <circle cx="24" cy="16" r="6" fill="#E60000"/>
        <path d="M21 13l6 3-6 3V13z" fill="white"/>
      </svg>
    ),
  },
  {
    id: "instapay" as PaymentMethod,
    label: "InstaPay",
    sub: "Egyptian instant payment",
    logo: (
      <svg viewBox="0 0 48 32" width="48" height="32">
        <rect width="48" height="32" rx="4" fill="#00A651"/>
        <text x="6" y="21" fontSize="11" fontWeight="bold" fill="white" fontFamily="Arial">Insta</text>
        <text x="6" y="30" fontSize="8" fill="white" fontFamily="Arial" opacity="0.8">Pay</text>
        <path d="M36 8 L42 16 L36 24 L32 24 L38 16 L32 8Z" fill="white"/>
      </svg>
    ),
  },
  {
    id: "fawry" as PaymentMethod,
    label: "Fawry",
    sub: "Pay at any Fawry outlet",
    logo: (
      <svg viewBox="0 0 48 32" width="48" height="32">
        <rect width="48" height="32" rx="4" fill="#F5A623"/>
        <text x="7" y="21" fontSize="13" fontWeight="bold" fill="white" fontFamily="Arial">fawry</text>
      </svg>
    ),
  },
]

// ─── CARD FORM ────────────────────────────────────────────────────────────────
function CardForm({ method, onPay, loading }: { method: PaymentMethod; onPay: () => void; loading: boolean }) {
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" })
  const [flip, setFlip] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (card.number.replace(/\s/g, "").length < 16) e.number = "Enter a valid 16-digit card number"
    if (!card.name.trim()) e.name = "Cardholder name is required"
    if (card.expiry.length < 5) e.expiry = "Enter valid expiry MM/YY"
    if (card.cvv.length < 3) e.cvv = "CVV must be 3–4 digits"
    return e
  }

  const handlePay = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onPay()
  }

  const inputCls = (field: string) =>
    `w-full px-3.5 py-2.5 text-sm border-[1.5px] rounded-lg outline-none font-[inherit] text-[#1a1830] bg-white transition-colors duration-150 focus:border-[#534AB7] ${errors[field] ? "border-[#E24B4A]" : "border-[#e8e6f0]"}`

  const brand = method === "mastercard" ? "#EB001B" : "#1A1F71"
  const digits = card.number || "•••• •••• •••• ••••"
  const holder = card.name || "FULL NAME"
  const exp    = card.expiry || "MM/YY"

  return (
    <div>
      {/* Visual card */}
      <div className="mb-6" style={{ perspective: 800 }}>
        <div style={{ width: "100%", height: 180, position: "relative", transformStyle: "preserve-3d", transform: flip ? "rotateY(180deg)" : "rotateY(0deg)", transition: "transform .5s ease" }}>
          {/* Front */}
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", borderRadius: 16, background: `linear-gradient(135deg, #1a1830 0%, #534AB7 100%)`, padding: "24px 28px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 20px 60px rgba(83,74,183,0.35)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.3)" }} />
                ))}
              </div>
              {method === "mastercard" && (
                <div style={{ display: "flex" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#EB001B", opacity: 0.9 }} />
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#F79E1B", opacity: 0.9, marginLeft: -10 }} />
                </div>
              )}
              {method === "visa" && <span style={{ color: "white", fontWeight: 900, fontSize: 18, fontStyle: "italic", fontFamily: "serif" }}>VISA</span>}
            </div>
            {/* Chip */}
            <div style={{ width: 40, height: 30, borderRadius: 5, background: "linear-gradient(135deg, #d4af37, #f0e68c)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 26, height: 20, borderRadius: 3, border: "1px solid rgba(0,0,0,0.15)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, padding: 2 }}>
                {[...Array(4)].map((_, i) => <div key={i} style={{ background: "rgba(0,0,0,0.1)", borderRadius: 1 }} />)}
              </div>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, letterSpacing: "0.15em", marginBottom: 6 }}>CARD NUMBER</div>
              <div style={{ color: "white", fontSize: 17, letterSpacing: "0.2em", fontFamily: "monospace", fontWeight: 500 }}>{digits}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, letterSpacing: "0.12em", marginBottom: 3 }}>CARDHOLDER</div>
                <div style={{ color: "white", fontSize: 13, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>{holder}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, letterSpacing: "0.12em", marginBottom: 3 }}>EXPIRES</div>
                <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{exp}</div>
              </div>
            </div>
          </div>
          {/* Back */}
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", borderRadius: 16, background: "linear-gradient(135deg, #2d2b4e 0%, #1a1830 100%)", overflow: "hidden", boxShadow: "0 20px 60px rgba(83,74,183,0.35)" }}>
            <div style={{ height: 44, background: "#111", margin: "24px 0 20px" }} />
            <div style={{ padding: "0 28px" }}>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, letterSpacing: "0.12em", marginBottom: 8 }}>CVV</div>
              <div style={{ background: "white", borderRadius: 6, padding: "10px 14px", textAlign: "right", fontFamily: "monospace", fontSize: 16, letterSpacing: "0.3em", color: "#1a1830" }}>
                {card.cvv ? "•".repeat(card.cvv.length) : "•••"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-3.5">
        <div>
          <label className="block text-[13px] font-medium text-[#1a1830] mb-1.5">Card number</label>
          <input value={card.number} onChange={e => setCard(c => ({ ...c, number: formatCard(e.target.value) }))}
            placeholder="1234 5678 9012 3456" className={inputCls("number")} />
          {errors.number && <p className="text-[11px] text-[#E24B4A] mt-1">{errors.number}</p>}
        </div>
        <div>
          <label className="block text-[13px] font-medium text-[#1a1830] mb-1.5">Cardholder name</label>
          <input value={card.name} onChange={e => setCard(c => ({ ...c, name: e.target.value.toUpperCase() }))}
            placeholder="MOHAMED RASHAD" className={inputCls("name")} />
          {errors.name && <p className="text-[11px] text-[#E24B4A] mt-1">{errors.name}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-medium text-[#1a1830] mb-1.5">Expiry date</label>
            <input value={card.expiry} onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))}
              placeholder="MM/YY" className={inputCls("expiry")} />
            {errors.expiry && <p className="text-[11px] text-[#E24B4A] mt-1">{errors.expiry}</p>}
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#1a1830] mb-1.5">CVV</label>
            <input value={card.cvv}
              onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
              onFocus={() => setFlip(true)} onBlur={() => setFlip(false)}
              placeholder="•••" className={inputCls("cvv")} />
            {errors.cvv && <p className="text-[11px] text-[#E24B4A] mt-1">{errors.cvv}</p>}
          </div>
        </div>
      </div>

      <button onClick={handlePay} disabled={loading}
        className="w-full mt-5 bg-[#534AB7] hover:bg-[#3C3489] disabled:opacity-60 text-white py-3 rounded-xl text-[15px] font-semibold transition-colors flex items-center justify-center gap-2 border-none cursor-pointer font-[inherit]">
        {loading ? <><span className="animate-spin inline-block">⟳</span> Processing…</> : <>🔒 Pay now</>}
      </button>
      <p className="text-[11px] text-[#888] text-center mt-3">256-bit SSL encrypted · PCI DSS compliant</p>
    </div>
  )
}

// ─── VODAFONE CASH FORM ───────────────────────────────────────────────────────
function VodafoneForm({ onPay, loading }: { onPay: () => void; loading: boolean }) {
  const [phone, setPhone] = useState("")
  const [pin, setPin]     = useState("")
  const [error, setError] = useState("")

  const handlePay = () => {
    if (phone.length < 11) { setError("Enter a valid 11-digit Vodafone number"); return }
    if (pin.length < 4)    { setError("Enter your 4-digit wallet PIN"); return }
    setError(""); onPay()
  }

  return (
    <div>
      {/* Vodafone branding */}
      <div className="bg-[#E60000]/8 border-[1.5px] border-[#E60000]/20 rounded-2xl p-5 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#E60000] flex items-center justify-center shrink-0">
          <span className="text-white text-2xl font-bold">V</span>
        </div>
        <div>
          <div className="text-[15px] font-bold text-[#1a1830]">Vodafone Cash</div>
          <div className="text-[13px] text-[#64607a]">Pay securely from your Vodafone wallet</div>
        </div>
      </div>

      {error && <div className="bg-[#FCEBEB] border border-[#F09595] rounded-lg px-4 py-3 mb-4 text-[13px] text-[#A32D2D]">⚠ {error}</div>}

      <div className="space-y-3.5">
        <div>
          <label className="block text-[13px] font-medium text-[#1a1830] mb-1.5">Vodafone number</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-[#1a1830]">+20</div>
            <input value={phone} onChange={e => setPhone(formatPhone(e.target.value))}
              placeholder="010X XXX XXXX"
              className="w-full pl-12 pr-3.5 py-2.5 text-sm border-[1.5px] border-[#e8e6f0] focus:border-[#E60000] rounded-lg outline-none font-[inherit] text-[#1a1830] bg-white transition-colors" />
          </div>
        </div>
        <div>
          <label className="block text-[13px] font-medium text-[#1a1830] mb-1.5">Wallet PIN</label>
          <input type="password" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="••••"
            className="w-full px-3.5 py-2.5 text-sm border-[1.5px] border-[#e8e6f0] focus:border-[#E60000] rounded-lg outline-none font-[inherit] text-[#1a1830] bg-white transition-colors" />
        </div>
      </div>

      <div className="bg-[#f6f5fc] rounded-xl p-4 mt-4 mb-5">
        <div className="text-[12px] font-medium text-[#1a1830] mb-2">How it works</div>
        {["Enter your number and PIN above", "Confirm the payment on your phone", "Done — your plan activates instantly"].map((s, i) => (
          <div key={i} className="flex items-start gap-2.5 mb-1.5 last:mb-0">
            <div className="w-5 h-5 rounded-full bg-[#E60000] text-white text-[10px] flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
            <span className="text-[12px] text-[#64607a]">{s}</span>
          </div>
        ))}
      </div>

      <button onClick={handlePay} disabled={loading}
        className="w-full bg-[#E60000] hover:bg-[#cc0000] disabled:opacity-60 text-white py-3 rounded-xl text-[15px] font-semibold transition-colors flex items-center justify-center gap-2 border-none cursor-pointer font-[inherit]">
        {loading ? <><span className="animate-spin inline-block">⟳</span> Processing…</> : <>✓ Confirm payment</>}
      </button>
      <p className="text-[11px] text-[#888] text-center mt-3">Secured by Vodafone Cash · EGP regulated</p>
    </div>
  )
}

// ─── INSTAPAY FORM ────────────────────────────────────────────────────────────
function InstapayForm({ onPay, loading, amount }: { onPay: () => void; loading: boolean; amount: number }) {
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")

  const handlePay = () => {
    if (phone.length < 11) { setError("Enter a valid 11-digit phone number"); return }
    setError(""); onPay()
  }

  return (
    <div>
      <div className="bg-[#00A651]/8 border-[1.5px] border-[#00A651]/20 rounded-2xl p-5 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-[#00A651] flex items-center justify-center shrink-0">
          <span className="text-white text-[13px] font-bold">Insta<br/>Pay</span>
        </div>
        <div>
          <div className="text-[15px] font-bold text-[#1a1830]">InstaPay</div>
          <div className="text-[13px] text-[#64607a]">Egyptian instant bank transfer</div>
        </div>
      </div>

      {error && <div className="bg-[#FCEBEB] border border-[#F09595] rounded-lg px-4 py-3 mb-4 text-[13px] text-[#A32D2D]">⚠ {error}</div>}

      <div className="mb-4">
        <label className="block text-[13px] font-medium text-[#1a1830] mb-1.5">Your phone number (linked to InstaPay)</label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-[#1a1830]">+20</div>
          <input value={phone} onChange={e => setPhone(formatPhone(e.target.value))}
            placeholder="01X XXX XXXX"
            className="w-full pl-12 pr-3.5 py-2.5 text-sm border-[1.5px] border-[#e8e6f0] focus:border-[#00A651] rounded-lg outline-none font-[inherit] text-[#1a1830] bg-white transition-colors" />
        </div>
      </div>

      <div className="bg-[#f6f5fc] rounded-xl p-4 mb-5 text-center">
        <div className="text-[12px] text-[#888] mb-1">Amount to transfer</div>
        <div className="text-[28px] font-bold text-[#1a1830]">EGP {(amount * 50).toLocaleString()}</div>
        <div className="text-[11px] text-[#888] mt-1">≈ ${amount} USD · rate may vary</div>
      </div>

      <button onClick={handlePay} disabled={loading}
        className="w-full bg-[#00A651] hover:bg-[#008c44] disabled:opacity-60 text-white py-3 rounded-xl text-[15px] font-semibold transition-colors flex items-center justify-center gap-2 border-none cursor-pointer font-[inherit]">
        {loading ? <><span className="animate-spin inline-block">⟳</span> Processing…</> : <>⚡ Pay with InstaPay</>}
      </button>
      <p className="text-[11px] text-[#888] text-center mt-3">You'll receive an OTP to confirm on your banking app</p>
    </div>
  )
}

// ─── FAWRY FORM ───────────────────────────────────────────────────────────────
function FawryForm({ onPay, loading, amount }: { onPay: () => void; loading: boolean; amount: number }) {
  const [phone, setPhone] = useState("")
  const [ref] = useState("FWR-" + Math.random().toString(36).slice(2, 10).toUpperCase())

  return (
    <div>
      <div className="bg-[#F5A623]/10 border-[1.5px] border-[#F5A623]/30 rounded-2xl p-5 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-[#F5A623] flex items-center justify-center shrink-0">
          <span className="text-white text-[14px] font-bold">fawry</span>
        </div>
        <div>
          <div className="text-[15px] font-bold text-[#1a1830]">Fawry</div>
          <div className="text-[13px] text-[#64607a]">Pay at any Fawry outlet near you</div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-[13px] font-medium text-[#1a1830] mb-1.5">Your phone number</label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-[#1a1830]">+20</div>
          <input value={phone} onChange={e => setPhone(formatPhone(e.target.value))}
            placeholder="01X XXX XXXX"
            className="w-full pl-12 pr-3.5 py-2.5 text-sm border-[1.5px] border-[#e8e6f0] focus:border-[#F5A623] rounded-lg outline-none font-[inherit] text-[#1a1830] bg-white transition-colors" />
        </div>
      </div>

      {/* Reference code */}
      <div className="bg-[#f6f5fc] rounded-xl p-5 mb-5">
        <div className="text-[12px] font-medium text-[#888] mb-3 uppercase tracking-wider">Your payment reference</div>
        <div className="flex items-center justify-between bg-white rounded-lg border border-[#e8e6f0] px-4 py-3 mb-3">
          <span className="font-mono text-[18px] font-bold text-[#534AB7] tracking-widest">{ref}</span>
          <button onClick={() => navigator.clipboard?.writeText(ref)}
            className="text-[11px] text-[#534AB7] font-medium border-none bg-transparent cursor-pointer">Copy</button>
        </div>
        <div className="flex items-start gap-2.5 mb-2">
          <span className="text-[#F5A623] text-lg shrink-0">①</span>
          <span className="text-[12px] text-[#64607a]">Go to any Fawry outlet or use the Fawry app</span>
        </div>
        <div className="flex items-start gap-2.5 mb-2">
          <span className="text-[#F5A623] text-lg shrink-0">②</span>
          <span className="text-[12px] text-[#64607a]">Give the cashier this reference code</span>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="text-[#F5A623] text-lg shrink-0">③</span>
          <span className="text-[12px] text-[#64607a]">Pay <strong>EGP {(amount * 50).toLocaleString()}</strong> and your plan activates within 1 hour</span>
        </div>
      </div>

      <button onClick={onPay} disabled={loading}
        className="w-full bg-[#F5A623] hover:bg-[#d48c1c] disabled:opacity-60 text-white py-3 rounded-xl text-[15px] font-semibold transition-colors flex items-center justify-center gap-2 border-none cursor-pointer font-[inherit]">
        {loading ? <><span className="animate-spin inline-block">⟳</span> Generating code…</> : <>Generate payment code</>}
      </button>
      <p className="text-[11px] text-[#888] text-center mt-3">Code is valid for 48 hours · available at 150,000+ outlets</p>
    </div>
  )
}

// ─── SUCCESS SCREEN ───────────────────────────────────────────────────────────
function SuccessScreen({ plan, method }: { plan: string; method: PaymentMethod }) {
  const router = useRouter()
  const methodLabel = METHODS.find(m => m.id === method)?.label ?? method

  useEffect(() => {
    sessionStorage.removeItem("selectedPlan")
    const timer = setTimeout(() => router.replace("/dashboard"), 2500)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="text-center py-8">
      {/* Animated checkmark */}
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="w-24 h-24 rounded-full bg-[#E1F5EE] flex items-center justify-center">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <circle cx="22" cy="22" r="21" stroke="#1D9E75" strokeWidth="2"/>
            <path d="M12 22l7 7 13-14" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ strokeDasharray: 30, strokeDashoffset: 0, animation: "draw .6s ease forwards" }} />
          </svg>
        </div>
      </div>

      <h2 className="text-[24px] font-bold text-[#1a1830] mb-2">Payment successful!</h2>
      <p className="text-[14px] text-[#64607a] mb-2">
        Your <strong>{plan}</strong> plan is now active.<br/>
        Paid via <strong>{methodLabel}</strong>.
      </p>
      <p className="text-[13px] text-[#888] mb-6">Redirecting to your dashboard…</p>

      <div className="bg-[#f6f5fc] rounded-2xl p-5 mb-6 text-left">
        {[
          { label: "Plan", value: plan },
          { label: "Status", value: "✓ Active", color: "#1D9E75" },
          { label: "Payment method", value: methodLabel },
          { label: "Date", value: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) },
        ].map(r => (
          <div key={r.label} className="flex justify-between py-2 border-b border-[#e8e6f0] last:border-none">
            <span className="text-[13px] text-[#888]">{r.label}</span>
            <span className="text-[13px] font-medium" style={{ color: r.color ?? "#1a1830" }}>{r.value}</span>
          </div>
        ))}
      </div>

      <button onClick={() => router.push("/dashboard")}
        className="w-full bg-[#534AB7] hover:bg-[#3C3489] text-white py-3 rounded-xl text-[15px] font-semibold transition-colors border-none cursor-pointer font-[inherit] mb-3">
        Go to dashboard →
      </button>
      <Link href="/" className="block text-center text-[13px] text-[#534AB7] hover:underline no-underline">Back to home</Link>

      <style>{`@keyframes draw { from { stroke-dashoffset: 30 } to { stroke-dashoffset: 0 } }`}</style>
    </div>
  )
}

// ─── PROCESSING SCREEN ────────────────────────────────────────────────────────
function ProcessingScreen() {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 rounded-full bg-[#EEEDFE] flex items-center justify-center mx-auto mb-6">
        <div className="w-8 h-8 border-[3px] border-[#534AB7] border-t-transparent rounded-full animate-spin" />
      </div>
      <h3 className="text-[18px] font-semibold text-[#1a1830] mb-2">Processing payment…</h3>
      <p className="text-[13px] text-[#888]">Please don't close this page</p>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
function PaymentPageContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { refreshUser } = useAuth()

  const [dbPlan, setDbPlan]           = useState<PricingPlan | null>(null)
  const [isAnnual, setIsAnnual]       = useState(false)
  const [amount, setAmount]           = useState(0)
  const [plansLoading, setPlansLoading] = useState(true)
  const [plansError, setPlansError]   = useState("")

  const [method,  setMethod]  = useState<PaymentMethod | null>(null)
  const [step,    setStep]    = useState<Step>("method")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadPlan() {
      try {
        const plans = await api.getPlans()
        const planIdParam = searchParams.get("planId")
        const stored = sessionStorage.getItem("selectedPlan")
        let selectedId = planIdParam
        let annual = searchParams.get("annual") === "true"

        if (stored) {
          try {
            const parsed = JSON.parse(stored) as {
              id?: string
              annual?: boolean
              price?: number
            }
            selectedId = parsed.id ?? selectedId
            if (parsed.annual !== undefined) annual = parsed.annual
          } catch {
            // ignore malformed session data
          }
        }

        const matched =
          plans.find((p) => p.id === selectedId) ?? plans[0] ?? null

        if (!matched) {
          setPlansError("No active plans found. Please contact support.")
          return
        }

        let monthlyAmount = matched.priceMonthly
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as { price?: number }
            if (typeof parsed.price === "number") monthlyAmount = parsed.price
          } catch {
            // ignore
          }
        }

        setDbPlan(matched)
        setIsAnnual(annual)
        setAmount(monthlyAmount)
      } catch (err) {
        setPlansError(
          err instanceof Error ? err.message : "Failed to load pricing plans",
        )
      } finally {
        setPlansLoading(false)
      }
    }

    loadPlan()
  }, [searchParams])

  if (plansLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-[#64607a] text-sm">Loading your plan…</div>
      </div>
    )
  }

  if (plansError || !dbPlan) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-[#64607a] text-sm text-center">{plansError ?? "Plan not found."}</p>
        <Link href="/pricing" className="text-[#534AB7] text-sm font-medium no-underline">
          ← Back to pricing
        </Link>
      </div>
    )
  }

  const plan = {
    name: dbPlan.name,
    price: dbPlan.priceMonthly,
    annual: Math.round(dbPlan.priceMonthly * 0.8),
  }

  const handlePay = async () => {
    if (!dbPlan) return
    setLoading(true)
    setStep("processing")
    try {
      await api.completePayment({
        pricingId: dbPlan.id,
        amount: isAnnual ? amount * 12 : amount,
        currency: "EGP",
        isAnnual,
      })
      await refreshUser()
      setLoading(false)
      setStep("success")
    } catch (err) {
      setLoading(false)
      setStep("details")
      alert(err instanceof Error ? err.message : "Payment failed")
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#e8e6f0] h-14 px-6 flex items-center justify-between shrink-0">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-7 h-7 bg-[#534AB7] rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span className="text-[#1a1830] text-[14px] font-bold">SupportNest</span>
        </Link>
        <div className="flex items-center gap-1.5 text-[12px] text-[#888]">
          <span>🔒</span> Secure checkout
        </div>
      </header>

      <div className="flex-1 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-[960px] grid gap-6" style={{ gridTemplateColumns: "1fr 380px" }}>

          {/* ── Left: payment form ──────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#e8e6f0] p-7">

            {step === "processing" && <ProcessingScreen />}
            {step === "success"    && <SuccessScreen plan={plan.name} method={method!} />}

            {(step === "method" || step === "details") && (
              <>
                {/* Back button */}
                {step === "details" && (
                  <button onClick={() => setStep("method")}
                    className="flex items-center gap-1.5 text-[13px] text-[#888] hover:text-[#1a1830] mb-5 border-none bg-transparent cursor-pointer font-[inherit] transition-colors">
                    ← Change payment method
                  </button>
                )}

                {/* Method picker */}
                {step === "method" && (
                  <>
                    <h2 className="text-[18px] font-bold text-[#1a1830] mb-1">Choose payment method</h2>
                    <p className="text-[13px] text-[#888] mb-6">All payments are encrypted and secure</p>
                    <div className="grid grid-cols-1 gap-3">
                      {METHODS.map(m => (
                        <button key={m.id} onClick={() => { setMethod(m.id); setStep("details") }}
                          className="flex items-center gap-4 p-4 rounded-xl border-[1.5px] border-[#e8e6f0] hover:border-[#534AB7] hover:bg-[#EEEDFE]/30 transition-all cursor-pointer bg-white text-left font-[inherit]">
                          <div className="shrink-0">{m.logo}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-semibold text-[#1a1830]">{m.label}</div>
                            <div className="text-[12px] text-[#888]">{m.sub}</div>
                          </div>
                          <span className="text-[#888] text-lg">›</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Payment form */}
                {step === "details" && method && (
                  <>
                    <h2 className="text-[18px] font-bold text-[#1a1830] mb-1">
                      {METHODS.find(m2 => m2.id === method)?.label}
                    </h2>
                    <p className="text-[13px] text-[#888] mb-6">
                      {METHODS.find(m2 => m2.id === method)?.sub}
                    </p>

                    {(method === "mastercard" || method === "visa") && (
                      <CardForm method={method} onPay={handlePay} loading={loading} />
                    )}
                    {method === "vodafone" && (
                      <VodafoneForm onPay={handlePay} loading={loading} />
                    )}
                    {method === "instapay" && (
                      <InstapayForm onPay={handlePay} loading={loading} amount={amount} />
                    )}
                    {method === "fawry" && (
                      <FawryForm onPay={handlePay} loading={loading} amount={amount} />
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* ── Right: order summary ────────────────────── */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-[#e8e6f0] p-6">
              <h3 className="text-[14px] font-bold text-[#1a1830] mb-4">Order summary</h3>
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-[#e8e6f0]">
                <div className="w-10 h-10 rounded-xl bg-[#EEEDFE] flex items-center justify-center shrink-0">
                  <span className="text-lg">⚡</span>
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-[#1a1830]">SupportNest {plan.name}</div>
                  <div className="text-[12px] text-[#888]">{isAnnual ? "Annual billing" : "Monthly billing"}</div>
                </div>
              </div>
              <div className="space-y-2.5 mb-5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#888]">Subtotal</span>
                  <span className="text-[#1a1830]">EGP {amount}/mo</span>
                </div>
                {isAnnual && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#888]">Annual discount</span>
                    <span className="text-[#1D9E75]">-25%</span>
                  </div>
                )}
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#888]">Tax</span>
                  <span className="text-[#1a1830]">EGP 0.00</span>
                </div>
              </div>
              <div className="flex justify-between pt-4 border-t border-[#e8e6f0]">
                <span className="text-[15px] font-bold text-[#1a1830]">Total today</span>
                <span className="text-[20px] font-bold text-[#534AB7]">EGP {isAnnual ? amount * 12 : amount}</span>
              </div>
              {isAnnual && (
                <div className="mt-3 bg-[#E1F5EE] rounded-lg px-3 py-2 text-[11px] text-[#0F6E56] font-medium">
                  ✓ You save EGP {((plan.price ?? 0) - (plan.annual ?? 0)) * 12}/year with annual billing
                </div>
              )}
            </div>

            {/* What's included */}
            <div className="bg-white rounded-2xl border border-[#e8e6f0] p-5">
              <div className="text-[12px] font-bold text-[#888] uppercase tracking-wider mb-3">What's included</div>
              {[
                "AI Router + Tier 1 + Tier 2 agents",
                "Embeddable live chat widget",
                "Knowledge base RAG",
                "Human agent inbox",
                "Real-time analytics dashboard",
                "API access + webhooks",
              ].map(f => (
                <div key={f} className="flex items-start gap-2 mb-2 last:mb-0">
                  <span className="text-[#1D9E75] text-sm shrink-0 mt-0.5">✓</span>
                  <span className="text-[12px] text-[#64607a]">{f}</span>
                </div>
              ))}
            </div>

            {/* Trust badges */}
            <div className="bg-[#f6f5fc] rounded-xl p-4">
              {[
                { icon: "🔒", text: "256-bit SSL encryption" },
                { icon: "↩", text: "14-day money-back guarantee" },
                { icon: "⚡", text: "Instant activation after payment" },
              ].map(b => (
                <div key={b.text} className="flex items-center gap-2.5 mb-2 last:mb-0">
                  <span className="text-base">{b.icon}</span>
                  <span className="text-[12px] text-[#64607a]">{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <PaymentRoute>
      <PaymentPageContent />
    </PaymentRoute>
  )
}