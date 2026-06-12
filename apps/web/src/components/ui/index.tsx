"use client";

import { DashboardStatsStatus, DocStatus } from "@/types/types";
import { useState } from "react";
import { useLingui } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
export const S = {
	purple: "#534AB7",
	purpleLight: "#7F77DD",
	purpleDark: "#3C3489",
	dark: "var(--page-text)",
	darkMid: "var(--surface-elevated)",
	white: "#ffffff",
	bg: "var(--surface-elevated)",
	border: "var(--card-border)",
	textMuted: "var(--page-muted)",
	textSecondary: "var(--label-muted)",
	green: "#1D9E75",
	greenBg: "var(--color-success-bg)",
	amber: "#854F0B",
	amberBg: "var(--color-warning-bg)",
	purpleBg: "var(--color-brand-faint)",
	danger: "#A32D2D",
	dangerBg: "var(--color-danger-bg)",
};

// ─── INPUT ────────────────────────────────────────────────────────────────────
interface InputProps {
	label?: string;
	type?: string;
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	error?: string;
	icon?: string;
	rightEl?: React.ReactNode;
}

export function Input({
	label,
	type = "text",
	value,
	onChange,
	placeholder,
	error,
	icon,
	rightEl,
}: InputProps) {
	const [focused, setFocused] = useState(false);
	return (
		<div style={{ marginBottom: 16 }}>
			{label && (
				<label
					style={{
						display: "block",
						fontSize: 13,
						fontWeight: 500,
						color: S.dark,
						marginBottom: 6,
					}}
				>
					{label}
				</label>
			)}
			<div style={{ position: "relative" }}>
				{icon && (
					<i
						className={`ti ti-${icon}`}
						style={{
							position: "absolute",
							left: 12,
							top: "50%",
							transform: "translateY(-50%)",
							color: focused ? S.purple : S.textMuted,
							fontSize: 17,
							transition: "color .15s",
						}}
					/>
				)}
				<input
					type={type}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					onFocus={() => setFocused(true)}
					onBlur={() => setFocused(false)}
					style={{
						width: "100%",
						boxSizing: "border-box",
						padding: icon
							? "10px 12px 10px 38px"
							: rightEl
								? "10px 44px 10px 12px"
								: "10px 12px",
						fontSize: 14,
						border: `1.5px solid ${error ? S.danger : focused ? S.purple : S.border}`,
						borderRadius: 8,
						outline: "none",
						background: "var(--surface)",
						color: S.dark,
						transition: "border-color .15s",
						fontFamily: "inherit",
					}}
				/>
				{rightEl && (
					<div
						style={{
							position: "absolute",
							right: 10,
							top: "50%",
							transform: "translateY(-50%)",
						}}
					>
						{rightEl}
					</div>
				)}
			</div>
			{error && (
				<p
					style={{
						fontSize: 12,
						color: "#E24B4A",
						marginTop: 5,
						marginBottom: 0,
					}}
				>
					{error}
				</p>
			)}
		</div>
	);
}

// ─── BUTTON ───────────────────────────────────────────────────────────────────
interface BtnProps {
	children: React.ReactNode;
	onClick?: () => void;
	loading?: boolean;
	variant?: "primary" | "outline" | "ghost" | "danger";
	type?: "button" | "submit";
	disabled?: boolean;
	size?: "sm" | "md";
	fullWidth?: boolean;
}

