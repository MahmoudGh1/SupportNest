"use client";

import { T, PAYMENT_METHODS } from "@/types/payment.types";
import type { PaymentMethod } from "@/types/payment.types";
import {
  MastercardLogo,
  VisaLogo,
  VodafoneLogo,
  InstapayLogo,
  FawryLogo,
} from "./PaymentLogos";

// ── Logo map ───────────────────────────────────────────────────────────────────
const LOGOS: Record<PaymentMethod, React.ReactNode> = {
  mastercard: <MastercardLogo />,
  visa: <VisaLogo />,
  vodafone: <VodafoneLogo />,
  instapay: <InstapayLogo />,
  fawry: <FawryLogo />,
};

// ── Method picker ──────────────────────────────────────────────────────────────
interface MethodPickerProps {
  onSelect: (method: PaymentMethod) => void;
}

export function MethodPicker({ onSelect }: MethodPickerProps) {
  return (
    <>
      <h2
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: T.white,
          margin: "0 0 4px",
        }}
      >
        Choose payment method
      </h2>
      <p style={{ fontSize: 13, color: T.gray500, margin: "0 0 20px" }}>
        All payments are encrypted and secure
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 16px",
              borderRadius: T.radiusLg,
              border: `1.5px solid ${T.darkBorder2}`,
              background: "transparent",
              cursor: "pointer",
              textAlign: "left",
              fontFamily: T.font,
              transition: "border-color .15s, background .15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = T.violet;
              (e.currentTarget as HTMLElement).style.background = T.violetMuted;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                T.darkBorder2;
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <div style={{ flexShrink: 0 }}>{LOGOS[m.id]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.white }}>
                {m.label}
              </div>
              <div style={{ fontSize: 12, color: T.gray500 }}>{m.sub}</div>
            </div>
            <span style={{ color: T.gray500, fontSize: 18 }}>›</span>
          </button>
        ))}
      </div>
    </>
  );
}

// ── Paymob iframe overlay ──────────────────────────────────────────────────────
interface PaymobIframeProps {
  url: string;
  onClose: () => void;
}

export function PaymobIframe({ url, onClose }: PaymobIframeProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: T.darkSurface,
          borderRadius: T.radiusXl,
          overflow: "hidden",
          border: `1px solid ${T.darkBorder2}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: `1px solid ${T.darkBorder}`,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: T.white }}>
            🔒 Secure Payment · Paymob
          </span>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: T.gray300,
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
        <iframe
          src={url}
          style={{
            width: "100%",
            height: 520,
            border: "none",
            display: "block",
          }}
          title="Paymob payment"
        />
      </div>
    </div>
  );
}

// ── Order summary header ───────────────────────────────────────────────────────
interface OrderHeaderProps {
  planName: string;
  planPrice: number;
}

export function OrderHeader({ planName, planPrice }: OrderHeaderProps) {
  return (
    <div
      style={{
        background: T.darkSurface2,
        borderBottom: `1px solid ${T.darkBorder}`,
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: T.violetMuted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span>⚡</span>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>
            SupportNest {planName}
          </div>
          <div style={{ fontSize: 11, color: T.gray500 }}>Monthly billing</div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.violet }}>
          ${planPrice}
        </div>
        <div style={{ fontSize: 11, color: T.gray500 }}>per month</div>
      </div>
    </div>
  );
}

// ── Trust badges ───────────────────────────────────────────────────────────────
export function TrustBadges() {
  const badges = [
    { icon: "🔒", text: "256-bit SSL encryption" },
    { icon: "↩", text: "14-day money-back guarantee" },
    { icon: "⚡", text: "Instant activation after payment" },
  ];

  return (
    <div
      style={{
        background: T.darkSurface,
        border: `1px solid ${T.darkBorder}`,
        borderRadius: T.radiusLg,
        padding: "14px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {badges.map((b) => (
        <div
          key={b.text}
          style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
          <span style={{ fontSize: 14 }}>{b.icon}</span>
          <span style={{ fontSize: 12, color: T.gray500 }}>{b.text}</span>
        </div>
      ))}
    </div>
  );
}
