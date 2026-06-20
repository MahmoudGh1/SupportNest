"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { S } from "@/components/ui";
import type { AdminOrganization, AdminPlan } from "@/types/types";
import { OrganizationDetail } from "@/components/admin-dashboard/OrganizationDetail";
import { Trans, useLingui } from "@lingui/react/macro";
import { useLingui as useLinguiCore } from "@lingui/react";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string, locale: string) {
	if (!iso) return "—";
	return new Date(iso).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
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

function TableSkeleton() {
	return (
		<div style={{ background: S.surface, borderRadius: 12, border: `0.5px solid ${S.border}`, overflow: "hidden" }}>
			<style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
			{Array.from({ length: 6 }).map((_, i) => (
				<div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", borderBottom: i < 5 ? `0.5px solid ${S.border}` : "none" }}>
					<Shimmer width={32} height={32} radius={8} />
					<div style={{ flex: 1 }}><Shimmer width="40%" height={14} radius={4} /></div>
					<Shimmer width={80} height={20} radius={999} />
					<Shimmer width={70} height={20} radius={999} />
					<Shimmer width={90} height={14} radius={4} />
					<Shimmer width={60} height={14} radius={4} />
				</div>
			))}
		</div>
	);
}

// ─── STATUS PILL ──────────────────────────────────────────────────────────────
function StatusPill({ active, scheduledDeletionAt }: { active: boolean; scheduledDeletionAt?: string | null }) {
	if (scheduledDeletionAt) {
		return (
			<span style={{
				fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
				background: "#FEF2F2",
				color: S.danger,
				display: "inline-flex", alignItems: "center", gap: 5,
				border: `1px solid ${S.dangerBg}`
			}}>
				<i className="ti ti-clock-pause" style={{ fontSize: 12 }} />
				<Trans>Deleting soon</Trans>
			</span>
		);
	}
	return (
		<span style={{
			fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
			background: active ? S.greenBg : S.dangerBg,
			color: active ? "#0F6E56" : S.danger,
			display: "inline-flex", alignItems: "center", gap: 5,
		}}>
			<span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? S.green : S.danger }} />
			{active ? <Trans>Active</Trans> : <Trans>Suspended</Trans>}
		</span>
	);
}

// ─── PLAN PILL ────────────────────────────────────────────────────────────────
function PlanPill({ plan }: { plan: AdminPlan | null }) {
	if (!plan) return <span style={{ fontSize: 12, color: S.textMuted }}><Trans>No plan</Trans></span>;
	return (
		<span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: S.purpleBg, color: S.purple }}>
			{plan.name}
		</span>
	);
}

