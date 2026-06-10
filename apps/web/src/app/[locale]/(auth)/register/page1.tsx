"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { usePlan } from "@/context/plan-context";
import { StepIndicator } from "@/components/auth/StepIndicator";
import {
	PaymentStep,
	type RegistrationData,
} from "@/components/auth/PaymentStep";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────

const T = {
	darkBg: "#0F0F0F",
	darkPanel: "#161616",
	darkSurface: "#1E1E1E",
	darkBorder: "rgba(255,255,255,0.08)",
	darkBorder2: "rgba(255,255,255,0.12)",
	white: "#FFFFFF",
	gray500: "#888888",
	gray600: "#666666",
	inputBg: "#1E1E1E",
	inputBorder: "rgba(255,255,255,0.12)",
	inputFocus: "rgba(255,255,255,0.35)",
	violet: "#534AB7",
	violetLight: "#AFA9EC",
	violetBg: "rgba(83,74,183,0.15)",
	green: "#1D9E75",
	greenBg: "rgba(29,158,117,0.12)",
	greenBorder: "rgba(29,158,117,0.3)",
	danger: "#E24B4A",
	radius: "10px",
	radiusSm: "8px",
	radiusLg: "14px",
	font: "'Sora', system-ui, sans-serif",
} as const;

// ─── OPTIONS ──────────────────────────────────────────────────────────────────

const INDUSTRIES = [
	"E-commerce",
	"SaaS",
	"Healthcare",
	"Education",
	"Finance",
	"Real Estate",
	"Logistics",
	"Other",
];

const SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"];

// ─── SECTION HEADER ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: string; title: string }) {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: 10,
				marginBottom: 24,
			}}
		>
			<div
				style={{
					width: 32,
					height: 32,
					borderRadius: T.radiusSm,
					background: T.violetBg,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<i
					className={`ti ti-${icon}`}
					style={{ fontSize: 16, color: T.violet }}
				/>
			</div>
			<h2
				style={{
					fontSize: 16,
					fontWeight: 600,
					color: T.white,
					margin: 0,
					letterSpacing: "-0.3px",
				}}
			>
				{title}
			</h2>
		</div>
	);
}

// ─── FORM FIELD ───────────────────────────────────────────────────────────────

