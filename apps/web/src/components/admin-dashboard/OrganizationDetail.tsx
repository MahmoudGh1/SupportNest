"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { S } from "@/components/ui";
import type {
	AdminOrganizationDetail,
	AdminTierStats,
	AdminConversationStats,
	AdminTicketStats,
	AdminCsatStats,
} from "@/types/types";

interface Props {
	organizationId: string;
	onClose: () => void;
}

const cardStyle: React.CSSProperties = {
	background: S.surface,
	border: `1px solid ${S.border}`,
	borderRadius: 16,
	padding: "1.5rem",
	boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
	transition: "all 0.3s ease"
};

const labelStyle: React.CSSProperties = {
	fontSize: 12,
	color: S.textMuted,
	textTransform: "uppercase",
	letterSpacing: ".08em",
	fontWeight: 800,
	marginBottom: 16,
	display: "flex",
	alignItems: "center",
	gap: 8
};

const valueStyle: React.CSSProperties = {
	fontSize: 15,
	color: S.dark,
	fontWeight: 600,
};

// ─── SKELETON COMPONENTS ──────────────────────────────────────────────────────
function Shimmer({ width = "100%", height = 16, radius = 6 }: { width?: string | number; height?: number; radius?: number }) {
	return (
		<div
			style={{
				width,
				height,
				borderRadius: radius,
				background: `linear-gradient(90deg, ${S.border} 25%, #f0eff8 50%, ${S.border} 75%)`,
				backgroundSize: "200% 100%",
				animation: "shimmer 1.4s infinite",
				flexShrink: 0,
			}}
		/>
	);
}

function OrganizationDetailSkeleton() {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
			<style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>

			{/* Header Skeleton */}
			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
				<div style={{ display: "flex", alignItems: "center", gap: 16 }}>
					<Shimmer width={40} height={40} radius={12} />
					<div>
						<Shimmer width={250} height={28} radius={8} />
						<div style={{ marginTop: 8 }}>
							<Shimmer width={180} height={14} radius={4} />
						</div>
					</div>
				</div>
				<div style={{ display: "flex", gap: 12 }}>
					<Shimmer width={120} height={42} radius={12} />
					<Shimmer width={100} height={42} radius={12} />
				</div>
			</div>

			{/* Stats Row Skeleton */}
			<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
				<div style={cardStyle}>
					<Shimmer width={100} height={14} radius={4} />
					<div style={{ display: "grid", gap: 20, marginTop: 20 }}>
						<div>
							<Shimmer width={80} height={12} radius={4} />
							<div style={{ marginTop: 6 }}><Shimmer width="90%" height={18} radius={4} /></div>
						</div>
						<div>
							<Shimmer width={100} height={12} radius={4} />
							<div style={{ marginTop: 6 }}><Shimmer width="60%" height={24} radius={6} /></div>
						</div>
					</div>
				</div>

				<div style={cardStyle}>
					<Shimmer width={140} height={14} radius={4} />
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 24 }}>
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i}>
								<Shimmer width="70%" height={32} radius={8} />
								<div style={{ marginTop: 8 }}><Shimmer width="50%" height={12} radius={4} /></div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

