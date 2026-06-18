"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { S } from "@/components/ui";
import type { AdminOrganization, AdminPlan } from "@/types/types";
import { OrganizationDetail } from "@/components/admin-dashboard/OrganizationDetail";
import { useAuth } from "@/context/auth-context";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── RESPONSIVE STYLES (MEDIA INJECTOR) ────────────────────────────────────────
function ResponsiveStyles() {
    return (
        <style>{`
            @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
            @keyframes spin { to { transform: rotate(360deg) } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
            
            /* Responsive Utilities */
            .org-grid {
                display: grid;
                grid-template-columns: 1.8fr 0.8fr 0.8fr 1.2fr 0.8fr 1.6fr;
                gap: 12px;
                padding: 14px 20px;
                align-items: center;
            }
            .org-header-grid {
                display: grid;
                grid-template-columns: 1.8fr 0.8fr 0.8fr 1.2fr 0.8fr 1.6fr;
                gap: 12px;
                padding: 12px 20px;
            }

            @media (max-width: 992px) {
                .org-header-grid { display: none !important; }
                .org-grid {
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: flex-start !important;
                    gap: 14px !important;
                    padding: 20px !important;
                }
                .org-cell-label {
                    display: inline-block !important;
                    width: 90px;
                    font-size: 11px;
                    font-weight: 600;
                    color: ${S.textMuted};
                    text-transform: uppercase;
                    letter-spacing: .02em;
                }
                .org-actions-wrapper {
                    width: 100% !important;
                    justify-content: flex-start !important;
                    margin-top: 6px;
                    padding-top: 14px;
                    border-top: 1px dashed ${S.border};
                }
                .org-responsive-row {
                    display: flex !important;
                    align-items: center !important;
                    width: 100%;
                }
            }
            @media (max-width: 480px) {
                .org-actions-wrapper {
                    flex-wrap: wrap !important;
                }
                .org-actions-wrapper button {
                    flex: 1 1 calc(50% - 8px);
                    text-align: center;
                    justify-content: center;
                }
            }
        `}</style>
    );
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
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="org-grid" style={{ borderBottom: i < 4 ? `0.5px solid ${S.border}` : "none" }}>
                    <div style={{ flex: 1, width: "100%" }}><Shimmer width="50%" height={16} radius={4} /></div>
                    <div><Shimmer width={60} height={20} radius={999} /></div>
                    <div><Shimmer width={70} height={20} radius={999} /></div>
                    <div><Shimmer width={90} height={14} radius={4} /></div>
                    <div><Shimmer width={60} height={14} radius={4} /></div>
                </div>
            ))}
        </div>
    );
}

// ─── STATUS PILL ──────────────────────────────────────────────────────────────
function StatusPill({ active }: { active: boolean }) {
    return (
        <span style={{
            fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
            background: active ? S.greenBg : S.dangerBg,
            color: active ? "#0F6E56" : S.danger,
            display: "inline-flex", alignItems: "center", gap: 5,
        }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? S.green : S.danger }} />
            {active ? "Active" : "Suspended"}
        </span>
    );
}

// ─── PLAN PILL ────────────────────────────────────────────────────────────────
function PlanPill({ plan }: { plan: AdminPlan | null }) {
    if (!plan) return <span style={{ fontSize: 12, color: S.textMuted }}>No plan</span>;
    return (
        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: S.purpleBg, color: S.purple }}>
            {plan.name}
        </span>
    );
}

