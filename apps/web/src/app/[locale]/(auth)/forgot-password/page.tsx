"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

const T = {
    text: "var(--page-text)",
    violet: "#534AB7",
    bg: "var(--page-bg)",
    surface: "var(--surface)",
    border: "var(--card-border)",
    muted: "var(--page-muted)",
    errorText: "#E24B4A",
    green: "#1D9E75",
    radius: "10px",
    font: "'Sora', system-ui, sans-serif",
} as const;

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);

    async function handleSubmit() {
        if (!email.trim()) {
            setError("Email is required.");
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError("Enter a valid email.");
            return;
        }

        setError("");
        setSubmitting(true);
        try {
            await api.forgotPassword(email);
            setSent(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .sn-input::placeholder { color: var(--page-muted); opacity: 1; }
                .sn-input:focus { border-color: #534AB7 !important; box-shadow: 0 0 0 3px rgba(83,74,183,0.18); outline: none; }
            `}</style>
            <div style={{
                minHeight: "100vh", background: T.bg,
                display: "flex", alignItems: "center",
                justifyContent: "center", fontFamily: T.font, padding: "40px 16px",
            }}>
                <div style={{ width: "100%", maxWidth: 400 }}>
                    {/* Logo */}
                    <div style={{ textAlign: "center", marginBottom: 32 }}>
                        <Link href="/" style={{
                            fontSize: 22, fontWeight: 700, color: T.text,
                            letterSpacing: "-0.02em", textDecoration: "none",
                        }}>
                            SupportNest
                        </Link>
                    </div>

                    {sent ? (
                        /* Success state */
                        <div style={{ textAlign: "center" }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: 14,
                                background: "rgba(29,158,117,0.12)",
                                display: "inline-flex", alignItems: "center",
                                justifyContent: "center", marginBottom: 20,
                            }}>
                                <i className="ti ti-mail-check" style={{ fontSize: 26, color: T.green }} />
                            </div>
                            <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: "0 0 8px" }}>
                                Check your email
                            </h1>
                            <p style={{ fontSize: 14, color: T.muted, margin: "0 0 8px" }}>
                                If an account exists for
                            </p>
                            <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: "0 0 24px" }}>
                                {email}
                            </p>
                            <p style={{ fontSize: 14, color: T.muted, margin: "0 0 32px" }}>
                                you{"\'"}ll receive a password reset link shortly.
                            </p>
                            <button
                                onClick={() => router.push("/login")}
                                style={{
                                    width: "100%", padding: "13px",
                                    background: T.violet, color: "#fff",
                                    border: "none", borderRadius: T.radius,
                                    fontSize: 15, fontWeight: 600,
                                    fontFamily: T.font, cursor: "pointer",
                                }}
                            >
                                Back to login
                            </button>
                        </div>
                    ) : (
                        /* Form state */
                        <>
                            <div style={{ textAlign: "center", marginBottom: 20 }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: 14,
                                    background: "rgba(83,74,183,0.12)",
                                    display: "inline-flex", alignItems: "center",
                                    justifyContent: "center",
                                }}>
                                    <i className="ti ti-lock-question" style={{ fontSize: 26, color: T.violet }} />
                                </div>
                            </div>

                            <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: "0 0 8px", textAlign: "center" }}>
                                Forgot your password?
                            </h1>
                            <p style={{ fontSize: 14, color: T.muted, textAlign: "center", margin: "0 0 32px" }}>
                                Enter your email and we{"\'"}ll send you a reset link.
                            </p>

                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 500, color: T.muted, marginBottom: 6, display: "block" }}>
                                        Email
                                    </label>
                                    <input
                                        className="sn-input"
                                        type="email"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                        placeholder="you@company.com"
                                        style={{
                                            width: "100%", padding: "11px 14px",
                                            background: T.surface, border: `1.5px solid ${error ? T.errorText : T.border}`,
                                            borderRadius: T.radius, color: T.text,
                                            fontSize: 14, fontFamily: T.font,
                                            outline: "none", boxSizing: "border-box",
                                        }}
                                    />
                                    {error && (
                                        <p style={{ fontSize: 12, color: T.errorText, margin: "4px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                                            <i className="ti ti-alert-circle" style={{ fontSize: 13 }} />
                                            {error}
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    style={{
                                        width: "100%", padding: "13px",
                                        background: submitting ? "rgba(83,74,183,0.5)" : T.violet,
                                        color: "#fff", border: "none", borderRadius: T.radius,
                                        fontSize: 15, fontWeight: 600, fontFamily: T.font,
                                        cursor: submitting ? "not-allowed" : "pointer",
                                        display: "flex", alignItems: "center",
                                        justifyContent: "center", gap: 8,
                                    }}
                                >
                                    {submitting
                                        ? <><i className="ti ti-loader-2" style={{ fontSize: 16, animation: "spin 0.8s linear infinite" }} /> Sending…</>
                                        : "Send reset link"
                                    }
                                </button>

                                <p style={{ textAlign: "center", fontSize: 13, color: T.muted, margin: 0 }}>
                                    Remember your password?{" "}
                                    <Link href="/login" style={{ color: T.violet, textDecoration: "none", fontWeight: 500 }}>
                                        Sign in
                                    </Link>
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}