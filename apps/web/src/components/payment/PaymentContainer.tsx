"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "api-production-e60c.up.railway.app/api/v1";
const PAYMOB_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYMOB_KEY ?? "egy_pk_test_24gr1hEc6j0YheiEeIh2oailmkBszFKX";

// ── Design tokens (matches registration dark theme) ──────────────────────────
const T = {
    white:        "#FFFFFF",
    violet:       "#534AB7",
    violetHover:  "#6259D0",
    green:        "#1D9E75",
    darkSurface:  "#1E1E1E",
    darkSurface2: "#252525",
    darkBorder:   "rgba(255,255,255,0.08)",
    darkBorder2:  "rgba(255,255,255,0.12)",
    gray300:      "rgba(255,255,255,0.55)",
    gray500:      "rgba(255,255,255,0.30)",
    gray700:      "rgba(255,255,255,0.15)",
    errorBg:      "rgba(220,38,38,0.12)",
    errorText:    "#f87171",
    infoBg:       "rgba(83,74,183,0.15)",
    infoText:     "#a5b4fc",
    radius:       "10px",
    radiusLg:     "14px",
    font:         "'Sora', system-ui, sans-serif",
} as const;

interface StoredPlan {
    id:          string;
    name:        string;
    price:       number;
    annual:      boolean;
    amountCents: number;
}

interface PaymentContainerProps {
    registerData: {
        firstName: string;
        lastName:  string;
        email:     string;
        phone:     string;
    };
    onSuccess: (token: string) => void;
    onError:   (message: string) => void;
}

