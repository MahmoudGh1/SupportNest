"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";

const T = {
	white: "var(--page-text)",
	violet: "#534AB7",
	violetHover: "#6259D0",
	darkBg: "var(--page-bg)",
	darkSurface: "var(--surface)",
	darkBorder: "var(--card-border)",
	darkBorder2: "var(--card-border)",
	gray300: "var(--page-muted)",
	gray500: "var(--page-muted)",
	errorText: "#f87171",
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
	const { refreshUser } = useAuth();
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
		let planId = "";
		let annual = false;

		if (stored) {
			try {
				const plan = JSON.parse(stored) as {
					id?: string;
					annual?: boolean;
				};
				planId = plan.id ?? "";
				annual = Boolean(plan.annual);
			} catch {
				setSubmitError("Invalid plan selection. Please choose a plan again.");
				return;
			}
		}

		if (!planId) {
			setSubmitError("No plan selected. Please choose a plan on the pricing page first.");
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

			sessionStorage.setItem("registrationData", JSON.stringify(form));
			router.push(`/payment?planId=${planId}&annual=${annual}`);
		} catch (err) {
			setSubmitError(
				err instanceof Error ? err.message : "Registration failed. Please try again.",
			);
		} finally {
			setSubmitting(false);
		}
	}

	const inputStyle: React.CSSProperties = {
		width: "100%",
		padding: "11px 14px",
		background: T.darkSurface,
		border: `1.5px solid ${T.darkBorder2}`,
		borderRadius: T.radius,
		color: T.white,
		fontSize: 14,
		fontFamily: T.font,
		outline: "none",
		boxSizing: "border-box",
		transition: "border-color .15s",
	};

	const labelStyle: React.CSSProperties = {
		fontSize: 13,
		fontWeight: 500,
		color: T.gray300,
		marginBottom: 6,
		display: "block",
	};

	const errorStyle: React.CSSProperties = {
		fontSize: 12,
		color: T.errorText,
		marginTop: 4,
	};

	return (
		<div
			style={{
				minHeight: "100vh",
				background: T.darkBg,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				fontFamily: T.font,
				padding: "40px 16px",
			}}
		>
			<div style={{ width: "100%", maxWidth: 500 }}>
				<div style={{ textAlign: "center", marginBottom: 32 }}>
					<Link
						href="/"
						style={{
							fontSize: 22,
							fontWeight: 700,
							color: T.white,
							letterSpacing: "-0.02em",
							textDecoration: "none",
						}}
					>
						SupportNest
					</Link>
				</div>

				<h1
					style={{
						fontSize: 26,
						fontWeight: 700,
						color: T.white,
						margin: "0 0 6px",
						textAlign: "center",
					}}
				>
					Create your account
				</h1>
				<p
					style={{
						fontSize: 14,
						color: T.gray500,
						textAlign: "center",
						margin: "0 0 32px",
					}}
				>
					Tell us about you and your business.
				</p>

				<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: 12,
						}}
					>
						<div>
							<label style={labelStyle}>First name</label>
							<input
								style={inputStyle}
								placeholder="Jane"
								{...field("firstName")}
							/>
							{errors.firstName && (
								<p style={errorStyle}>{errors.firstName}</p>
							)}
						</div>
						<div>
							<label style={labelStyle}>Last name</label>
							<input
								style={inputStyle}
								placeholder="Smith"
								{...field("lastName")}
							/>
							{errors.lastName && (
								<p style={errorStyle}>{errors.lastName}</p>
							)}
						</div>
					</div>

					<div>
						<label style={labelStyle}>Work email</label>
						<input
							style={inputStyle}
							type="email"
							placeholder="jane@company.com"
							{...field("email")}
						/>
						{errors.email && <p style={errorStyle}>{errors.email}</p>}
					</div>

					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: 12,
						}}
					>
						<div>
							<label style={labelStyle}>Password</label>
							<input
								style={inputStyle}
								type="password"
								placeholder="Min. 8 characters"
								{...field("password")}
							/>
							{errors.password && (
								<p style={errorStyle}>{errors.password}</p>
							)}
						</div>
						<div>
							<label style={labelStyle}>Confirm password</label>
							<input
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

					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 12,
							margin: "4px 0",
						}}
					>
						<div style={{ flex: 1, height: 1, background: T.darkBorder }} />
						<span style={{ fontSize: 12, color: T.gray500 }}>
							Business details
						</span>
						<div style={{ flex: 1, height: 1, background: T.darkBorder }} />
					</div>

					<div>
						<label style={labelStyle}>Business name</label>
						<input
							style={inputStyle}
							placeholder="Acme Corp"
							{...field("businessName")}
						/>
						{errors.businessName && (
							<p style={errorStyle}>{errors.businessName}</p>
						)}
					</div>

					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: 12,
						}}
					>
						<div>
							<label style={labelStyle}>Industry</label>
							<select
								style={{ ...inputStyle, appearance: "none" }}
								{...field("industry")}
							>
								<option value="">Select…</option>
								{INDUSTRIES.map((i) => (
									<option key={i} value={i}>
										{i}
									</option>
								))}
							</select>
							{errors.industry && (
								<p style={errorStyle}>{errors.industry}</p>
							)}
						</div>
						<div>
							<label style={labelStyle}>Company size</label>
							<select
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

					<button
						type="button"
						onClick={handleContinueToPayment}
						disabled={submitting}
						style={{
							width: "100%",
							padding: "13px",
							background: T.violet,
							color: T.white,
							border: "none",
							borderRadius: T.radius,
							fontSize: 15,
							fontWeight: 600,
							fontFamily: T.font,
							cursor: "pointer",
							marginTop: 4,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: 8,
							transition: "background .15s",
						}}
						onMouseEnter={(e) =>
							(e.currentTarget.style.background = T.violetHover)
						}
						onMouseLeave={(e) =>
							(e.currentTarget.style.background = T.violet)
						}
					>
						{submitting ? "Creating account…" : "Continue to Payment"}
						{!submitting && (
							<i className="ti ti-arrow-right" style={{ fontSize: 16 }} />
						)}
					</button>

					<p
						style={{
							textAlign: "center",
							fontSize: 13,
							color: T.gray500,
							margin: 0,
						}}
					>
						Already have an account?{" "}
						<Link
							href="/login"
							style={{
								color: T.violet,
								textDecoration: "none",
								fontWeight: 500,
							}}
						>
							Sign in
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