export function OrganizationDetail({ organizationId, onClose }: Props) {
	// alias so all existing action buttons that reference `orgId` keep working
	const orgId = organizationId;

	const [org, setOrg] = useState<AdminOrganizationDetail | null>(null);
	const [tierStats, setTierStats] = useState<AdminTierStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		setLoading(true);
		Promise.all([api.getAdminOrganization(organizationId), api.getAdminOrgTierStats(organizationId)])
			.then(([orgData, stats]) => {
				setOrg(orgData);
				setTierStats(stats);
			})
			.catch((err) => setError(err.message || "Failed to load details"))
			.finally(() => setLoading(false));
	}, [organizationId]);

	if (loading) {
		return <OrganizationDetailSkeleton />;
	}

	if (error || !org) {
		return (
			<div style={{ padding: "4rem 2rem", textAlign: "center", background: S.surface, borderRadius: 20, border: `1px solid ${S.border}` }}>
				<i className="ti ti-alert-circle" style={{ fontSize: 48, color: S.danger, marginBottom: 16, display: "block" }} />
				<h3 style={{ fontSize: 20, fontWeight: 800, color: S.dark, margin: "0 0 8px" }}>Oops! Something went wrong</h3>
				<p style={{ color: S.textMuted, marginBottom: 24 }}>{error || "Organization not found"}</p>
				<button onClick={onClose} style={{ 
					padding: "12px 24px", 
					borderRadius: 12, 
					background: S.purple, 
					color: "#fff", 
					border: "none", 
					fontWeight: 700,
					cursor: "pointer",
					boxShadow: `0 4px 12px ${S.purple}30`
				}}>
					Return to Dashboard
				</button>
			</div>
		);
	}

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeIn .4s cubic-bezier(0.4, 0, 0.2, 1)" }}>
			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
				<div style={{ display: "flex", alignItems: "center", gap: 16 }}>
					<button onClick={onClose} style={{ 
						width: 42, 
						height: 42, 
						borderRadius: 14, 
						background: S.surface, 
						border: `1.5px solid ${S.border}`, 
						cursor: "pointer", 
						color: S.textMuted, 
						display: "flex", 
						alignItems: "center", 
						justifyContent: "center",
						transition: "all 0.2s ease",
						boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
					}} className="back-btn">
						<i className="ti ti-arrow-left" style={{ fontSize: 22 }} />
					</button>
					<div>
						<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
							<h2 style={{ fontSize: 26, fontWeight: 850, margin: 0, color: S.dark, letterSpacing: "-0.02em" }}>{org.name}</h2>
							<span style={{ 
								fontSize: 11, 
								fontWeight: 800, 
								padding: "2px 8px", 
								borderRadius: 6, 
								background: org.is_active ? S.greenBg : S.dangerBg,
								color: org.is_active ? "#0F6E56" : S.danger,
								textTransform: "uppercase"
							}}>
								{org.is_active ? "Active" : "Suspended"}
							</span>
						</div>
						<p style={{ fontSize: 14, color: S.textMuted, margin: 0, fontWeight: 500 }}>
							<span style={{ color: S.purple, fontWeight: 700 }}>{org.slug}</span> • Joined {new Date(org.created_at).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}
						</p>
					</div>
				</div>
				<div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
					{org.scheduled_deletion_at ? (
						<button
							style={{
								padding: "12px 20px",
								borderRadius: 14,
								background: S.greenBg,
								color: "#0F6E56",
								border: `1.5px solid ${S.green}30`,
								fontWeight: 800,
								fontSize: 14,
								cursor: "pointer",
								display: "flex",
								alignItems: "center",
								gap: 8,
								boxShadow: "0 4px 12px rgba(15, 110, 86, 0.1)"
							}}
							onClick={async () => {
								try {
									await api.cancelDeleteAdminOrganization(orgId);
									const updated = await api.getAdminOrganization(orgId);
									setOrg(updated);
								} catch (e: any) { alert(e.message); }
							}}
						>
							<i className="ti ti-rotate-clockwise" style={{ fontSize: 18 }} />
							Restore Organization
						</button>
					) : (
						<>
							<button
								style={{
									padding: "12px 20px",
									borderRadius: 14,
									background: org.is_active ? S.dangerBg : S.greenBg,
									color: org.is_active ? S.danger : "#0F6E56",
									border: `1.5px solid ${org.is_active ? S.danger : S.green}20`,
									fontWeight: 800,
									fontSize: 14,
									cursor: "pointer",
									display: "flex",
									alignItems: "center",
									gap: 8,
									transition: "all 0.2s ease"
								}}
								onClick={async () => {
									try {
										if (org.is_active) await api.suspendAdminOrganization(orgId);
										else await api.activateAdminOrganization(orgId);
										const updated = await api.getAdminOrganization(orgId);
										setOrg(updated);
									} catch (e: any) { alert(e.message); }
								}}
							>
								<i className={`ti ti-${org.is_active ? "ban" : "circle-check"}`} style={{ fontSize: 18 }} />
								{org.is_active ? "Suspend" : "Activate"}
							</button>
							<button
								style={{
									padding: "12px 20px",
									borderRadius: 14,
									background: S.danger,
									color: "#fff",
									border: "none",
									fontWeight: 800,
									fontSize: 14,
									cursor: "pointer",
									display: "flex",
									alignItems: "center",
									gap: 8,
									boxShadow: `0 4px 12px ${S.danger}30`,
									transition: "all 0.2s ease"
								}}
								onClick={async () => {
									if (confirm(`Are you sure you want to schedule ${org.name} for deletion? It will be permanently removed in 30 minutes.`)) {
										try {
											await api.deleteAdminOrganization(orgId);
											const updated = await api.getAdminOrganization(orgId);
											setOrg(updated);
										} catch (e: any) { alert(e.message); }
									}
								}}
							>
								<i className="ti ti-trash" style={{ fontSize: 18 }} />
								Delete Org
							</button>
						</>
					)}
				</div>
			</div>

			<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
				<div style={cardStyle}>
					<div style={labelStyle}>
						<i className="ti ti-info-circle" />
						Organization Details
					</div>
					<div style={{ display: "grid", gap: 20 }}>
						<div style={{ background: S.bgSoft, padding: 16, borderRadius: 12, border: `1px solid ${S.border}` }}>
							<div style={{ fontSize: 11, color: S.textMuted, marginBottom: 6, fontWeight: 800, letterSpacing: "0.05em" }}>ADMINISTRATOR EMAIL</div>
							<div style={{ ...valueStyle, wordBreak: "break-all", fontSize: 16 }}>{org.email}</div>
						</div>
						<div style={{ background: `${S.purple}08`, padding: 16, borderRadius: 12, border: `1px solid ${S.purple}15` }}>
							<div style={{ fontSize: 11, color: S.purple, marginBottom: 6, fontWeight: 800, letterSpacing: "0.05em" }}>CURRENT SUBSCRIPTION</div>
							<div style={{ ...valueStyle, color: S.purple, fontWeight: 850, fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
								<i className="ti ti-award" />
								{org.plan?.name || "Free Trial"}
							</div>
						</div>
					</div>
				</div>

				<div style={cardStyle}>
					<div style={labelStyle}>
						<i className="ti ti-chart-dots" />
						Operational Metrics
					</div>
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
						<div className="metric-box">
							<div style={{ fontSize: 32, fontWeight: 900, color: S.dark, letterSpacing: "-0.03em" }}>{org.stats.total_tickets.toLocaleString()}</div>
							<div style={{ fontSize: 11, color: S.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Total Tickets</div>
						</div>
						<div className="metric-box">
							<div style={{ fontSize: 32, fontWeight: 900, color: S.warning, letterSpacing: "-0.03em" }}>{org.stats.open_tickets.toLocaleString()}</div>
							<div style={{ fontSize: 11, color: S.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Active / Open</div>
						</div>
						<div className="metric-box">
							<div style={{ fontSize: 32, fontWeight: 900, color: S.danger, letterSpacing: "-0.03em" }}>{org.stats.escalated_tickets.toLocaleString()}</div>
							<div style={{ fontSize: 11, color: S.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Escalations</div>
						</div>
						<div className="metric-box">
							<div style={{ fontSize: 32, fontWeight: 900, color: S.green, letterSpacing: "-0.03em" }}>{org.stats.resolved_tickets.toLocaleString()}</div>
							<div style={{ fontSize: 11, color: S.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Resolved</div>
						</div>
					</div>
				</div>
			</div>

			<section style={cardStyle}>
				<div style={labelStyle}>
					<i className="ti ti-bolt" />
					AI & Human Performance by Tier
				</div>
				{tierStats ? (
					<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24, marginTop: 12 }}>
						<div className="tier-card" style={{ padding: "16px", borderRadius: 14, background: S.bgSoft, border: `1px solid ${S.border}` }}>
							<div style={{ fontSize: 11, color: S.textMuted, marginBottom: 8, fontWeight: 800 }}>TIER 0 (ROUTER)</div>
							<div style={{ fontSize: 28, fontWeight: 900, color: S.info }}>{tierStats.tier0_resolve_rate.toFixed(1)}%</div>
							<div style={{ fontSize: 13, color: S.textMuted, fontWeight: 500, marginTop: 4 }}>{tierStats.tier0_resolved} resolved</div>
						</div>
						<div className="tier-card" style={{ padding: "16px", borderRadius: 14, background: `${S.purple}05`, border: `1px solid ${S.purple}10` }}>
							<div style={{ fontSize: 11, color: S.purple, marginBottom: 8, fontWeight: 800 }}>TIER 1 (L1 AGENT)</div>
							<div style={{ fontSize: 28, fontWeight: 900, color: S.purple }}>{tierStats.tier1_resolve_rate.toFixed(1)}%</div>
							<div style={{ fontSize: 13, color: S.purple, fontWeight: 500, marginTop: 4, opacity: 0.8 }}>{tierStats.tier1_resolved} resolved</div>
						</div>
						<div className="tier-card" style={{ padding: "16px", borderRadius: 14, background: `${S.purple}08`, border: `1px solid ${S.purple}20` }}>
							<div style={{ fontSize: 11, color: S.purple, marginBottom: 8, fontWeight: 800 }}>TIER 2 (EXPERT AI)</div>
							<div style={{ fontSize: 28, fontWeight: 900, color: S.purpleDark }}>{tierStats.tier2_resolve_rate.toFixed(1)}%</div>
							<div style={{ fontSize: 13, color: S.purpleDark, fontWeight: 500, marginTop: 4, opacity: 0.8 }}>{tierStats.tier2_resolved} resolved</div>
						</div>
						<div className="tier-card" style={{ padding: "16px", borderRadius: 14, background: `${S.warning}08`, border: `1px solid ${S.warning}20` }}>
							<div style={{ fontSize: 11, color: S.warning, marginBottom: 8, fontWeight: 800 }}>ESCALATION RATE</div>
							<div style={{ fontSize: 28, fontWeight: 900, color: S.warning }}>{tierStats.human_escalation_rate.toFixed(1)}%</div>
							<div style={{ fontSize: 13, color: S.warning, fontWeight: 500, marginTop: 4, opacity: 0.8 }}>{tierStats.human_escalated} to human</div>
						</div>
					</div>
				) : (
					<div style={{ textAlign: "center", padding: "2rem", color: S.textMuted, background: S.bgSoft, borderRadius: 12 }}>
						<i className="ti ti-database-off" style={{ fontSize: 24, display: "block", marginBottom: 8 }} />
						No performance data currently available for this organization.
					</div>
				)}
			</section>

			<section style={cardStyle}>
				<div style={labelStyle}>
					<i className="ti ti-users" />
					Organization Team & Access ({org.users.length})
				</div>
				<div className="team-table-wrapper" style={{ overflowX: "auto", marginTop: 8, borderRadius: 12, border: `1px solid ${S.border}` }}>
					<table style={{ width: "100%", borderCollapse: "collapse" }}>
						<thead>
							<tr style={{ background: S.bgSoft }}>
								<th style={{ textAlign: "left", padding: "14px 20px", fontSize: 11, color: S.textMuted, borderBottom: `1px solid ${S.border}`, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>MEMBER</th>
								<th style={{ textAlign: "left", padding: "14px 20px", fontSize: 11, color: S.textMuted, borderBottom: `1px solid ${S.border}`, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>EMAIL ADDRESS</th>
								<th style={{ textAlign: "left", padding: "14px 20px", fontSize: 11, color: S.textMuted, borderBottom: `1px solid ${S.border}`, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>ROLE</th>
								<th style={{ textAlign: "right", padding: "14px 20px", fontSize: 11, color: S.textMuted, borderBottom: `1px solid ${S.border}`, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>ASSIGNED</th>
							</tr>
						</thead>
						<tbody>
							{org.users.map(user => (
								<tr key={user.id} className="team-row">
									<td style={{ padding: "16px 20px", fontSize: 15, color: S.dark, borderBottom: `1px solid ${S.border}`, fontWeight: 700 }}>
										<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
											<div style={{ width: 32, height: 32, borderRadius: 8, background: S.purpleBg, color: S.purple, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }}>
												{user.first_name[0]}{user.last_name[0]}
											</div>
											{user.first_name} {user.last_name}
										</div>
									</td>
									<td style={{ padding: "16px 20px", fontSize: 14, color: S.textMuted, borderBottom: `1px solid ${S.border}`, fontWeight: 500 }}>{user.email}</td>
									<td style={{ padding: "16px 20px", borderBottom: `1px solid ${S.border}` }}>
										<span style={{ 
											fontSize: 10, 
											background: user.role === 'admin' ? `${S.purple}10` : S.bgSoft, 
											color: user.role === 'admin' ? S.purple : S.textMuted,
											padding: "4px 10px", 
											borderRadius: 8, 
											textTransform: "uppercase", 
											fontWeight: 800, 
											border: `1px solid ${user.role === 'admin' ? `${S.purple}20` : S.border}`
										}}>{user.role}</span>
									</td>
									<td style={{ padding: "16px 20px", textAlign: "right", fontSize: 15, color: S.dark, borderBottom: `1px solid ${S.border}`, fontWeight: 750 }}>{user.assigned_tickets_count}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>

			<style>{`
				.back-btn:hover { background: ${S.bgSoft}; transform: translateX(-2px); }
				.team-row:hover { background: ${S.bgSoft}40; }
				@media (max-width: 800px) {
					.team-table-wrapper table thead { display: none; }
					.team-table-wrapper table tr { display: block; padding: 20px; border-bottom: 1px solid ${S.border}; }
					.team-table-wrapper table td { display: block; padding: 4px 0; border: none; text-align: left !important; }
					.team-table-wrapper table td:first-child { margin-bottom: 8px; }
				}
				@keyframes fadeIn {
					from { opacity: 0; transform: translateY(12px); }
					to { opacity: 1; transform: translateY(0); }
				}
			`}</style>
		</div>
	);
}