// ─── CREATE ORG MODAL ─────────────────────────────────────────────────────────
function CreateOrgModal({ onClose, onCreated, plans }: { onClose: () => void; onCreated: (org: AdminOrganization) => void; plans: AdminPlan[] }) {
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
        if (!name.trim()) e.name = "Organization name is required.";
        if (!email.trim()) e.email = "Email is required.";
        else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email.";
        if (!password.trim()) e.password = "Password is required.";
        else if (password.length < 6) e.password = "Minimum 6 characters.";
        if (!slug.trim()) e.slug = "Slug is required.";
        else if (!/^[a-z0-9-]+$/.test(slug)) e.slug = "Lowercase letters, numbers, and hyphens only.";
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
            setErrors({ form: err.message ?? "Failed to create organization." });
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
            <div style={{ background: S.surface, borderRadius: 16, width: "100%", maxWidth: 460, padding: "1.5rem", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: S.dark }}>New organization</h3>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: S.textMuted }}>Create a new tenant and admin user.</p>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: S.textMuted, fontSize: 22, lineHeight: 1 }}>×</button>
                </div>

                {errors.form && (
                    <div style={{ background: S.dangerBg, color: S.danger, borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>
                        {errors.form}
                    </div>
                )}

                <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: S.dark, marginBottom: 5 }}>Organization name</label>
                    <input value={name} onChange={e => handleNameChange(e.target.value)} placeholder="Acme Corp" style={fieldStyle(!!errors.name)} />
                    {errors.name && <p style={{ fontSize: 11, color: S.danger, margin: "4px 0 0" }}>{errors.name}</p>}
                </div>

                <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: S.dark, marginBottom: 5 }}>Admin email</label>
                    <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="admin@acme.com" style={fieldStyle(!!errors.email)} />
                    {errors.email && <p style={{ fontSize: 11, color: S.danger, margin: "4px 0 0" }}>{errors.email}</p>}
                </div>

                <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: S.dark, marginBottom: 5 }}>Admin password</label>
                    <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" style={fieldStyle(!!errors.password)} />
                    {errors.password && <p style={{ fontSize: 11, color: S.danger, margin: "4px 0 0" }}>{errors.password}</p>}
                </div>

                <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: S.dark, marginBottom: 5 }}>Slug</label>
                    <input value={slug} onChange={e => setSlug(slugify(e.target.value))} placeholder="acme-corp" style={{ ...fieldStyle(!!errors.slug), fontFamily: "monospace" }} />
                    {errors.slug ? (
                        <p style={{ fontSize: 11, color: S.danger, margin: "4px 0 0" }}>{errors.slug}</p>
                    ) : (
                        <p style={{ fontSize: 11, color: S.textMuted, margin: "4px 0 0" }}>URL-safe identifier.</p>
                    )}
                </div>

                <div style={{ marginBottom: 22 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: S.dark, marginBottom: 5 }}>Subscription Plan</label>
                    <select value={planId} onChange={e => setPlanId(e.target.value)} style={fieldStyle(false)}>
                        <option value="">Select a plan (optional)</option>
                        {plans.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: `1.5px solid ${S.border}`, background: "transparent", color: S.textSecondary, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                        Cancel
                    </button>
                    <button onClick={handleCreate} disabled={loading} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: loading ? S.purpleLight : S.purple, color: "#fff", fontSize: 13, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
                        {loading && <i className="ti ti-loader-2" style={{ fontSize: 14, animation: "spin 1s linear infinite" }} />}
                        Create organization
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── EDIT ORG MODAL ───────────────────────────────────────────────────────────
function EditOrgModal({ org, onClose, onUpdated, plans }: { org: AdminOrganization; onClose: () => void; onUpdated: (org: AdminOrganization) => void; plans: AdminPlan[] }) {
    const [name, setName] = useState(org.name);
    const [email, setEmail] = useState(org.email);
    const [planId, setPlanId] = useState(org.plan?.id ?? "");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = "Organization name is required.";
        if (!email.trim()) e.email = "Email is required.";
        else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email.";
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
            setErrors({ form: err.message ?? "Failed to update organization." });
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
            <div style={{ background: S.surface, borderRadius: 16, width: "100%", maxWidth: 460, padding: "1.5rem", boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: S.dark }}>Edit organization</h3>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: S.textMuted }}>Update details for {org.name}.</p>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: S.textMuted, fontSize: 22, lineHeight: 1 }}>×</button>
                </div>

                {errors.form && (
                    <div style={{ background: S.dangerBg, color: S.danger, borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>
                        {errors.form}
                    </div>
                )}

                <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: S.dark, marginBottom: 5 }}>Organization name</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Acme Corp" style={fieldStyle(!!errors.name)} />
                    {errors.name && <p style={{ fontSize: 11, color: S.danger, margin: "4px 0 0" }}>{errors.name}</p>}
                </div>

                <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: S.dark, marginBottom: 5 }}>Contact email</label>
                    <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="contact@acme.com" style={fieldStyle(!!errors.email)} />
                    {errors.email && <p style={{ fontSize: 11, color: S.danger, margin: "4px 0 0" }}>{errors.email}</p>}
                </div>

                <div style={{ marginBottom: 22 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: S.dark, marginBottom: 5 }}>Subscription Plan</label>
                    <select value={planId} onChange={e => setPlanId(e.target.value)} style={fieldStyle(false)}>
                        <option value="">Select a plan</option>
                        {plans.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: `1.5px solid ${S.border}`, background: "transparent", color: S.textSecondary, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                        Cancel
                    </button>
                    <button onClick={handleUpdate} disabled={loading} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: loading ? S.purpleLight : S.purple, color: "#fff", fontSize: 13, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
                        {loading && <i className="ti ti-loader-2" style={{ fontSize: 14, animation: "spin 1s linear infinite" }} />}
                        Save changes
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── DELETE CONFIRM MODAL ─────────────────────────────────────────────────────
function DeleteConfirmModal({ org, onClose, onDeleted }: { org: AdminOrganization; onClose: () => void; onDeleted: () => void }) {
    const [loading, setLoading] = useState(false);
    const [confirmName, setConfirmName] = useState("");

    const handleDelete = async () => {
        if (confirmName !== org.name) return;
        setLoading(true);
        try {
            await api.deleteAdminOrganization(org.id);
            onDeleted();
        } catch (err: any) {
            alert(err.message ?? "Failed to delete organization.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,24,48,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: S.surface, borderRadius: 16, width: "100%", maxWidth: 420, padding: "1.5rem", boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: S.dangerBg, color: S.danger, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <i className="ti ti-alert-triangle" style={{ fontSize: 22 }} />
                </div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: S.dark }}>Delete organization?</h3>
                <p style={{ margin: "8px 0 16px", fontSize: 13, color: S.textMuted, lineHeight: 1.5 }}>
                    This will permanently delete <strong>{org.name}</strong> and all data. This action cannot be undone.
                </p>

                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: S.dark, marginBottom: 5 }}>
                        Type <strong>{org.name}</strong> to confirm
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
                        Cancel
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
                        {loading ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    return (
        <div style={{
            position: "fixed", bottom: 24, right: 24, left: 24, zIndex: 999,
            maxWidth: 360, marginLeft: "auto",
            background: type === "success"? S.greenBg: S.dangerBg,
            border: `1px solid ${type === "success" ? S.green: S.danger}`,
            color: type === "success"? "#0F6E56": S.danger,
            borderRadius: 10, padding: "12px 18px", fontSize: 13, fontWeight: 500,
            display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
            animation: "slideUp .2s ease",
        }}>
            <i className={`ti ti-${type === "success" ? "check": "alert-circle"}`} style={{ fontSize: 16 }} />
            <span style={{ flex: 1 }}>{msg}</span>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 18 }}>×</button>
        </div>
    );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

