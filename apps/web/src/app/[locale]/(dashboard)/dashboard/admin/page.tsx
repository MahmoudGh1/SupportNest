"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { S } from "@/components/ui";
import type { AdminOverview, AdminOrganization, AdminPlan } from "@/types/types";
import { OrganizationDetail } from "@/components/admin-dashboard/OrganizationDetail";

// ─── SHARED HELPERS ───────────────────────────────────────────────────────────
function Shimmer({ width = "100%", height = 16, radius = 6 }: { width?: string | number; height?: number; radius?: number }) {
	return (
		<div
			style={{
				width, height, borderRadius: radius,
				background: `linear-gradient(90deg, ${S.border} 25%, #f0eff8 50%, ${S.border} 75%)`,
				backgroundSize: "200% 100%",
				animation: "shimmer 1.4s infinite",
				flexShrink: 0,
			}}
		/>
	);
}

function fmtDate(iso: string) {
	if (!iso) return "—";
	return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ════════════════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ════════════════════════════════════════════════════════════════════════════

function StatCard({
	label,
	value,
	icon,
	color = "var(--color-brand)",
}: {
	label: string;
	value: string | number;
	icon: string;
	color?: string;
}) {
	return (
		<div style={{ background: S.surface, borderRadius: 12, padding: "1.25rem", border: `0.5px solid ${S.border}` }}>
			<div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
				<div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}10`, display: "flex", alignItems: "center", justifyContent: "center" }}>
					<i className={`ti ti-${icon}`} style={{ fontSize: 18, color }} />
				</div>
				<span style={{ fontSize: 12, color: S.textMuted, fontWeight: 500 }}>{label}</span>
			</div>
			<div style={{ fontSize: 24, fontWeight: 700, color: S.dark }}>{value}</div>
		</div>
	);
}

function OverviewSkeleton() {
	return (
		<div style={{ padding: "1.5rem", minWidth: 0 }}>
			<style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
			<div style={{ marginBottom: 24 }}>
				<Shimmer width={120} height={12} radius={4} />
				<div style={{ marginTop: 8 }}><Shimmer width={300} height={28} radius={6} /></div>
			</div>
			<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
				{Array.from({ length: 8 }).map((_, i) => (
					<div key={i} style={{ background: S.surface, borderRadius: 12, padding: "1.25rem", border: `0.5px solid ${S.border}` }}>
						<div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
							<Shimmer width={36} height={36} radius={10} /><Shimmer width={100} height={14} radius={4} />
						</div>
						<Shimmer width="60%" height={24} radius={6} />
					</div>
				))}
			</div>
		</div>
	);
}

function OverviewTab() {
	const [stats, setStats] = useState<AdminOverview | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		api.getAdminOverview()
			.then(setStats)
			.catch((err) => setError(err.message || "Failed to load overview stats"))
			.finally(() => setLoading(false));
	}, []);

	if (loading) return <OverviewSkeleton />;
	if (error) return <div style={{ padding: "1.5rem" }}><div style={{ background: S.dangerBg, color: S.danger, padding: "1rem", borderRadius: 8, fontSize: 14 }}>{error}</div></div>;
	if (!stats) return null;

	return (
		<div style={{ padding: "1.5rem", minWidth: 0 }}>
			<div style={{ marginBottom: 24 }}>
				<p style={{ fontSize: 11, fontWeight: 600, color: S.textMuted, letterSpacing: ".06em", textTransform: "uppercase", margin: "0 0 4px" }}>Platform Overview</p>
				<h1 style={{ fontSize: 24, fontWeight: 750, color: S.dark, margin: 0 }}>System-wide Performance</h1>
			</div>

			<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 24 }}>
				<StatCard label="Total Organizations" value={stats.total_organizations} icon="building" color={S.purple} />
				<StatCard label="Active Organizations" value={stats.active_organizations} icon="building-check" color={S.green} />
				<StatCard label="Total Users" value={stats.total_users} icon="users" color={S.brand} />
				<StatCard label="AI Resolution Rate" value={`${stats.overall_ai_resolution_rate}%`} icon="cpu" color="#ff9f43" />
				<StatCard label="Total Conversations" value={stats.total_conversations.toLocaleString()} icon="message-2" color={S.brand} />
				<StatCard label="Total Tickets" value={stats.total_tickets.toLocaleString()} icon="ticket" color={S.purple} />
				<StatCard label="Escalated" value={stats.escalated_tickets} icon="alert-circle" color={S.danger} />
				<StatCard label="Avg CSAT" value={`${stats.avg_csat_score || "—"} / 5.0`} icon="star" color="#f1c40f" />
			</div>

			<div style={{ background: S.surface, borderRadius: 12, border: `0.5px solid ${S.border}`, padding: "1.5rem", marginBottom: 24 }}>
				<h3 style={{ fontSize: 16, fontWeight: 700, color: S.dark, margin: "0 0 20px" }}>AI Tier Resolution Breakdown</h3>
				<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24 }}>
					{[
						{ label: "Tier 0 (Router)", value: `${stats.tier_breakdown.tier0_resolve_rate}%`, sub: `${stats.tier_breakdown.tier0_resolved} resolved`, color: S.green },
						{ label: "Tier 1 (AI Agent)", value: `${stats.tier_breakdown.tier1_resolve_rate}%`, sub: `${stats.tier_breakdown.tier1_resolved} resolved`, color: S.brand },
						{ label: "Tier 2 (Expert AI)", value: `${stats.tier_breakdown.tier2_resolve_rate}%`, sub: `${stats.tier_breakdown.tier2_resolved} resolved`, color: S.purple },
						{ label: "Human Escalation", value: `${stats.tier_breakdown.human_escalation_rate}%`, sub: `${stats.tier_breakdown.human_escalated} escalated`, color: S.danger },
					].map((item) => (
						<div key={item.label}>
							<div style={{ fontSize: 12, color: S.textMuted, fontWeight: 500, marginBottom: 4 }}>{item.label}</div>
							<div style={{ fontSize: 20, fontWeight: 700, color: S.dark, marginBottom: 2 }}>{item.value}</div>
							<div style={{ fontSize: 11, color: S.textMuted }}>{item.sub}</div>
							<div style={{ height: 4, background: `${item.color}20`, borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
								<div style={{ height: "100%", width: item.value, background: item.color }} />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

// ════════════════════════════════════════════════════════════════════════════
// ORGANIZATIONS TAB
// ════════════════════════════════════════════════════════════════════════════

function StatusPill({ active }: { active: boolean }) {
	return (
		<span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: active ? S.greenBg : S.dangerBg, color: active ? "#0F6E56" : S.danger, display: "inline-flex", alignItems: "center", gap: 5 }}>
			<span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? S.green : S.danger }} />
			{active ? "Active" : "Suspended"}
		</span>
	);
}

function PlanPill({ plan }: { plan: AdminPlan | null }) {
	if (!plan) return <span style={{ fontSize: 12, color: S.textMuted }}>No plan</span>;
	return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: S.purpleBg, color: S.purple }}>{plan.name}</span>;
}

function OrganizationsTab() {
	const [orgs, setOrgs] = useState<AdminOrganization[]>([]);
	const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<"" | "true" | "false">("");

	const fetchOrgs = useCallback(async () => {
		setLoading(true);
		try {
			const res = await api.getAdminOrganizations({
				search: search || undefined,
				is_active: statusFilter === "" ? "" : statusFilter === "true",
				limit: 10
			});
			setOrgs(res.data);
		} catch (err) { console.error(err); }
		finally { setLoading(false); }
	}, [search, statusFilter]);

	useEffect(() => {
		const t = setTimeout(fetchOrgs, 300);
		return () => clearTimeout(t);
	}, [fetchOrgs]);

	if (selectedOrgId) {
		return <div style={{ padding: "1.5rem" }}><OrganizationDetail orgId={selectedOrgId} onClose={() => setSelectedOrgId(null)} /></div>;
	}

	return (
		<div style={{ padding: "1.5rem" }}>
			<div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
				<input
					value={search}
					onChange={e => setSearch(e.target.value)}
					placeholder="Search organizations..."
					style={{ flex: 1, height: 38, padding: "0 12px", border: `1.5px solid ${S.border}`, borderRadius: 8, fontSize: 13, outline: "none" }}
				/>
				<select
					value={statusFilter}
					onChange={e => setStatusFilter(e.target.value as any)}
					style={{ height: 38, padding: "0 10px", border: `1.5px solid ${S.border}`, borderRadius: 8, fontSize: 13, outline: "none" }}
				>
					<option value="">All Status</option>
					<option value="true">Active</option>
					<option value="false">Suspended</option>
				</select>
			</div>
			<div style={{ background: S.surface, borderRadius: 12, border: `0.5px solid ${S.border}`, overflow: "hidden" }}>
				<div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 0.5fr", gap: 12, padding: "12px 20px", borderBottom: `0.5px solid ${S.border}`, fontSize: 11, fontWeight: 600, color: S.textMuted, textTransform: "uppercase" }}>
					<div>Organization</div>
					<div>Plan</div>
					<div>Status</div>
					<div>Created</div>
					<div style={{ textAlign: "right" }}>Actions</div>
				</div>
				{loading && (
					<div style={{ padding: "2rem", textAlign: "center", color: S.textMuted, fontSize: 13 }}>Loading...</div>
				)}
				{!loading && orgs.length === 0 && (
					<div style={{ padding: "2rem", textAlign: "center", color: S.textMuted, fontSize: 13 }}>No organizations found.</div>
				)}
				{orgs.map((org) => (
					<div key={org.id} onClick={() => setSelectedOrgId(org.id)} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 0.5fr", gap: 12, padding: "14px 20px", alignItems: "center", cursor: "pointer", borderBottom: `0.5px solid ${S.border}` }}>
						<div style={{ fontWeight: 600, color: S.dark }}>{org.name}</div>
						<div><PlanPill plan={org.plan} /></div>
						<div><StatusPill active={org.is_active} /></div>
						<div style={{ fontSize: 12, color: S.textMuted }}>{fmtDate(org.created_at)}</div>
						<div style={{ textAlign: "right" }}><i className="ti ti-chevron-right" style={{ color: S.textMuted }} /></div>
					</div>
				))}
			</div>
		</div>
	);
}

// ════════════════════════════════════════════════════════════════════════════
// CONTACT SUBMISSIONS TAB
// ════════════════════════════════════════════════════════════════════════════

type ContactSubmission = {
	id: string;
	name: string;
	email: string;
	company?: string;
	message: string;
	createdAt: string;
};

function ContactSubmissionsTab() {
	const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		api.getContactSubmissions()
			.then(setSubmissions)
			.catch((err) => setError(err.message || "Failed to load submissions"))
			.finally(() => setLoading(false));
	}, []);

	if (loading) return (
		<div style={{ padding: "1.5rem" }}>
			<style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
			<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
				{Array.from({ length: 4 }).map((_, i) => (
					<Shimmer key={i} height={64} radius={10} />
				))}
			</div>
		</div>
	);

	if (error) return (
		<div style={{ padding: "1.5rem" }}>
			<div style={{ background: S.dangerBg, color: S.danger, padding: "1rem", borderRadius: 8, fontSize: 14 }}>{error}</div>
		</div>
	);

	return (
		<div style={{ padding: "1.5rem" }}>
			<div style={{ marginBottom: 20 }}>
				<p style={{ fontSize: 11, fontWeight: 600, color: S.textMuted, letterSpacing: ".06em", textTransform: "uppercase", margin: "0 0 4px" }}>
					Inbound Leads
				</p>
				<h1 style={{ fontSize: 24, fontWeight: 750, color: S.dark, margin: 0 }}>
					Contact Submissions
					<span style={{ marginLeft: 10, fontSize: 14, fontWeight: 600, padding: "2px 10px", borderRadius: 999, background: S.purpleBg, color: S.purple }}>
						{submissions.length}
					</span>
				</h1>
			</div>

			<div style={{ background: S.surface, borderRadius: 12, border: `0.5px solid ${S.border}`, overflow: "hidden" }}>
				{/* Table header */}
				<div style={{
					display: "grid",
					gridTemplateColumns: "1fr 1.2fr 1fr 2.5fr 0.8fr",
					gap: 12,
					padding: "12px 20px",
					borderBottom: `0.5px solid ${S.border}`,
					fontSize: 11,
					fontWeight: 600,
					color: S.textMuted,
					textTransform: "uppercase",
				}}>
					<div>Name</div>
					<div>Email</div>
					<div>Company</div>
					<div>Message</div>
					<div>Date</div>
				</div>

				{submissions.length === 0 && (
					<div style={{ padding: "3rem", textAlign: "center", color: S.textMuted, fontSize: 13 }}>
						<i className="ti ti-mail-off" style={{ fontSize: 32, display: "block", marginBottom: 8, opacity: 0.4 }} />
						No submissions yet.
					</div>
				)}

				{submissions.map((s) => (
					<div
						key={s.id}
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1.2fr 1fr 2.5fr 0.8fr",
							gap: 12,
							padding: "14px 20px",
							alignItems: "start",
							borderBottom: `0.5px solid ${S.border}`,
							fontSize: 13,
						}}
					>
						<div style={{ fontWeight: 600, color: S.dark }}>{s.name}</div>
						<div style={{ color: S.textMuted, wordBreak: "break-all" }}>{s.email}</div>
						<div style={{ color: S.textMuted }}>{s.company || "—"}</div>
						<div style={{ color: S.dark, lineHeight: 1.5 }}>{s.message}</div>
						<div style={{ fontSize: 11, color: S.textMuted }}>{fmtDate(s.createdAt)}</div>
					</div>
				))}
			</div>
		</div>
	);
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════

type Tab = "overview" | "organizations" | "contact-submissions";

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
	return (
		<button onClick={onClick} style={{ padding: "12px 20px", border: "none", background: "transparent", borderBottom: active ? `2px solid ${S.purple}` : "2px solid transparent", color: active ? S.dark : S.textMuted, fontWeight: active ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
			{label}
		</button>
	);
}

export default function AdminDashboardPage() {
	const [tab, setTab] = useState<Tab>("overview");

	return (
		<div style={{ minWidth: 0 }}>
			<div style={{ display: "flex", gap: 4, padding: "0 1.5rem", borderBottom: `0.5px solid ${S.border}`, background: S.surface }}>
				<TabButton label="Overview" active={tab === "overview"} onClick={() => setTab("overview")} />
				<TabButton label="Organizations" active={tab === "organizations"} onClick={() => setTab("organizations")} />
			{/* 	<TabButton label="Contact Submissions" active={tab === "contact-submissions"} onClick={() => setTab("contact-submissions")} /> */}
			</div>
			{tab === "overview" && <OverviewTab />}
			{tab === "organizations" && <OrganizationsTab />}
			{tab === "contact-submissions" && <ContactSubmissionsTab />}
		</div>
	);
}