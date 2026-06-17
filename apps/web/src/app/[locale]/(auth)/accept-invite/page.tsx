"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { GoogleLogin } from "@react-oauth/google";
import { api } from "@/lib/api.ts";

const T = {
    darkBg: "var(--page-bg)",
    darkPanel: "var(--surface-elevated)",
    darkSurface: "var(--surface)",
    darkBorder: "var(--card-border)",
    text: "var(--page-text)",
    muted: "var(--page-muted)",
    inputBg: "var(--surface)",
    inputBorder: "var(--card-border)",
    inputFocus: "var(--input-focus)",
    violet: "var(--brand-violet, #534AB7)",
    violetLight: "var(--brand-violet-light, #AFA9EC)",
    danger: "#E24B4A",
    dangerBg: "var(--danger-bg)",
    radius: "10px",
    radiusLg: "14px",
    font: "'Sora', system-ui, sans-serif",
    labelMuted: "var(--label-muted)",
} as const;

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

interface FieldProps {
    label: string;
    type?: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
    rightEl?: React.ReactNode;
}

function FormField({ label, type = "text", value, onChange, placeholder, error, disabled, rightEl }: FieldProps) {
    const [focused, setFocused] = useState(false);
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: T.labelMuted }}>
                {label}
            </label>
            <div style={{ position: "relative" }}>
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={placeholder}
                    disabled={disabled}
                    style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: rightEl ? "12px 44px 12px 14px" : "12px 14px",
                        fontSize: 14,
                        fontFamily: T.font,
                        color: T.text,
                        background: T.inputBg,
                        border: `1.5px solid ${error ? T.danger : focused ? T.inputFocus : T.inputBorder}`,
                        borderRadius: T.radius,
                        outline: "none",
                        transition: "border-color .15s",
                        opacity: disabled ? 0.5 : 1,
                        cursor: disabled ? "not-allowed" : "text",
                    }}
                />
                {rightEl && (
                    <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
                        {rightEl}
                    </div>
                )}
            </div>
            {error && (
                <span style={{ fontSize: 12, color: T.danger, display: "flex", gap: 5, alignItems: "center" }}>
                    <i className="ti ti-alert-circle" style={{ fontSize: 13 }} />
                    {error}
                </span>
            )}
        </div>
    );
}