export default function OrganizationsPage() {
    const { user } = useAuth();
    const router = useRouter();

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
            setError(err.message ?? "Failed to load organizations.");
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, page]);

    useEffect(() => {
        fetchOrgs();
        fetchPlans();
    }, [fetchOrgs, fetchPlans]);

    useEffect(() => {
        const t = setTimeout(() => { setPage(1); setSearch(searchInput); }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const handleCreated = (org: AdminOrganization) => {
        setShowCreate(false);
        setToast({ msg: `${org.name} created.`, type: "success" });
        fetchOrgs();
    };

    const handleUpdated = (org: AdminOrganization) => {
        setEditingOrg(null);
        setToast({ msg: `${org.name} updated.`, type: "success" });
        fetchOrgs();
    };

    const handleDeleted = () => {
        const name = deletingOrg?.name;
        setDeletingOrg(null);
        setToast({ msg: `${name} deleted.`, type: "success" });
        if (selectedOrgId) setSelectedOrgId(null);
        fetchOrgs();
    };

    const handleToggleStatus = async (org: AdminOrganization) => {
        setActionLoading(org.id);
        try {
            if (org.is_active) {
                await api.suspendAdminOrganization(org.id);
                setToast({ msg: `${org.name} suspended.`, type: "success" });
            } else {
                await api.activateAdminOrganization(org.id);
                setToast({ msg: `${org.name} activated.`, type: "success" });
            }
            setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, is_active: !o.is_active } : o));
        } catch (err: any) {
            setToast({ msg: err.message ?? "Action failed.", type: "error" });
        } finally {
            setActionLoading(null);
        }
    };

    const totalPages = meta?.total_pages ?? 1;

    if (user?.role !== "SUPER_ADMIN") {
        return <div style={{ padding: "2rem", textAlign: "center", color: S.danger, fontWeight: 600 }}>Access Denied</div>;
    }

    if (selectedOrgId) {
        return (
            <div style={{ padding: "1rem" }}>
                <OrganizationDetail organizationId={selectedOrgId} onClose={() => setSelectedOrgId(null)} />
            </div>
        );
    }

    return (
        <div style={{ padding: "1rem", minWidth: 0 }}>
            <ResponsiveStyles />

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
                <div>
                    <p style={{ fontSize: 10, fontWeight: 600, color: S.textMuted, letterSpacing: ".06em", textTransform: "uppercase", margin: "0 0 4px" }}>
                        Platform Administration
                    </p>
                    <h1 style={{ fontSize: "calc(18px + 0.4vw)", fontWeight: 750, color: S.dark, margin: 0 }}>
                        Organizations
                    </h1>
                </div>
                <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 8, border: "none", background: S.purple, color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                    <i className="ti ti-plus" style={{ fontSize: 15 }} />
                    New organization
                </button>
            </div>

            {/* Filters Layout */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ position: "relative", flex: "1 1 240px" }}>
                    <i className="ti ti-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: S.textMuted, fontSize: 15 }} />
                    <input
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        placeholder="Search organizations…"
                        style={{ width: "100%", boxSizing: "border-box", height: 38, padding: "0 12px 0 36px", border: `1.5px solid ${S.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", color: S.dark, outline: "none", background: S.surface }}
                    />
                </div>
                <div style={{ display: "flex", gap: 4, background: S.surface, border: `0.5px solid ${S.border}`, borderRadius: 8, padding: 4, width: "auto", overflowX: "auto" }}>
                    {[
                        { label: "All", value: "" as const },
                        { label: "Active", value: "true" as const },
                        { label: "Suspended", value: "false" as const },
                    ].map(opt => (
                        <button
                            key={opt.label}
                            onClick={() => { setStatusFilter(opt.value); setPage(1); }}
                            style={{
                                padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "inherit",
                                fontSize: 12, fontWeight: 500,
                                background: statusFilter === opt.value ? S.purple : "transparent",
                                color: statusFilter === opt.value ? "#fff" : S.textMuted,
                                transition: "all .15s", whiteSpace: "nowrap"
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Area */}
            {loading ? (
                <TableSkeleton />
            ) : error ? (
                <div style={{ background: S.dangerBg, color: S.danger, padding: "1rem", borderRadius: 8, fontSize: 13 }}>{error}</div>
            ) : orgs.length === 0 ? (
                <div style={{ background: S.surface, borderRadius: 12, border: `0.5px solid ${S.border}`, padding: "3rem 1rem", textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: S.dark }}>No organizations found</p>
                </div>
            ) : (
                <div style={{ background: S.surface, borderRadius: 12, border: `0.5px solid ${S.border}`, overflow: "hidden" }}>
                    
                    {/* Desktop Headers */}
                    <div className="org-header-grid" style={{ borderBottom: `0.5px solid ${S.border}`, fontSize: 11, fontWeight: 600, color: S.textMuted, letterSpacing: ".04em", textTransform: "uppercase" }}>
                        <div>Organization</div>
                        <div>Plan</div>
                        <div>Status</div>
                        <div>Stats</div>
                        <div>Created</div>
                        <div style={{ textAlign: "right" }}>Actions</div>
                    </div>

                    {/* Dynamic Responsive List / Rows */}
                    {orgs.map((org) => (
                        <div
                            key={org.id}
                            onClick={() => setSelectedOrgId(org.id)}
                            className="org-grid"
                            style={{
                                borderBottom: `0.5px solid ${S.border}`, background: S.surface,
                                transition: "background .15s"
                            }}
                        >
                            {/* Organization Metadata */}
                            <div style={{ minWidth: 0, width: "100%" }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: S.dark, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{org.name}</div>
                                <div style={{ fontSize: 12, color: S.textMuted, fontFamily: "monospace", marginTop: 2 }}>{org.slug}</div>
                            </div>

                            {/* Subscription Plan */}
                            <div className="org-responsive-row">
                                <span className="org-cell-label" style={{ display: "none" }}>Plan</span>
                                <PlanPill plan={org.plan} />
                            </div>

                            {/* Active Status */}
                            <div className="org-responsive-row">
                                <span className="org-cell-label" style={{ display: "none" }}>Status</span>
                                <StatusPill active={org.is_active} />
                            </div>

                            {/* Usage Analytics */}
                            <div className="org-responsive-row" style={{ fontSize: 12, color: S.textSecondary }}>
                                <span className="org-cell-label" style={{ display: "none" }}>Usage</span>
                                <div>
                                    Users: <strong>{org.metrics?.total_users ?? 0}</strong>
                                    <span style={{ margin: "0 6px", color: S.border }} className="org-cell-label-inline">|</span> 
                                    Convs: {org.metrics?.total_conversations ?? 0}
                                </div>
                            </div>

                            {/* Timestamp */}
                            <div className="org-responsive-row" style={{ fontSize: 13, color: S.textSecondary }}>
                                <span className="org-cell-label" style={{ display: "none" }}>Created</span>
                                {fmtDate(org.created_at)}
                            </div>

                            {/* Row Action Handles */}
                            <div className="org-actions-wrapper" style={{ display: "flex", gap: 8, justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
                                <button 
                                    onClick={() => handleToggleStatus(org)} 
                                    disabled={actionLoading === org.id}
                                    style={{ padding: "6px 10px", borderRadius: 6, border: `1.5px solid ${S.border}`, background: "transparent", color: org.is_active ? S.danger : S.green, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
                                >
                                    {actionLoading === org.id ? "..." : org.is_active ? "Suspend" : "Activate"}
                                </button>
                                <button 
                                    onClick={() => setEditingOrg(org)} 
                                    style={{ padding: "6px 10px", borderRadius: 6, border: `1.5px solid ${S.border}`, background: "transparent", color: S.textSecondary, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => setDeletingOrg(org)} 
                                    style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: S.dangerBg, color: S.danger, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Pagination Controls Footer */}
                    {totalPages > 1 && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", background: "var(--surface-muted, #fafafa)", gap: 12, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, color: S.textMuted }}>
                                Page {page} of {totalPages}
                            </span>
                            <div style={{ display: "flex", gap: 6 }}>
                                <button 
                                    disabled={page === 1} 
                                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                                    style={{ padding: "6px 12px", borderRadius: 6, border: `1.5px solid ${S.border}`, background: S.surface, color: page === 1 ? S.textMuted : S.textSecondary, fontSize: 12, fontWeight: 500, cursor: "pointer" }}
                                >
                                    Prev
                                </button>
                                <button 
                                    disabled={page === totalPages} 
                                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                                    style={{ padding: "6px 12px", borderRadius: 6, border: `1.5px solid ${S.border}`, background: S.surface, color: page === totalPages ? S.textMuted : S.textSecondary, fontSize: 12, fontWeight: 500, cursor: "pointer" }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Overlays */}
            {showCreate && <CreateOrgModal plans={plans} onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
            {editingOrg && <EditOrgModal org={editingOrg} plans={plans} onClose={() => setEditingOrg(null)} onUpdated={handleUpdated} />}
            {deletingOrg && <DeleteConfirmModal org={deletingOrg} onClose={() => setDeletingOrg(null)} onDeleted={handleDeleted} />}
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
