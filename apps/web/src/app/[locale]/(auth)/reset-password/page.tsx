"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function ResetPasswordClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) router.replace("/forgot-password");
    }, [token, router]);

    function validate(): string | null {
        if (!password) return "Password is required.";
        if (password.length < 8) return "Password must be at least 8 characters.";
        if (password !== confirmPassword) return "Passwords don't match.";
        return null;
    }

    async function handleSubmit() {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }
        if (!token) return;

        setError("");
        setSubmitting(true);
        try {
            await api.resetPassword(token, password);
            setSuccess(true);
            // redirect to login after 2 seconds
            setTimeout(() => router.push("/login"), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setSubmitting(false);
        }
    }

    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "11px 14px",
        background: T.surface, border: `1.5px solid ${T.border}`,
        borderRadius: T.radius, color: T.text,
        fontSize: 14, fontFamily: T.font,
        outline: "none", boxSizing: "border-box",
        paddingRight: 44,
    };

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
                    <div style={{ textAlign: "center", marginBottom: 32 }}>
                        <Link href="/" style={{
                            fontSize: 22, fontWeight: 700, color: T.text,
                            letterSpacing: "-0.02em", textDecoration: "none",
                        }}>
                            SupportNest
                        </Link>
                    </div>

                    {success ? (
                        <div style={{ textAlign: "center" }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: 14,
                                background: "rgba(29,158,117,0.12)",
                                display: "inline-flex", alignItems: "center",
                                justifyContent: "center", marginBottom: 20,
                            }}>
                                <i className="ti ti-circle-check" style={{ fontSize: 26, color: T.green }} />
                            </div>
                            <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: "0 0 8px" }}>
                                Password reset!
                            </h1>
                            <p style={{ fontSize: 14, color: T.muted, margin: "0 0 24px" }}>
                                Your password has been updated. Redirecting to login…
                            </p>
                        </div>
                    ) : (
                        <>
                            <div style={{ textAlign: "center", marginBottom: 20 }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: 14,
                                    background: "rgba(83,74,183,0.12)",
                                    display: "inline-flex", alignItems: "center",
                                    justifyContent: "center",
                                }}>
                                    <i className="ti ti-lock-cog" style={{ fontSize: 26, color: T.violet }} />
                                </div>
                            </div>

                            <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: "0 0 8px", textAlign: "center" }}>
                                Set new password
                            </h1>
                            <p style={{ fontSize: 14, color: T.muted, textAlign: "center", margin: "0 0 32px" }}>
                                Choose a strong password for your account.
                            </p>

                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {/* Password */}
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 500, color: T.muted, marginBottom: 6, display: "block" }}>
                                        New password
                                    </label>
                                    <div style={{ position: "relative" }}>
                                        <input
                                            className="sn-input"
                                            type={showPass ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                            placeholder="Min. 8 characters"
                                            style={inputStyle}
                                        />
                                        <button
                                            onClick={() => setShowPass(p => !p)}
                                            style={{
                                                position: "absolute", right: 12, top: "50%",
                                                transform: "translateY(-50%)",
                                                background: "none", border: "none",
                                                cursor: "pointer", color: T.muted,
                                                padding: 0, display: "flex",
                                            }}
                                        >
                                            <i className={`ti ti-eye${showPass ? "-off" : ""}`} style={{ fontSize: 17 }} />
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm password */}
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 500, color: T.muted, marginBottom: 6, display: "block" }}>
                                        Confirm new password
                                    </label>
                                    <div style={{ position: "relative" }}>
                                        <input
                                            className="sn-input"
                                            type={showConfirm ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                                            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                            placeholder="Repeat password"
                                            style={inputStyle}
                                        />
                                        <button
                                            onClick={() => setShowConfirm(p => !p)}
                                            style={{
                                                position: "absolute", right: 12, top: "50%",
                                                transform: "translateY(-50%)",
                                                background: "none", border: "none",
                                                cursor: "pointer", color: T.muted,
                                                padding: 0, display: "flex",
                                            }}
                                        >
                                            <i className={`ti ti-eye${showConfirm ? "-off" : ""}`} style={{ fontSize: 17 }} />
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <p style={{
                                        fontSize: 13, color: T.errorText, margin: 0,
                                        display: "flex", alignItems: "center", gap: 6,
                                    }}>
                                        <i className="ti ti-alert-circle" style={{ fontSize: 14 }} />
                                        {error}
                                    </p>
                                )}

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
                                        ? <><i className="ti ti-loader-2" style={{ fontSize: 16, animation: "spin 0.8s linear infinite" }} /> Resetting…</>
                                        : "Reset password"
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

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div style={{ textAlign: "center", padding: 80 }}>Loading…</div>}>
            <ResetPasswordClient />
        </Suspense>
    );
}