interface FieldProps {
	label: string;
	type?: string;
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	error?: string;
	autoComplete?: string;
	rightEl?: React.ReactNode;
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
}: FieldProps) {
	const [focused, setFocused] = useState(false);
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
			{label && (
				<label
					style={{
						fontSize: 13,
						fontWeight: 500,
						color: "rgba(255,255,255,0.7)",
					}}
				>
					{label}
				</label>
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

// ─── SELECT FIELD ─────────────────────────────────────────────────────────────

function SelectField({
	label,
	value,
	onChange,
	options,
	error,
	placeholder,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	options: string[];
	error?: string;
	placeholder?: string;
}) {
	const [focused, setFocused] = useState(false);
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
			<label
				style={{
					fontSize: 13,
					fontWeight: 500,
					color: "rgba(255,255,255,0.7)",
				}}
			>
				{label}
			</label>
			<div style={{ position: "relative" }}>
				<select
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onFocus={() => setFocused(true)}
					onBlur={() => setFocused(false)}
					style={{
						width: "100%",
						boxSizing: "border-box",
						padding: "12px 36px 12px 14px",
						fontSize: 14,
						fontFamily: T.font,
						color: value ? T.white : T.gray500,
						background: T.inputBg,
						border: `1.5px solid ${error ? T.danger : focused ? T.inputFocus : T.inputBorder}`,
						borderRadius: T.radius,
						outline: "none",
						appearance: "none",
						cursor: "pointer",
						transition: "border-color .15s",
					}}
				>
					<option
						value=""
						disabled
						style={{ color: T.gray500 }}
					>
						{placeholder}
					</option>
					{options.map((o) => (
						<option
							key={o}
							value={o}
							style={{ background: "#1E1E1E", color: T.white }}
						>
							{o}
						</option>
					))}
				</select>
				<i
					className="ti ti-chevron-down"
					style={{
						position: "absolute",
						right: 12,
						top: "50%",
						transform: "translateY(-50%)",
						fontSize: 16,
						color: T.gray500,
						pointerEvents: "none",
					}}
				/>
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

// ─── PLAN SUMMARY ─────────────────────────────────────────────────────────────

function PlanSummary() {
	const { selectedPlan } = usePlan();
	if (!selectedPlan) return null;

	const tax = 0;
	const total = selectedPlan.price + tax;

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: 16,
				position: "sticky",
				top: 40,
			}}
		>
			{/* Price card */}
			<div
				style={{
					background: T.darkSurface,
					border: `1px solid ${T.darkBorder}`,
					borderRadius: T.radiusLg,
					overflow: "hidden",
				}}
			>
				<div
					style={{
						height: 3,
						background: `linear-gradient(90deg, ${T.violet}, ${T.green})`,
					}}
				/>
				<div style={{ padding: "24px" }}>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "flex-start",
							marginBottom: 8,
						}}
					>
						<h3
							style={{
								fontSize: 18,
								fontWeight: 700,
								color: T.white,
								margin: 0,
								letterSpacing: "-0.4px",
							}}
						>
							{selectedPlan.name}
						</h3>
						{selectedPlan.recommended && (
							<span
								style={{
									background: T.violetBg,
									color: T.violetLight,
									fontSize: 11,
									fontWeight: 500,
									padding: "3px 10px",
									borderRadius: 999,
									border: "1px solid rgba(83,74,183,0.3)",
									whiteSpace: "nowrap",
								}}
							>
								Recommended
							</span>
						)}
					</div>

					<p
						style={{
							fontSize: 13,
							color: T.gray500,
							margin: "0 0 20px",
							lineHeight: 1.5,
						}}
					>
						{selectedPlan.description}
					</p>

					<div
						style={{
							display: "flex",
							alignItems: "baseline",
							gap: 4,
							marginBottom: 20,
						}}
					>
						<span
							style={{
								fontSize: 38,
								fontWeight: 700,
								color: T.white,
								letterSpacing: "-1px",
							}}
						>
							${selectedPlan.price}
						</span>
						<span style={{ fontSize: 13, color: T.gray500 }}>/month</span>
					</div>

					<div
						style={{ height: 1, background: T.darkBorder, marginBottom: 20 }}
					/>

					<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
						<div style={{ display: "flex", justifyContent: "space-between" }}>
							<span style={{ fontSize: 13, color: T.gray500 }}>
								{selectedPlan.name} Subscription
							</span>
							<span style={{ fontSize: 13, color: T.white, fontWeight: 500 }}>
								${selectedPlan.price.toFixed(2)}
							</span>
						</div>
						<div style={{ display: "flex", justifyContent: "space-between" }}>
							<span style={{ fontSize: 13, color: T.gray500 }}>
								Taxes (Est.)
							</span>
							<span style={{ fontSize: 13, color: T.white, fontWeight: 500 }}>
								${tax.toFixed(2)}
							</span>
						</div>
					</div>

					<div
						style={{ height: 1, background: T.darkBorder, margin: "20px 0" }}
					/>

					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<span style={{ fontSize: 15, fontWeight: 600, color: T.white }}>
							Total Due Today
						</span>
						<span
							style={{
								fontSize: 20,
								fontWeight: 700,
								color: T.white,
								letterSpacing: "-0.5px",
							}}
						>
							${total.toFixed(2)}
						</span>
					</div>
				</div>
			</div>

			{/* Plan includes */}
			<div
				style={{
					background: T.darkSurface,
					border: `1px solid ${T.darkBorder}`,
					borderRadius: T.radiusLg,
					padding: "24px",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 10,
						marginBottom: 18,
					}}
				>
					<div
						style={{
							width: 28,
							height: 28,
							borderRadius: T.radiusSm,
							background: T.greenBg,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<i
							className="ti ti-shield-check"
							style={{ fontSize: 15, color: T.green }}
						/>
					</div>
					<span style={{ fontSize: 14, fontWeight: 600, color: T.white }}>
						Plan Includes
					</span>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
					{selectedPlan.features.map((f) => (
						<div
							key={f}
							style={{ display: "flex", alignItems: "center", gap: 10 }}
						>
							<div
								style={{
									width: 20,
									height: 20,
									borderRadius: "50%",
									background: T.greenBg,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									flexShrink: 0,
								}}
							>
								<i
									className="ti ti-check"
									style={{ fontSize: 11, color: T.green }}
								/>
							</div>
							<span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
								{f}
							</span>
						</div>
					))}
				</div>
			</div>

			{/* Security note */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 8,
					padding: "12px 16px",
					background: T.darkSurface,
					border: `1px solid ${T.darkBorder}`,
					borderRadius: T.radius,
				}}
			>
				<i
					className="ti ti-lock"
					style={{ fontSize: 15, color: T.gray500, flexShrink: 0 }}
				/>
				<span style={{ fontSize: 12, color: T.gray500, lineHeight: 1.5 }}>
					Secured by 256-bit SSL encryption. Your data is always protected.
				</span>
			</div>
		</div>
	);
}

