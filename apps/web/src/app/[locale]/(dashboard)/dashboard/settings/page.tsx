"use client";

import { useEffect, useState, useRef } from "react";
import {
	api,
	OrgProfile,
	WidgetConfig,
	UpdateWidgetConfigInput,
} from "@/lib/api";
import { S } from "@/components/ui";

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
				background: S.dark,
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

// ─── ORGANIZATION TAB ────────────────────────────────────────────────────────
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
			await api.updateOrgProfile({ name, email, widget_config: widget });
			setToast("Organization settings saved.");
		} catch (err: any) {
			setToast("Error: " + err.message);
		} finally {
			setLoading(false);
		}
	};

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

						{/* Position */}
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
								Widget Position
							</label>
							<div style={{ display: "flex", gap: 10 }}>
								{(["bottom-left", "bottom-right"] as const).map((pos) => (
									<button
										key={pos}
										onClick={() => setW("position")(pos)}
										style={{
											flex: 1,
											padding: "10px 12px",
											borderRadius: 8,
											cursor: "pointer",
											fontFamily: "inherit",
											border: `1.5px solid ${widget.position === pos ? S.purple : S.border}`,
											background:
												widget.position === pos ? S.purpleBg : "#fff",
											color:
												widget.position === pos ? S.purple : S.textSecondary,
											fontSize: 13,
											fontWeight: widget.position === pos ? 500 : 400,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											gap: 7,
											transition: "all .15s",
										}}
									>
										<i
											className={`ti ti-layout-bottombar-${pos === "bottom-left" ? "collapse" : "expand"}`}
											style={{ fontSize: 16 }}
										/>
										{pos === "bottom-left" ? "Bottom Left" : "Bottom Right"}
									</button>
								))}
							</div>
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
									...(widget.position === "bottom-right"
										? { right: 16 }
										: { left: 16 }),
									transition: "left .3s, right .3s",
								}}
							>
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
									<div
										style={{ background: widget.color, padding: "10px 12px" }}
									>
										<div
											style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}
										>
											Support
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
													background: widget.color,
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
								<div
									style={{
										width: 40,
										height: 40,
										borderRadius: "50%",
										background: widget.color,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
										marginLeft:
											widget.position === "bottom-right" ? "auto" : 0,
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

// ─── MAIN PAGE — Organization only, no tab switcher ──────────────────────────
export default function SettingsPage() {
	const [org, setOrg] = useState<OrgProfile | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api
			.getOrgProfile()
			.then((o) => setOrg(o.organization))
			.finally(() => setLoading(false));
	}, []);

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

	return (
		<>
			<style>{`
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
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
						Manage your organization name and widget configuration.
					</p>
				</div>

				{org && <OrgTab org={org} />}
			</div>
		</>
	);
}