function FormPanel() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token") ?? "";

    const [orgName, setorgName] = useState("");
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [pageLoading, setPageLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [tokenError, setTokenError] = useState("");

    useEffect(() => {
        if (!token) {
            setTokenError("Invalid invitation link.");
            setPageLoading(false);
            return;
        }
        fetch(`${BASE_URL}/invitations/accept/${token}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.email) {
                    setEmail(data.email);
                    setorgName(data.orgName ?? "");
                } else {
                    setTokenError(data.message ?? "Invalid or expired invitation.");
                }
            })
            .catch(() => setTokenError("Could not verify invitation. Please try again."))
            .finally(() => setPageLoading(false));
    }, [token]);

    async function handleGoogleRegister(idToken: string) {
        try {
            const { userId, email } = await api.registerWithGoogle(idToken);

            sessionStorage.setItem("registrationData", JSON.stringify({
                firstName: "",
                lastName: "",
                email,
            }));

            router.push(`/register/business?userId=${userId}`);
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : "Google sign-up failed");
        }
    }

    function validate(): boolean {
        const e: Record<string, string> = {};
        if (!firstName.trim()) e.firstName = "Required";
        if (!lastName.trim()) e.lastName = "Required";
        if (!password) e.password = "Required";
        else if (password.length < 8) e.password = "At least 8 characters";
        if (password !== confirmPassword) e.confirmPassword = "Passwords don't match";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit() {
        if (!validate()) return;
        setSubmitting(true);
        setSubmitError("");
        try {
            const res = await fetch(`${BASE_URL}/invitations/accept/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firstName, lastName, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message ?? "Something went wrong");
            router.replace("/login?invited=true");
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : "Failed to create account");
            setSubmitting(false);
        }
    }

    if (pageLoading) {
        return (
            <div className="invite-form-panel">
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                    <i className="ti ti-loader-2" style={{ fontSize: 28, color: T.violet, animation: "spin 0.8s linear infinite" }} />
                    <p style={{ color: T.muted, fontSize: 14, margin: 0 }}>Verifying invitation…</p>
                </div>
            </div>
        );
    }

    if (tokenError) {
        return (
            <div className="invite-form-panel" style={{ gap: 16 }}>
                <div style={{ width: 56, height: 56, background: "rgba(226,75,74,0.12)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="ti ti-alert-circle" style={{ fontSize: 26, color: T.danger }} />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Invalid Invitation</h2>
                <p style={{ fontSize: 14, color: T.muted, margin: 0, textAlign: "center" }}>{tokenError}</p>
                <button
                    onClick={() => router.push("/login")}
                    style={{ marginTop: 8, padding: "12px 28px", background: T.violet, color: "#fff", border: "none", borderRadius: T.radius, fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: "pointer" }}
                >
                    Go to login
                </button>
            </div>
        );
    }

    return (
        <div
            className="invite-form-panel"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        >
            <div style={{ width: "100%", maxWidth: 380 }}>
                {/* Logo */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 36 }}>
                    <div style={{ width: 56, height: 56, background: T.violet, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <i className="ti ti-shield-check" style={{ color: "#fff", fontSize: 26 }} />
                    </div>
                </div>

                {/* Heading */}
                <h1 style={{ fontSize: 30, fontWeight: 700, color: T.text, margin: "0 0 8px", letterSpacing: "-0.8px", textAlign: "center" }}>
                    Accept Invitation
                </h1>
                <p style={{ fontSize: 14, color: T.muted, textAlign: "center", margin: "0 0 4px" }}>
                    You{"\'"}ve been invited to join <strong style={{ color: T.text }}>{orgName}</strong>
                </p>
                <p style={{ fontSize: 13, color: T.violetLight, textAlign: "center", margin: "0 0 32px" }}>
                    {email}
                </p>


                {/* Google */}
                <div className="google-login-wrapper">
                    <GoogleLogin
                        onSuccess={async (credentialResponse) => {
                            setSubmitError("");
                            setSubmitting(true);
                            try {
                                await handleGoogleRegister(credentialResponse.credential!);
                            } catch (e) {
                                setSubmitError(e instanceof Error ? e.message : "Google sign-up failed.");
                            } finally {
                                setSubmitting(false);
                            }
                        }}
                        onError={() => setSubmitError("Google sign-up failed.")}
                        width="1000"
                        auto_select={false}
                        text="signup_with"
                    />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 4px" }}>
                    <div style={{ flex: 1, height: 1, background: T.darkBorder }} />
                    <span style={{ fontSize: 12, color: T.muted }}>or continue with email</span>
                    <div style={{ flex: 1, height: 1, background: T.darkBorder }} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {submitError && (
                        <div role="alert" style={{ background: T.dangerBg, border: `1px solid rgba(226,75,74,0.3)`, borderRadius: T.radius, padding: "12px 16px", fontSize: 13, color: T.danger, display: "flex", gap: 8, alignItems: "center" }}>
                            <i className="ti ti-alert-circle" style={{ fontSize: 16, flexShrink: 0 }} />
                            {submitError}
                        </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <FormField label="First name" value={firstName} onChange={setFirstName} placeholder="Jane" error={errors.firstName} />
                        <FormField label="Last name" value={lastName} onChange={setLastName} placeholder="Smith" error={errors.lastName} />
                    </div>

                    <FormField label="Email" value={email} onChange={() => { }} disabled />

                    <FormField
                        label="Password"
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={setPassword}
                        placeholder="Min. 8 characters"
                        error={errors.password}
                        rightEl={
                            <button onClick={() => setShowPass((p) => !p)} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, padding: 0, display: "flex" }}>
                                <i className={`ti ti-eye${showPass ? "-off" : ""}`} style={{ fontSize: 17 }} />
                            </button>
                        }
                    />

                    <FormField
                        label="Confirm password"
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        placeholder="Repeat password"
                        error={errors.confirmPassword}
                        rightEl={
                            <button onClick={() => setShowConfirm((p) => !p)} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, padding: 0, display: "flex" }}>
                                <i className={`ti ti-eye${showConfirm ? "-off" : ""}`} style={{ fontSize: 17 }} />
                            </button>
                        }
                    />

                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        style={{ width: "100%", padding: "13px", background: T.violet, color: "#fff", border: "none", borderRadius: T.radius, fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4, opacity: submitting ? 0.7 : 1, transition: "opacity .15s" }}
                    >
                        {submitting ? (
                            <><i className="ti ti-loader-2" style={{ fontSize: 16, animation: "spin 0.8s linear infinite" }} /> Creating account…</>
                        ) : "Create account & join team"}
                    </button>

                    <p style={{ textAlign: "center", fontSize: 13, color: T.muted, margin: 0 }}>
                        Already have an account?{" "}
                        <button onClick={() => router.push("/login")} style={{ background: "none", border: "none", color: T.violetLight, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font, padding: 0 }}>
                            Sign in
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

function BrandPanel() {
    return (
        <div className="invite-brand-panel">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", maxWidth: 440 }}>
                <h1 style={{ fontSize: 42, fontWeight: 700, color: T.text, margin: "0 0 12px", letterSpacing: "-1.2px" }}>
                    <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
                        SupportNest
                    </Link>
                </h1>
                <p style={{ fontSize: 13, color: T.violetLight, fontWeight: 500, margin: "0 0 48px", lineHeight: 1.5 }}>
                    AI Powered Multi-Agent Customer Support Platform
                </p>
                <div style={{ background: T.darkSurface, border: `1px solid ${T.darkBorder}`, borderRadius: T.radiusLg, padding: "28px", textAlign: "left", width: "100%" }}>
                    <div style={{ fontSize: 36, lineHeight: 1, color: T.violet, fontFamily: "Georgia, serif", marginBottom: 16 }}>&quot;</div>
                    <p style={{ fontSize: 15, color: T.text, lineHeight: 1.75, margin: "0 0 24px" }}>
                        SupportNest is a game changer. Their AI handles our customers and only escalates what truly needs a human. Our team finally has time to breathe.
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: T.violet, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600, color: "#fff", flexShrink: 0 }}>
                            M
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Mahmoud Al-Rashidi</div>
                            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Head of Support, Maqsam</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AcceptInvitePage() {
    return (
        <>
            <style>{`
                .google-login-wrapper {
					width: 100%;
				}
				.google-login-wrapper > div {
					width: 100% !important;
					max-width: 100% !important;
				}
				.google-login-wrapper iframe {
					width: 100% !important;
					max-width: 100% !important;
				}
                
                @keyframes spin { to { transform: rotate(360deg); } }
                * { box-sizing: border-box; }

                .invite-layout {
                    display: flex;
                    min-height: 100vh;
                    font-family: 'Sora', system-ui, sans-serif;
                    background: var(--page-bg);
                    color: var(--page-text);
                }

                .invite-form-panel {
                    width: 45%;
                    background: var(--surface-elevated);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 64px;
                    min-height: 100vh;
                    border-right: 1px solid var(--card-border);
                }

                .invite-brand-panel {
                    flex: 1;
                    background: var(--page-bg);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 64px;
                    min-height: 100vh;
                }

                /* Tablet */
                @media (max-width: 900px) {
                    .invite-form-panel {
                        width: 55%;
                        padding: 48px 40px;
                    }
                    .invite-brand-panel {
                        padding: 48px 32px;
                    }
                }

                /* Mobile */
                @media (max-width: 640px) {
                    .invite-layout {
                        flex-direction: column;
                    }
                    .invite-form-panel {
                        width: 100%;
                        min-height: 100vh;
                        padding: 48px 24px;
                        border-right: none;
                    }
                    .invite-brand-panel {
                        display: none;
                    }
                }
            `}</style>
            <div className="invite-layout">
                <FormPanel />
                <BrandPanel />
            </div>
        </>
    );
}
