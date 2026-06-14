"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
// Mapped cleanly to dynamic variables that respect your main app layout.
const T = {
	bg: "var(--bg-main, transparent)", 
	panel: "var(--panel-bg, rgba(255, 255, 255, 0.03))",
	surface: "var(--surface-bg, rgba(255, 255, 255, 0.02))",
	border: "var(--border-subtle, rgba(255, 255, 255, 0.08))",
	border2: "var(--border-muted, rgba(255, 255, 255, 0.12))",
	textPrimary: "var(--text-primary, #FFFFFF)",
	textSecondary: "var(--text-secondary, #AFA9EC)",
	inputBg: "var(--input-bg, rgba(0, 0, 0, 0.2))",
	inputBorder: "var(--input-border, rgba(255, 255, 255, 0.15))",
	inputFocus: "var(--input-focus, #534AB7)",
	hoverBg: "var(--hover-bg, rgba(255, 255, 255, 0.03))",
	
	// Brand & Status Tokens
	violet: "#534AB7",
	violetLight: "#AFA9EC",
	violetBg: "rgba(83,74,183,0.15)",
	green: "#1D9E75",
	greenBg: "rgba(29,158,117,0.12)",
	amber: "#D97706",
	amberBg: "rgba(217,119,6,0.12)",
	amberBorder: "rgba(217,119,6,0.25)",
	danger: "#E24B4A",
	dangerBg: "rgba(226,75,74,0.12)",
	dangerBorder: "rgba(226,75,74,0.25)",
	radius: "10px",
	radiusSm: "8px",
	radiusLg: "14px",
	font: "'Sora', system-ui, sans-serif",
} as const;

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Member {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	role: string;
	isActive: boolean;
	createdAt: string;
}

