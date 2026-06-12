"use client";

import { useEffect, useState, useRef } from "react";
import {
	UserProfile,
	OrgProfile,
	WidgetConfig,
	UpdateProfileInput,
	UpdatePasswordInput,
	UpdateWidgetConfigInput,
} from "@/types/types";
import { S } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fieldStyle = (
	focused: boolean,
	error?: string,
): React.CSSProperties => ({
	width: "100%",
	boxSizing: "border-box",
	height: 40,
	padding: "0 12px",
	border: `1.5px solid ${error ? "#E24B4A" : focused ? S.purple : S.border}`,
	borderRadius: 8,
	fontSize: 13,
	fontFamily: "inherit",
	color: S.dark,
	outline: "none",
	background: "#fafafa",
	transition: "border-color .15s",
});

function Field({
	label,
	value,
	onChange,
	type = "text",
	placeholder,
	error,
	disabled,
	hint,
}: {
	label: string;
	value: string;
	onChange?: (v: string) => void;
	type?: string;
	placeholder?: string;
	error?: string;
	disabled?: boolean;
	hint?: string;
}) {
	const [focused, setFocused] = useState(false);
	return (
		<div>
			<label
				style={{
					display: "block",
					fontSize: 12,
					fontWeight: 500,
					color: S.dark,
					marginBottom: 5,
				}}
			>
				{label}
			</label>
			<input
				type={type}
				value={value}
				onChange={(e) => onChange?.(e.target.value)}
				placeholder={placeholder}
				disabled={disabled}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				style={{
					...fieldStyle(focused, error),
					opacity: disabled ? 0.6 : 1,
					cursor: disabled ? "not-allowed" : "text",
				}}
			/>
			{error && (
				<p style={{ fontSize: 11, color: "#E24B4A", margin: "4px 0 0" }}>
					{error}
				</p>
			)}
			{hint && !error && (
				<p style={{ fontSize: 11, color: S.textMuted, margin: "4px 0 0" }}>
					{hint}
				</p>
			)}
		</div>
	);
}

function SaveBtn({
	loading,
	onClick,
	label = "Save changes",
}: {
	loading: boolean;
	onClick: () => void;
	label?: string;
}) {
	return (
		<button
			onClick={onClick}
			disabled={loading}
			style={{
				height: 38,
				padding: "0 20px",
				background: loading ? S.purpleLight : S.purple,
				color: "#fff",
				border: "none",
				borderRadius: 8,
				fontSize: 13,
				fontWeight: 500,
				fontFamily: "inherit",
				cursor: loading ? "not-allowed" : "pointer",
				display: "inline-flex",
				alignItems: "center",
				gap: 8,
				transition: "background .15s",
			}}
		>
			{loading ? (
				<>
					<i
						className="ti ti-loader-2"
						style={{ fontSize: 14, animation: "spin 1s linear infinite" }}
					/>
					Saving…
				</>
			) : (
				<>
					<i
						className="ti ti-check"
						style={{ fontSize: 14 }}
					/>
					{label}
				</>
			)}
		</button>
	);
}

function SectionCard({
	title,
	icon,
	children,
}: {
	title: string;
	icon: string;
	children: React.ReactNode;
}) {
	return (
		<div
			style={{
				background: "#fff",
				border: `0.5px solid ${S.border}`,
				borderRadius: 12,
				overflow: "hidden",
				marginBottom: 16,
			}}
		>
			<div
				style={{
					padding: "14px 20px",
					borderBottom: `0.5px solid ${S.border}`,
					display: "flex",
					alignItems: "center",
					gap: 8,
				}}
			>
				<i
					className={`ti ti-${icon}`}
					style={{ fontSize: 17, color: S.purple }}
				/>
				<span style={{ fontSize: 13, fontWeight: 600, color: S.dark }}>
					{title}
				</span>
			</div>
			<div style={{ padding: "20px" }}>{children}</div>
		</div>
	);
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
	useEffect(() => {
		const t = setTimeout(onDone, 3000);
		return () => clearTimeout(t);
	}, [onDone]);
	const isError = message.startsWith("Error:");
	return (
		<div
			style={{
				position: "fixed",
				bottom: 24,
				right: 24,
				zIndex: 200,
				background: isError ? "#1a1830" : S.dark,
				color: "#fff",
				fontSize: 13,
				padding: "10px 16px",
				borderRadius: 10,
				boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
				animation: "fadeIn .2s ease",
				display: "flex",
				alignItems: "center",
				gap: 8,
			}}
		>
			<i
				className={`ti ti-${isError ? "alert-circle" : "check"}`}
				style={{ fontSize: 15, color: isError ? "#F87171" : S.green }}
			/>
			{message}
		</div>
	);
}