// ─── CREATE ORG MODAL ─────────────────────────────────────────────────────────
function CreateOrgModal({ onClose, onCreated, plans }: { onClose: () => void; onCreated: (org: AdminOrganization) => void; plans: AdminPlan[] }) {
	const { t } = useLingui();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [slug, setSlug] = useState("");
	const [planId, setPlanId] = useState("");
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const slugify = (v: string) => v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

	const handleNameChange = (v: string) => {
		setName(v);
		if (!slug || slug === slugify(name)) setSlug(slugify(v));
	};

	const validate = () => {
		const e: Record<string, string> = {};
		if (!name.trim()) e.name = t`Organization name is required.`;
		if (!email.trim()) e.email = t`Email is required.`;
		else if (!/\S+@\S+\.\S+/.test(email)) e.email = t`Enter a valid email.`;
		if (!password.trim()) e.password = t`Password is required.`;
		else if (password.length < 6) e.password = t`Minimum 6 characters.`;
		if (!slug.trim()) e.slug = t`Slug is required.`;
		else if (!/^[a-z0-9-]+$/.test(slug)) e.slug = t`Lowercase letters, numbers, and hyphens only.`;
		return e;
	};

	const handleCreate = async () => {
		const e = validate();
		if (Object.keys(e).length) { setErrors(e); return; }
		setErrors({});
		setLoading(true);
		try {
			const org = await api.createAdminOrganization({
				name: name.trim(),
				email: email.trim(),
				password: password.trim(),
				slug: slug.trim(),
				plan_id: planId || undefined
			});
			onCreated(org);
		} catch (err: any) {
			setErrors({ form: err.message ?? t`Failed to create organization.` });
		} finally {
			setLoading(false);
		}
	};

	const fieldStyle = (hasError: boolean): React.CSSProperties => ({
		width: "100%", boxSizing: "border-box", height: 40, padding: "0 12px",
		border: `1.5px solid ${hasError ? S.danger : S.border}`, borderRadius: 8,
		fontSize: 13, fontFamily: "inherit", color: S.dark, outline: "none",
		background: "var(--surface-elevated)", transition: "border-color .15s",
	});

	return (
		<div style={{ position: "fixed", inset: 0, background: "rgba(26,24,48,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
			<div style={{ background: S.surface, borderRadius: 16, width: "100%", maxWidth: 460, padding: "2rem", boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}>
				<div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
					<div>
						<h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: S.dark }}><Trans>New organization</Trans></h3>
						<p style={{ margin: "4px 0 0", fontSize: 12, color: S.textMuted }}><Trans>Create a new tenant and admin user.</Trans></p>
					</div>
					<button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: S.textMuted, fontSize: 20, lineHeight: 1 }}>×</button>
				</div>

				{errors.form && (
					<div style={{ background: S.dangerBg, color: S.danger, borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>
						{errors.form}
					</div>
				)}

				<div style={{ marginBottom: 14 }}>
					<label style={{ display: "block", fontSize: 12, fontWeight: 500, color: S.dark, marginBottom: 5 }}><Trans>Organization name</Trans></label>
					<input value={name} onChange={e => handleNameChange(e.target.value)} placeholder={t`Acme Corp`} style={fieldStyle(!!errors.name)} />
					{errors.name && <p style={{ fontSize: 11, color: S.danger, margin: "4px 0 0" }}>{errors.name}</p>}
				</div>

				<div style={{ marginBottom: 14 }}>
					<label style={{ display: "block", fontSize: 12, fontWeight: 500, color: S.dark, marginBottom: 5 }}><Trans>Admin email</Trans></label>
					<input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="admin@acme.com" style={fieldStyle(!!errors.email)} />
					{errors.email && <p style={{ fontSize: 11, color: S.danger, margin: "4px 0 0" }}>{errors.email}</p>}
				</div>

				<div style={{ marginBottom: 14 }}>
					<label style={{ display: "block", fontSize: 12, fontWeight: 500, color: S.dark, marginBottom: 5 }}><Trans>Admin password</Trans></label>
					<input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" style={fieldStyle(!!errors.password)} />
					{errors.password && <p style={{ fontSize: 11, color: S.danger, margin: "4px 0 0" }}>{errors.password}</p>}
				</div>

				<div style={{ marginBottom: 14 }}>
					<label style={{ display: "block", fontSize: 12, fontWeight: 500, color: S.dark, marginBottom: 5 }}><Trans>Slug</Trans></label>
					<input value={slug} onChange={e => setSlug(slugify(e.target.value))} placeholder="acme-corp" style={{ ...fieldStyle(!!errors.slug), fontFamily: "monospace" }} />
					{errors.slug ? (
						<p style={{ fontSize: 11, color: S.danger, margin: "4px 0 0" }}>{errors.slug}</p>
					) : (
						<p style={{ fontSize: 11, color: S.textMuted, margin: "4px 0 0" }}><Trans>URL-safe identifier — lowercase, hyphens only.</Trans></p>
					)}
				</div>

				<div style={{ marginBottom: 22 }}>
					<label style={{ display: "block", fontSize: 12, fontWeight: 500, color: S.dark, marginBottom: 5 }}><Trans>Subscription Plan</Trans></label>
					<select value={planId} onChange={e => setPlanId(e.target.value)} style={fieldStyle(false)}>
						<option value="">{t`Select a plan (optional)`}</option>
						{plans.map(p => (
							<option key={p.id} value={p.id}>{p.name}</option>
						))}
					</select>
				</div>

				<div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
					<button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: `1.5px solid ${S.border}`, background: "transparent", color: S.textSecondary, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
						<Trans>Cancel</Trans>
					</button>
					<button onClick={handleCreate} disabled={loading} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: loading ? S.purpleLight : S.purple, color: "#fff", fontSize: 13, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
						{loading && <i className="ti ti-loader-2" style={{ fontSize: 14, animation: "spin 1s linear infinite" }} />}
						<Trans>Create organization</Trans>
					</button>
				</div>
				<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
			</div>
		</div>
	);
}

// ─── EDIT ORG MODAL ───────────────────────────────────────────────────────────
function EditOrgModal({ org, onClose, onUpdated, plans }: { org: AdminOrganization; onClose: () => void; onUpdated: (org: AdminOrganization) => void; plans: AdminPlan[] }) {
	const { t } = useLingui();
	const [name, setName] = useState(org.name);
	const [email, setEmail] = useState(org.email);
	const [planId, setPlanId] = useState(org.plan?.id ?? "");
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const validate = () => {
		const e: Record<string, string> = {};
		if (!name.trim()) e.name = t`Organization name is required.`;
		if (!email.trim()) e.email = t`Email is required.`;
		else if (!/\S+@\S+\.\S+/.test(email)) e.email = t`Enter a valid email.`;
		return e;
	};

	const handleUpdate = async () => {
		const e = validate();
		if (Object.keys(e).length) { setErrors(e); return; }
		setErrors({});
		setLoading(true);
		try {
			const updated = await api.updateAdminOrganization(org.id, {
				name: name.trim(),
				email: email.trim(),
				plan_id: planId || undefined
			});
			onUpdated(updated);
		} catch (err: any) {
			setErrors({ form: err.message ?? t`Failed to update organization.` });
		} finally {
			setLoading(false);
		}
	};

	const fieldStyle = (hasError: boolean): React.CSSProperties => ({
		width: "100%", boxSizing: "border-box", height: 40, padding: "0 12px",
		border: `1.5px solid ${hasError ? S.danger : S.border}`, borderRadius: 8,
		fontSize: 13, fontFamily: "inherit", color: S.dark, outline: "none",
		background: "var(--surface-elevated)", transition: "border-color .15s",
	});

	return (
		<div style={{ position: "fixed", inset: 0, background: "rgba(26,24,48,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
			<div style={{ background: S.surface, borderRadius: 16, width: "100%", maxWidth: 460, padding: "2rem", boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}>
				<div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
					<div>
						<h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: S.dark }}><Trans>Edit organization</Trans></h3>
						<p style={{ margin: "4px 0 0", fontSize: 12, color: S.textMuted }}><Trans>Update details for {org.name}.</Trans></p>
					</div>
					<button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: S.textMuted, fontSize: 20, lineHeight: 1 }}>×</button>
				</div>

				{errors.form && (
					<div style={{ background: S.dangerBg, color: S.danger, borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>
						{errors.form}
					</div>
				)}

				<div style={{ marginBottom: 14 }}>
					<label style={{ display: "block", fontSize: 12, fontWeight: 500, color: S.dark, marginBottom: 5 }}><Trans>Organization name</Trans></label>
					<input value={name} onChange={e => setName(e.target.value)} placeholder={t`Acme Corp`} style={fieldStyle(!!errors.name)} />
					{errors.name && <p style={{ fontSize: 11, color: S.danger, margin: "4px 0 0" }}>{errors.name}</p>}
				</div>

				<div style={{ marginBottom: 14 }}>
					<label style={{ display: "block", fontSize: 12, fontWeight: 500, color: S.dark, marginBottom: 5 }}><Trans>Contact email</Trans></label>
					<input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="contact@acme.com" style={fieldStyle(!!errors.email)} />
					{errors.email && <p style={{ fontSize: 11, color: S.danger, margin: "4px 0 0" }}>{errors.email}</p>}
				</div>

				<div style={{ marginBottom: 22 }}>
					<label style={{ display: "block", fontSize: 12, fontWeight: 500, color: S.dark, marginBottom: 5 }}><Trans>Subscription Plan</Trans></label>
					<select value={planId} onChange={e => setPlanId(e.target.value)} style={fieldStyle(false)}>
						<option value="">{t`Select a plan`}</option>
						{plans.map(p => (
							<option key={p.id} value={p.id}>{p.name}</option>
						))}
					</select>
				</div>

				<div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
					<button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: `1.5px solid ${S.border}`, background: "transparent", color: S.textSecondary, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
						<Trans>Cancel</Trans>
					</button>
					<button onClick={handleUpdate} disabled={loading} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: loading ? S.purpleLight : S.purple, color: "#fff", fontSize: 13, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
						{loading && <i className="ti ti-loader-2" style={{ fontSize: 14, animation: "spin 1s linear infinite" }} />}
						<Trans>Save changes</Trans>
					</button>
				</div>
			</div>
		</div>
	);
}

// ─── DELETE CONFIRM MODAL ─────────────────────────────────────────────────────
function DeleteConfirmModal({ org, onClose, onDeleted }: { org: AdminOrganization; onClose: () => void; onDeleted: () => void }) {
	const { t } = useLingui();
	const [loading, setLoading] = useState(false);
	const [confirmName, setConfirmName] = useState("");

	const handleDelete = async () => {
		if (confirmName !== org.name) return;
		setLoading(true);
		try {
			await api.deleteAdminOrganization(org.id);
			onDeleted();
		} catch (err: any) {
			alert(err.message ?? t`Failed to delete organization.`);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={{ position: "fixed", inset: 0, background: "rgba(26,24,48,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
			<div style={{ background: S.surface, borderRadius: 16, width: "100%", maxWidth: 420, padding: "2rem", boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}>
				<div style={{ width: 48, height: 48, borderRadius: 12, background: S.dangerBg, color: S.danger, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
					<i className="ti ti-alert-triangle" style={{ fontSize: 24 }} />
				</div>
				<h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: S.dark }}><Trans>Delete organization?</Trans></h3>
				<p style={{ margin: "8px 0 20px", fontSize: 14, color: S.textMuted, lineHeight: 1.5 }}>
					<Trans>
						This will permanently delete <strong>{org.name}</strong> and all associated data, including users, conversations, and settings. This action cannot be undone.
					</Trans>
				</p>

				<div style={{ marginBottom: 20 }}>
					<label style={{ display: "block", fontSize: 12, fontWeight: 500, color: S.dark, marginBottom: 5 }}>
						<Trans>Type <strong>{org.name}</strong> to confirm</Trans>
					</label>
					<input
						value={confirmName}
						onChange={e => setConfirmName(e.target.value)}
						placeholder={org.name}
						style={{
							width: "100%", boxSizing: "border-box", height: 40, padding: "0 12px",
							border: `1.5px solid ${S.border}`, borderRadius: 8,
							fontSize: 13, fontFamily: "inherit", color: S.dark, outline: "none",
							background: "var(--surface-elevated)",
						}}
					/>
				</div>

				<div style={{ display: "flex", gap: 10 }}>
					<button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1.5px solid ${S.border}`, background: "transparent", color: S.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
						<Trans>Cancel</Trans>
					</button>
					<button
						onClick={handleDelete}
						disabled={loading || confirmName !== org.name}
						style={{
							flex: 1, padding: "10px", borderRadius: 8, border: "none",
							background: loading || confirmName !== org.name ? S.dangerBg : S.danger,
							color: loading || confirmName !== org.name ? S.danger : "#fff",
							fontSize: 13, fontWeight: 600, cursor: loading || confirmName !== org.name ? "not-allowed" : "pointer",
							fontFamily: "inherit"
						}}
					>
						{loading ? <Trans>Deleting...</Trans> : <Trans>Delete Permanently</Trans>}
					</button>
				</div>
			</div>
		</div>
	);
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
	useEffect(() => { const timer = setTimeout(onClose, 3500); return () => clearTimeout(timer); }, [onClose]);
	return (
		<div style={{
			position: "fixed", bottom: 24, right: 24, zIndex: 999,
			background: type === "success" ? S.greenBg : S.dangerBg,
			border: `1px solid ${type === "success" ? S.green : S.danger}`,
			color: type === "success" ? "#0F6E56" : S.danger,
			borderRadius: 10, padding: "12px 18px", fontSize: 13, fontWeight: 500,
			display: "flex", alignItems: "center", gap: 8,
			boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
			animation: "slideUp .2s ease",
		}}>
			<i className={`ti ti-${type === "success" ? "check" : "alert-circle"}`} style={{ fontSize: 16 }} />
			{msg}
			<button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", marginLeft: 8, fontSize: 16 }}>×</button>
			<style>{`@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
		</div>
	);
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

export default function OrganizationsPage() {
	const { t } = useLingui();
	// Get the active locale for date formatting
	const { i18n } = useLinguiCore();
	const locale = i18n.locale;

	const [orgs, setOrgs] = useState<AdminOrganization[]>([]);
	const [plans, setPlans] = useState<AdminPlan[]>([]);
	const [meta, setMeta] = useState<{ total: number; page: number; limit: number; total_pages: number } | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [statusFilter, setStatusFilter] = useState<"" | "true" | "false">("");
	const [page, setPage] = useState(1);

	const [showCreate, setShowCreate] = useState(false);
	const [editingOrg, setEditingOrg] = useState<AdminOrganization | null>(null);
	const [deletingOrg, setDeletingOrg] = useState<AdminOrganization | null>(null);

	const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
	const [actionLoading, setActionLoading] = useState<string | null>(null);

	const fetchPlans = useCallback(async () => {
		try {
			const res = await api.getPlans();
			setPlans(res.map(p => ({ id: p.id, name: p.name, price_monthly: p.priceMonthly })));
		} catch (err) {
			console.error("Failed to load plans", err);
		}
	}, []);

	const fetchOrgs = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const res = await api.getAdminOrganizations({
				search: search || undefined,
				is_active: statusFilter === "" ? "" : statusFilter === "true",
				page,
				limit: PAGE_SIZE,
			});
			setOrgs(res.data);
			setMeta(res.meta);
		} catch (err: any) {
			setError(err.message ?? t`Failed to load overview stats`);
		} finally {
			setLoading(false);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search, statusFilter, page]);
	// NOTE: `t` is intentionally omitted — it's a stable Lingui macro reference
	// and including it would cause infinite re-fetches on every render.

	useEffect(() => {
		fetchOrgs();
		fetchPlans();
	}, [fetchOrgs, fetchPlans]);

	// debounce search
	useEffect(() => {
		const timer = setTimeout(() => { setPage(1); setSearch(searchInput); }, 400);
		return () => clearTimeout(timer);
	}, [searchInput]);

	const handleCreated = (org: AdminOrganization) => {
		setShowCreate(false);
		setToast({ msg: t`${org.name} created.`, type: "success" });
		fetchOrgs();
	};

	const handleUpdated = (org: AdminOrganization) => {
		setEditingOrg(null);
		setToast({ msg: t`${org.name} updated.`, type: "success" });
		fetchOrgs();
	};

	const handleDeleted = () => {
		const name = deletingOrg?.name ?? "";
		setDeletingOrg(null);
		setToast({ msg: t`${name} deleted.`, type: "success" });
		if (selectedOrgId) setSelectedOrgId(null);
		fetchOrgs();
	};

	const handleToggleStatus = async (org: AdminOrganization) => {
		setActionLoading(org.id);
		try {
			if (org.is_active) {
				await api.suspendAdminOrganization(org.id);
				setToast({ msg: t`${org.name} suspended.`, type: "success" });
			} else {
				await api.activateAdminOrganization(org.id);
				setToast({ msg: t`${org.name} activated.`, type: "success" });
			}
			setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, is_active: !o.is_active } : o));
		} catch (err: any) {
			setToast({ msg: err.message ?? t`Action failed.`, type: "error" });
		} finally {
			setActionLoading(null);
		}
	};

	const handleCancelDeletion = async (org: AdminOrganization) => {
		setActionLoading(org.id);
		try {
			await api.cancelDeleteAdminOrganization(org.id);
			setToast({ msg: t`Deletion of ${org.name} cancelled.`, type: "success" });
			setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, scheduled_deletion_at: null } : o));
		} catch (err: any) {
			setToast({ msg: err.message ?? t`Action failed.`, type: "error" });
		} finally {
			setActionLoading(null);
		}
	};

	const totalPages = meta?.total_pages ?? 1;

	const STATUS_OPTIONS = [
		{ label: t`All Status`, value: "" as const },
		{ label: t`Active`, value: "true" as const },
		{ label: t`Suspended`, value: "false" as const },
	];

	if (selectedOrgId) {
		return (
			<div style={{ padding: "1.5rem" }}>
				<OrganizationDetail
					organizationId={selectedOrgId}
					onClose={() => setSelectedOrgId(null)}
				/>
			</div>
		);
	}

	return (
		<div style={{ padding: "1.5rem", minWidth: 0 }}>
			{/* Header */}
			<div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
				<div>
					<p style={{ fontSize: 11, fontWeight: 600, color: S.textMuted, letterSpacing: ".06em", textTransform: "uppercase", margin: "0 0 4px" }}>
						<Trans>Tenant management</Trans>
					</p>
					<h1 style={{ fontSize: 24, fontWeight: 750, color: S.dark, margin: 0 }}>
						<Trans>Organizations</Trans>
					</h1>
				</div>
				<button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 8, border: "none", background: S.purple, color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
					<i className="ti ti-plus" style={{ fontSize: 16 }} />
					<Trans>New organization</Trans>
				</button>
			</div>

			{/* Stats row */}
			<div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
				<div style={{ background: S.surface, border: `0.5px solid ${S.border}`, borderRadius: 10, padding: "14px 20px", minWidth: 140 }}>
					<div style={{ fontSize: 11, color: S.textMuted, fontWeight: 600, marginBottom: 4 }}><Trans>Platform Status</Trans></div>
					<div style={{ fontSize: 13, fontWeight: 700, color: "#0F6E56" }}><Trans>All Systems Operational</Trans></div>
				</div>
				<div style={{ background: S.surface, border: `0.5px solid ${S.border}`, borderRadius: 10, padding: "14px 20px", minWidth: 140 }}>
					<div style={{ fontSize: 11, color: S.textMuted, fontWeight: 600, marginBottom: 4 }}><Trans>Total Organizations</Trans></div>
					<div style={{ fontSize: 20, fontWeight: 750, color: S.dark }}>{meta?.total ?? "—"}</div>
				</div>
				<div style={{ background: S.surface, border: `0.5px solid ${S.border}`, borderRadius: 10, padding: "14px 20px", minWidth: 140 }}>
					<div style={{ fontSize: 11, color: S.textMuted, fontWeight: 600, marginBottom: 4 }}><Trans>Active Organizations</Trans></div>
					<div style={{ fontSize: 20, fontWeight: 750, color: S.dark }}>{orgs.filter(o => o.is_active).length}</div>
				</div>
				<div style={{ background: S.surface, border: `0.5px solid ${S.border}`, borderRadius: 10, padding: "14px 20px", minWidth: 140 }}>
					<div style={{ fontSize: 11, color: S.textMuted, fontWeight: 600, marginBottom: 4 }}><Trans>Total Users</Trans></div>
					<div style={{ fontSize: 20, fontWeight: 750, color: S.dark }}>{orgs.reduce((a, o) => a + (o.stats?.total_users ?? 0), 0)}</div>
				</div>
				<div style={{ background: S.surface, border: `0.5px solid ${S.border}`, borderRadius: 10, padding: "14px 20px", minWidth: 140 }}>
					<div style={{ fontSize: 11, color: S.textMuted, fontWeight: 600, marginBottom: 4 }}><Trans>Total Tickets</Trans></div>
					<div style={{ fontSize: 20, fontWeight: 750, color: S.dark }}>{orgs.reduce((a, o) => a + (o.stats?.total_tickets ?? 0), 0)}</div>
				</div>
				<div style={{ background: S.surface, border: `0.5px solid ${S.border}`, borderRadius: 10, padding: "14px 20px", minWidth: 140 }}>
					<div style={{ fontSize: 11, color: S.textMuted, fontWeight: 600, marginBottom: 4 }}><Trans>Escalated Tickets</Trans></div>
					<div style={{ fontSize: 20, fontWeight: 750, color: S.dark }}>{orgs.reduce((a, o) => a + (o.stats?.escalated_tickets ?? 0), 0)}</div>
				</div>
			</div>

			{/* Welcome */}
			<div style={{ marginBottom: 20 }}>
				<h2 style={{ fontSize: 18, fontWeight: 700, color: S.dark, margin: 0 }}>
					<Trans>Welcome back, Super Admin</Trans>
				</h2>
			</div>

			{/* Filters */}
			<div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
				<div style={{ position: "relative", flex: "1 1 260px", maxWidth: 360 }}>
					<i className="ti ti-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: S.textMuted, fontSize: 16 }} />
					<input
						value={searchInput}
						onChange={e => setSearchInput(e.target.value)}
						placeholder={t`Search organizations by name or slug...`}
						style={{ width: "100%", boxSizing: "border-box", height: 38, padding: "0 12px 0 36px", border: `1.5px solid ${S.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", color: S.dark, outline: "none", background: S.surface }}
					/>
				</div>
				<div style={{ display: "flex", gap: 4, background: S.surface, border: `0.5px solid ${S.border}`, borderRadius: 8, padding: 4 }}>
					{STATUS_OPTIONS.map(opt => (
						<button
							key={opt.value}
							onClick={() => { setStatusFilter(opt.value); setPage(1); }}
							style={{
								padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "inherit",
								fontSize: 12, fontWeight: 500,
								background: statusFilter === opt.value ? S.purple : "transparent",
								color: statusFilter === opt.value ? "#fff" : S.textMuted,
								transition: "all .15s",
							}}
						>
							{opt.label}
						</button>
					))}
				</div>
			</div>

			{/* Table */}
			{loading ? (
				<TableSkeleton />
			) : error ? (
				<div style={{ background: S.dangerBg, color: S.danger, padding: "1rem", borderRadius: 8, fontSize: 14 }}>{error}</div>
			) : orgs.length === 0 ? (
				<div style={{ background: S.surface, borderRadius: 12, border: `0.5px solid ${S.border}`, padding: "3rem", textAlign: "center" }}>
					<div style={{ width: 52, height: 52, borderRadius: 14, background: S.purpleBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
						<i className="ti ti-building-skyscraper" style={{ fontSize: 26, color: S.purple }} />
					</div>
					<p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: S.dark }}><Trans>No organizations found</Trans></p>
					<p style={{ margin: "6px 0 0", fontSize: 12, color: S.textMuted }}>
						{search || statusFilter
							? <Trans>No organizations match your search.</Trans>
							: <Trans>Create your first organization to get started.</Trans>}
					</p>
				</div>
			) : (
				<div style={{ background: S.surface, borderRadius: 12, border: `0.5px solid ${S.border}`, overflow: "hidden" }}>
					{/* Table header */}
					<div style={{ display: "grid", gridTemplateColumns: "1.8fr 0.8fr 0.8fr 1.2fr 0.8fr 1.6fr", gap: 12, padding: "12px 20px", borderBottom: `0.5px solid ${S.border}`, fontSize: 11, fontWeight: 600, color: S.textMuted, letterSpacing: ".04em", textTransform: "uppercase" }}>
						<div><Trans>Organization</Trans></div>
						<div><Trans>Plan</Trans></div>
						<div><Trans>Status</Trans></div>
						<div><Trans>Stats</Trans></div>
						<div><Trans>Joined Date</Trans></div>
						<div style={{ textAlign: "right" }}><Trans>Actions</Trans></div>
					</div>

					{orgs.map((org, i) => (
						<div
							key={org.id}
							onClick={() => setSelectedOrgId(org.id)}
							style={{
								display: "grid", gridTemplateColumns: "1.8fr 0.8fr 0.8fr 1.2fr 0.8fr 1.6fr", gap: 12,
								padding: "14px 20px", alignItems: "center", cursor: "pointer",
								borderBottom: i < orgs.length - 1 ? `0.5px solid ${S.border}` : "none",
								transition: "background .12s",
							}}
							onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-elevated)")}
							onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
						>
							{/* Org name */}
							<div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
								<div style={{ width: 34, height: 34, borderRadius: 8, background: S.purpleBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 700, color: S.purple }}>
									{org.name?.[0]?.toUpperCase() ?? "?"}
								</div>
								<div style={{ minWidth: 0 }}>
									<div style={{ fontSize: 13, fontWeight: 600, color: S.dark, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{org.name}</div>
									<div style={{ fontSize: 11, color: S.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{org.email}</div>
								</div>
							</div>

							{/* Plan */}
							<div><PlanPill plan={org.plan} /></div>

							{/* Status */}
							<div><StatusPill active={org.is_active} scheduledDeletionAt={org.scheduled_deletion_at} /></div>

							{/* Stats */}
							<div style={{ display: "flex", gap: 10, fontSize: 11, color: S.textMuted }}>
								<span title={t`Users`}><i className="ti ti-users" style={{ fontSize: 12, marginRight: 2 }} />{org.stats?.total_users ?? 0}</span>
								<span title={t`Tickets`}><i className="ti ti-ticket" style={{ fontSize: 12, marginRight: 2 }} />{org.stats?.total_tickets ?? 0}</span>
							</div>

							{/* Joined Date */}
							<div style={{ fontSize: 12, color: S.textMuted }}>{fmtDate(org.created_at, locale)}</div>

							{/* Actions */}
							<div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }} onClick={e => e.stopPropagation()}>
								{org.scheduled_deletion_at ? (
									<button
										onClick={() => handleCancelDeletion(org)}
										disabled={actionLoading === org.id}
										title={t`Cancel scheduled deletion`}
										style={{
											padding: "6px 10px", borderRadius: 7,
											border: `1px solid ${S.green}`,
											background: S.greenBg,
											color: "#0F6E56",
											fontSize: 11, fontWeight: 600, cursor: actionLoading === org.id ? "not-allowed" : "pointer",
											fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4,
											opacity: actionLoading === org.id ? 0.6 : 1,
										}}
									>
										{actionLoading === org.id
											? <i className="ti ti-loader-2" style={{ fontSize: 12, animation: "spin 1s linear infinite" }} />
											: <i className="ti ti-rotate-clockwise" style={{ fontSize: 12 }} />}
										<Trans>Cancel Delete</Trans>
									</button>
								) : (
									<>
										<button
											onClick={() => handleToggleStatus(org)}
											disabled={actionLoading === org.id}
											title={org.is_active ? t`Suspend organization` : t`Activate organization`}
											style={{
												padding: "6px 10px", borderRadius: 7,
												border: `1px solid ${org.is_active ? S.dangerBg : S.greenBg}`,
												background: org.is_active ? S.dangerBg : S.greenBg,
												color: org.is_active ? S.danger : "#0F6E56",
												fontSize: 11, fontWeight: 600, cursor: actionLoading === org.id ? "not-allowed" : "pointer",
												fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4,
												opacity: actionLoading === org.id ? 0.6 : 1,
											}}
										>
											{actionLoading === org.id
												? <i className="ti ti-loader-2" style={{ fontSize: 12, animation: "spin 1s linear infinite" }} />
												: <i className={`ti ti-${org.is_active ? "ban" : "circle-check"}`} style={{ fontSize: 12 }} />}
											{org.is_active ? <Trans>Suspend</Trans> : <Trans>Activate</Trans>}
										</button>
										<button
											onClick={() => setEditingOrg(org)}
											title={t`Edit details`}
											style={{ padding: "6px 8px", borderRadius: 7, border: `1px solid ${S.border}`, background: S.surface, color: S.textSecondary, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
										>
											<i className="ti ti-edit" style={{ fontSize: 14 }} />
										</button>
										<button
											onClick={() => setDeletingOrg(org)}
											title={t`Delete organization`}
											style={{ padding: "6px 8px", borderRadius: 7, border: `1px solid ${S.dangerBg}`, background: S.dangerBg, color: S.danger, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
										>
											<i className="ti ti-trash" style={{ fontSize: 14 }} />
										</button>
									</>
								)}
								<button
									onClick={() => setSelectedOrgId(org.id)}
									title={t`View Organization Details`}
									style={{ padding: "6px 8px", borderRadius: 7, border: `1px solid ${S.border}`, background: S.surface, color: S.textSecondary, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
								>
									<i className="ti ti-chevron-right" style={{ fontSize: 14 }} />
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Pagination */}
			{meta && totalPages > 1 && (
				<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
					<span style={{ fontSize: 12, color: S.textMuted }}>
						<Trans>Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}</Trans>
					</span>
					<div style={{ display: "flex", gap: 6 }}>
						<button
							onClick={() => setPage(p => Math.max(1, p - 1))}
							disabled={page <= 1}
							style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${S.border}`, background: "transparent", color: S.textSecondary, fontSize: 12, cursor: page <= 1 ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: page <= 1 ? 0.5 : 1 }}
						>
							<Trans>Previous</Trans>
						</button>
						<span style={{ display: "flex", alignItems: "center", padding: "0 8px", fontSize: 12, color: S.textMuted }}>
							<Trans>Page {page} of {totalPages}</Trans>
						</span>
						<button
							onClick={() => setPage(p => Math.min(totalPages, p + 1))}
							disabled={page >= totalPages}
							style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${S.border}`, background: "transparent", color: S.textSecondary, fontSize: 12, cursor: page >= totalPages ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: page >= totalPages ? 0.5 : 1 }}
						>
							<Trans>Next</Trans>
						</button>
					</div>
				</div>
			)}

			{showCreate && <CreateOrgModal plans={plans} onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
			{editingOrg && <EditOrgModal org={editingOrg} plans={plans} onClose={() => setEditingOrg(null)} onUpdated={handleUpdated} />}
			{deletingOrg && <DeleteConfirmModal org={deletingOrg} onClose={() => setDeletingOrg(null)} onDeleted={handleDeleted} />}
			{toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

			<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
		</div>
	);
}