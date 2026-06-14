"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useLingui } from "@lingui/react/macro";
import { GoogleLogin } from "@react-oauth/google";
import Link from "next/link";

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
	violetLight: "var(--brand-violet-light, #7F77DD)",
	danger: "#E24B4A",
	dangerBg: "var(--danger-bg)",
	radius: "10px",
	radiusSm: "8px",
	radiusLg: "14px",
	font: "'Sora', system-ui, sans-serif",
	labelMuted: "var(--label-muted)",
} as const;

const testimonial = {
	quote:
		"SupportNest is a game changer. Their AI handles our customers and only escalates what truly needs a human. Our team finally has time to breathe.",
	name: "Mahmoud Al-Rashidi",
	title: "Head of Support, Maqsam",
};

interface FieldProps {
	label: string;
	type?: string;
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	error?: string;
	autoComplete?: string;
	rightEl?: React.ReactNode;
	labelRight?: React.ReactNode;
}

function FormField({
	label,
	type = "text",
	value,
	onChange,
	placeholder,
	error,
	autoComplete,
	rightEl,
	labelRight,
}: FieldProps) {
	const [focused, setFocused] = useState(false);
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
			{label && (
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<label
						style={{
							fontSize: 13,
							fontWeight: 500,
							color: T.labelMuted,
						}}
					>
						{label}
					</label>
					{labelRight}
				</div>
			)}
			<div style={{ position: "relative" }}>
				<input
					type={type}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onFocus={() => setFocused(true)}
					onBlur={() => setFocused(false)}
					placeholder={placeholder}
					autoComplete={autoComplete}
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
					}}
				/>
				{rightEl && (
					<div
						style={{
							position: "absolute",
							right: 12,
							top: "50%",
							transform: "translateY(-50%)",
						}}
					>
						{rightEl}
					</div>
				)}
			</div>
			{error && (
				<span
					style={{
						fontSize: 12,
						color: T.danger,
						display: "flex",
						gap: 5,
						alignItems: "center",
					}}
				>
					<i
						className="ti ti-alert-circle"
						style={{ fontSize: 13 }}
					/>
					{error}
				</span>
			)}
		</div>
	);
}

