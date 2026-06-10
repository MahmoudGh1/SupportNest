"use client";

import { usePlan } from "@/context/plan-context";

const T = {
    white: "#FFFFFF",
    gray500: "#888888",
    darkSurface: "#1E1E1E",
    darkBorder: "rgba(255,255,255,0.08)",
    darkBorder2: "rgba(255,255,255,0.12)",
    radius: "10px",
    radiusLg: "14px",
    font: "'Sora', system-ui, sans-serif",
} as const;

export interface RegistrationData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    businessName: string;
    industry: string;
    size: string;
}

interface Props {
    registrationData: RegistrationData;
    onBack: () => void;
}

export function PaymentStep({ registrationData, onBack }: Props) {
    const { selectedPlan } = usePlan();

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/*
       * ═══════════════════════════════════════════════════════════════
       * 👋 TEAMMATE — YOUR PAYMENT COMPONENT GOES HERE
       *
       * You have access to:
       *
       * registrationData = {
       *   firstName, lastName, email,
       *   password, industry, size
       * }
       *
       * selectedPlan = {
       *   id, name, price, currency, features
       * }  ← from usePlan() hook, already imported above
       *
       * When payment succeeds → redirect user to /login
       * When payment fails   → show error inside your component
       *
       * DO NOT remove the onBack button below.
       * ═══════════════════════════════════════════════════════════════
       */}

            <div style={{
                background: T.darkSurface,
                border: `1px solid ${T.darkBorder}`,
                borderRadius: T.radiusLg,
                padding: "40px 32px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                minHeight: 240,
            }}>
                <i className="ti ti-credit-card" style={{ fontSize: 36, color: T.gray500 }} />
                <p style={{ fontSize: 14, color: T.gray500, margin: 0, textAlign: "center" }}>
                    Payment component — awaiting teammate
                </p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", margin: 0, textAlign: "center" }}>
                    Plan: {selectedPlan?.name} · ${selectedPlan?.price}/mo
                </p>
            </div>

            <button
                onClick={onBack}
                style={{
                    width: "100%",
                    padding: "12px",
                    background: "transparent",
                    color: "rgba(255,255,255,0.45)",
                    border: `1.5px solid ${T.darkBorder2}`,
                    borderRadius: T.radius,
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: T.font,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "border-color .15s, color .15s",
                }}
                onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)";
                    (e.currentTarget as HTMLElement).style.color = T.white;
                }}
                onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = T.darkBorder2;
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)";
                }}
            >
                <i className="ti ti-arrow-left" style={{ fontSize: 16 }} />
                Back to Account Details
            </button>
        </div>
    );
}