interface PendingInvitation {
	id: string;
	email: string;
	role: string;
	status: string;
	createdAt: string;
	expiresAt: string;
	invitedBy: { firstName: string; lastName: string };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function formatRole(role: string) {
	return role
		.toLowerCase()
		.replace(/_/g, " ")
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function getInitials(firstName: string, lastName: string) {
	return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────

function Avatar({ initials, size = 36 }: { initials: string; size?: number }) {
	return (
		<div
			style={{
				width: size,
				height: size,
				borderRadius: "50%",
				background: T.violetBg,
				border: `1.5px solid rgba(83,74,183,0.3)`,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				fontSize: size * 0.33,
				fontWeight: 600,
				color: T.violetLight,
				flexShrink: 0,
			}}
		>
			{initials}
		</div>
	);
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

function StatusBadge({ type }: { type: "active" | "pending" | "inactive" }) {
	const map = {
		active: {
			bg: T.greenBg,
			color: T.green,
			border: "rgba(29,158,117,0.25)",
			label: "Active",
		},
		pending: {
			bg: T.amberBg,
			color: T.amber,
			border: T.amberBorder,
			label: "Pending",
		},
		inactive: {
			bg: T.surface,
			color: T.textSecondary,
			border: T.border2,
			label: "Inactive",
		},
	};
	const s = map[type];
	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: 5,
				background: s.bg,
				color: s.color,
				width: "fit-content",
				border: `1px solid ${s.border}`,
				fontSize: 11,
				fontWeight: 500,
				padding: "3px 10px",
				borderRadius: 999,
				whiteSpace: "nowrap",
			}}
		>
			<span
				style={{
					width: 5,
					height: 5,
					borderRadius: "50%",
					background: s.color,
					flexShrink: 0,
				}}
			/>
			{s.label}
		</span>
	);
}

// ─── INVITE MODAL ─────────────────────────────────────────────────────────────

function InviteModal({
	onClose,
	onSuccess,
}: {
	onClose: () => void;
	onSuccess: () => void;
}) {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [focused, setFocused] = useState(false);

	const handleSend = async () => {
		if (!email.trim()) {
			setError("Email is required.");
			return;
		}
		if (!/\S+@\S+\.\S+/.test(email)) {
			setError("Enter a valid email.");
			return;
		}
		setError("");
		setLoading(true);
		try {
			await api.sendInvitation(email.trim().toLowerCase());
			onSuccess();
			onClose();
		} catch (e: any) {
			setError(e.message ?? "Failed to send invitation.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			{/* Backdrop */}
			<div
				onClick={onClose}
				style={{
					position: "fixed",
					inset: 0,
					background: "rgba(10, 10, 20, 0.6)",
					backdropFilter: "blur(6px)",
					zIndex: 100,
				}}
			/>

			{/* Modal */}
			<div
				className="responsive-modal"
				style={{
					position: "fixed",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					zIndex: 101,
					background: T.panel,
					backdropFilter: "blur(20px)",
					border: `1px solid ${T.border2}`,
					borderRadius: T.radiusLg,
					padding: "32px",
					width: "calc(100% - 32px)",
					maxWidth: 420,
					fontFamily: T.font,
					boxSizing: "border-box",
					boxShadow: "0 24px 50px -12px rgba(0, 0, 0, 0.5)"
				}}
			>
				{/* Header */}
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-start",
						marginBottom: 24,
					}}
				>
					<div>
						<h2
							style={{
								fontSize: 18,
								fontWeight: 700,
								color: T.textPrimary,
								margin: "0 0 6px",
								letterSpacing: "-0.4px",
							}}
						>
							Invite Team Member
						</h2>
						<p
							style={{
								fontSize: 13,
								color: T.textSecondary,
								margin: 0,
								lineHeight: 1.5,
								opacity: 0.8
							}}
						>
							They'll receive an email to create their account.
						</p>
					</div>
					<button
						onClick={onClose}
						style={{
							background: "none",
							border: "none",
							cursor: "pointer",
							color: T.textSecondary,
							padding: 4,
							display: "flex",
							borderRadius: T.radiusSm,
						}}
					>
						<i
							className="ti ti-x"
							style={{ fontSize: 18 }}
						/>
					</button>
				</div>

				{/* Email field */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: 6,
						marginBottom: 20,
					}}
				>
					<label
						style={{
							fontSize: 13,
							fontWeight: 500,
							color: T.textPrimary,
							opacity: 0.8
						}}
					>
						Email address
					</label>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						onFocus={() => setFocused(true)}
						onBlur={() => setFocused(false)}
						onKeyDown={(e) => e.key === "Enter" && handleSend()}
						placeholder="colleague@company.com"
						autoFocus
						style={{
							width: "100%",
							boxSizing: "border-box",
							padding: "12px 14px",
							fontSize: 14,
							fontFamily: T.font,
							color: T.textPrimary,
							background: T.inputBg,
							border: `1.5px solid ${error ? T.danger : focused ? T.inputFocus : T.inputBorder}`,
							borderRadius: T.radius,
							outline: "none",
							transition: "border-color .15s, background-color .15s",
						}}
					/>
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

				{/* Role note */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 8,
						padding: "10px 14px",
						background: T.surface,
						border: `1px solid ${T.border}`,
						borderRadius: T.radiusSm,
						marginBottom: 24,
					}}
				>
					<i
						className="ti ti-info-circle"
						style={{ fontSize: 15, color: T.textSecondary, flexShrink: 0 }}
					/>
					<span style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5, opacity: 0.9 }}>
						Invited members join as{" "}
						<strong style={{ color: T.textPrimary }}>
							Support Agents
						</strong>
						. You can change their role after they join.
					</span>
				</div>

				{/* Actions */}
				<div style={{ display: "flex", gap: 10 }}>
					<button
						onClick={onClose}
						style={{
							flex: 1,
							padding: "11px",
							background: "transparent",
							color: T.textSecondary,
							border: `1.5px solid ${T.border2}`,
							borderRadius: T.radius,
							fontSize: 14,
							fontWeight: 500,
							fontFamily: T.font,
							cursor: "pointer",
						}}
					>
						Cancel
					</button>
					<button
						onClick={handleSend}
						disabled={loading}
						style={{
							flex: 2,
							padding: "11px",
							background: T.violet,
							color: "#FFF",
							border: "none",
							borderRadius: T.radius,
							fontSize: 14,
							fontWeight: 600,
							fontFamily: T.font,
							cursor: loading ? "not-allowed" : "pointer",
							opacity: loading ? 0.7 : 1,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: 8,
							transition: "opacity .15s",
						}}
					>
						{loading ? (
							<>
								<i
									className="ti ti-loader-2"
									style={{
										fontSize: 15,
										animation: "spin 0.8s linear infinite",
									}}
								/>{" "}
								Sending…
							</>
						) : (
							<>
								<i
									className="ti ti-send"
									style={{ fontSize: 15 }}
								/>{" "}
								Send Invitation
							</>
						)}
					</button>
				</div>
			</div>
		</>
	);
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function EmptyState({ onInvite }: { onInvite: () => void }) {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				padding: "80px 24px",
				textAlign: "center",
			}}
		>
			<div
				style={{
					width: 56,
					height: 56,
					borderRadius: 16,
					background: T.violetBg,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					marginBottom: 20,
				}}
			>
				<i
					className="ti ti-users"
					style={{ fontSize: 26, color: T.violet }}
				/>
			</div>
			<h3
				style={{
					fontSize: 16,
					fontWeight: 600,
					color: T.textPrimary,
					margin: "0 0 8px",
				}}
			>
				No team members yet
			</h3>
			<p
				style={{
					fontSize: 13,
					color: T.textSecondary,
					margin: "0 0 24px",
					lineHeight: 1.6,
					maxWidth: 280,
				}}
			>
				Invite your support agents to join your workspace and start handling
				customer conversations.
			</p>
			<button
				onClick={onInvite}
				style={{
					padding: "10px 20px",
					background: T.violet,
					color: "#FFF",
					border: "none",
					borderRadius: T.radius,
					fontSize: 13,
					fontWeight: 600,
					fontFamily: T.font,
					cursor: "pointer",
					display: "flex",
					alignItems: "center",
					gap: 8,
				}}
			>
				<i
					className="ti ti-user-plus"
					style={{ fontSize: 15 }}
				/>
				Invite your first member
			</button>
		</div>
	);
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function TeamPage() {
	const { user } = useAuth();

	const [members, setMembers] = useState<Member[]>([]);
	const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [showModal, setShowModal] = useState(false);
	const [revoking, setRevoking] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState("");

	const fetchTeam = useCallback(async () => {
		try {
			const data = await api.getTeam();
			setMembers(data.members);
			setInvitations(data.pendingInvitations);
		} catch (e: any) {
			setError("Failed to load team data.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchTeam();
	}, [fetchTeam]);

	const handleInviteSuccess = () => {
		setSuccessMsg("Invitation sent successfully!");
		fetchTeam();
		setTimeout(() => setSuccessMsg(""), 4000);
	};

	const handleRevoke = async (id: string) => {
		setRevoking(id);
		try {
			await api.revokeInvitation(id);
			setInvitations((prev) => prev.filter((inv) => inv.id !== id));
		} catch (e: any) {
			setError(e.message ?? "Failed to revoke invitation.");
		} finally {
			setRevoking(null);
		}
	};

	const totalRows = members.length + invitations.length;

	return (
		<>
			<style>{`
				@keyframes spin { to { transform: rotate(360deg); } }

				/* Custom variable overrides that synchronize perfectly with SupportNest's Navy/Violet Theme */
				.teampage-container {
					--bg-main: transparent; /* Allows your true app layout background to bleed through smoothly */
					--panel-bg: rgba(255, 255, 255, 0.03);
					--surface-bg: rgba(255, 255, 255, 0.05);
					--border-subtle: rgba(255, 255, 255, 0.06);
					--border-muted: rgba(255, 255, 255, 0.1);
					--text-primary: #FFFFFF;
					--text-secondary: rgba(255, 255, 255, 0.6);
					--input-bg: rgba(0, 0, 0, 0.25);
					--input-border: rgba(255, 255, 255, 0.12);
					--input-focus: #534AB7;
					--hover-bg: rgba(255, 255, 255, 0.03);
				}

				/* Balanced fallback variations for light mode optimization */
				html:not(.dark) body .teampage-container {
					--bg-main: transparent;
					--panel-bg: #FFFFFF;
					--surface-bg: #F8F9FA;
					--border-subtle: rgba(0, 0, 0, 0.06);
					--border-muted: rgba(0, 0, 0, 0.09);
					--text-primary: #1A1B1E;
					--text-secondary: #6C757D;
					--input-bg: #FFFFFF;
					--input-border: #CED4DA;
					--input-focus: #534AB7;
					--hover-bg: rgba(0, 0, 0, 0.015);
				}

				.table-grid-row:hover {
					background-color: var(--hover-bg) !important;
				}

				@media (max-width: 768px) {
					.teampage-container {
						padding: 24px 16px !important;
					}
					.teampage-header {
						flex-direction: column !important;
						align-items: flex-start !important;
						gap: 16px !important;
					}
					.teampage-header button {
						width: 100% !important;
						justify-content: center !important;
					}
					.responsive-table-wrapper {
						border-radius: ${T.radius} !important;
					}
					.table-grid-row {
						grid-template-columns: 1fr !important;
						gap: 12px !important;
						padding: 16px !important;
					}
					.table-header-row {
						display: none !important;
					}
					.mobile-action-cell {
						justify-content: flex-start !important;
						margin-top: 4px;
					}
					.responsive-modal {
						padding: 24px 16px !important;
						width: calc(100% - 24px) !important;
					}
				}
			`}</style>

			<div
				className="teampage-container"
				style={{
					flex: 1,
					background: T.bg,
					fontFamily: T.font,
					padding: "36px 40px",
					overflowY: "auto",
				}}
			>
				{/* Header */}
				<div
					className="teampage-header"
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: 32,
					}}
				>
					<div>
						<h1
							style={{
								fontSize: 22,
								fontWeight: 700,
								color: T.textPrimary,
								margin: "0 0 4px",
								letterSpacing: "-0.5px",
							}}
						>
							{user?.orgName ?? "Your"} Team
						</h1>
						<p style={{ fontSize: 13, color: T.textSecondary, margin: 0 }}>
							{members.length} member{members.length !== 1 ? "s" : ""}
							{invitations.length > 0 &&
								` · ${invitations.length} pending invite${invitations.length !== 1 ? "s" : ""}`}
						</p>
					</div>

					<button
						onClick={() => setShowModal(true)}
						style={{
							padding: "10px 18px",
							background: T.violet,
							color: "#FFF",
							border: "none",
							borderRadius: T.radius,
							fontSize: 13,
							fontWeight: 600,
							fontFamily: T.font,
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							gap: 8,
							transition: "opacity .15s",
						}}
						onMouseEnter={(e) =>
							((e.currentTarget as HTMLElement).style.opacity = "0.85")
						}
						onMouseLeave={(e) =>
							((e.currentTarget as HTMLElement).style.opacity = "1")
						}
					>
						<i
							className="ti ti-user-plus"
							style={{ fontSize: 15 }}
						/>
						Invite Member
					</button>
				</div>

				{/* Success banner */}
				{successMsg && (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 10,
							background: T.greenBg,
							border: "1px solid rgba(29,158,117,0.25)",
							borderRadius: T.radius,
							padding: "12px 16px",
							marginBottom: 20,
							fontSize: 13,
							color: T.green,
						}}
					>
						<i
							className="ti ti-circle-check"
							style={{ fontSize: 16, flexShrink: 0 }}
						/>
						{successMsg}
					</div>
				)}

				{/* Error banner */}
				{error && (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 10,
							background: T.dangerBg,
							border: `1px solid ${T.dangerBorder}`,
							borderRadius: T.radius,
							padding: "12px 16px",
							marginBottom: 20,
							fontSize: 13,
							color: T.danger,
						}}
					>
						<i
							className="ti ti-alert-circle"
							style={{ fontSize: 16, flexShrink: 0 }}
						/>
						{error}
						<button
							onClick={() => setError("")}
							style={{
								background: "none",
								border: "none",
								cursor: "pointer",
								color: T.danger,
								marginLeft: "auto",
								padding: 0,
							}}
						>
							<i
								className="ti ti-x"
								style={{ fontSize: 15 }}
							/>
						</button>
					</div>
				)}

				{/* Table Area */}
				<div
					className="responsive-table-wrapper"
					style={{
						background: T.panel,
						border: `1px solid ${T.border}`,
						borderRadius: T.radiusLg,
						overflow: "hidden",
						boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
						backdropFilter: "blur(4px)",
					}}
				>
					{/* Table header */}
					<div
						className="table-header-row"
						style={{
							display: "grid",
							gridTemplateColumns: "2fr 1fr 1fr 1fr 100px",
							padding: "12px 20px",
							borderBottom: `1px solid ${T.border}`,
							background: T.surface,
						}}
					>
						{["Member", "Role", "Status", "Joined", ""].map((col) => (
							<span
								key={col}
								style={{
									fontSize: 11,
									fontWeight: 600,
									color: T.textSecondary,
									textTransform: "uppercase",
									letterSpacing: "0.5px",
								}}
							>
								{col}
							</span>
						))}
					</div>

					{/* Loading */}
					{loading && (
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: 10,
								padding: "48px",
								color: T.textSecondary,
								fontSize: 13,
							}}
						>
							<i
								className="ti ti-loader-2"
								style={{
									fontSize: 18,
									animation: "spin 0.8s linear infinite",
								}}
							/>
							Loading team…
						</div>
					)}

					{/* Empty */}
					{!loading && totalRows === 0 && (
						<EmptyState onInvite={() => setShowModal(true)} />
					)}

					{/* Members List */}
					{!loading &&
						members.map((member, i) => (
							<div
								key={member.id}
								className="table-grid-row"
								style={{
									display: "grid",
									gridTemplateColumns: "2fr 1fr 1fr 1fr 100px",
									padding: "14px 20px",
									borderBottom:
										i < totalRows - 1 ? `1px solid ${T.border}` : "none",
									alignItems: "center",
									transition: "background .15s ease",
								}}
							>
								{/* Member info */}
								<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
									<Avatar initials={getInitials(member.firstName, member.lastName)} />
									<div>
										<div style={{ fontSize: 14, fontWeight: 500, color: T.textPrimary }}>
											{member.firstName} {member.lastName}
											{member.id === user?.id && (
												<span
													style={{
														marginLeft: 8,
														fontSize: 10,
														fontWeight: 500,
														color: T.violetLight,
														background: T.violetBg,
														padding: "2px 7px",
														borderRadius: 999,
														verticalAlign: "middle",
													}}
												>
													You
												</span>
											)}
										</div>
										<div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2 }}>
											{member.email}
										</div>
									</div>
								</div>

								{/* Role */}
								<span style={{ fontSize: 13, color: T.textPrimary, opacity: 0.8 }}>
									{formatRole(member.role)}
								</span>

								{/* Status */}
								<StatusBadge type={member.isActive ? "active" : "inactive"} />

								{/* Joined */}
								<span style={{ fontSize: 13, color: T.textSecondary }}>
									{formatDate(member.createdAt)}
								</span>

								<div />
							</div>
						))}

					{/* Pending invitations */}
					{!loading &&
						invitations.map((inv, i) => (
							<div
								key={inv.id}
								className="table-grid-row"
								style={{
									display: "grid",
									gridTemplateColumns: "2fr 1fr 1fr 1fr 100px",
									padding: "14px 20px",
									borderBottom:
										i < invitations.length - 1
											? `1px solid ${T.border}`
											: "none",
									alignItems: "center",
									transition: "background .15s ease",
								}}
							>
								{/* Invite info */}
								<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
									<div
										style={{
											width: 36,
											height: 36,
											borderRadius: "50%",
											background: T.amberBg,
											border: `1.5px solid ${T.amberBorder}`,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											flexShrink: 0,
										}}
									>
										<i
											className="ti ti-mail"
											style={{ fontSize: 15, color: T.amber }}
										/>
									</div>
									<div>
										<div style={{ fontSize: 14, fontWeight: 500, color: T.textPrimary, opacity: 0.9 }}>
											{inv.email}
										</div>
										<div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2 }}>
											Invited by {inv.invitedBy.firstName} {inv.invitedBy.lastName} · Expires {formatDate(inv.expiresAt)}
										</div>
									</div>
								</div>

								{/* Role */}
								<span style={{ fontSize: 13, color: T.textPrimary, opacity: 0.8 }}>
									{formatRole(inv.role)}
								</span>

								{/* Status */}
								<StatusBadge type="pending" />

								{/* Sent date */}
								<span style={{ fontSize: 13, color: T.textSecondary }}>
									{formatDate(inv.createdAt)}
								</span>

								{/* Revoke Button Container */}
								<div className="mobile-action-cell" style={{ display: "flex", justifyContent: "flex-end" }}>
									<button
										onClick={() => handleRevoke(inv.id)}
										disabled={revoking === inv.id}
										title="Revoke invitation"
										style={{
											background: "none",
											border: `1px solid ${T.border2}`,
											borderRadius: T.radiusSm,
											color: revoking === inv.id ? T.textSecondary : T.danger,
											cursor: revoking === inv.id ? "not-allowed" : "pointer",
											padding: "5px 10px",
											fontSize: 12,
											fontFamily: T.font,
											display: "flex",
											alignItems: "center",
											gap: 5,
											transition: "border-color .15s, color .15s, background-color .15s",
										}}
										onMouseEnter={(e) => {
											if (revoking !== inv.id) {
												(e.currentTarget as HTMLElement).style.borderColor = T.dangerBorder;
												(e.currentTarget as HTMLElement).style.background = T.dangerBg;
											}
										}}
										onMouseLeave={(e) => {
											(e.currentTarget as HTMLElement).style.borderColor = T.border2;
											(e.currentTarget as HTMLElement).style.background = "none";
										}}
									>
										{revoking === inv.id ? (
											<i
												className="ti ti-loader-2"
												style={{
													fontSize: 13,
													animation: "spin 0.8s linear infinite",
												}}
											/>
										) : (
											<i
												className="ti ti-x"
												style={{ fontSize: 13 }}
											/>
										)}
										Revoke
									</button>
								</div>
							</div>
						))}
				</div>
			</div>

			{/* Modal */}
			{showModal && (
				<InviteModal
					onClose={() => setShowModal(false)}
					onSuccess={handleInviteSuccess}
				/>
			)}
		</>
	);
}