export function Btn({
	children,
	onClick,
	loading,
	variant = "primary",
	type = "button",
	disabled,
	size = "md",
	fullWidth,
}: BtnProps) {
	const styles = {
		primary: {
			background: S.purple,
			color: "#fff",
			border: `1.5px solid ${S.purple}`,
		},
		outline: {
			background: "transparent",
			color: S.purple,
			border: `1.5px solid ${S.purple}`,
		},
		ghost: {
			background: "transparent",
			color: S.textSecondary,
			border: `1.5px solid ${S.border}`,
		},
		danger: {
			background: "#E24B4A",
			color: "#fff",
			border: "1.5px solid #E24B4A",
		},
	};
	const pad = size === "sm" ? "7px 14px" : "10px 20px";
	return (
		<>
			<button
				type={type}
				onClick={onClick}
				disabled={loading || disabled}
				style={{
					...styles[variant],
					padding: pad,
					borderRadius: 8,
					fontSize: 14,
					fontWeight: 500,
					cursor: loading || disabled ? "not-allowed" : "pointer",
					opacity: loading || disabled ? 0.7 : 1,
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					gap: 8,
					width: fullWidth ? "100%" : "auto",
					fontFamily: "inherit",
					transition: "opacity .15s, transform .1s",
					transform: "scale(1)",
				}}
				onMouseDown={(e) => {
					if (!loading && !disabled)
						(e.currentTarget as HTMLElement).style.transform = "scale(0.98)";
				}}
				onMouseUp={(e) => {
					(e.currentTarget as HTMLElement).style.transform = "scale(1)";
				}}
				onMouseLeave={(e) => {
					(e.currentTarget as HTMLElement).style.transform = "scale(1)";
				}}
			>
				{loading && (
					<i
						className="ti ti-loader-2"
						style={{ animation: "spin 1s linear infinite", fontSize: 16 }}
					/>
				)}
				{children}
			</button>
			<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
		</>
	);
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: DashboardStatsStatus }) {
	const { i18n } = useLingui();

	const map = {
		ACTIVE: {
			bg: S.greenBg,
			color: S.green,
			label: t`Active`,
			icon: "circle-check",
		},
		ESCALATED: {
			bg: "#EEF2FF",
			color: "#4F46E5",
			label: t`Escalated`,
			icon: "loader-2",
		},
		CLOSED: {
			bg: S.dangerBg,
			color: S.danger,
			label: t`Closed`,
			icon: "alert-circle",
		},
	};
	const s = map[status];
	return (
		<span
			style={{
				background: s.bg,
				color: s.color,
				fontSize: 10,
				fontWeight: 500,
				padding: "3px 8px",
				borderRadius: 999,
			}}
		>
			{s.label}
		</span>
	);
}

// ─── PAGE LOADER ──────────────────────────────────────────────────────────────
export function PageLoader() {
	return (
		<>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					height: "100vh",
					background: S.bg,
				}}
			>
				<div style={{ textAlign: "center" }}>
					<div
						style={{
							width: 40,
							height: 40,
							borderRadius: 10,
							background: S.purple,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							margin: "0 auto 16px",
						}}
					>
						<i
							className="ti ti-shield-check"
							style={{ color: "#fff", fontSize: 20 }}
						/>
					</div>
					<div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
						{[0, 1, 2].map((i) => (
							<div
								key={i}
								style={{
									width: 7,
									height: 7,
									borderRadius: "50%",
									background: S.purple,
									animation: `pulse 1.2s ${i * 0.2}s infinite`,
								}}
							/>
						))}
					</div>
				</div>
			</div>
			<style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}`}</style>
		</>
	);
}

// ─── PLACEHOLDER PAGE ─────────────────────────────────────────────────────────
export function PlaceholderPage({
	title,
	icon,
	description,
}: {
	title: string;
	icon: string;
	description: string;
}) {
	return (
		<div
			style={{
				flex: 1,
				background: S.bg,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<div style={{ textAlign: "center", maxWidth: 340 }}>
				<div
					style={{
						width: 64,
						height: 64,
						borderRadius: 16,
						background: S.purpleBg,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						margin: "0 auto 16px",
					}}
				>
					<i
						className={`ti ti-${icon}`}
						style={{ fontSize: 30, color: S.purple }}
					/>
				</div>
				<h2
					style={{
						fontSize: 18,
						fontWeight: 600,
						color: S.dark,
						margin: "0 0 8px",
					}}
				>
					{title}
				</h2>
				<p
					style={{
						fontSize: 13,
						color: S.textMuted,
						lineHeight: 1.6,
						margin: 0,
					}}
				>
					{description}
				</p>
				<div style={{ marginTop: 20 }}>
					<span
						style={{
							background: S.purpleBg,
							color: S.purple,
							fontSize: 11,
							fontWeight: 500,
							padding: "4px 10px",
							borderRadius: 6,
						}}
					>
						Coming in sprint 2
					</span>
				</div>
			</div>
		</div>
	);
}
