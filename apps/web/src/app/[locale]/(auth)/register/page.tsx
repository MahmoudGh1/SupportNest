"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { GoogleLogin } from "@react-oauth/google";

const T = {
	text: "var(--page-text)",
	violet: "#534AB7",
	violetHover: "#7F77DD",
	bg: "var(--page-bg)",
	surface: "var(--surface)",
	border: "var(--card-border)",
	muted: "var(--page-muted)",
	errorText: "#E24B4A",
	radius: "10px",
	font: "'Sora', system-ui, sans-serif",
} as const;

export default function RegisterPage() {
	const router = useRouter();
	const [form, setForm] = useState({
		firstName: "", lastName: "", email: "",
		password: "", confirmPassword: "",
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [submitError, setSubmitError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	function field(key: keyof typeof form) {
		return {
			value: form[key],
			onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
				setForm((f) => ({ ...f, [key]: e.target.value })),
		};
	}

	function validate(): boolean {
		const e: Record<string, string> = {};
		const MAX_NAME_LENGTH = 50;
		const nameRegex = /^[a-zA-Z\s'-]+$/;

		if (!form.firstName.trim()) {
			e.firstName = "Required";
		} else if (form.firstName.length > MAX_NAME_LENGTH) {
			e.firstName = `Cannot exceed ${MAX_NAME_LENGTH} characters`;
		} else if (!nameRegex.test(form.firstName)) {
			e.firstName = "Only letters, spaces, hyphens, and apostrophes allowed";
		}

		if (!form.lastName.trim()) {
			e.lastName = "Required";
		} else if (form.lastName.length > MAX_NAME_LENGTH) {
			e.lastName = `Cannot exceed ${MAX_NAME_LENGTH} characters`;
		} else if (!nameRegex.test(form.lastName)) {
			e.lastName = "Only letters, spaces, hyphens, and apostrophes allowed";
		}

		if (!form.email.trim()) {
			e.email = "Required";
		} else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.email)) {
			e.email = "Enter a valid email";
		}

		if (!form.password) {
			e.password = "Required";
		} else if (form.password.length < 8) {
			e.password = "At least 8 characters";
		}

		if (form.password && form.password !== form.confirmPassword) {
			e.confirmPassword = "Passwords don't match";
		}

		setErrors(e);
		return Object.keys(e).length === 0;
	}

	async function handleGoogleRegister(idToken: string) {
		try {
			const { userId, email, isNewUser, firstName, lastName } = await api.registerWithGoogle(idToken);

			if (!isNewUser) {
				setSubmitError("This Google account is already registered. Redirecting to login...");
				setTimeout(() => router.push("/login"), 1500);
				return;
			}

			sessionStorage.setItem("registrationData", JSON.stringify({
				firstName,
				lastName,
				email,
			}));

			router.push(`/register/business?userId=${userId}`);
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Google sign-up failed");
		}
	}

	async function handleContinue() {
		if (!validate()) return;
		setSubmitError("");
		setSubmitting(true);
		try {
			const result = await api.registerInitial({
				email: form.email,
				password: form.password,
				firstName: form.firstName,
				lastName: form.lastName,
			});

			sessionStorage.setItem("registrationData", JSON.stringify({
				firstName: form.firstName,
				lastName: form.lastName,
				email: result.email,
			}));

			// await api.sendVerification(result.userId, result.email);

			router.push(
				`/verify-email?userId=${result.userId}&email=${encodeURIComponent(result.email)}&mode=register`
			);
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Registration failed.");
		} finally {
			setSubmitting(false);
		}
	}

	const inputStyle: React.CSSProperties = {
		width: "100%", padding: "11px 14px",
		background: T.surface, border: `1.5px solid ${T.border}`,
		borderRadius: T.radius, color: T.text, fontSize: 14,
		fontFamily: T.font, outline: "none", boxSizing: "border-box",
		transition: "border-color .15s",
	};
	const labelStyle: React.CSSProperties = {
		fontSize: 13, fontWeight: 500, color: T.muted,
		marginBottom: 6, display: "block",
	};
	const errorStyle: React.CSSProperties = {
		fontSize: 12, color: T.errorText, marginTop: 4,
	};
	const twoCol: React.CSSProperties = {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
		gap: 12,
	};

	return (
		<>
			<style>{`
                .sn-input::placeholder { color: var(--page-muted); opacity: 1; }
                .sn-input:focus { border-color: #534AB7 !important; box-shadow: 0 0 0 3px rgba(83,74,183,0.18); }
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

					{/* Step indicator */}
					<div style={{
						display: "flex", alignItems: "center",
						justifyContent: "center", gap: 8, marginBottom: 32,
					}}>
						{["Your details", "Verify email", "Business", "Payment"].map((label, i) => (
							<div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
								<div style={{ display: "flex", alignItems: "center", gap: 6, opacity: i === 0 ? 1 : 0.35 }}>
									<div style={{
										width: 20, height: 20, borderRadius: "50%",
										background: i === 0 ? T.violet : "transparent",
										border: `2px solid ${i === 0 ? T.violet : T.border}`,
										display: "flex", alignItems: "center", justifyContent: "center",
										fontSize: 10, fontWeight: 700,
										color: i === 0 ? "#fff" : T.text,
									}}>
										{i + 1}
									</div>
									<span style={{ fontSize: 11, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? T.text : T.muted, whiteSpace: "nowrap" }}>
										{label}
									</span>
								</div>
								{i < 3 && <div style={{ width: 16, height: 1, background: T.border }} />}
							</div>
						))}
					</div>

					<h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: "0 0 6px", textAlign: "center" }}>
						Create your account
					</h1>
					<p style={{ fontSize: 14, color: T.muted, textAlign: "center", margin: "0 0 28px" }}>
						Start with your personal details.
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
						<div style={{ flex: 1, height: 1, background: T.border }} />
						<span style={{ fontSize: 12, color: T.muted }}>or continue with email</span>
						<div style={{ flex: 1, height: 1, background: T.border }} />
					</div>

					<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
						<div style={twoCol}>
							<div>
								<label style={labelStyle}>First name</label>
								<input className="sn-input" style={inputStyle} placeholder="Jane" {...field("firstName")} />
								{errors.firstName && <p style={errorStyle}>{errors.firstName}</p>}
							</div>
							<div>
								<label style={labelStyle}>Last name</label>
								<input className="sn-input" style={inputStyle} placeholder="Smith" {...field("lastName")} />
								{errors.lastName && <p style={errorStyle}>{errors.lastName}</p>}
							</div>
						</div>

						<div>
							<label style={labelStyle}>Work email</label>
							<input className="sn-input" style={inputStyle} type="email" placeholder="jane@company.com" {...field("email")} />
							{errors.email && <p style={errorStyle}>{errors.email}</p>}
						</div>

						<div style={twoCol}>
							<div>
								<label style={labelStyle}>Password</label>
								<input className="sn-input" style={inputStyle} type="password" placeholder="Min. 8 characters" {...field("password")} />
								{errors.password && <p style={errorStyle}>{errors.password}</p>}
							</div>
							<div>
								<label style={labelStyle}>Confirm password</label>
								<input className="sn-input" style={inputStyle} type="password" placeholder="Repeat password" {...field("confirmPassword")} />
								{errors.confirmPassword && <p style={errorStyle}>{errors.confirmPassword}</p>}
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
								background: submitting ? "rgba(83,74,183,0.5)" : T.violet,
								color: "#fff", border: "none", borderRadius: T.radius,
								fontSize: 15, fontWeight: 600, fontFamily: T.font,
								cursor: submitting ? "not-allowed" : "pointer",
								display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
							}}
						>
							{submitting ? "Creating account…" : "Continue"}
							{!submitting && <i className="ti ti-arrow-right" style={{ fontSize: 16 }} />}
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
