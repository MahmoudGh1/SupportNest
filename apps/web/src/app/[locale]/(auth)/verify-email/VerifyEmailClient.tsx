"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useSearchParams } from "next/navigation";

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

const RESEND_COOLDOWN = 60;

export default function VerifyEmailClient() {
    const router = useRouter();
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const searchParams = useSearchParams();
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");
    const mode = searchParams.get("mode");

    useEffect(() => {
        if (!userId) router.replace("/register");
    }, [userId, router]);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

    function handleBoxChange(index: number, value: string) {
        const digit = value.replace(/\D/g, "").slice(-1);
        const next = [...code];
        next[index] = digit;
        setCode(next);
        setError("");
        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    }

    function handleBoxKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    }

    function handlePaste(e: React.ClipboardEvent) {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        const next = [...code];
        pasted.split("").forEach((digit, i) => { next[i] = digit; });
        setCode(next);
        const lastIndex = Math.min(pasted.length, 5);
        inputRefs.current[lastIndex]?.focus();
    }

    async function handleVerify() {
        const fullCode = code.join("");
        if (fullCode.length < 6) {
            setError("Please enter the full 6-digit code.");
            return;
        }
        if (!userId) return;

        setSubmitting(true);
        setError("");
        try {
            await api.verifyEmail(userId, fullCode);

            if (mode === "login") {
                router.push(`/login?verified=true&email=${encodeURIComponent(email ?? "")}`);
            } else {
                router.push(`/register/business?userId=${userId}`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Invalid code. Please try again.");
            setCode(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } finally {
            setSubmitting(false);
        }
    }

    async function handleResend() {
        if (!userId || !email || resendCooldown > 0) return;
        setResending(true);
        setError("");
        try {
            await api.sendVerification(userId, email);
            setResendCooldown(RESEND_COOLDOWN);
            setCode(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to resend code.");
        } finally {
            setResending(false);
        }
    }

    return (
        <>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .otp-box:focus { 
                    border-color: #534AB7 !important; 
                    box-shadow: 0 0 0 3px rgba(83,74,183,0.18); 
                    outline: none;
                }
            `}</style>
            <div style={{
                minHeight: "100vh", background: T.bg,
                display: "flex", alignItems: "center",
                justifyContent: "center", fontFamily: T.font, padding: "40px 16px",
            }}>
                <div style={{ width: "100%", maxWidth: 420 }}>
                    {/* Logo */}
                    <div style={{ textAlign: "center", marginBottom: 32 }}>
                        <Link href="/" style={{
                            fontSize: 22, fontWeight: 700, color: T.text,
                            letterSpacing: "-0.02em", textDecoration: "none",
                        }}>
                            SupportNest
                        </Link>
                    </div>

                    {/* Step indicator */}
                    <div style={{
                        display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 8, marginBottom: 32,
                    }}>
                        {["Your details", "Verify email", "Business", "Payment"].map((label, i) => (
                            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, opacity: i === 1 ? 1 : i === 0 ? 0.6 : 0.35 }}>
                                    <div style={{
                                        width: 20, height: 20, borderRadius: "50%",
                                        background: i === 0 ? T.green : i === 1 ? T.violet : "transparent",
                                        border: `2px solid ${i === 0 ? T.green : i === 1 ? T.violet : T.border}`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 10, fontWeight: 700,
                                        color: i <= 1 ? "#fff" : T.text,
                                    }}>
                                        {i === 0
                                            ? <i className="ti ti-check" style={{ fontSize: 10 }} />
                                            : i + 1
                                        }
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: i === 1 ? 600 : 400, color: i === 1 ? T.text : T.muted, whiteSpace: "nowrap" }}>
                                        {label}
                                    </span>
                                </div>
                                {i < 3 && <div style={{ width: 16, height: 1, background: T.border }} />}
                            </div>
                        ))}
                    </div>

                    {/* Email icon */}
                    <div style={{ textAlign: "center", marginBottom: 20 }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: 14,
                            background: "rgba(83,74,183,0.12)",
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <i className="ti ti-mail" style={{ fontSize: 26, color: T.violet }} />
                        </div>
                    </div>

                    <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: "0 0 8px", textAlign: "center" }}>
                        Check your email
                    </h1>
                    <p style={{ fontSize: 14, color: T.muted, textAlign: "center", margin: "0 0 8px" }}>
                        We sent a 6-digit code to
                    </p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: T.text, textAlign: "center", margin: "0 0 32px" }}>
                        {email}
                    </p>

                    {/* 6-box OTP input */}
                    <div style={{
                        display: "flex", gap: 10,
                        justifyContent: "center", marginBottom: 24,
                    }}
                        onPaste={handlePaste}
                    >
                        {code.map((digit, i) => (
                            <input
                                key={i}
                                ref={(el) => { inputRefs.current[i] = el; }}
                                className="otp-box"
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleBoxChange(i, e.target.value)}
                                onKeyDown={(e) => handleBoxKeyDown(i, e)}
                                style={{
                                    width: 52, height: 60,
                                    textAlign: "center", fontSize: 24, fontWeight: 700,
                                    fontFamily: T.font, color: T.text,
                                    background: T.surface,
                                    border: `1.5px solid ${error ? T.errorText : digit ? T.violet : T.border}`,
                                    borderRadius: T.radius,
                                    transition: "border-color .15s",
                                }}
                            />
                        ))}
                    </div>

                    {error && (
                        <p style={{
                            fontSize: 13, color: T.errorText,
                            textAlign: "center", margin: "0 0 16px",
                            display: "flex", alignItems: "center",
                            justifyContent: "center", gap: 6,
                        }}>
                            <i className="ti ti-alert-circle" style={{ fontSize: 14 }} />
                            {error}
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={handleVerify}
                        disabled={submitting || code.join("").length < 6}
                        style={{
                            width: "100%", padding: "13px",
                            background: submitting || code.join("").length < 6
                                ? "rgba(83,74,183,0.4)" : T.violet,
                            color: "#fff", border: "none", borderRadius: T.radius,
                            fontSize: 15, fontWeight: 600, fontFamily: T.font,
                            cursor: submitting || code.join("").length < 6 ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center",
                            justifyContent: "center", gap: 8,
                            marginBottom: 20,
                        }}
                    >
                        {submitting
                            ? <><i className="ti ti-loader-2" style={{ fontSize: 16, animation: "spin 0.8s linear infinite" }} /> Verifying…</>
                            : "Verify email"
                        }
                    </button>

                    {/* Resend */}
                    <p style={{ textAlign: "center", fontSize: 13, color: T.muted, margin: 0 }}>
                        Didn{"\'"}t receive it?{" "}
                        {resendCooldown > 0
                            ? <span style={{ color: T.muted }}>Resend in {resendCooldown}s</span>
                            : (
                                <button
                                    onClick={handleResend}
                                    disabled={resending}
                                    style={{
                                        background: "none", border: "none",
                                        color: T.violet, fontSize: 13, fontWeight: 600,
                                        cursor: resending ? "not-allowed" : "pointer",
                                        fontFamily: T.font, padding: 0,
                                        opacity: resending ? 0.5 : 1,
                                    }}
                                >
                                    {resending ? "Sending…" : "Resend code"}
                                </button>
                            )
                        }
                    </p>
                </div>
            </div>
        </>
    );
}