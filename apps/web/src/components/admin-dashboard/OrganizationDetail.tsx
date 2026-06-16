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
	border: `0.5px solid ${S.border}`,
	borderRadius: 12,
	padding: "1.25rem",
};

const labelStyle: React.CSSProperties = {
	fontSize: 11,
	color: S.textMuted,
	textTransform: "uppercase",
	letterSpacing: ".05em",
	fontWeight: 600,
	marginBottom: 4,
};

const valueStyle: React.CSSProperties = {
	fontSize: 14,
	color: S.dark,
	fontWeight: 500,
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
		<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
			<style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>

			{/* Header Skeleton */}
			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
				<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
					<Shimmer width={24} height={24} radius={4} />
					<div>
						<Shimmer width={200} height={24} radius={6} />
						<div style={{ marginTop: 6 }}>
							<Shimmer width={150} height={13} radius={4} />
						</div>
					</div>
				</div>
				<Shimmer width={100} height={36} radius={8} />
			</div>

			{/* Stats Row Skeleton */}
			<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
				<div style={cardStyle}>
					<Shimmer width={80} height={11} radius={4} />
					<div style={{ display: "grid", gap: 12, marginTop: 12 }}>
						<div>
							<Shimmer width={60} height={10} radius={4} />
							<div style={{ marginTop: 4 }}><Shimmer width="80%" height={14} radius={4} /></div>
						</div>
						<div>
							<Shimmer width={80} height={10} radius={4} />
							<div style={{ marginTop: 4 }}><Shimmer width="50%" height={14} radius={4} /></div>
						</div>
					</div>
				</div>

				<div style={cardStyle}>
					<Shimmer width={120} height={11} radius={4} />
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i}>
								<Shimmer width="60%" height={24} radius={6} />
								<div style={{ marginTop: 4 }}><Shimmer width="40%" height={10} radius={4} /></div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Tier Performance Skeleton */}
			<section style={cardStyle}>
				<Shimmer width={150} height={11} radius={4} />
				<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 20, marginTop: 16 }}>
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i}>
							<Shimmer width="70%" height={11} radius={4} />
							<div style={{ marginTop: 6, marginBottom: 4 }}><Shimmer width="50%" height={22} radius={6} /></div>
							<Shimmer width="40%" height={10} radius={4} />
						</div>
					))}
				</div>
			</section>

			{/* Team Table Skeleton */}
			<section style={cardStyle}>
				<Shimmer width={180} height={11} radius={4} />
				<div style={{ marginTop: 16 }}>
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `0.5px solid ${S.border}` }}>
							<Shimmer width="25%" height={13} radius={4} />
							<Shimmer width="35%" height={13} radius={4} />
							<Shimmer width="20%" height={13} radius={4} />
							<Shimmer width="10%" height={13} radius={4} />
						</div>
					))}
				</div>
			</section>
		</div>
	);
}

