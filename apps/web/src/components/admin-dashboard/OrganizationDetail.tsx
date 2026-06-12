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
	orgId: string;
	onClose: () => void;
}

const cardStyle: React.CSSProperties = {
	background: "#fff",
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

export function OrganizationDetail({ orgId, onClose }: Props) {
	const [org, setOrg] = useState<AdminOrganizationDetail | null>(null);
	const [tierStats, setTierStats] = useState<AdminTierStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		setLoading(true);
		Promise.all([api.getAdminOrganization(orgId), api.getAdminOrgTierStats(orgId)])
			.then(([orgData, stats]) => {
				setOrg(orgData);
				setTierStats(stats);
			})
			.catch((err) => setError(err.message || "Failed to load details"))
			.finally(() => setLoading(false));
	}, [orgId]);

	if (loading) {
		return (
			<div style={{ padding: "2rem", textAlign: "center", color: S.textMuted }}>
				<i className="ti ti-loader-2" style={{ fontSize: 24, animation: "spin 1s linear infinite" }} />
			</div>
		);
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
								if (org.is_active) await api.suspendAdminOrganization(orgId);
								else await api.activateAdminOrganization(orgId);
								const updated = await api.getAdminOrganization(orgId);
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
