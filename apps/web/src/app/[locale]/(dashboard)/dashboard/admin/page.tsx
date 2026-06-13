"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { S } from "@/components/ui";
import { OrganizationDetail } from "@/components/admin-dashboard/OrganizationDetail";
import { OrganizationEditor } from "@/components/admin-dashboard/OrganizationEditor";
import { UserEditor } from "@/components/admin-dashboard/UserEditor";
import type {
	AdminOrganization,
	AdminOrganizationsResponse,
	AdminOverview,
	AdminUser,
	AdminUsersResponse,
} from "@/types/types";

type ActiveFilter = boolean | "";
type Tab = "overview" | "organizations" | "users";

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

function RolePill({ role }: { role: string }) {
	const colors: Record<string, { bg: string; text: string }> = {
		super_admin: { bg: S.purpleFaint, text: S.purple },
		org_admin: { bg: S.infoBg, text: S.info },
		support_agent: { bg: S.greenBg, text: S.green },
	};
	const style = colors[role.toLowerCase()] || { bg: S.border, text: S.textMuted };
	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				background: style.bg,
				color: style.text,
				borderRadius: 6,
				padding: "2px 8px",
				fontSize: 10,
				fontWeight: 600,
				textTransform: "uppercase",
			}}
		>
			{role.replace("_", " ")}
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

export default function AdminDashboardPage() {
	const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
	const [showCreateOrg, setShowCreateOrg] = useState(false);
	const [refreshCounter, setRefreshCounter] = useState(0);
	const [orgs, setOrgs] = useState<AdminOrganizationsResponse | null>(null);
	const [search, setSearch] = useState("");
	const [activeFilter, setActiveFilter] = useState<ActiveFilter>("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let ignore = false;
		setLoading(true);

		const fetchData = async () => {
			try {
				const data = await api.getAdminOrganizations({
					search,
					is_active: activeFilter,
					page: 1,
					limit: 50,
				});
				if (!ignore) setOrgs(data);
				if (!ignore) setError("");
			} catch (err: any) {
				if (!ignore) setError(err.message ?? "Failed to load data");
			} finally {
				if (!ignore) setLoading(false);
			}
		};

		fetchData();
		return () => { ignore = true; };
	}, [activeFilter, search, refreshCounter]);

	const renderOrganizations = () => (
		<section
			style={{
				background: "#fff",
				border: `0.5px solid ${S.border}`,
				borderRadius: 12,
				padding: "1.5rem",
				minWidth: 0,
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 12,
					marginBottom: 20,
					flexWrap: "wrap",
				}}
			>
				<h2 style={{ fontSize: 16, color: S.dark, margin: 0, fontWeight: 700 }}>
					Registered Organizations
				</h2>
				<div style={{ display: "flex", gap: 12, alignItems: "center" }}>
					<button
						onClick={() => setShowCreateOrg(true)}
						style={{
							height: 36,
							padding: "0 14px",
							background: S.purple,
							color: "#fff",
							borderRadius: 8,
							border: "none",
							fontSize: 13,
							fontWeight: 600,
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							gap: 6,
						}}
					>
						<i className="ti ti-plus" style={{ fontSize: 14 }} />
						New Organization
					</button>
					<div style={{ position: "relative" }}>
						<i className="ti ti-search" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: S.textMuted, fontSize: 15 }} />
						<input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search..."
							style={{ width: 210, height: 36, border: `1px solid ${S.border}`, borderRadius: 8, padding: "0 10px 0 34px", fontSize: 13, outline: "none" }}
						/>
					</div>
				</div>
			</div>

			<div style={{ overflowX: "auto" }}>
				<table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
					<thead>
						<tr>
							{["Organization", "Admin Email", "Status", "Users", "Tickets", "Escalated"].map((heading) => (
								<th key={heading} style={headerStyle}>{heading}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{orgs?.data.map((org) => (
							<tr
								key={org.id}
								onClick={() => setSelectedOrgId(org.id)}
								style={{ cursor: "pointer", transition: "background 0.1s" }}
								onMouseEnter={(e) => (e.currentTarget.style.background = S.bgSoft)}
								onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
							>
								<td style={cellStyle}>
									<div style={{ color: S.dark, fontWeight: 650, fontSize: 13 }}>{org.name}</div>
									<div style={{ color: S.textMuted, fontSize: 11 }}>{org.slug}</div>
								</td>
								<td style={cellStyle}>{org.email}</td>
								<td style={cellStyle}><StatusPill active={org.is_active} /></td>
								<td style={cellStyle}>{formatNumber(org.stats.total_users)}</td>
								<td style={cellStyle}>{formatNumber(org.stats.total_tickets)}</td>
								<td style={cellStyle}>
									<span style={{ color: org.stats.escalated_tickets > 0 ? S.danger : S.textSecondary, fontWeight: org.stats.escalated_tickets > 0 ? 600 : 400 }}>
										{formatNumber(org.stats.escalated_tickets)}
									</span>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);

	return (
		<div style={{ padding: "1.5rem", minWidth: 0 }}>
			{selectedOrgId ? (
				<OrganizationDetail
					orgId={selectedOrgId}
					onClose={() => setSelectedOrgId(null)}
				/>
			) : (
				<>
					<div style={{ marginBottom: 24 }}>
						<p style={{ fontSize: 11, fontWeight: 600, color: S.textMuted, letterSpacing: ".06em", textTransform: "uppercase", margin: "0 0 4px" }}>
							Platform Administration
						</p>
						<h1 style={{ fontSize: 24, fontWeight: 750, color: S.dark, margin: 0 }}>
							Manage Organizations & Performance
						</h1>
					</div>

					{error && (
						<div style={{ background: S.dangerBg, color: S.danger, borderRadius: 8, padding: "12px", fontSize: 13, marginBottom: 14 }}>
							{error}
						</div>
					)}

					{loading ? (
						<div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: S.textMuted }}>
							<i className="ti ti-loader-2" style={{ fontSize: 24, animation: "spin 1s linear infinite" }} />
						</div>
					) : renderOrganizations()}
				</>
			)}

			{showCreateOrg && (
				<OrganizationEditor
					onClose={() => setShowCreateOrg(false)}
					onSuccess={() => {
						setShowCreateOrg(false);
						setRefreshCounter(prev => prev + 1);
					}}
				/>
			)}
		</div>
	);
}
