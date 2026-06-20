"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { S } from "@/components/ui";
import type { AdminOverview, AdminOrganization, AdminPlan } from "@/types/types";
import { OrganizationDetail } from "@/components/admin-dashboard/OrganizationDetail";
import { Trans, useLingui } from "@lingui/react/macro";

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
    <div className="stat-card" style={{
      background: S.surface,
      borderRadius: 16,
      padding: "1.5rem",
      border: `1px solid ${S.border}`,
      boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: `linear-gradient(135deg, ${color}15, ${color}05)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid ${color}20`
        }}>
          <i className={`ti ti-${icon}`} style={{ fontSize: 20, color }} />
        </div>
        <span style={{ fontSize: 13, color: S.textMuted, fontWeight: 600, letterSpacing: "0.01em" }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: S.dark, letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{
        position: "absolute",
        right: -10,
        bottom: -10,
        fontSize: 80,
        opacity: 0.03,
        color,
        pointerEvents: "none"
      }}>
        <i className={`ti ti-${icon}`} />
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div style={{ padding: "1.5rem", minWidth: 0 }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ marginBottom: 32 }}>
        <Shimmer width={150} height={14} radius={4} />
        <div style={{ marginTop: 12 }}><Shimmer width={400} height={32} radius={8} /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 32 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ background: S.surface, borderRadius: 16, padding: "1.5rem", border: `1px solid ${S.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <Shimmer width={42} height={42} radius={12} /><Shimmer width={120} height={16} radius={4} />
            </div>
            <Shimmer width="50%" height={28} radius={6} />
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewTab() {
 const { t } = useLingui(); 
  const [stats, setStats] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getAdminOverview()
      .then(setStats)
      .catch((err) => setError(err.message || t`Failed to load overview stats`))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) return <OverviewSkeleton />;
  if (error) return <div style={{ padding: "1.5rem" }}><div style={{ background: S.dangerBg, color: S.danger, padding: "1rem", borderRadius: 8, fontSize: 14 }}>{error}</div></div>;
  if (!stats) return null;

  const today = new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ padding: "2rem 1.5rem", minWidth: 0, animation: "fadeIn .5s cubic-bezier(0.4, 0, 0.2, 1)" }}>
      <div style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: S.purple, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              <Trans>Dashboard</Trans>
            </span>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: S.border }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: S.textMuted }}>{today}</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 850, color: S.dark, margin: 0, letterSpacing: "-0.03em" }}>
            <Trans>Welcome back, Super Admin</Trans>
          </h1>
        </div>
        <div className="header-performance" style={{ background: S.surface, padding: "12px 20px", borderRadius: 14, border: `1px solid ${S.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: S.textMuted, letterSpacing: ".06em", textTransform: "uppercase", margin: "0 0 6px" }}>
            <Trans>Platform Status</Trans>
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: S.green, boxShadow: `0 0 12px ${S.green}60`, animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: S.dark }}>
              <Trans>All Systems Operational</Trans>
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginBottom: 40 }}>
        <StatCard label={t`Total Organizations`} value={stats.total_organizations} icon="building" color={S.purple} />
        <StatCard label={t`Active Organizations`} value={stats.active_organizations} icon="building-check" color={S.green} />
        <StatCard label={t`Total Users`} value={stats.total_users} icon="users" color={S.brand} />
        <StatCard label={t`Total Conversations`} value={stats.total_conversations.toLocaleString()} icon="message-2" color={S.brand} />
        <StatCard label={t`Total Tickets`} value={stats.total_tickets.toLocaleString()} icon="ticket" color={S.purple} />
        <StatCard label={t`Escalated Tickets`} value={stats.escalated_tickets} icon="alert-circle" color={S.danger} />
      </div>

      <style>{`
        .stat-card:hover { transform: translateY(-4px); boxShadow: 0 12px 24px rgba(0,0,0,0.06); border-color: ${S.purple}40; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }
        @media (max-width: 600px) {
          .header-performance { width: 100%; text-align: left; }
        }
      `}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ORGANIZATIONS TAB
// ════════════════════════════════════════════════════════════════════════════

