"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

const T = {
    text: "var(--page-text)",
    violet: "#534AB7",
    violetHover: "#7F77DD",
    bg: "var(--page-bg)",
    surface: "var(--surface)",
    border: "var(--card-border)",
    muted: "var(--page-muted)",
    errorText: "#E24B4A",
    green: "#1D9E75",
    radius: "10px",
    font: "'Sora', system-ui, sans-serif",
} as const;

const INDUSTRIES = [
    "Technology", "Healthcare", "Finance", "Retail & E-commerce",
    "Education", "Real Estate", "Hospitality", "Manufacturing",
    "Media & Entertainment", "Other",
];
const SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"];

export default function BusinessDetailsClient() {
    const router = useRouter();
    const [form, setForm] = useState({ businessName: "", industry: "", size: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const { refreshUser } = useAuth();

    const searchParams = useSearchParams();
    const userId = searchParams.get("userId");

    useEffect(() => {
        if (!userId) router.replace("/register");
    }, [userId, router]);

    function field(key: keyof typeof form) {
        return {
            value: form[key],
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
                setForm((f) => ({ ...f, [key]: e.target.value })),
        };
    }

    function validate(): boolean {
        const e: Record<string, string> = {};
        if (!form.businessName.trim()) e.businessName = "Required";
        if (!form.industry) e.industry = "Select an industry";
        if (!form.size) e.size = "Select a company size";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleContinue() {
        if (!validate()) return;

        const stored = sessionStorage.getItem("selectedPlan");

        if (!userId) {
            setErrors({ businessName: "Session expired. Please start registration again." });
            router.replace("/register");
            return;
        }

        if (!stored) {
            setErrors({ businessName: "No plan selected. Please choose a plan first." });
            router.replace("/pricing");
            return;
        }

        let planId = "";
        let annual = false;
        let amountCents = 0;
        try {
            const plan = JSON.parse(stored) as { id?: string; annual?: boolean; amountCents?: number; price?: number };
            planId = plan.id ?? "";
            annual = Boolean(plan.annual);
            amountCents = plan.amountCents ?? (plan.price ? plan.price * 100 : 0);
        } catch {
            router.replace("/pricing");
            return;
        }

        if (!planId) {
            router.replace("/pricing");
            return;
        }

        setSubmitting(true);
        setSubmitError("");

        try {
            await api.completeRegistration({
                userId,
                businessName: form.businessName,
                planId,
                amount: amountCents / 100,
                currency: "EGP",
                isAnnual: annual,
            });

            // await refreshUser();

            sessionStorage.removeItem("pendingUserId");
            sessionStorage.removeItem("pendingEmail");

            // router.push("/payment");
            router.push(`/payment?userId=${userId}`);
        } catch (err) {
            setSubmitError(
                err instanceof Error ? err.message : "Something went wrong. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    }

    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "11px 14px",
        background: T.surface, border: `1.5px solid ${T.border}`,
        borderRadius: T.radius, color: T.text, fontSize: 14,
        fontFamily: T.font, outline: "none", boxSizing: "border-box",
        colorScheme: "inherit" as React.CSSProperties["colorScheme"],
        transition: "border-color .15s",
    };
    const labelStyle: React.CSSProperties = {
        fontSize: 13, fontWeight: 500, color: T.muted,
        marginBottom: 6, display: "block",
    };
    const errorStyle: React.CSSProperties = { fontSize: 12, color: T.errorText, marginTop: 4 };
    const twoCol: React.CSSProperties = {
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12,
    };

    return (
        <>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .sn-input::placeholder { color: var(--page-muted); opacity: 1; }
                .sn-input:focus { border-color: #534AB7 !important; box-shadow: 0 0 0 3px rgba(83,74,183,0.18); }
                .sn-select option { background: var(--surface); color: var(--page-text); }
            `}</style>
            <div style={{
                minHeight: "100vh", background: T.bg,
                display: "flex", alignItems: "center",
                justifyContent: "center", fontFamily: T.font, padding: "40px 16px",
            }}>
                <div style={{ width: "100%", maxWidth: 460 }}>
                    <div style={{ textAlign: "center", marginBottom: 32 }}>
                        <Link href="/" style={{
                            fontSize: 22, fontWeight: 700, color: T.text,
                            letterSpacing: "-0.02em", textDecoration: "none",
                        }}>SupportNest</Link>
                    </div>

                    {/* Step indicator */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 32 }}>
                        {["Your details", "Verify email", "Business", "Payment"].map((label, i) => (
                            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, opacity: i === 2 ? 1 : i < 2 ? 0.6 : 0.35 }}>
                                    <div style={{
                                        width: 20, height: 20, borderRadius: "50%",
                                        background: i < 2 ? T.green : i === 2 ? T.violet : "transparent",
                                        border: `2px solid ${i < 2 ? T.green : i === 2 ? T.violet : T.border}`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 10, fontWeight: 700,
                                        color: i <= 2 ? "#fff" : T.text,
                                    }}>
                                        {i < 2
                                            ? <i className="ti ti-check" style={{ fontSize: 10 }} />
                                            : i + 1
                                        }
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: i === 2 ? 600 : 400, color: i === 2 ? T.text : T.muted, whiteSpace: "nowrap" }}>
                                        {label}
                                    </span>
                                </div>
                                {i < 3 && <div style={{ width: 16, height: 1, background: T.border }} />}
                            </div>
                        ))}
                    </div>

                    <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: "0 0 6px", textAlign: "center" }}>
                        Tell us about your business
                    </h1>
                    <p style={{ fontSize: 14, color: T.muted, textAlign: "center", margin: "0 0 28px" }}>
                        Almost there — just a few more details.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div>
                            <label style={labelStyle}>Business name</label>
                            <input className="sn-input" style={inputStyle} placeholder="Acme Corp" {...field("businessName")} />
                            {errors.businessName && <p style={errorStyle}>{errors.businessName}</p>}
                        </div>

                        <div style={twoCol}>
                            <div>
                                <label style={labelStyle}>Industry</label>
                                <select className="sn-input sn-select" style={{ ...inputStyle, appearance: "none" }} {...field("industry")}>
                                    <option value="">Select…</option>
                                    {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                                </select>
                                {errors.industry && <p style={errorStyle}>{errors.industry}</p>}
                            </div>
                            <div>
                                <label style={labelStyle}>Company size</label>
                                <select className="sn-input sn-select" style={{ ...inputStyle, appearance: "none" }} {...field("size")}>
                                    <option value="">Select…</option>
                                    {SIZES.map((s) => <option key={s} value={s}>{s} employees</option>)}
                                </select>
                                {errors.size && <p style={errorStyle}>{errors.size}</p>}
                            </div>
                        </div>

                        {submitError && (
                            <p style={{ fontSize: 13, color: T.errorText, textAlign: "center", margin: 0 }}>
                                {submitError}
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={handleContinue}
                            disabled={submitting}
                            style={{
                                width: "100%", padding: "13px",
                                color: "#fff",
                                border: "none", borderRadius: T.radius,
                                fontSize: 15, fontWeight: 600, fontFamily: T.font,
                                marginTop: 4,
                                display: "flex", alignItems: "center",
                                justifyContent: "center", gap: 8,
                                background: submitting ? "rgba(83,74,183,0.5)" : T.violet,
                                cursor: submitting ? "not-allowed" : "pointer",
                            }}
                        >
                            {submitting
                                ? <><i className="ti ti-loader-2" style={{ fontSize: 16, animation: "spin 0.8s linear infinite" }} /> Setting up your account…</>
                                : <>Continue to Payment <i className="ti ti-arrow-right" style={{ fontSize: 16 }} /></>
                            }
                        </button>

                        <p style={{ textAlign: "center", fontSize: 13, color: T.muted, margin: 0 }}>
                            Already have an account?{" "}
                            <Link href="/login" style={{ color: T.violet, textDecoration: "none", fontWeight: 500 }}>
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}