function FormPanel() {
	const { login, loginWithGoogle } = useAuth();
	const router = useRouter();
	const { t } = useLingui();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPass, setShowPass] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	const validate = () => {
		const errs: Record<string, string> = {};
		if (!email) errs.email = t`Email is required.`;
		else if (!/\S+@\S+\.\S+/.test(email)) errs.email = t`Enter a valid email.`;
		if (!password) errs.password = t`Password is required.`;
		return errs;
	};

	const handleSubmit = async () => {
		const errs = validate();
		if (Object.keys(errs).length) {
			setFieldErrors(errs);
			return;
		}
		setFieldErrors({});
		setError("");
		setLoading(true);
		try {
			const user = await login(email, password);
			// how user.onboarded is handled frontend or backend?
			// it gives me error
			// router.push("/dashboard");
			if (user.role === "SUPER_ADMIN") {
				router.push("/dashboard/admin");
			} else {
				router.push("/dashboard");
			}
		} catch (e) {
			if (e instanceof Error) {
				setError(e.message ?? t`Invalid email or password.`);
			} else {
				setError("An unexpected error occurred.");
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			className="login-form-panel"
			onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
		>
			<div style={{ width: "100%", maxWidth: 380 }}>
				{/* Logo mark */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						marginBottom: 36,
					}}
				>
					{/* swap with <Image src="/logo.png" width={56} height={56} alt="SupportNest" /> */}
					<div
						style={{
							width: 56,
							height: 56,
							background: T.violet,
							borderRadius: 14,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							marginBottom: 0,
						}}
					>
						<i
							className="ti ti-shield-check"
							style={{ color: "#fff", fontSize: 26 }}
						/>
					</div>
				</div>

				{/* Heading */}
				<h1
					style={{
						fontSize: 30,
						fontWeight: 700,
						color: T.text,
						margin: "0 0 8px",
						letterSpacing: "-0.8px",
						textAlign: "center",
					}}
				>
					{t`Welcome Back`}
				</h1>
				<p
					style={{
						fontSize: 14,
						color: T.muted,
						textAlign: "center",
						margin: "0 0 36px",
					}}
				>
					{t`Sign in to your account`}
				</p>

				<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
					{/* Google */}
					<GoogleLogin
						onSuccess={async (credentialResponse) => {
							setError("");
							setLoading(true);
							try {
								await loginWithGoogle(credentialResponse.credential!);
								router.push("/dashboard");
							} catch (e) {
								if (e instanceof Error) {
									setError(e.message ?? t`Invalid email or password.`);
								} else {
									setError("An unexpected error occurred.");
								}
							} finally {
								setLoading(false);
							}
						}}
						onError={() => setError(t`Google sign-in failed.`)}
						width="380"
						auto_select={false}
					/>

					{/* Divider */}
					<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
						<div style={{ flex: 1, height: 1, background: T.darkBorder }} />
						<span style={{ fontSize: 12, color: T.muted }}>{t`or`}</span>
						<div style={{ flex: 1, height: 1, background: T.darkBorder }} />
					</div>

					{error && (
						<div
							role="alert"
							style={{
								background: T.dangerBg,
								border: `1px solid rgba(226,75,74,0.3)`,
								borderRadius: T.radius,
								padding: "12px 16px",
								fontSize: 13,
								color: T.danger,
								display: "flex",
								gap: 8,
								alignItems: "center",
							}}
						>
							<i
								className="ti ti-alert-circle"
								style={{ fontSize: 16, flexShrink: 0 }}
							/>
							{error}
						</div>
					)}

					<FormField
						label={t`Email`}
						type="email"
						value={email}
						onChange={setEmail}
						placeholder="you@company.com"
						error={fieldErrors.email}
						autoComplete="email"
					/>

					<FormField
						label={t`Password`}
						type={showPass ? "text" : "password"}
						value={password}
						onChange={setPassword}
						placeholder="••••••••"
						error={fieldErrors.password}
						autoComplete="current-password"
						labelRight={
							<button
								style={{
									background: "none",
									border: "none",
									fontSize: 13,
									color: T.violetLight,
									cursor: "pointer",
									fontFamily: T.font,
									padding: 0,
								}}
							>
								{t`Forgot your password?`}
							</button>
						}
						rightEl={
							<button
								onClick={() => setShowPass((p) => !p)}
								style={{
									background: "none",
									border: "none",
									cursor: "pointer",
									color: T.muted,
									padding: 0,
									display: "flex",
								}}
							>
								<i
									className={`ti ti-eye${showPass ? "-off" : ""}`}
									style={{ fontSize: 17 }}
								/>
							</button>
						}
					/>

					{/* Submit */}
					<button
						onClick={handleSubmit}
						disabled={loading}
						style={{
							width: "100%",
							padding: "13px",
							background: T.violet,
							color: "#fff",
							border: "none",
							borderRadius: T.radius,
							fontSize: 14,
							fontWeight: 600,
							fontFamily: T.font,
							cursor: loading ? "not-allowed" : "pointer",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: 8,
							marginTop: 4,
							opacity: loading ? 0.7 : 1,
							transition: "opacity .15s",
						}}
					>
						{loading ? (
							<>
								<i
									className="ti ti-loader-2"
									style={{
										fontSize: 16,
										animation: "spin 0.8s linear infinite",
									}}
								/>{" "}
								{t`Signing in…`}
							</>
						) : (
							t`Sign in`
						)}
					</button>

					{/* Sign up */}
					<p
						style={{
							textAlign: "center",
							fontSize: 13,
							color: T.muted,
							margin: 0,
						}}
					>
						{t`Don't have an account?`}{" "}
						<button
							onClick={() => router.push("/pricing")}
							style={{
								background: "none",
								border: "none",
								color: T.violetLight,
								fontSize: 13,
								fontWeight: 600,
								cursor: "pointer",
								fontFamily: T.font,
								padding: 0,
							}}
						>
							{t`See Plans`}
						</button>
					</p>
				</div>

				{/* Footer */}
				<p
					style={{
						textAlign: "center",
						fontSize: 11,
						color: T.muted,
						marginTop: 48,
						lineHeight: 1.6,
						opacity: 0.6,
					}}
				>
					By continuing, you agree to SupportNest{" "}
					<button
						style={{
							background: "none",
							border: "none",
							color: T.muted,
							fontSize: 11,
							cursor: "pointer",
							fontFamily: T.font,
							padding: 0,
							textDecoration: "underline",
						}}
					>
						Terms of Service
					</button>{" "}
					and{" "}
					<button
						style={{
							background: "none",
							border: "none",
							color: T.muted,
							fontSize: 11,
							cursor: "pointer",
							fontFamily: T.font,
							padding: 0,
							textDecoration: "underline",
						}}
					>
						Privacy Policy
					</button>
					, and to receive periodic emails with updates
				</p>
			</div>
		</div>
	);
}

