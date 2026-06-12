"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { S } from "@/components/ui";
import type {
	AdminOrganization,
	AdminOrganizationsResponse,
	AdminOverview,
} from "@/types/types";

type ActiveFilter = boolean | "";

const cellStyle: React.CSSProperties = {
	padding: "12px 10px",
	borderBottom: `0.5px solid ${S.border}`,
	fontSize: 12,
	color: S.textSecondary,
	verticalAlign: "middle",
};

const headerStyle: React.CSSProperties = {
	textAlign: "left",
	padding: "0 10px 10px",
	borderBottom: `0.5px solid ${S.border}`,
	color: S.textMuted,
	fontSize: 10,
	textTransform: "uppercase",
	letterSpacing: ".06em",
	fontWeight: 600,
	whiteSpace: "nowrap",
};

function formatNumber(value: number | undefined) {
	return (value ?? 0).toLocaleString();
}

function formatLatency(ms: number | undefined) {
	if (!ms) return "0 ms";
	return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms} ms`;
}

function MetricCard({
	label,
	value,
	meta,
	icon,
	color = S.purple,
}: {
	label: string;
	value: string | number;
	meta: string;
	icon: string;
	color?: string;
}) {
	return (
		<div
			style={{
				background: "#fff",
				border: `0.5px solid ${S.border}`,
				borderRadius: 8,
				padding: "1rem",
				minHeight: 112,
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "flex-start",
					justifyContent: "space-between",
					gap: 12,
				}}
			>
				<span style={{ color: S.textMuted, fontSize: 12 }}>{label}</span>
				<span
					style={{
						width: 32,
						height: 32,
						borderRadius: 8,
						background: `${color}18`,
						color,
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						flexShrink: 0,
					}}
				>
					<i className={`ti ti-${icon}`} style={{ fontSize: 17 }} />
				</span>
			</div>
			<div
				style={{
					color: S.dark,
					fontSize: 26,
					fontWeight: 650,
					marginTop: 12,
					lineHeight: 1,
				}}
			>
				{value}
			</div>
			<div style={{ color: S.textMuted, fontSize: 11, marginTop: 9 }}>
				{meta}
			</div>
		</div>
	);
}

function StatusPill({ active }: { active: boolean }) {
	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: 6,
				background: active ? S.greenBg : S.dangerBg,
				color: active ? S.green : S.danger,
				borderRadius: 999,
				padding: "4px 9px",
				fontSize: 11,
				fontWeight: 600,
				whiteSpace: "nowrap",
			}}
		>
			<i
				className={`ti ti-${active ? "circle-check" : "circle-x"}`}
				style={{ fontSize: 13 }}
			/>
			{active ? "Active" : "Suspended"}
		</span>
	);
}

function TierProgress({
	label,
	value,
	color,
}: {
	label: string;
	value: number;
	color: string;
}) {
	return (
		<div>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 6,
				}}
			>
				<span style={{ fontSize: 12, color: S.textSecondary }}>{label}</span>
				<span style={{ fontSize: 12, color: S.dark, fontWeight: 600 }}>
					{value.toFixed(1)}%
				</span>
			</div>
			<div
				style={{
					height: 7,
					borderRadius: 999,
					background: S.border,
					overflow: "hidden",
				}}
			>
				<div
					style={{
						width: `${Math.min(value, 100)}%`,
						height: "100%",
						background: color,
						borderRadius: 999,
					}}
				/>
			</div>
		</div>
	);
}

function OrganizationRow({ org }: { org: AdminOrganization }) {
	return (
		<tr>
			<td style={cellStyle}>
				<div style={{ color: S.dark, fontWeight: 600 }}>{org.name}</div>
				<div style={{ color: S.textMuted, fontSize: 11 }}>{org.email}</div>
			</td>
			<td style={cellStyle}>{org.plan?.name ?? "No plan"}</td>
			<td style={cellStyle}>
				<StatusPill active={org.is_active} />
			</td>
			<td style={cellStyle}>{formatNumber(org.stats.total_users)}</td>
			<td style={cellStyle}>
				{formatNumber(org.stats.total_conversations)}
			</td>
			<td style={cellStyle}>{formatNumber(org.stats.open_tickets)}</td>
			<td style={cellStyle}>{formatNumber(org.stats.escalated_tickets)}</td>
		</tr>
	);
}

export default function AdminDashboardPage() {
	const [overview, setOverview] = useState<AdminOverview | null>(null);
	const [orgs, setOrgs] = useState<AdminOrganizationsResponse | null>(null);
	const [search, setSearch] = useState("");
	const [activeFilter, setActiveFilter] = useState<ActiveFilter>("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let ignore = false;

		Promise.all([
			api.getAdminOverview(),
			api.getAdminOrganizations({
				search,
				is_active: activeFilter,
				page: 1,
				limit: 20,
			}),
		])
			.then(([overviewData, orgData]) => {
				if (ignore) return;
				setOverview(overviewData);
				setOrgs(orgData);
				setError("");
			})
			.catch((err) => {
				if (!ignore) setError(err.message ?? "Failed to load admin data");
			})
			.finally(() => {
				if (!ignore) setLoading(false);
			});

		return () => {
			ignore = true;
		};
	}, [activeFilter, search]);

	const health = useMemo(() => {
		if (!overview?.total_organizations) return 0;
		return Math.round(
			(overview.active_organizations / overview.total_organizations) * 100,
		);
	}, [overview]);

	if (loading && !overview) {
		return (
			<div
				style={{
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
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
		<div style={{ padding: "1.5rem", minWidth: 0 }}>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 16,
					marginBottom: 18,
					flexWrap: "wrap",
				}}
			>
				<div>
					<p
						style={{
							fontSize: 11,
							fontWeight: 600,
							color: S.textMuted,
							letterSpacing: ".06em",
							textTransform: "uppercase",
							margin: "0 0 8px",
						}}
					>
						Platform administration
					</p>
					<h1
						style={{
							fontSize: 22,
							lineHeight: 1.2,
							color: S.dark,
							margin: 0,
							fontWeight: 650,
						}}
					>
						Organizations, conversations, and escalation health
					</h1>
				</div>
				<div
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: 8,
						color: S.green,
						background: S.greenBg,
						borderRadius: 8,
						padding: "9px 12px",
						fontSize: 12,
						fontWeight: 600,
					}}
				>
					<i className="ti ti-activity" style={{ fontSize: 16 }} />
					{health}% orgs active
				</div>
			</div>

			{error && (
				<div
					style={{
						background: S.dangerBg,
						color: S.danger,
						border: `0.5px solid ${S.danger}33`,
						borderRadius: 8,
						padding: "10px 12px",
						fontSize: 13,
						marginBottom: 14,
					}}
				>
					{error}
				</div>
			)}

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
					gap: 12,
					marginBottom: 14,
				}}
			>
				<MetricCard
					label="Organizations"
					value={formatNumber(overview?.total_organizations)}
					meta={`${formatNumber(overview?.suspended_organizations)} suspended`}
					icon="building"
				/>
				<MetricCard
					label="Users"
					value={formatNumber(overview?.total_users)}
					meta="Across every organization"
					icon="users"
					color="#2563EB"
				/>
				<MetricCard
					label="Conversations"
					value={formatNumber(overview?.total_conversations)}
					meta={`${formatNumber(overview?.active_conversations)} active now`}
					icon="messages"
					color="#0F766E"
				/>
				<MetricCard
					label="Open tickets"
					value={formatNumber(overview?.open_tickets)}
					meta={`${formatNumber(overview?.escalated_tickets)} escalated`}
					icon="ticket"
					color="#B45309"
				/>
				<MetricCard
					label="AI resolution"
					value={`${overview?.overall_ai_resolution_rate ?? 0}%`}
					meta={`CSAT ${overview?.avg_csat_score ?? 0}/5 average`}
					icon="sparkles"
					color="#7C3AED"
				/>
			</div>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
					gap: 14,
					alignItems: "start",
				}}
			>
				<section
					style={{
						background: "#fff",
						border: `0.5px solid ${S.border}`,
						borderRadius: 8,
						padding: "1rem",
					}}
				>
					<h2
						style={{
							fontSize: 14,
							color: S.dark,
							margin: "0 0 14px",
							fontWeight: 650,
						}}
					>
						Tier funnel
					</h2>
					<div style={{ display: "grid", gap: 14 }}>
						<TierProgress
							label="Tier 1 resolved"
							value={overview?.tier_breakdown.tier1_resolve_rate ?? 0}
							color={S.purple}
						/>
						<TierProgress
							label="Tier 2 resolved"
							value={overview?.tier_breakdown.tier2_resolve_rate ?? 0}
							color="#2563EB"
						/>
						<TierProgress
							label="Human escalated"
							value={overview?.tier_breakdown.human_escalation_rate ?? 0}
							color="#B45309"
						/>
					</div>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
							gap: 10,
							marginTop: 18,
						}}
					>
						<MetricCard
							label="Tier 1 latency"
							value={formatLatency(overview?.tier_breakdown.avg_tier1_latency_ms)}
							meta="Average response"
							icon="clock"
						/>
						<MetricCard
							label="Tier 2 latency"
							value={formatLatency(overview?.tier_breakdown.avg_tier2_latency_ms)}
							meta={`${formatNumber(overview?.tier_breakdown.total_tokens_used)} tokens`}
							icon="timer"
							color="#2563EB"
						/>
					</div>
				</section>

				<section
					style={{
						background: "#fff",
						border: `0.5px solid ${S.border}`,
						borderRadius: 8,
						padding: "1rem",
						minWidth: 0,
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							gap: 12,
							marginBottom: 14,
							flexWrap: "wrap",
						}}
					>
						<h2
							style={{
								fontSize: 14,
								color: S.dark,
								margin: 0,
								fontWeight: 650,
							}}
						>
							Organizations
						</h2>
						<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
							<div style={{ position: "relative" }}>
								<i
									className="ti ti-search"
									style={{
										position: "absolute",
										left: 11,
										top: "50%",
										transform: "translateY(-50%)",
										color: S.textMuted,
										fontSize: 15,
									}}
								/>
								<input
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder="Search organizations"
									style={{
										width: 210,
										height: 34,
										boxSizing: "border-box",
										border: `1px solid ${S.border}`,
										borderRadius: 8,
										padding: "0 10px 0 34px",
										color: S.dark,
										fontFamily: "inherit",
										fontSize: 12,
										outline: "none",
									}}
								/>
							</div>
							<select
								value={String(activeFilter)}
								onChange={(e) => {
									const value = e.target.value;
									setActiveFilter(value === "" ? "" : value === "true");
								}}
								style={{
									height: 34,
									border: `1px solid ${S.border}`,
									borderRadius: 8,
									padding: "0 10px",
									color: S.dark,
									background: "#fff",
									fontFamily: "inherit",
									fontSize: 12,
									outline: "none",
								}}
							>
								<option value="">All statuses</option>
								<option value="true">Active</option>
								<option value="false">Suspended</option>
							</select>
						</div>
					</div>

					<div style={{ overflowX: "auto" }}>
						<table
							style={{
								width: "100%",
								borderCollapse: "collapse",
								minWidth: 760,
							}}
						>
							<thead>
								<tr>
									{[
										"Organization",
										"Plan",
										"Status",
										"Users",
										"Conversations",
										"Open",
										"Escalated",
									].map((heading) => (
										<th key={heading} style={headerStyle}>
											{heading}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{orgs?.data.map((org) => (
									<OrganizationRow key={org.id} org={org} />
								))}
							</tbody>
						</table>
					</div>

					{!loading && orgs?.data.length === 0 && (
						<div
							style={{
								textAlign: "center",
								padding: "2rem",
								color: S.textMuted,
								fontSize: 13,
							}}
						>
							No organizations match these filters.
						</div>
					)}

					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							color: S.textMuted,
							fontSize: 11,
							marginTop: 12,
						}}
					>
						<span>{formatNumber(orgs?.meta.total)} total organizations</span>
						<span>
							Page {orgs?.meta.page ?? 1} of {orgs?.meta.total_pages ?? 1}
						</span>
					</div>
				</section>
			</div>
		</div>
	);
}
