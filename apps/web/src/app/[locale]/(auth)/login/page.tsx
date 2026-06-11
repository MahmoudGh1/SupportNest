"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

const T = {
	darkBg: "#0F0F0F",
	darkPanel: "#161616",
	darkSurface: "#1E1E1E",
	darkBorder: "rgba(255,255,255,0.08)",
	white: "#FFFFFF",
	gray500: "#888888",
	gray600: "#666666",
	inputBg: "#1E1E1E",
	inputBorder: "rgba(255,255,255,0.12)",
	inputFocus: "rgba(255,255,255,0.35)",
	violet: "#534AB7",
	violetLight: "#AFA9EC",
	danger: "#E24B4A",
	dangerBg: "rgba(226,75,74,0.12)",
	radius: "10px",
	radiusSm: "8px",
	radiusLg: "14px",
	font: "'Sora', system-ui, sans-serif",
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
							color: "rgba(255,255,255,0.7)",
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
						color: T.white,
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
	const { login } = useAuth();
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPass, setShowPass] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	const validate = () => {
		const errs: Record<string, string> = {};
		if (!email) errs.email = "Email is required.";
		else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Enter a valid email.";
		if (!password) errs.password = "Password is required.";
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
			router.push("/dashboard");
		} catch (e: any) {
			setError(e.message ?? "Invalid email or password.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
			style={{
				width: "45%",
				background: T.darkPanel,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				padding: "60px 64px",
				minHeight: "100vh",
				borderRight: `1px solid ${T.darkBorder}`,
			}}
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
						color: T.white,
						margin: "0 0 8px",
						letterSpacing: "-0.8px",
						textAlign: "center",
					}}
				>
					Welcome Back
				</h1>
				<p
					style={{
						fontSize: 14,
						color: T.gray500,
						textAlign: "center",
						margin: "0 0 36px",
					}}
				>
					Sign in to your account
				</p>

				<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
					{/* Google — disabled */}
					<button
						disabled
						title="Google sign-in coming soon"
						style={{
							width: "100%",
							padding: "12px 16px",
							background: "transparent",
							border: `1.5px solid ${T.darkBorder}`,
							borderRadius: T.radius,
							fontSize: 14,
							fontWeight: 500,
							fontFamily: T.font,
							color: "rgba(255,255,255,0.25)",
							cursor: "not-allowed",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: 10,
						}}
					>
						<svg
							width="18"
							height="18"
							viewBox="0 0 18 18"
							aria-hidden
							style={{ opacity: 0.3 }}
						>
							<path
								fill="#4285F4"
								d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
							/>
							<path
								fill="#34A853"
								d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
							/>
							<path
								fill="#FBBC05"
								d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
							/>
							<path
								fill="#EA4335"
								d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
							/>
						</svg>
						Continue with Google
					</button>

					{/* Divider */}
					<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
						<div style={{ flex: 1, height: 1, background: T.darkBorder }} />
						<span style={{ fontSize: 12, color: T.gray600 }}>or</span>
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
						label="Email"
						type="email"
						value={email}
						onChange={setEmail}
						placeholder="you@company.com"
						error={fieldErrors.email}
						autoComplete="email"
					/>

					<FormField
						label="Password"
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
								Forgot your password?
							</button>
						}
						rightEl={
							<button
								onClick={() => setShowPass((p) => !p)}
								style={{
									background: "none",
									border: "none",
									cursor: "pointer",
									color: T.gray500,
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
							color: T.white,
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
								Signing in…
							</>
						) : (
							"Sign in"
						)}
					</button>

					{/* Sign up */}
					<p
						style={{
							textAlign: "center",
							fontSize: 13,
							color: T.gray500,
							margin: 0,
						}}
					>
						Don't have an account?{" "}
						<button
							onClick={() => router.push("/register")}
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
							Sign Up
						</button>
					</p>
				</div>

				{/* Footer */}
				<p
					style={{
						textAlign: "center",
						fontSize: 11,
						color: "rgba(255,255,255,0.2)",
						marginTop: 48,
						lineHeight: 1.6,
					}}
				>
					By continuing, you agree to SupportNest{" "}
					<button
						style={{
							background: "none",
							border: "none",
							color: "rgba(255,255,255,0.35)",
							fontSize: 11,
							cursor: "pointer",
							fontFamily: T.font,
							padding: 0,
						}}
					>
						Terms of Service
					</button>{" "}
					and{" "}
					<button
						style={{
							background: "none",
							border: "none",
							color: "rgba(255,255,255,0.35)",
							fontSize: 11,
							cursor: "pointer",
							fontFamily: T.font,
							padding: 0,
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
		<div
			style={{
				flex: 1,
				background: T.darkBg,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				padding: "60px 64px",
				minHeight: "100vh",
			}}
		>
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
						color: T.white,
						margin: "0 0 12px",
						letterSpacing: "-1.2px",
					}}
				>
					SupportNest
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
						"
					</div>
					<p
						style={{
							fontSize: 15,
							color: "rgba(255,255,255,0.78)",
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
							<div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>
								{testimonial.name}
							</div>
							<div
								style={{
									fontSize: 12,
									color: "rgba(255,255,255,0.35)",
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
			<style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>
			<div
				style={{
					display: "flex",
					height: "100vh",
					fontFamily: T.font,
					overflow: "hidden",
				}}
			>
				<FormPanel />
				<BrandPanel />
			</div>
		</>
	);
}
