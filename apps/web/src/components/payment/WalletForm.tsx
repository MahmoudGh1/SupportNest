"use client";

import { useState } from "react";
import { T, inputStyle, labelStyle, formatPhone } from "@/types/payment.types";

// ── Shared phone input ─────────────────────────────────────────────────────────
function PhoneInput({
  value,
  onChange,
  accentColor,
}: {
  value: string;
  onChange: (v: string) => void;
  accentColor: string;
}) {
  return (
    <div style={{ position: "relative" }}>
      <div style={{
        position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
        fontSize: 13, fontWeight: 500, color: T.gray300, pointerEvents: "none",
      }}>+20</div>
      <input
        value={value}
        onChange={e => onChange(formatPhone(e.target.value))}
        placeholder="01X XXX XXXX"
        style={{ ...inputStyle, paddingLeft: 48 }}
        onFocus={e => (e.currentTarget.style.borderColor = accentColor)}
        onBlur={e => (e.currentTarget.style.borderColor = T.darkBorder2)}
      />
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
      borderRadius: T.radius, padding: "10px 14px", marginBottom: 14,
      fontSize: 13, color: T.errorText,
    }}>
      ⚠ {message}
    </div>
  );
}

// ── Vodafone Cash ──────────────────────────────────────────────────────────────
interface VodafoneFormProps {
  loading: boolean;
  onPay: (phone: string) => void;
}