export function OrganizationDetail({ organizationId, onClose }: Props) {
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
			<div style={{ padding: "2rem", textAlign: "center", color: S.danger }}>
				{error || "Organization not found"}
				<button onClick={onClose} style={{ display: "block", margin: "1rem auto", color: S.purple, background: "none", border: "none", cursor: "pointer" }}>
					Go back
				</button>
			</div>
		);
	}

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
				<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
					<button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: S.textMuted }}>
						<i className="ti ti-arrow-left" style={{ fontSize: 20 }} />
					</button>
					<div>
						<h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: S.dark }}>{org.name}</h2>
						<p style={{ fontSize: 13, color: S.textMuted, margin: 0 }}>{org.slug} • Created {new Date(org.created_at).toLocaleDateString()}</p>
					</div>
				</div>
				<div style={{ display: "flex", gap: 12 }}>
					<button
						style={{
							padding: "8px 14px",
							borderRadius: 8,
							background: org.is_active ? S.dangerBg : S.greenBg,
							color: org.is_active ? S.danger : S.green,
							border: "none",
							fontWeight: 600,
							fontSize: 12,
							cursor: "pointer",
						}}
						onClick={async () => {
							try {
								if (org.is_active) await api.suspendAdminOrganization(organizationId);
								else await api.activateAdminOrganization(organizationId);
								const updated = await api.getAdminOrganization(organizationId);
								setOrg(updated);
							} catch (e: any) { alert(e.message); }
						}}
					>
						<i className={`ti ti-${org.is_active ? "player-pause" : "player-play"}`} style={{ marginRight: 6 }} />
						{org.is_active ? "Suspend" : "Activate"}
					</button>
				</div>
			</div>

			<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
				<div style={cardStyle}>
					<div style={labelStyle}>Information</div>
					<div style={{ display: "grid", gap: 12 }}>
						<div>
							<div style={{ fontSize: 11, color: S.textMuted }}>Admin Email</div>
							<div style={valueStyle}>{org.email}</div>
						</div>
						<div>
							<div style={{ fontSize: 11, color: S.textMuted }}>Subscription Plan</div>
							<div style={{ ...valueStyle, color: S.purple, fontWeight: 700 }}>{org.plan?.name || "No Plan"}</div>
						</div>
					</div>
				</div>

				<div style={cardStyle}>
					<div style={labelStyle}>Tickets & Activity</div>
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
						<div>
							<div style={{ fontSize: 24, fontWeight: 700, color: S.dark }}>{org.stats.total_tickets}</div>
							<div style={{ fontSize: 11, color: S.textMuted }}>Total Tickets</div>
						</div>
						<div>
							<div style={{ fontSize: 24, fontWeight: 700, color: S.warning }}>{org.stats.open_tickets}</div>
							<div style={{ fontSize: 11, color: S.textMuted }}>Open Tickets</div>
						</div>
						<div>
							<div style={{ fontSize: 24, fontWeight: 700, color: S.danger }}>{org.stats.escalated_tickets}</div>
							<div style={{ fontSize: 11, color: S.textMuted }}>Escalated</div>
						</div>
						<div>
							<div style={{ fontSize: 24, fontWeight: 700, color: S.green }}>{org.stats.resolved_tickets}</div>
							<div style={{ fontSize: 11, color: S.textMuted }}>Resolved</div>
						</div>
					</div>
				</div>
			</div>

			<section style={cardStyle}>
				<div style={labelStyle}>Performance by Tier</div>
				{tierStats ? (
					<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 20 }}>
						<div>
							<div style={{ fontSize: 11, color: S.textMuted, marginBottom: 4 }}>Tier 0 (Router)</div>
							<div style={{ fontSize: 22, fontWeight: 700, color: S.info }}>{tierStats.tier0_resolve_rate.toFixed(1)}%</div>
							<div style={{ fontSize: 10, color: S.textMuted }}>{tierStats.tier0_resolved} resolved</div>
						</div>
						<div>
							<div style={{ fontSize: 11, color: S.textMuted, marginBottom: 4 }}>Tier 1 (AI Agent)</div>
							<div style={{ fontSize: 22, fontWeight: 700, color: S.purple }}>{tierStats.tier1_resolve_rate.toFixed(1)}%</div>
							<div style={{ fontSize: 10, color: S.textMuted }}>{tierStats.tier1_resolved} resolved</div>
						</div>
						<div>
							<div style={{ fontSize: 11, color: S.textMuted, marginBottom: 4 }}>Tier 2 (Expert AI)</div>
							<div style={{ fontSize: 22, fontWeight: 700, color: S.purpleDark }}>{tierStats.tier2_resolve_rate.toFixed(1)}%</div>
							<div style={{ fontSize: 10, color: S.textMuted }}>{tierStats.tier2_resolved} resolved</div>
						</div>
						<div>
							<div style={{ fontSize: 11, color: S.textMuted, marginBottom: 4 }}>Human Escalation</div>
							<div style={{ fontSize: 22, fontWeight: 700, color: S.warning }}>{tierStats.human_escalation_rate.toFixed(1)}%</div>
							<div style={{ fontSize: 10, color: S.textMuted }}>{tierStats.human_escalated} escalated</div>
						</div>
					</div>
				) : <p style={{ fontSize: 13, color: S.textMuted }}>No tier data available.</p>}
			</section>

			<section style={cardStyle}>
				<div style={labelStyle}>Organization Team ({org.users.length})</div>
				<div style={{ overflowX: "auto" }}>
					<table style={{ width: "100%", borderCollapse: "collapse" }}>
						<thead>
							<tr>
								<th style={{ textAlign: "left", padding: "8px", fontSize: 11, color: S.textMuted, borderBottom: `1px solid ${S.border}` }}>Name</th>
								<th style={{ textAlign: "left", padding: "8px", fontSize: 11, color: S.textMuted, borderBottom: `1px solid ${S.border}` }}>Email</th>
								<th style={{ textAlign: "left", padding: "8px", fontSize: 11, color: S.textMuted, borderBottom: `1px solid ${S.border}` }}>Role</th>
								<th style={{ textAlign: "left", padding: "8px", fontSize: 11, color: S.textMuted, borderBottom: `1px solid ${S.border}` }}>Tickets</th>
							</tr>
						</thead>
						<tbody>
							{org.users.map(user => (
								<tr key={user.id}>
									<td style={{ padding: "10px 8px", fontSize: 13, color: S.dark, borderBottom: `0.5px solid ${S.border}` }}>{user.first_name} {user.last_name}</td>
									<td style={{ padding: "10px 8px", fontSize: 13, color: S.textMuted, borderBottom: `0.5px solid ${S.border}` }}>{user.email}</td>
									<td style={{ padding: "10px 8px", fontSize: 13, color: S.dark, borderBottom: `0.5px solid ${S.border}` }}>
										<span style={{ fontSize: 10, background: S.bgSoft, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase" }}>{user.role}</span>
									</td>
									<td style={{ padding: "10px 8px", fontSize: 13, color: S.dark, borderBottom: `0.5px solid ${S.border}` }}>{user.assigned_tickets_count}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	);
}