function StatusPill({ active }: { active: boolean }) {
  return (
    <span style={{
      fontSize: 12,
      fontWeight: 700,
      padding: "4px 12px",
      borderRadius: 10,
      background: active ? S.greenBg : S.dangerBg,
      color: active ? "#0F6E56" : S.danger,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      border: `1px solid ${active ? S.green : S.danger}20`
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? S.green : S.danger }} />
      {active ? <Trans>Active</Trans> : <Trans>Suspended</Trans>}
    </span>
  );
}

function PlanPill({ plan }: { plan: AdminPlan | null }) {
  if (!plan) return <span style={{ fontSize: 12, color: S.textMuted }}><Trans>No plan</Trans></span>;
  return (
    <span style={{
      fontSize: 12,
      fontWeight: 700,
      padding: "4px 12px",
      borderRadius: 10,
      background: S.purpleBg,
      color: S.purple,
      border: `1px solid ${S.purple}20`
    }}>{plan.name}</span>
  );
}

function OrganizationsTab() {
  const { t } = useLingui();
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
        limit: 20
      });
      setOrgs(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchOrgs, 300);
    return () => clearTimeout(timer);
  }, [fetchOrgs]);

  if (selectedOrgId) {
    return (
      <div className="org-detail-container" style={{ animation: "fadeIn .4s cubic-bezier(0.4, 0, 0.2, 1)" }}>
        <OrganizationDetail organizationId={selectedOrgId} onClose={() => setSelectedOrgId(null)} />
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem 1.5rem", animation: "fadeIn .4s cubic-bezier(0.4, 0, 0.2, 1)" }}>
      <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 300 }}>
          <i className="ti ti-search" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: S.textMuted, fontSize: 18 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t`Search organizations by name or slug...`}
            style={{
              width: "100%",
              height: 48,
              padding: "0 16px 0 48px",
              border: `1.5px solid ${S.border}`,
              borderRadius: 14,
              fontSize: 15,
              outline: "none",
              background: S.surface,
              boxSizing: "border-box",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0,0,0,0.01)"
            }}
            className="search-input"
          />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            style={{
              height: 48,
              padding: "0 16px",
              border: `1.5px solid ${S.border}`,
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 600,
              outline: "none",
              background: S.surface,
              cursor: "pointer",
              color: S.dark
            }}
          >
            <option value=""><Trans>All Status</Trans></option>
            <option value="true"><Trans>Active</Trans></option>
            <option value="false"><Trans>Suspended</Trans></option>
          </select>
        </div>
      </div>

      <div className="org-table-container" style={{ background: S.surface, borderRadius: 20, border: `1px solid ${S.border}`, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.04)" }}>
        <div className="org-header" style={{
          display: "grid",
          gridTemplateColumns: "2.5fr 1fr 1fr 1.2fr 0.5fr",
          gap: 16,
          padding: "18px 28px",
          borderBottom: `1px solid ${S.border}`,
          fontSize: 11,
          fontWeight: 800,
          color: S.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          background: S.bgSoft
        }}>
          <div><Trans>Organization</Trans></div>
          <div><Trans>Plan</Trans></div>
          <div><Trans>Status</Trans></div>
          <div><Trans>Joined Date</Trans></div>
          <div style={{ textAlign: "right" }}><Trans>Actions</Trans></div>
        </div>

        {loading ? (
          <div style={{ padding: "6rem", textAlign: "center", color: S.textMuted }}>
            <i className="ti ti-loader-2" style={{ fontSize: 32, animation: "spin 1s linear infinite" }} />
          </div>
        ) : orgs.length === 0 ? (
          <div style={{ padding: "6rem", textAlign: "center", color: S.textMuted, fontSize: 15 }}>
            <i className="ti ti-building-off" style={{ fontSize: 48, display: "block", marginBottom: 16, opacity: 0.3 }} />
            <Trans>No organizations match your search.</Trans>
          </div>
        ) : (
          orgs.map((org) => (
            <div key={org.id} onClick={() => setSelectedOrgId(org.id)} className="org-row" style={{
              display: "grid",
              gridTemplateColumns: "2.5fr 1fr 1fr 1.2fr 0.5fr",
              gap: 16,
              padding: "20px 28px",
              alignItems: "center",
              cursor: "pointer",
              borderBottom: `1px solid ${S.border}`,
              transition: "all 0.2s ease"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: `linear-gradient(135deg, ${S.purpleBg}, #f5f3ff)`,
                  color: S.purple,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  flexShrink: 0,
                  border: `1px solid ${S.purple}15`,
                  fontSize: 18
                }}>
                  {org.name[0].toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 750, color: S.dark, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 2 }}>{org.name}</div>
                  <div style={{ fontSize: 13, color: S.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 }}>{org.slug}</div>
                </div>
              </div>
              <div><PlanPill plan={org.plan} /></div>
              <div><StatusPill active={org.is_active} /></div>
              <div style={{ fontSize: 14, color: S.textMuted, fontWeight: 500 }}>{fmtDate(org.created_at)}</div>
              <div style={{ textAlign: "right" }}><i className="ti ti-chevron-right" style={{ color: S.textMuted, fontSize: 20, opacity: 0.5 }} /></div>
            </div>
          ))
        )}
      </div>

      {/* Mobile Card Layout */}
      <div className="org-cards-mobile" style={{ display: "none", flexDirection: "column", gap: 20 }}>
        {loading ? (
          <div style={{ padding: "4rem", textAlign: "center" }}>
            <i className="ti ti-loader-2" style={{ fontSize: 32, animation: "spin 1s linear infinite" }} />
          </div>
        ) : orgs.map(org => (
          <div key={org.id} onClick={() => setSelectedOrgId(org.id)} style={{
            background: S.surface,
            borderRadius: 20,
            border: `1px solid ${S.border}`,
            padding: 24,
            boxShadow: "0 6px 16px rgba(0,0,0,0.04)",
            transition: "transform 0.2s ease"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: `linear-gradient(135deg, ${S.purpleBg}, #f5f3ff)`,
                color: S.purple,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 22,
                border: `1px solid ${S.purple}15`
              }}>
                {org.name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, color: S.dark, fontSize: 18, marginBottom: 2 }}>{org.name}</div>
                <div style={{ fontSize: 14, color: S.textMuted }}>{org.slug}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 11, color: S.textMuted, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 6 }}>
                  <Trans>Status</Trans>
                </div>
                <StatusPill active={org.is_active} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: S.textMuted, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 6 }}>
                  <Trans>Plan</Trans>
                </div>
                <PlanPill plan={org.plan} />
              </div>
            </div>

            <button style={{
              background: S.purple,
              color: "#fff",
              border: "none",
              width: "100%",
              padding: "14px",
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 750,
              cursor: "pointer",
              boxShadow: `0 4px 12px ${S.purple}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8
            }}>
              <Trans>View Organization Details</Trans>
              <i className="ti ti-arrow-right" style={{ fontSize: 16 }} />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        .org-row:hover { background: ${S.bgSoft}; }
        .search-input:focus { border-color: ${S.purple}60; box-shadow: 0 0 0 4px ${S.purple}10; }
        @media (max-width: 950px) {
          .org-table-container { display: none; }
          .org-cards-mobile { display: flex; }
        }
      `}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN ADMIN DASHBOARD EXPORT
// ════════════════════════════════════════════════════════════════════════════

type TabType = "overview" | "organizations";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  return (
    <div style={{ background: S.bgSoft, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ background: S.surface, borderBottom: `1px solid ${S.border}`, padding: "0 1.5rem", display: "flex", gap: 24 }}>
        <button
          onClick={() => setActiveTab("overview")}
          style={{
            padding: "1rem 0",
            background: "none",
            border: "none",
            borderBottom: activeTab === "overview" ? `2px solid ${S.purple}` : "2px solid transparent",
            color: activeTab === "overview" ? S.dark : S.textMuted,
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          <Trans>Overview</Trans>
        </button>
        <button
          onClick={() => setActiveTab("organizations")}
          style={{
            padding: "1rem 0",
            background: "none",
            border: "none",
            borderBottom: activeTab === "organizations" ? `2px solid ${S.purple}` : "2px solid transparent",
            color: activeTab === "organizations" ? S.dark : S.textMuted,
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          <Trans>Organizations</Trans>
        </button>
      </div>

      <div style={{ flex: 1 }}>
        {activeTab === "overview" ? <OverviewTab /> : <OrganizationsTab />}
      </div>
    </div>
  );
}