"use client";

import { useRouter } from "next/navigation";
import { T } from "@/types/payment.types";
import type { PaymentMethod } from "@/types/payment.types";
import { PAYMENT_METHODS } from "@/types/payment.types";

// ── Processing ─────────────────────────────────────────────────────────────────
export function ProcessingScreen() {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: T.violetMuted,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            border: `3px solid ${T.violet}`,
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
      <h3
        style={{
          fontSize: 17,
          fontWeight: 600,
          color: T.white,
          margin: "0 0 6px",
        }}
      >
        Processing payment…
      </h3>
      <p style={{ fontSize: 13, color: T.gray500, margin: 0 }}>
        Please don&apos;t close this page
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

// ── Success ────────────────────────────────────────────────────────────────────
interface SuccessScreenProps {
  planName: string;
  methodId: PaymentMethod;
}

export function SuccessScreen({ planName, methodId }: SuccessScreenProps) {
  const router = useRouter();
  const methodLabel =
    PAYMENT_METHODS.find((m) => m.id === methodId)?.label ?? methodId;

  const rows = [
    { label: "Plan", value: planName },
    { label: "Status", value: "✓ Active", color: T.successText },
    { label: "Payment method", value: methodLabel },
    {
      label: "Date",
      value: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    },
  ];

  return (
    <div style={{ textAlign: "center", padding: "32px 16px" }}>
      {/* Animated checkmark */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: T.successBg,
          border: `2px solid ${T.successBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
        }}
      >
        <svg width="36" height="36" viewBox="0 0 44 44" fill="none">
          <path
            d="M10 22l9 9 15-16"
            stroke="#4ade80"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 40,
              strokeDashoffset: 0,
              animation: "draw .6s ease forwards",
            }}
          />
        </svg>
      </div>

      <h2
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: T.white,
          margin: "0 0 8px",
        }}
      >
        Payment successful!
      </h2>
      <p
        style={{
          fontSize: 14,
          color: T.gray300,
          margin: "0 0 24px",
          lineHeight: 1.6,
        }}
      >
        Your <strong style={{ color: T.white }}>{planName}</strong> plan is now
        active.
        <br />
        Paid via <strong style={{ color: T.white }}>{methodLabel}</strong>.
      </p>

      <div
        style={{
          background: T.darkSurface2,
          borderRadius: T.radiusLg,
          padding: 20,
          marginBottom: 24,
          textAlign: "left",
        }}
      >
        {rows.map((row, i) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 0",
              borderBottom:
                i < rows.length - 1 ? `1px solid ${T.darkBorder}` : "none",
            }}
          >
            <span style={{ fontSize: 13, color: T.gray500 }}>{row.label}</span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: row.color ?? T.white,
              }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={() => router.push("/dashboard")}
        style={{
          width: "100%",
          padding: "13px",
          background: T.violet,
          color: T.white,
          border: "none",
          borderRadius: T.radius,
          fontSize: 15,
          fontWeight: 600,
          fontFamily: T.font,
          cursor: "pointer",
        }}
      >
        Go to dashboard →
      </button>

      <style>{`@keyframes draw { from { stroke-dashoffset: 40 } to { stroke-dashoffset: 0 } }`}</style>
    </div>
  );
}