export function VodafoneForm({ loading, onPay }: VodafoneFormProps) {
  const [phone, setPhone] = useState("");
  const [pin, setPin]     = useState("");
  const [error, setError] = useState("");

  const handlePay = () => {
    if (phone.length < 11) { setError("Enter a valid 11-digit Vodafone number"); return; }
    if (pin.length < 4)    { setError("Enter your 4-digit wallet PIN"); return; }
    setError("");
    onPay(phone);
  };

  return (
    <div>
      <div style={{ background: "rgba(230,0,0,0.08)", border: "1.5px solid rgba(230,0,0,0.2)", borderRadius: T.radiusLg, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#E60000", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "white", fontSize: 20, fontWeight: 700 }}>V</span>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>Vodafone Cash</div>
          <div style={{ fontSize: 12, color: T.gray300 }}>Pay securely from your Vodafone wallet</div>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Vodafone number</label>
          <PhoneInput value={phone} onChange={setPhone} accentColor="#E60000" />
        </div>
        <div>
          <label style={labelStyle}>Wallet PIN</label>
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="••••"
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = "#E60000")}
            onBlur={e => (e.currentTarget.style.borderColor = T.darkBorder2)}
          />
        </div>
      </div>

      <div style={{ background: T.darkSurface2, borderRadius: T.radiusLg, padding: "14px 16px", margin: "16px 0" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.gray500, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>How it works</div>
        {["Enter your number and PIN above", "Confirm the payment on your phone", "Done — your plan activates instantly"].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: i < 2 ? 8 : 0 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#E60000", color: "white", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
            <span style={{ fontSize: 12, color: T.gray300 }}>{s}</span>
          </div>
        ))}
      </div>

      <button onClick={handlePay} disabled={loading} style={{
        width: "100%", padding: "13px",
        background: loading ? "rgba(230,0,0,0.6)" : "#E60000",
        color: T.white, border: "none", borderRadius: T.radius,
        fontSize: 15, fontWeight: 600, fontFamily: T.font,
        cursor: loading ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {loading ? "Processing…" : "✓ Confirm payment"}
      </button>
      <p style={{ textAlign: "center", fontSize: 11, color: T.gray500, marginTop: 10 }}>Secured by Vodafone Cash · EGP regulated</p>
    </div>
  );
}

// ── InstaPay ───────────────────────────────────────────────────────────────────
interface InstapayFormProps {
  loading: boolean;
  amount: number;
  onPay: (phone: string) => void;
}

export function InstapayForm({ loading, amount, onPay }: InstapayFormProps) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handlePay = () => {
    if (phone.length < 11) { setError("Enter a valid 11-digit phone number"); return; }
    setError("");
    onPay(phone);
  };

  return (
    <div>
      <div style={{ background: "rgba(0,166,81,0.08)", border: "1.5px solid rgba(0,166,81,0.2)", borderRadius: T.radiusLg, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: T.radius, background: "#00A651", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "white", fontSize: 11, fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>Insta<br />Pay</span>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>InstaPay</div>
          <div style={{ fontSize: 12, color: T.gray300 }}>Egyptian instant bank transfer</div>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Phone number linked to InstaPay</label>
        <PhoneInput value={phone} onChange={setPhone} accentColor="#00A651" />
      </div>

      <div style={{ background: T.darkSurface2, borderRadius: T.radiusLg, padding: 20, marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 11, color: T.gray500, marginBottom: 6 }}>Amount to transfer</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: T.white }}>EGP {(amount * 50).toLocaleString()}</div>
        <div style={{ fontSize: 11, color: T.gray500, marginTop: 4 }}>≈ ${amount} USD · rate may vary</div>
      </div>

      <button onClick={handlePay} disabled={loading} style={{
        width: "100%", padding: "13px",
        background: loading ? "rgba(0,166,81,0.6)" : "#00A651",
        color: T.white, border: "none", borderRadius: T.radius,
        fontSize: 15, fontWeight: 600, fontFamily: T.font,
        cursor: loading ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {loading ? "Processing…" : "⚡ Pay with InstaPay"}
      </button>
      <p style={{ textAlign: "center", fontSize: 11, color: T.gray500, marginTop: 10 }}>You'll receive an OTP to confirm on your banking app</p>
    </div>
  );
}

// ── Fawry ──────────────────────────────────────────────────────────────────────
interface FawryFormProps {
  loading: boolean;
  amount: number;
  referenceCode?: string;
  onPay: () => void;
}

export function FawryForm({ loading, amount, referenceCode, onPay }: FawryFormProps) {
  const [phone, setPhone] = useState("");
  // eslint-disable-next-line react-hooks/purity
  const ref = referenceCode ?? `FWR-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

  return (
    <div>
      <div style={{ background: "rgba(245,166,35,0.08)", border: "1.5px solid rgba(245,166,35,0.2)", borderRadius: T.radiusLg, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: T.radius, background: "#F5A623", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>fawry</span>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>Fawry</div>
          <div style={{ fontSize: 12, color: T.gray300 }}>Pay at any Fawry outlet near you</div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Your phone number</label>
        <PhoneInput value={phone} onChange={setPhone} accentColor="#F5A623" />
      </div>

      <div style={{ background: T.darkSurface2, borderRadius: T.radiusLg, padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.gray500, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Your payment reference</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.darkSurface, borderRadius: T.radius, border: `1px solid ${T.darkBorder2}`, padding: "10px 14px", marginBottom: 14 }}>
          <span style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: T.violet, letterSpacing: "0.15em" }}>{ref}</span>
          <button
            onClick={() => navigator.clipboard?.writeText(ref)}
            style={{ fontSize: 11, color: T.violet, fontWeight: 500, border: "none", background: "transparent", cursor: "pointer", fontFamily: T.font }}
          >
            Copy
          </button>
        </div>
        {[
          "Go to any Fawry outlet or use the Fawry app",
          "Give the cashier this reference code",
          `Pay EGP ${(amount * 50).toLocaleString()} — plan activates within 1 hour`,
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: i < 2 ? 8 : 0 }}>
            <span style={{ color: "#F5A623", fontSize: 14, flexShrink: 0, marginTop: 1 }}>{"①②③"[i]}</span>
            <span style={{ fontSize: 12, color: T.gray300 }}>{s}</span>
          </div>
        ))}
      </div>

      <button onClick={onPay} disabled={loading} style={{
        width: "100%", padding: "13px",
        background: loading ? "rgba(245,166,35,0.6)" : "#F5A623",
        color: T.white, border: "none", borderRadius: T.radius,
        fontSize: 15, fontWeight: 600, fontFamily: T.font,
        cursor: loading ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {loading ? "Generating code…" : "Generate payment code"}
      </button>
      <p style={{ textAlign: "center", fontSize: 11, color: T.gray500, marginTop: 10 }}>Code valid 48 hours · 150,000+ outlets nationwide</p>
    </div>
  );
}