// ─── STEP 1 ───────────────────────────────────────────────────────────────────

interface Step1Props {
	form: RegistrationData;
	onChange: (data: RegistrationData) => void;
	onNext: () => void;
}

function Step1({ form, onChange, onNext }: Step1Props) {
	const [showPass, setShowPass] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [errors, setErrors] = useState<Partial<RegistrationData>>({});

	const set = (k: keyof RegistrationData) => (v: string) =>
		onChange({ ...form, [k]: v });

	const validate = () => {
		const e: Partial<RegistrationData> = {};
		if (!form.firstName.trim()) e.firstName = "Required.";
		if (!form.lastName.trim()) e.lastName = "Required.";
		if (!form.email) e.email = "Email is required.";
		else if (!/\S+@\S+\.\S+/.test(form.email))
			e.email = "Enter a valid email.";
		if (!form.password) e.password = "Password is required.";
		else if (form.password.length < 8) e.password = "Min. 8 characters.";
		if (!form.confirmPassword)
			e.confirmPassword = "Please confirm your password.";
		else if (form.password !== form.confirmPassword)
			e.confirmPassword = "Passwords do not match.";
		if (!form.businessName) e.businessName = "Required.";
		if (!form.industry) e.industry = "Required.";
		if (!form.size) e.size = "Required.";
		return e;
	};

	const handleNext = () => {
		const e = validate();
		if (Object.keys(e).length) {
			setErrors(e);
			return;
		}
		onNext();
	};

	const strength = (() => {
		const p = form.password;
		if (!p) return 0;
		let s = 0;
		if (p.length >= 8) s++;
		if (/[A-Z]/.test(p)) s++;
		if (/[0-9]/.test(p)) s++;
		if (/[^A-Za-z0-9]/.test(p)) s++;
		return s;
	})();
	const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
	const strengthColor = ["", T.danger, "#EF9F27", T.green, T.green];

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
			<SectionHeader
				icon="user"
				title="Account Details"
			/>

			<div
				style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
			>
				<FormField
					label="First Name"
					value={form.firstName}
					onChange={set("firstName")}
					placeholder="Mohamed"
					error={errors.firstName}
					autoComplete="given-name"
				/>
				<FormField
					label="Last Name"
					value={form.lastName}
					onChange={set("lastName")}
					placeholder="Rashad"
					error={errors.lastName}
					autoComplete="family-name"
				/>
			</div>

			<FormField
				label="Work Email"
				type="email"
				value={form.email}
				onChange={set("email")}
				placeholder="you@company.com"
				error={errors.email}
				autoComplete="email"
			/>

			<FormField
				label="Password"
				type={showPass ? "text" : "password"}
				value={form.password}
				onChange={set("password")}
				placeholder="Min. 8 characters"
				error={errors.password}
				autoComplete="new-password"
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

			{form.password && (
				<div style={{ marginTop: -12 }}>
					<div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
						{[1, 2, 3, 4].map((i) => (
							<div
								key={i}
								style={{
									flex: 1,
									height: 3,
									borderRadius: 2,
									background:
										i <= strength
											? strengthColor[strength]
											: "rgba(255,255,255,0.08)",
									transition: "background .2s",
								}}
							/>
						))}
					</div>
					<span style={{ fontSize: 11, color: strengthColor[strength] }}>
						{strengthLabel[strength]}
					</span>
				</div>
			)}

			<FormField
				label="Confirm Password"
				type={showConfirm ? "text" : "password"}
				value={form.confirmPassword}
				onChange={set("confirmPassword")}
				placeholder="Repeat your password"
				error={errors.confirmPassword}
				autoComplete="new-password"
				rightEl={
					<button
						onClick={() => setShowConfirm((p) => !p)}
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
							className={`ti ti-eye${showConfirm ? "-off" : ""}`}
							style={{ fontSize: 17 }}
						/>
					</button>
				}
			/>

			<FormField
				label="Company Name"
				type="text"
				value={form.businessName}
				onChange={set("businessName")}
				placeholder="Your Company Name"
				error={errors.businessName}
				autoComplete="text"
			/>

			<div
				style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
			>
				<SelectField
					label="Company Industry"
					value={form.industry}
					onChange={set("industry")}
					options={INDUSTRIES}
					placeholder="Select industry"
					error={errors.industry}
				/>
				<SelectField
					label="Company Size"
					value={form.size}
					onChange={set("size")}
					options={SIZES}
					placeholder="Select size"
					error={errors.size}
				/>
			</div>

			<button
				onClick={handleNext}
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
					cursor: "pointer",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					gap: 8,
					marginTop: 8,
				}}
			>
				Continue to Payment
				<i
					className="ti ti-arrow-right"
					style={{ fontSize: 16 }}
				/>
			</button>
		</div>
	);
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
	const router = useRouter();
	const { selectedPlan } = usePlan();
	const [step, setStep] = useState<1 | 2>(1);
	const [apiError, setApiError] = useState("");

	// ─── Form state lives here — survives step switching ──────────────────────
	const [formData, setFormData] = useState<RegistrationData>({
		firstName: "",
		lastName: "",
		email: "",
		password: "",
		confirmPassword: "",
		businessName: "",
		industry: "",
		size: "",
	});

	const handleStep1Complete = async () => {
		setApiError("");
		try {
			await api.register({
				email: formData.email,
				password: formData.password,
				firstName: formData.firstName,
				lastName: formData.lastName,
				businessName: formData.businessName,
				planId: selectedPlan?.id ?? "",
			});
			setStep(2);
		} catch (e: any) {
			setApiError(e.message ?? "Registration failed. Please try again.");
		}
	};

	return (
		<>
			<style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

			<div
				style={{
					minHeight: "100vh",
					background: T.darkBg,
					fontFamily: T.font,
					display: "flex",
					flexDirection: "column",
				}}
			>
				{/* Nav */}
				<nav
					style={{
						height: 60,
						borderBottom: `1px solid ${T.darkBorder}`,
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						padding: "0 40px",
						background: T.darkPanel,
						flexShrink: 0,
					}}
				>
					<div style={{ display: "flex", alignItems: "center", gap: 9 }}>
						<div
							style={{
								width: 30,
								height: 30,
								background: T.violet,
								borderRadius: T.radiusSm,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<i
								className="ti ti-shield-check"
								style={{ color: T.white, fontSize: 15 }}
							/>
						</div>
						<span
							style={{
								fontSize: 14,
								fontWeight: 600,
								color: T.white,
								letterSpacing: "-0.3px",
							}}
						>
							SupportNest
						</span>
					</div>
					<button
						onClick={() => router.push("/login")}
						style={{
							background: "none",
							border: "none",
							fontSize: 13,
							color: T.gray500,
							cursor: "pointer",
							fontFamily: T.font,
						}}
					>
						Already have an account?{" "}
						<span style={{ color: T.violetLight, fontWeight: 600 }}>
							Sign in
						</span>
					</button>
				</nav>

				{/* Content */}
				<div
					style={{
						flex: 1,
						display: "grid",
						gridTemplateColumns: "1fr 380px",
						gap: 32,
						maxWidth: 1100,
						width: "100%",
						margin: "0 auto",
						padding: "48px 40px",
						alignItems: "start",
					}}
				>
					{/* Left — form */}
					<div
						style={{
							background: T.darkPanel,
							border: `1px solid ${T.darkBorder}`,
							borderRadius: T.radiusLg,
							padding: "40px",
						}}
					>
						<h1
							style={{
								fontSize: 26,
								fontWeight: 700,
								color: T.white,
								margin: "0 0 8px",
								letterSpacing: "-0.7px",
							}}
						>
							Complete Your Registration
						</h1>
						<p
							style={{
								fontSize: 14,
								color: T.gray500,
								margin: "0 0 32px",
								lineHeight: 1.5,
							}}
						>
							Set up your account and finalize your SupportNest plan.
						</p>

						<StepIndicator current={step} />

						{apiError && (
							<div
								role="alert"
								style={{
									background: "rgba(226,75,74,0.12)",
									border: "1px solid rgba(226,75,74,0.3)",
									borderRadius: T.radius,
									padding: "12px 16px",
									fontSize: 13,
									color: T.danger,
									display: "flex",
									gap: 8,
									alignItems: "center",
									marginBottom: 20,
								}}
							>
								<i
									className="ti ti-alert-circle"
									style={{ fontSize: 16, flexShrink: 0 }}
								/>
								{apiError}
							</div>
						)}

						{step === 1 && (
							<Step1
								form={formData}
								onChange={setFormData}
								onNext={handleStep1Complete}
							/>
						)}
						{step === 2 && (
							<PaymentStep
								registrationData={formData}
								onBack={() => setStep(1)}
							/>
						)}
					</div>

					{/* Right — plan summary */}
					<PlanSummary />
				</div>
			</div>
		</>
	);
}