// ─── TAB: PROFILE ─────────────────────────────────────────────────────────────
function ProfileTab({ user }: { user: UserProfile }) {
	const [form, setForm] = useState<UpdateProfileInput>({
		first_name: user.first_name,
		last_name: user.last_name,
		email: user.email,
	});
	const [errors, setErrors] = useState<Partial<UpdateProfileInput>>({});
	const [loading, setLoading] = useState(false);
	const [toast, setToast] = useState("");

	// Password change state
	const [pwForm, setPwForm] = useState<UpdatePasswordInput>({
		current_password: "",
		new_password: "",
	});
	const [pwErrors, setPwErrors] = useState<Partial<UpdatePasswordInput>>({});
	const [pwLoading, setPwLoading] = useState(false);
	const [showCurrent, setShowCurrent] = useState(false);
	const [showNew, setShowNew] = useState(false);

	const set = (k: keyof UpdateProfileInput) => (v: string) =>
		setForm((f) => ({ ...f, [k]: v }));
	const setPw = (k: keyof UpdatePasswordInput) => (v: string) =>
		setPwForm((f) => ({ ...f, [k]: v }));

	const initials =
		`${form.first_name?.[0] ?? ""}${form.last_name?.[0] ?? ""}`.toUpperCase();

	const roleLabel: Record<string, string> = {
		org_admin: "Admin",
		support_agent: "Support Agent",
		super_admin: "Super Admin",
	};

	// Password strength
	const strength = (() => {
		const p = pwForm.new_password;
		if (!p) return 0;
		let s = 0;
		if (p.length >= 8) s++;
		if (/[A-Z]/.test(p)) s++;
		if (/[0-9]/.test(p)) s++;
		if (/[^A-Za-z0-9]/.test(p)) s++;
		return s;
	})();
	const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
	const strengthColor = ["", "#E24B4A", "#EF9F27", S.green, S.green];

	const validateProfile = () => {
		const e: Partial<UpdateProfileInput> = {};
		if (!form.first_name.trim()) e.first_name = "Required.";
		if (!form.last_name.trim()) e.last_name = "Required.";
		if (!form.email.trim()) e.email = "Required.";
		else if (!/\S+@\S+\.\S+/.test(form.email))
			e.email = "Enter a valid email.";
		return e;
	};

	const handleSaveProfile = async () => {
		const e = validateProfile();
		if (Object.keys(e).length) {
			setErrors(e);
			return;
		}
		setErrors({});
		setLoading(true);
		try {
			await api.updateUserProfile(form);
			setToast("Profile saved.");
		} catch (err: any) {
			setToast("Error: " + err.message);
		} finally {
			setLoading(false);
		}
	};

	const validatePassword = () => {
		const e: Partial<UpdatePasswordInput> = {};
		if (!pwForm.current_password) e.current_password = "Required.";
		if (!pwForm.new_password) e.new_password = "Required.";
		else if (pwForm.new_password.length < 8)
			e.new_password = "At least 8 characters.";
		return e;
	};

	const handleSavePassword = async () => {
		const e = validatePassword();
		if (Object.keys(e).length) {
			setPwErrors(e);
			return;
		}
		setPwErrors({});
		setPwLoading(true);
		try {
			await api.updatePassword(pwForm);
			setPwForm({ current_password: "", new_password: "" });
			setToast("Password updated.");
		} catch (err: any) {
			setToast("Error: " + err.message);
		} finally {
			setPwLoading(false);
		}
	};

	return (
		<>
			{/* Profile banner */}
			<div
				style={{
					background: `linear-gradient(135deg, #534AB7 0%, #7F77DD 100%)`,
					borderRadius: 12,
					padding: "1.5rem 1.5rem 1.25rem",
					display: "flex",
					alignItems: "center",
					gap: 16,
					marginBottom: 16,
				}}
			>
				<div
					style={{
						width: 60,
						height: 60,
						borderRadius: "50%",
						background: "rgba(255,255,255,0.2)",
						border: "2.5px solid rgba(255,255,255,0.4)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						fontSize: 20,
						fontWeight: 600,
						color: "#fff",
						flexShrink: 0,
					}}
				>
					{initials}
				</div>
				<div>
					<div style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>
						{form.first_name} {form.last_name}
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 8,
							marginTop: 4,
						}}
					>
						<span
							style={{
								background: "rgba(255,255,255,0.2)",
								color: "#fff",
								fontSize: 11,
								fontWeight: 500,
								padding: "2px 9px",
								borderRadius: 999,
							}}
						>
							{roleLabel[user.role] ?? user.role}
						</span>
						<span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
							{form.email}
						</span>
					</div>
				</div>
			</div>

			{/* Personal info */}
			<SectionCard
				title="Personal Information"
				icon="user"
			>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gap: 14,
						marginBottom: 14,
					}}
				>
					<Field
						label="First Name"
						value={form.first_name}
						onChange={set("first_name")}
						placeholder="Mohamed"
						error={errors.first_name}
					/>
					<Field
						label="Last Name"
						value={form.last_name}
						onChange={set("last_name")}
						placeholder="Rashad"
						error={errors.last_name}
					/>
				</div>
				<div style={{ marginBottom: 20 }}>
					<Field
						label="Email Address"
						value={form.email}
						onChange={set("email")}
						type="email"
						placeholder="you@company.com"
						error={errors.email}
					/>
				</div>
				<div style={{ display: "flex", justifyContent: "flex-end" }}>
					<SaveBtn
						loading={loading}
						onClick={handleSaveProfile}
					/>
				</div>
			</SectionCard>

			{/* Security */}
			<SectionCard
				title="Security"
				icon="lock"
			>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gap: 14,
						marginBottom: 14,
					}}
				>
					{/* Current password */}
					<div>
						<label
							style={{
								display: "block",
								fontSize: 12,
								fontWeight: 500,
								color: S.dark,
								marginBottom: 5,
							}}
						>
							Current Password
						</label>
						<div style={{ position: "relative" }}>
							<input
								type={showCurrent ? "text" : "password"}
								value={pwForm.current_password}
								onChange={(e) => setPw("current_password")(e.target.value)}
								placeholder="••••••••"
								style={{
									...fieldStyle(false, pwErrors.current_password),
									paddingRight: 36,
								}}
							/>
							<button
								onClick={() => setShowCurrent((p) => !p)}
								style={{
									position: "absolute",
									right: 10,
									top: "50%",
									transform: "translateY(-50%)",
									background: "none",
									border: "none",
									cursor: "pointer",
									color: S.textMuted,
									padding: 0,
									display: "flex",
								}}
							>
								<i
									className={`ti ti-eye${showCurrent ? "-off" : ""}`}
									style={{ fontSize: 16 }}
								/>
							</button>
						</div>
						{pwErrors.current_password && (
							<p style={{ fontSize: 11, color: "#E24B4A", margin: "4px 0 0" }}>
								{pwErrors.current_password}
							</p>
						)}
					</div>

					{/* New password */}
					<div>
						<label
							style={{
								display: "block",
								fontSize: 12,
								fontWeight: 500,
								color: S.dark,
								marginBottom: 5,
							}}
						>
							New Password
						</label>
						<div style={{ position: "relative" }}>
							<input
								type={showNew ? "text" : "password"}
								value={pwForm.new_password}
								onChange={(e) => setPw("new_password")(e.target.value)}
								placeholder="Min. 8 characters"
								style={{
									...fieldStyle(false, pwErrors.new_password),
									paddingRight: 36,
								}}
							/>
							<button
								onClick={() => setShowNew((p) => !p)}
								style={{
									position: "absolute",
									right: 10,
									top: "50%",
									transform: "translateY(-50%)",
									background: "none",
									border: "none",
									cursor: "pointer",
									color: S.textMuted,
									padding: 0,
									display: "flex",
								}}
							>
								<i
									className={`ti ti-eye${showNew ? "-off" : ""}`}
									style={{ fontSize: 16 }}
								/>
							</button>
						</div>
						{pwErrors.new_password && (
							<p style={{ fontSize: 11, color: "#E24B4A", margin: "4px 0 0" }}>
								{pwErrors.new_password}
							</p>
						)}
						{/* strength meter */}
						{pwForm.new_password && (
							<div style={{ marginTop: 6 }}>
								<div style={{ display: "flex", gap: 3, marginBottom: 3 }}>
									{[1, 2, 3, 4].map((i) => (
										<div
											key={i}
											style={{
												flex: 1,
												height: 3,
												borderRadius: 2,
												background:
													i <= strength ? strengthColor[strength] : S.border,
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
					</div>
				</div>
				<div style={{ display: "flex", justifyContent: "flex-end" }}>
					<SaveBtn
						loading={pwLoading}
						onClick={handleSavePassword}
						label="Update password"
					/>
				</div>
			</SectionCard>

			{/* Read-only account info */}
			<SectionCard
				title="Account Info"
				icon="info-circle"
			>
				<div
					style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
				>
					<Field
						label="Role"
						value={roleLabel[user.role] ?? user.role}
						disabled
					/>
					<Field
						label="Member since"
						value={new Date(user.created_at).toLocaleDateString("en-US", {
							month: "long",
							day: "numeric",
							year: "numeric",
						})}
						disabled
					/>
				</div>
			</SectionCard>

			{toast && (
				<Toast
					message={toast}
					onDone={() => setToast("")}
				/>
			)}
		</>
	);
}

// ─── TAB: ORGANIZATION ────────────────────────────────────────────────────────
function OrgTab({ org }: { org: OrgProfile }) {
	const [name, setName] = useState(org.name);
	const [email, setEmail] = useState(org.email);
	const [widget, setWidget] = useState<WidgetConfig>({ ...org.widget_config });
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);
	const [toast, setToast] = useState("");
	const colorRef = useRef<HTMLInputElement>(null);

	const setW = (k: keyof WidgetConfig) => (v: string) =>
		setWidget((w) => ({ ...w, [k]: v }));

	const validate = () => {
		const e: Record<string, string> = {};
		if (!name.trim()) e.name = "Organization name is required.";
		if (!email.trim()) e.email = "Email is required.";
		else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email.";
		if (!widget.greeting.trim()) e.greeting = "Greeting message is required.";
		return e;
	};

	const handleSave = async () => {
		const e = validate();
		if (Object.keys(e).length) {
			setErrors(e);
			return;
		}
		setErrors({});
		setLoading(true);
		try {
			const [orgResult, widgetResult] = await Promise.all([
				api.updateOrgProfile({ name, email }),
				api.updateWidgetConfig({
					title: widget.title ?? "Support",
					greetingMessage: widget.greeting,
					accentColor: widget.color,
					placeholder: "Type a message...",
				}),
			]);
			const merged = {
				...orgResult.organization,
				widget_config: widgetResult.organization.widget_config,
			};
			setName(merged.name);
			setEmail(merged.email);
			setWidget(merged.widget_config);
			setToast("Organization settings saved.");
		} catch (err: any) {
			setToast("Error: " + err.message);
		} finally {
			setLoading(false);
		}
	};

	// Live widget preview colors
	const previewBg = widget.color;

	return (
		<>
			{/* General */}
			<SectionCard
				title="General"
				icon="building"
			>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gap: 14,
						marginBottom: 14,
					}}
				>
					<Field
						label="Organization Name"
						value={name}
						onChange={setName}
						placeholder="Acme Corp"
						error={errors.name}
					/>
					<Field
						label="Support Email"
						value={email}
						onChange={setEmail}
						type="email"
						placeholder="support@company.com"
						error={errors.email}
					/>
				</div>
				<Field
					label="Slug"
					value={org.slug}
					disabled
					hint="URL-safe identifier — contact support to change."
				/>
			</SectionCard>

			{/* Widget config */}
			<SectionCard
				title="Widget Configuration"
				icon="message-chatbot"
			>
				<div
					style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}
				>
					{/* Left: controls */}
					<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
						{/* Color picker */}
						<div>
							<label
								style={{
									display: "block",
									fontSize: 12,
									fontWeight: 500,
									color: S.dark,
									marginBottom: 8,
								}}
							>
								Widget Color
							</label>
							<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
								<div
									onClick={() => colorRef.current?.click()}
									style={{
										width: 40,
										height: 40,
										borderRadius: 8,
										background: widget.color,
										cursor: "pointer",
										border: `2px solid ${S.border}`,
										flexShrink: 0,
										transition: "background .15s",
									}}
								/>
								<input
									ref={colorRef}
									type="color"
									value={widget.color}
									onChange={(e) => setW("color")(e.target.value)}
									style={{
										position: "absolute",
										opacity: 0,
										pointerEvents: "none",
										width: 0,
										height: 0,
									}}
								/>
								<input
									value={widget.color}
									onChange={(e) => {
										const v = e.target.value;
										if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setW("color")(v);
									}}
									placeholder="#534AB7"
									style={{
										width: 110,
										height: 40,
										padding: "0 12px",
										border: `1.5px solid ${S.border}`,
										borderRadius: 8,
										fontSize: 13,
										fontFamily: "monospace",
										color: S.dark,
										outline: "none",
										background: "#fafafa",
									}}
								/>
								<div style={{ display: "flex", gap: 6 }}>
									{[
										"#534AB7",
										"#0F6E56",
										"#854F0B",
										"#A32D2D",
										"#185FA5",
										"#1a1830",
									].map((c) => (
										<div
											key={c}
											onClick={() => setW("color")(c)}
											style={{
												width: 22,
												height: 22,
												borderRadius: 5,
												background: c,
												cursor: "pointer",
												border: `2px solid ${widget.color === c ? S.dark : "transparent"}`,
												transition: "border .1s",
											}}
										/>
									))}
								</div>
							</div>
						</div>

						{/* Title */}
						<div>
							<label
								style={{
									display: "block",
									fontSize: 12,
									fontWeight: 500,
									color: S.dark,
									marginBottom: 5,
								}}
							>
								Widget Title
								<span
									style={{
										color: S.textMuted,
										fontWeight: 400,
										marginLeft: 6,
									}}
								>
									({(widget.title ?? "").length}/30)
								</span>
							</label>
							<input
								type="text"
								value={widget.title ?? ""}
								onChange={(e) => {
									if (e.target.value.length <= 30)
										setW("title")(e.target.value);
								}}
								placeholder="e.g. Support"
								style={{
									width: "100%",
									boxSizing: "border-box",
									padding: "10px 12px",
									border: `1.5px solid ${errors.title ? "#E24B4A" : S.border}`,
									borderRadius: 8,
									fontSize: 13,
									fontFamily: "inherit",
									color: S.dark,
									outline: "none",
									background: "#fafafa",
									transition: "border-color .15s",
								}}
								onFocus={(e) => (e.target.style.borderColor = S.purple)}
								onBlur={(e) =>
								(e.target.style.borderColor = errors.title
									? "#E24B4A"
									: S.border)
								}
							/>
							{errors.title && (
								<p
									style={{ fontSize: 11, color: "#E24B4A", margin: "4px 0 0" }}
								>
									{errors.title}
								</p>
							)}
						</div>

						{/* Greeting */}
						<div>
							<label
								style={{
									display: "block",
									fontSize: 12,
									fontWeight: 500,
									color: S.dark,
									marginBottom: 5,
								}}
							>
								Greeting Message
								<span
									style={{
										color: S.textMuted,
										fontWeight: 400,
										marginLeft: 6,
									}}
								>
									({widget.greeting.length}/120)
								</span>
							</label>
							<textarea
								value={widget.greeting}
								onChange={(e) => {
									if (e.target.value.length <= 120)
										setW("greeting")(e.target.value);
								}}
								placeholder="Hi! How can we help you today?"
								rows={3}
								style={{
									width: "100%",
									boxSizing: "border-box",
									padding: "10px 12px",
									border: `1.5px solid ${errors.greeting ? "#E24B4A" : S.border}`,
									borderRadius: 8,
									fontSize: 13,
									fontFamily: "inherit",
									color: S.dark,
									outline: "none",
									background: "#fafafa",
									resize: "none",
									transition: "border-color .15s",
								}}
								onFocus={(e) => (e.target.style.borderColor = S.purple)}
								onBlur={(e) =>
								(e.target.style.borderColor = errors.greeting
									? "#E24B4A"
									: S.border)
								}
							/>
							{errors.greeting && (
								<p
									style={{ fontSize: 11, color: "#E24B4A", margin: "4px 0 0" }}
								>
									{errors.greeting}
								</p>
							)}
						</div>
					</div>

					{/* Right: live preview */}
					<div>
						<label
							style={{
								display: "block",
								fontSize: 12,
								fontWeight: 500,
								color: S.dark,
								marginBottom: 8,
							}}
						>
							Live Preview
						</label>
						<div
							style={{
								background: "#f0eff8",
								borderRadius: 12,
								padding: 16,
								height: 280,
								position: "relative",
								overflow: "hidden",
								border: `0.5px solid ${S.border}`,
							}}
						>
							{/* Fake browser chrome */}
							<div
								style={{
									background: "#fff",
									borderRadius: 8,
									padding: "8px 10px",
									fontSize: 11,
									color: S.textMuted,
									marginBottom: 8,
									display: "flex",
									alignItems: "center",
									gap: 6,
									border: `0.5px solid ${S.border}`,
								}}
							>
								<div style={{ display: "flex", gap: 4 }}>
									{["#F87171", "#FBBF24", "#34D399"].map((c) => (
										<div
											key={c}
											style={{
												width: 8,
												height: 8,
												borderRadius: "50%",
												background: c,
											}}
										/>
									))}
								</div>
								<div
									style={{
										flex: 1,
										background: "#f0eff8",
										borderRadius: 4,
										padding: "3px 8px",
										fontSize: 10,
										color: S.textMuted,
									}}
								>
									yoursite.com
								</div>
							</div>

							{/* Widget bubble */}
							<div
								style={{
									position: "absolute",
									bottom: 16,
									right: 16,
									transition: "left .3s, right .3s",
								}}
							>
								{/* Chat window */}
								<div
									style={{
										background: "#fff",
										borderRadius: 12,
										width: 190,
										boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
										marginBottom: 10,
										overflow: "hidden",
									}}
								>
									{/* Header */}
									<div style={{ background: previewBg, padding: "10px 12px" }}>
										<div
											style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}
										>
											{widget.title ?? "Support"}
										</div>
										<div
											style={{
												fontSize: 10,
												color: "rgba(255,255,255,0.7)",
												marginTop: 2,
											}}
										>
											We typically reply instantly
										</div>
									</div>
									{/* Greeting bubble */}
									<div style={{ padding: "10px 12px" }}>
										<div
											style={{
												background: "#f0eff8",
												borderRadius: "0 8px 8px 8px",
												padding: "8px 10px",
												fontSize: 11,
												color: S.dark,
												lineHeight: 1.4,
											}}
										>
											{widget.greeting || "Hi! How can we help?"}
										</div>
									</div>
									{/* Input */}
									<div style={{ padding: "0 10px 10px" }}>
										<div
											style={{
												border: `1px solid ${S.border}`,
												borderRadius: 20,
												padding: "5px 10px",
												fontSize: 10,
												color: S.textMuted,
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between",
											}}
										>
											<span>Type a message…</span>
											<div
												style={{
													width: 18,
													height: 18,
													borderRadius: "50%",
													background: previewBg,
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
												}}
											>
												<i
													className="ti ti-send"
													style={{ fontSize: 9, color: "#fff" }}
												/>
											</div>
										</div>
									</div>
								</div>
								{/* FAB */}
								<div
									style={{
										width: 40,
										height: 40,
										borderRadius: "50%",
										background: previewBg,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
										marginLeft: "auto",
										cursor: "pointer",
									}}
								>
									<i
										className="ti ti-message-2"
										style={{ fontSize: 18, color: "#fff" }}
									/>
								</div>
							</div>
						</div>
						<p style={{ fontSize: 11, color: S.textMuted, margin: "8px 0 0" }}>
							Preview updates as you change settings.
						</p>
					</div>
				</div>

				<div
					style={{
						display: "flex",
						justifyContent: "flex-end",
						marginTop: 20,
						paddingTop: 16,
						borderTop: `0.5px solid ${S.border}`,
					}}
				>
					<SaveBtn
						loading={loading}
						onClick={handleSave}
						label="Save organization settings"
					/>
				</div>
			</SectionCard>

			{toast && (
				<Toast
					message={toast}
					onDone={() => setToast("")}
				/>
			)}
		</>
	);
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
type Tab = "organization";

export default function SettingsPage() {
	const { user } = useAuth();
	const [tab, setTab] = useState<Tab>("organization");
	const [org, setOrg] = useState<OrgProfile | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (user?.role === "super_admin") {
			setLoading(false);
			return;
		}
		api.getOrgProfile()
			.then((o) => {
				setOrg(o.organization);
			})
			.catch((err) => {
				console.error("Failed to load org profile:", err);
			})
			.finally(() => setLoading(false));
	}, [user]);

	if (loading) {
		return (
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					height: "100%",
					color: S.textMuted,
				}}
			>
				<i
					className="ti ti-loader-2"
					style={{ fontSize: 24, animation: "spin 1s linear infinite" }}
				/>
				<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
			</div>
		);
	}

	const tabs: { key: Tab; label: string; icon: string }[] = [
		{ key: "organization", label: "Organization", icon: "building" },
	];

	return (
		<>
			<style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

			<div style={{ padding: "1.5rem", maxWidth: 860, margin: "0 auto" }}>
				{/* Page header */}
				<div style={{ marginBottom: "1.5rem" }}>
					<h1
						style={{
							fontSize: 18,
							fontWeight: 600,
							color: S.dark,
							margin: "0 0 4px",
						}}
					>
						Settings
					</h1>
					<p style={{ fontSize: 13, color: S.textMuted, margin: 0 }}>
						Manage your organization details and widget configuration.
					</p>
				</div>

				{/* Tabs */}
				<div
					style={{
						display: "flex",
						gap: 4,
						background: "#f0eff8",
						borderRadius: 10,
						padding: 4,
						marginBottom: 20,
						width: "fit-content",
					}}
				>
					{tabs.map((t) => (
						<button
							key={t.key}
							onClick={() => setTab(t.key)}
							style={{
								padding: "7px 16px",
								borderRadius: 7,
								border: "none",
								cursor: "pointer",
								fontFamily: "inherit",
								fontSize: 13,
								fontWeight: 500,
								background: tab === t.key ? "#fff" : "transparent",
								color: tab === t.key ? S.dark : S.textMuted,
								boxShadow:
									tab === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
								display: "flex",
								alignItems: "center",
								gap: 7,
								transition: "all .15s",
							}}
						>
							<i
								className={`ti ti-${t.icon}`}
								style={{
									fontSize: 15,
									color: tab === t.key ? S.purple : S.textMuted,
								}}
							/>
							{t.label}
						</button>
					))}
				</div>

				{/* Tab content */}
				<div
					style={{ animation: "fadeIn .2s ease" }}
					key={tab}
				>
					{tab === "organization" && org && <OrgTab org={org} />}
				</div>
			</div>
		</>
	);
}