function BrandPanel() {
	return (
		<div className="login-brand-panel">
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					textAlign: "center",
					maxWidth: 440,
				}}
			>
				<h1
					style={{
						fontSize: 42,
						fontWeight: 700,
						color: T.text,
						margin: "0 0 12px",
						letterSpacing: "-1.2px",
					}}
				>
					<Link
						href="/"
						style={{ color: "inherit", textDecoration: "none" }}
					>
						SupportNest
					</Link>
				</h1>

				<p
					style={{
						fontSize: 13,
						color: T.violetLight,
						fontWeight: 500,
						margin: "0 0 48px",
						lineHeight: 1.5,
					}}
				>
					AI Powered Multi-Agent Customer Support Platform
				</p>

				{/* Testimonial card */}
				<div
					style={{
						background: T.darkSurface,
						border: `1px solid ${T.darkBorder}`,
						borderRadius: T.radiusLg,
						padding: "28px",
						textAlign: "left",
						width: "100%",
					}}
				>
					<div
						style={{
							fontSize: 36,
							lineHeight: 1,
							color: T.violet,
							fontFamily: "Georgia, serif",
							marginBottom: 16,
						}}
					>
						{'"'}
					</div>
					<p
						style={{
							fontSize: 15,
							color: T.text,
							lineHeight: 1.75,
							margin: "0 0 24px",
						}}
					>
						{testimonial.quote}
					</p>
					<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
						{/* swap with <Image> when avatar ready */}
						<div
							style={{
								width: 40,
								height: 40,
								borderRadius: "50%",
								background: T.violet,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: 15,
								fontWeight: 600,
								color: "#fff",
								flexShrink: 0,
							}}
						>
							{testimonial.name.charAt(0)}
						</div>
						<div>
							<div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
								{testimonial.name}
							</div>
							<div
								style={{
									fontSize: 12,
									color: T.muted,
									marginTop: 2,
								}}
							>
								{testimonial.title}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function LoginPage() {
	return (
		<>
			<style>{`
				@keyframes spin { to { transform: rotate(360deg); } }
				* { box-sizing: border-box; }

				.login-layout {
					display: flex;
					min-height: 100vh;
					font-family: 'Sora', system-ui, sans-serif;
					background: var(--page-bg);
					color: var(--page-text);
				}

				.login-form-panel {
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

				.login-brand-panel {
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
					.login-form-panel {
						width: 55%;
						padding: 48px 40px;
					}
					.login-brand-panel {
						padding: 48px 32px;
					}
				}

				/* Mobile — stack vertically, brand panel hidden */
				@media (max-width: 640px) {
					.login-layout {
						flex-direction: column;
					}
					.login-form-panel {
						width: 100%;
						min-height: 100vh;
						padding: 48px 24px;
						border-right: none;
					}
					.login-brand-panel {
						display: none;
					}
				}
			`}</style>
			<div className="login-layout">
				<FormPanel />
				<BrandPanel />
			</div>
		</>
	);
}