export default function PaymentContainer({
    registerData,
    onSuccess,
    onError,
}: PaymentContainerProps) {
    const [storedPlan, setStoredPlan] = useState<StoredPlan | null>(null);
    const [annual,     setAnnual]     = useState(false);
    const [paying,     setPaying]     = useState(false);
    const [error,      setError]      = useState("");
    const [loading,    setLoading]    = useState(true);

    useEffect(() => {
        const raw = sessionStorage.getItem("selectedPlan");
        if (raw) {
            try {
                const parsed: StoredPlan = JSON.parse(raw);
                setStoredPlan(parsed);
                setAnnual(parsed.annual);
            } catch {
                setError("Could not load your selected plan. Please go back and select a plan.");
            }
        } else {
            setError("No plan selected. Please choose a plan first.");
        }
        setLoading(false);
    }, []);

    function getMonthlyPrice(): number {
        if (!storedPlan) return 0;
        if (annual && !storedPlan.annual)  return Math.round(storedPlan.price * 0.8);
        if (!annual && storedPlan.annual)  return Math.round(storedPlan.price / 0.8);
        return storedPlan.price;
    }

    function getTotalToday(): number {
        return annual ? getMonthlyPrice() * 12 : getMonthlyPrice();
    }

    async function handlePay() {
        if (!storedPlan) {
            setError("Session expired. Please go back and choose a plan.");
            return;
        }
        setPaying(true);
        setError("");

        try {
            const res = await fetch(`${API_BASE}/payments/create-intention`, {
                method:      "POST",
                headers:     { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    pricingId:   storedPlan.id,
                    amountCents: getTotalToday() * 100,
                    currency:    "EGP",
                    billingData: {
                        firstName: registerData.firstName,
                        lastName:  registerData.lastName,
                        email:     registerData.email,
                        phone:     registerData.phone,
                    },
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                const msg = result.error || result.message || "Payment setup failed";
                setError(msg);
                onError(msg);
                setPaying(false);
                return;
            }

            
            window.location.href =
                `https://accept.paymob.com/unifiedcheckout/?publicKey=${PAYMOB_PUBLIC_KEY}&clientSecret=${result.clientSecret}`;
        } catch (err) {
            const msg = `Something went wrong: ${err instanceof Error ? err.message : String(err)}`;
            console.error("Payment error:", err);
            setError(msg);
            onError(msg);
            setPaying(false);
        }
    }

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{
                display:        "flex",
                flexDirection:  "column",
                alignItems:     "center",
                justifyContent: "center",
                gap:            12,
                padding:        40,
                background:     T.darkSurface,
                borderRadius:   T.radiusLg,
                border:         `1px solid ${T.darkBorder}`,
                minHeight:      180,
            }}>
                <i className="ti ti-loader-2" style={{ fontSize: 28, color: T.gray500 }} />
                <p style={{ fontSize: 14, color: T.gray500, margin: 0 }}>Loading your plan…</p>
            </div>
        );
    }

    // ── No plan ───────────────────────────────────────────────────────────────
    if (!storedPlan) {
        return (
            <div style={{
                display:        "flex",
                flexDirection:  "column",
                alignItems:     "center",
                justifyContent: "center",
                gap:            16,
                padding:        40,
                background:     T.darkSurface,
                borderRadius:   T.radiusLg,
                border:         `1px solid ${T.darkBorder}`,
                minHeight:      180,
                textAlign:      "center",
            }}>
                <i className="ti ti-alert-circle" style={{ fontSize: 32, color: T.errorText }} />
                <p style={{ fontSize: 14, color: T.errorText, margin: 0, fontWeight: 500 }}>
                    No plan selected.
                </p>
                <Link
                    href="/pricing"
                    style={{
                        background:     T.violet,
                        color:          T.white,
                        borderRadius:   T.radius,
                        padding:        "10px 24px",
                        textDecoration: "none",
                        fontSize:       14,
                        fontWeight:     600,
                        fontFamily:     T.font,
                    }}
                >
                    ← Choose a plan
                </Link>
            </div>
        );
    }

    // ── Main render ───────────────────────────────────────────────────────────
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* ── Selected plan summary ───────────────────────────────────── */}
            <div style={{
                background:   T.darkSurface,
                border:       `1px solid ${T.darkBorder2}`,
                borderRadius: T.radiusLg,
                padding:      "18px 20px",
            }}>
                <p style={{
                    fontSize:      11,
                    fontWeight:    600,
                    color:         T.violet,
                    marginBottom:  10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    margin:        "0 0 10px",
                }}>
                    Selected Plan
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <p style={{ fontWeight: 700, fontSize: 17, color: T.white, margin: "0 0 3px" }}>
                            {storedPlan.name}
                        </p>
                        <p style={{ fontSize: 13, color: T.gray300, margin: 0 }}>
                            {storedPlan.annual ? "Annual billing" : "Monthly billing"}
                        </p>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 22, color: T.white }}>
                        EGP {getMonthlyPrice()}
                        <span style={{ fontSize: 13, fontWeight: 400, color: T.gray500 }}>/mo</span>
                    </div>
                </div>
                <Link
                    href="/pricing"
                    style={{
                        fontSize:    12,
                        color:       T.gray500,
                        marginTop:   10,
                        display:     "inline-block",
                        textDecoration: "none",
                    }}
                >
                    ← Change plan
                </Link>
            </div>

            {/* ── Billing cycle toggle ────────────────────────────────────── */}
            <div style={{
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                gap:            12,
                padding:        "14px 0",
            }}>
                <span style={{
                    fontSize:   14,
                    color:      !annual ? T.white : T.gray500,
                    fontWeight: !annual ? 600 : 400,
                    transition: "color .2s",
                }}>
                    Monthly
                </span>

                {/* Toggle pill */}
                <button
                    onClick={() => setAnnual(a => !a)}
                    aria-label="Toggle billing cycle"
                    style={{
                        width:      44,
                        height:     24,
                        borderRadius: 99,
                        background: annual ? T.violet : T.darkBorder2,
                        border:     "none",
                        cursor:     "pointer",
                        position:   "relative",
                        transition: "background 0.2s",
                        flexShrink: 0,
                    }}
                >
                    <div style={{
                        width:        18,
                        height:       18,
                        borderRadius: "50%",
                        background:   T.white,
                        position:     "absolute",
                        top:          3,
                        left:         annual ? 23 : 3,
                        transition:   "left 0.2s",
                        boxShadow:    "0 1px 4px rgba(0,0,0,0.35)",
                    }} />
                </button>

                <span style={{
                    fontSize:   14,
                    color:      annual ? T.white : T.gray500,
                    fontWeight: annual ? 600 : 400,
                    display:    "flex",
                    alignItems: "center",
                    gap:        6,
                    transition: "color .2s",
                }}>
                    Annual
                    <span style={{
                        background:    "rgba(29,158,117,0.18)",
                        color:         T.green,
                        fontSize:      11,
                        fontWeight:    700,
                        padding:       "2px 7px",
                        borderRadius:  99,
                    }}>
                        Save 20%
                    </span>
                </span>
            </div>

            {/* ── Order summary ───────────────────────────────────────────── */}
            <div style={{
                background:   T.darkSurface,
                border:       `1px solid ${T.darkBorder}`,
                borderRadius: T.radiusLg,
                padding:      "16px 20px",
            }}>
                <p style={{
                    fontSize:      11,
                    fontWeight:    600,
                    color:         T.gray700,
                    marginBottom:  12,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    margin:        "0 0 12px",
                }}>
                    Order Summary
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <Row label={`${storedPlan.name} Plan`}    value={`EGP ${getMonthlyPrice()}/mo`} />
                    <Row label="Billing cycle"                 value={annual ? "Annual" : "Monthly"} />
                    {annual && (
                        <Row label="Annual total" value={`EGP ${getMonthlyPrice() * 12}/yr`} />
                    )}
                </div>

                {/* Account info */}
                <div style={{
                    borderTop:   `1px solid ${T.darkBorder}`,
                    marginTop:   12,
                    paddingTop:  12,
                }}>
                    <p style={{ fontSize: 11, color: T.gray700, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Account
                    </p>
                    <p style={{ fontSize: 13, color: T.white, fontWeight: 500, margin: "0 0 2px" }}>
                        {registerData.firstName} {registerData.lastName}
                    </p>
                    <p style={{ fontSize: 12, color: T.gray500, margin: 0 }}>
                        {registerData.email}
                    </p>
                </div>

                {/* Total */}
                <div style={{
                    borderTop:      `1px solid ${T.darkBorder}`,
                    marginTop:      12,
                    paddingTop:     12,
                    display:        "flex",
                    justifyContent: "space-between",
                    alignItems:     "center",
                }}>
                    <span style={{ fontWeight: 700, color: T.white, fontSize: 14 }}>Total today</span>
                    <span style={{ fontWeight: 700, fontSize: 20, color: T.violet }}>
                        EGP {getTotalToday()}
                    </span>
                </div>
            </div>

            {/* ── Error ───────────────────────────────────────────────────── */}
            {error && (
                <div style={{
                    background:   T.errorBg,
                    color:        T.errorText,
                    borderRadius: T.radius,
                    padding:      "10px 14px",
                    fontSize:     14,
                    display:      "flex",
                    alignItems:   "center",
                    gap:          8,
                }}>
                    <i className="ti ti-alert-circle" style={{ fontSize: 16, flexShrink: 0 }} />
                    {error}
                </div>
            )}

            {/* ── Redirecting indicator ────────────────────────────────────── */}
            {paying && (
                <div style={{
                    background:  T.infoBg,
                    color:       T.infoText,
                    borderRadius: T.radius,
                    padding:     "10px 14px",
                    fontSize:    14,
                    display:     "flex",
                    alignItems:  "center",
                    gap:         8,
                }}>
                    <i className="ti ti-loader-2" style={{ fontSize: 16, flexShrink: 0 }} />
                    Redirecting to Paymob…
                </div>
            )}

            {/* ── Pay button ───────────────────────────────────────────────── */}
            <button
                onClick={handlePay}
                disabled={paying || !storedPlan}
                style={{
                    width:        "100%",
                    background:   paying || !storedPlan ? T.darkSurface2 : T.violet,
                    color:        paying || !storedPlan ? T.gray500 : T.white,
                    border:       `1.5px solid ${paying || !storedPlan ? T.darkBorder : T.violet}`,
                    borderRadius: T.radius,
                    padding:      "13px",
                    fontSize:     15,
                    fontWeight:   600,
                    fontFamily:   T.font,
                    cursor:       paying || !storedPlan ? "not-allowed" : "pointer",
                    transition:   "background .15s, color .15s",
                    display:      "flex",
                    alignItems:   "center",
                    justifyContent: "center",
                    gap:          8,
                }}
                onMouseEnter={e => {
                    if (!paying && storedPlan)
                        (e.currentTarget as HTMLElement).style.background = T.violetHover;
                }}
                onMouseLeave={e => {
                    if (!paying && storedPlan)
                        (e.currentTarget as HTMLElement).style.background = T.violet;
                }}
            >
                <i className="ti ti-lock" style={{ fontSize: 16 }} />
                {paying
                    ? "Redirecting…"
                    : `Pay EGP ${getTotalToday()} with Paymob`}
            </button>

            {/* ── Trust badge ─────────────────────────────────────────────── */}
            <div style={{
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                gap:            6,
                color:          T.gray700,
                fontSize:       12,
            }}>
                <i className="ti ti-lock" style={{ fontSize: 13 }} />
                Secured by Paymob
            </div>
        </div>
    );
}

// ── Small helper component ─────────────────────────────────────────────────────
function Row({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <span style={{ color: "rgba(255,255,255,0.35)" }}>{label}</span>
            <span style={{ fontWeight: 500, color: "rgba(255,255,255,0.75)" }}>{value}</span>
        </div>
    );
}
