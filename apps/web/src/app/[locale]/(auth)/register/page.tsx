"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

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

interface RegistrationData {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	confirmPassword: string;
	businessName: string;
	industry: string;
	size: string;
}

const INDUSTRIES = [
	"Technology",
	"Healthcare",
	"Finance",
	"Retail & E-commerce",
	"Education",
	"Real Estate",
	"Hospitality",
	"Manufacturing",
	"Media & Entertainment",
	"Other",
];
const SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"];

const EMPTY: RegistrationData = {
	firstName: "",
	lastName: "",
	email: "",
	password: "",
	confirmPassword: "",
	businessName: "",
	industry: "",
	size: "",
};

export default function RegisterPage() {
	const router = useRouter();
	const [form, setForm] = useState<RegistrationData>(EMPTY);
	const [errors, setErrors] = useState<Partial<RegistrationData>>({});
	const [submitError, setSubmitError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	function field(key: keyof RegistrationData) {
		return {
			value: form[key],
			onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
				setForm((f) => ({ ...f, [key]: e.target.value })),
		};
	}

	function validate(): boolean {
		const e: Partial<RegistrationData> = {};
		if (!form.firstName.trim()) e.firstName = "Required";
		if (!form.lastName.trim()) e.lastName = "Required";
		if (!form.email.trim()) e.email = "Required";
		else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
		if (!form.password) e.password = "Required";
		else if (form.password.length < 8) e.password = "At least 8 characters";
		if (form.password !== form.confirmPassword)
			e.confirmPassword = "Passwords don't match";
		if (!form.businessName.trim()) e.businessName = "Required";
		if (!form.industry) e.industry = "Select an industry";
		if (!form.size) e.size = "Select a company size";
		setErrors(e);
		return Object.keys(e).length === 0;
	}

	async function handleContinueToPayment() {
		if (!validate()) return;

		const stored = sessionStorage.getItem("selectedPlan");
		if (!stored) {
			setSubmitError("No plan selected. Please choose a plan on the pricing page first.");
			return;
		}

		let planId = "";
		let annual = false;
		try {
			const plan = JSON.parse(stored) as { id?: string; annual?: boolean };
			planId = plan.id ?? "";
			annual = Boolean(plan.annual);
		} catch {
			setSubmitError("Invalid plan data. Please go back and select a plan again.");
			return;
		}

		if (!planId) {
			setSubmitError("No plan selected.");
			return;
		}

		setSubmitError("");
		setSubmitting(true);

		try {
			await api.register({
				email: form.email,
				password: form.password,
				firstName: form.firstName,
				lastName: form.lastName,
				businessName: form.businessName,
				planId,
			});

			sessionStorage.setItem("registrationData", JSON.stringify({
				firstName: form.firstName,
				lastName: form.lastName,
				email: form.email,
			}));
			sessionStorage.setItem("pendingAuth", JSON.stringify({
				email: form.email,
				password: form.password,
			}));
			sessionStorage.setItem("pendingPaymentId", "pending-" + Date.now());

			router.push(`/payment?planId=${planId}&annual=${annual}`);
		} catch (err) {
			setSubmitError(
				err instanceof Error ? err.message : "Registration failed. Please try again."
			);
			setSubmitting(false);
		}
	}

	// Input uses page-text color so it always contrasts the surface background.
	// colorScheme mirrors the page theme so browser-native select option lists
	// render correctly in both dark and light mode.
	const inputStyle: React.CSSProperties = {
		width: "100%",
		padding: "11px 14px",
		background: T.surface,
		border: `1.5px solid ${T.border}`,
		borderRadius: T.radius,
		color: T.text,
		colorScheme: "inherit" as React.CSSProperties["colorScheme"],
		fontSize: 14,
		fontFamily: T.font,
		outline: "none",
		boxSizing: "border-box",
		transition: "border-color .15s",
	};

	const labelStyle: React.CSSProperties = {
		fontSize: 13,
		fontWeight: 500,
		color: T.muted,
		marginBottom: 6,
		display: "block",
	};

	const errorStyle: React.CSSProperties = {
		fontSize: 12,
		color: T.errorText,
		marginTop: 4,
		margin: "4px 0 0",
	};

	// Two-column grid that collapses to one column on narrow screens
	const twoColGrid: React.CSSProperties = {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
		gap: 12,
	};

	return (
		<>
			{/*
			  * Scoped styles for things inline styles can't do:
			  *   - input::placeholder colour
			  *   - select option background/colour (inherits colorScheme above but
			  *     some browsers need an explicit rule)
			  *   - focus ring using the brand violet
			  */}
			<style>{`
				.sn-input::placeholder {
					color: var(--page-muted);
					opacity: 1;
				}
				.sn-input:focus {
					border-color: #534AB7 !important;
					box-shadow: 0 0 0 3px rgba(83,74,183,0.18);
				}
				.sn-select option {
					background: var(--surface);
					color: var(--page-text);
				}
				@media (max-width: 420px) {
					.sn-page-pad { padding: 24px 12px !important; }
					.sn-card       { padding: 0 !important; }
					.sn-title      { font-size: 22px !important; }
				}
			`}</style>

			<div
				className="sn-page-pad"
				style={{
					minHeight: "100vh",
					background: T.bg,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					fontFamily: T.font,
					padding: "40px 16px",
				}}
			>
				<div className="sn-card" style={{ width: "100%", maxWidth: 500 }}>
					{/* Logo */}
					<div style={{ textAlign: "center", marginBottom: 32 }}>
						<Link
							href="/"
							style={{
								fontSize: 22,
								fontWeight: 700,
								color: T.text,
								letterSpacing: "-0.02em",
								textDecoration: "none",
							}}
						>
							SupportNest
						</Link>
					</div>

					{/* Progress indicator */}
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: 8,
							marginBottom: 28,
						}}
					>
						{["Your details", "Payment"].map((label, i) => {
							const active = i === 0;
							return (
								<div
									key={label}
									style={{ display: "flex", alignItems: "center", gap: 8 }}
								>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: 6,
											// Inactive step: lower opacity so it reads as "upcoming"
											opacity: active ? 1 : 0.45,
										}}
									>
										<div
											style={{
												width: 22,
												height: 22,
												borderRadius: "50%",
												// Active: filled violet. Inactive: transparent with border.
												background: active ? T.violet : "transparent",
												border: `2px solid ${active ? T.violet : T.border}`,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												fontSize: 11,
												fontWeight: 700,
												// Always white on violet; on transparent use page-text so it
												// stays readable in both light and dark mode.
												color: active ? "#ffffff" : T.text,
											}}
										>
											{i + 1}
										</div>
										<span
											style={{
												fontSize: 12,
												fontWeight: active ? 600 : 400,
												color: active ? T.text : T.muted,
											}}
										>
											{label}
										</span>
									</div>
									{i < 1 && (
										<div
											style={{ width: 24, height: 1, background: T.border }}
										/>
									)}
								</div>
							);
						})}
					</div>

					<h1
						className="sn-title"
						style={{
							fontSize: 26,
							fontWeight: 700,
							color: T.text,
							margin: "0 0 6px",
							textAlign: "center",
						}}
					>
						Create your account
					</h1>
					<p
						style={{
							fontSize: 14,
							color: T.muted,
							textAlign: "center",
							margin: "0 0 32px",
						}}
					>
						Tell us about you and your business.
					</p>

					<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
						{/* Name row */}
						<div style={twoColGrid}>
							<div>
								<label style={labelStyle}>First name</label>
								<input
									className="sn-input"
									style={inputStyle}
									placeholder="Jane"
									{...field("firstName")}
								/>
								{errors.firstName && <p style={errorStyle}>{errors.firstName}</p>}
							</div>
							<div>
								<label style={labelStyle}>Last name</label>
								<input
									className="sn-input"
									style={inputStyle}
									placeholder="Smith"
									{...field("lastName")}
								/>
								{errors.lastName && <p style={errorStyle}>{errors.lastName}</p>}
							</div>
						</div>

						{/* Email */}
						<div>
							<label style={labelStyle}>Work email</label>
							<input
								className="sn-input"
								style={inputStyle}
								type="email"
								placeholder="jane@company.com"
								{...field("email")}
							/>
							{errors.email && <p style={errorStyle}>{errors.email}</p>}
						</div>

						{/* Password row */}
						<div style={twoColGrid}>
							<div>
								<label style={labelStyle}>Password</label>
								<input
									className="sn-input"
									style={inputStyle}
									type="password"
									placeholder="Min. 8 characters"
									{...field("password")}
								/>
								{errors.password && <p style={errorStyle}>{errors.password}</p>}
							</div>
							<div>
								<label style={labelStyle}>Confirm password</label>
								<input
									className="sn-input"
									style={inputStyle}
									type="password"
									placeholder="Repeat password"
									{...field("confirmPassword")}
								/>
								{errors.confirmPassword && (
									<p style={errorStyle}>{errors.confirmPassword}</p>
								)}
							</div>
						</div>

						{/* Section divider */}
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 12,
								margin: "4px 0",
							}}
						>
							<div style={{ flex: 1, height: 1, background: T.border }} />
							<span style={{ fontSize: 12, color: T.muted }}>Business details</span>
							<div style={{ flex: 1, height: 1, background: T.border }} />
						</div>

						{/* Business name */}
						<div>
							<label style={labelStyle}>Business name</label>
							<input
								className="sn-input"
								style={inputStyle}
								placeholder="Acme Corp"
								{...field("businessName")}
							/>
							{errors.businessName && (
								<p style={errorStyle}>{errors.businessName}</p>
							)}
						</div>

						{/* Industry + size row */}
						<div style={twoColGrid}>
							<div>
								<label style={labelStyle}>Industry</label>
								<select
									className="sn-input sn-select"
									style={{ ...inputStyle, appearance: "none" }}
									{...field("industry")}
								>
									<option value="">Select…</option>
									{INDUSTRIES.map((ind) => (
										<option key={ind} value={ind}>
											{ind}
										</option>
									))}
								</select>
								{errors.industry && <p style={errorStyle}>{errors.industry}</p>}
							</div>
							<div>
								<label style={labelStyle}>Company size</label>
								<select
									className="sn-input sn-select"
									style={{ ...inputStyle, appearance: "none" }}
									{...field("size")}
								>
									<option value="">Select…</option>
									{SIZES.map((s) => (
										<option key={s} value={s}>
											{s} employees
										</option>
									))}
								</select>
								{errors.size && <p style={errorStyle}>{errors.size}</p>}
							</div>
						</div>

						{/* Submit error */}
						{submitError && (
							<p
								style={{
									fontSize: 13,
									color: T.errorText,
									textAlign: "center",
									margin: 0,
								}}
							>
								{submitError}
							</p>
						)}

						{/* CTA button — always white text regardless of mode */}
						<button
							type="button"
							onClick={handleContinueToPayment}
							disabled={submitting}
							style={{
								width: "100%",
								padding: "13px",
								background: submitting ? "rgba(83,74,183,0.5)" : T.violet,
								color: "#ffffff",
								border: "none",
								borderRadius: T.radius,
								fontSize: 15,
								fontWeight: 600,
								fontFamily: T.font,
								cursor: submitting ? "not-allowed" : "pointer",
								marginTop: 4,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: 8,
								transition: "background .15s",
							}}
							onMouseEnter={(e) => {
								if (!submitting)
									(e.currentTarget as HTMLElement).style.background = T.violetHover;
							}}
							onMouseLeave={(e) => {
								if (!submitting)
									(e.currentTarget as HTMLElement).style.background = T.violet;
							}}
						>
							{submitting ? "Creating your account…" : "Continue to Payment"}
							{!submitting && (
								<i className="ti ti-arrow-right" style={{ fontSize: 16 }} />
							)}
						</button>

						<p
							style={{
								textAlign: "center",
								fontSize: 13,
								color: T.muted,
								margin: 0,
							}}
						>
							Already have an account?{" "}
							<Link
								href="/login"
								style={{ color: T.violet, textDecoration: "none", fontWeight: 500 }}
							>
								Sign in
							</Link>
						</p>
					</div>
				</div>
			</div>
		</>
	);
}