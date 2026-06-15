"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { api } from "@/lib/api";
import { S } from "@/components/ui";
import { OrganizationDetail } from "@/components/admin-dashboard/OrganizationDetail";
import type {
    AdminOrganizationsResponse,
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

function OrganizationsSkeleton() {
    const ROWS = 6;
    const COLS = ["30%", "22%", "12%", "8%", "8%", "8%"];

    return (
        <div style={{ padding: "1.5rem", minWidth: 0 }}>
            <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>

            {/* Page header skeleton */}
            <div style={{ marginBottom: 24 }}>
                <Shimmer width={150} height={11} radius={4} />
                <div style={{ marginTop: 8 }}>
                    <Shimmer width={320} height={28} radius={6} />
                </div>
            </div>

            <section
                style={{
                    background: S.surface,
                    border: `0.5px solid ${S.border}`,
                    borderRadius: 12,
                    padding: "1.5rem",
                    minWidth: 0,
                }}
            >
                {/* Table header row */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 20,
                    }}
                >
                    <Shimmer width={220} height={20} radius={6} />
                    <Shimmer width={210} height={36} radius={8} />
                </div>

                {/* Table */}
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                        <thead>
                            <tr>
                                {["Organization", "Admin Email", "Status", "Users", "Tickets", "Escalated"].map((h) => (
                                    <th key={h} style={headerStyle}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: ROWS }).map((_, rowIdx) => (
                                <tr key={rowIdx}>
                                    {/* Organization col — two lines */}
                                    <td style={cellStyle}>
                                        <Shimmer width="60%" height={13} radius={4} />
                                        <div style={{ marginTop: 5 }}>
                                            <Shimmer width="40%" height={10} radius={4} />
                                        </div>
                                    </td>
                                    {/* Remaining cols */}
                                    {COLS.slice(1).map((w, colIdx) => (
                                        <td key={colIdx} style={cellStyle}>
                                            <Shimmer width={w} height={13} radius={4} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

// ─── STATUS / ROLE PILLS ──────────────────────────────────────────────────────
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
            <i className={`ti ti-${active ? "circle-check" : "circle-x"}`} style={{ fontSize: 13 }} />
            {active ? "Active" : "Suspended"}
        </span>
    );
}

function formatNumber(value: number | undefined) {
    return (value ?? 0).toLocaleString();
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function OrganizationsPage() {
    const [selectedorganizationId, setSelectedorganizationId] = useState<string | null>(null);
    const [orgs, setOrgs] = useState<AdminOrganizationsResponse | null>(null);
    const [search, setSearch] = useState("");
    const [debouncedSearch] = useDebounce(search, 500);
    const [activeFilter] = useState<ActiveFilter>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let ignore = false;
        setLoading(true);

        const fetchData = async () => {
            try {
                const data = await api.getAdminOrganizations({
                    search: debouncedSearch,
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
    }, [activeFilter, debouncedSearch]);

    if (loading && !orgs) {
        return <OrganizationsSkeleton />;
    }

    const renderOrganizations = () => (
        <section
            style={{
                background: S.surface,
                border: `0.5px solid ${S.border}`,
                borderRadius: 12,
                padding: "1.5rem",
                minWidth: 0,
            }}
        >
            {/* Header */}
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

            {/* Table */}
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
                                onClick={() => setSelectedorganizationId(org.id)}
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
                                    <span style={{
                                        color: org.stats.escalated_tickets > 0 ? S.danger : S.textSecondary,
                                        fontWeight: org.stats.escalated_tickets > 0 ? 600 : 400,
                                    }}>
                                        {formatNumber(org.stats.escalated_tickets)}
                                    </span>
                                </td>
                            </tr>
                        ))}

                        {/* Empty state */}
                        {!loading && orgs?.data.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ ...cellStyle, textAlign: "center", padding: "2.5rem", color: S.textMuted }}>
                                    <i className="ti ti-building-off" style={{ fontSize: 28, display: "block", marginBottom: 8 }} />
                                    No organizations found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );

    return (
        <div style={{ padding: "1.5rem", minWidth: 0 }}>
            {selectedorganizationId ? (
                <OrganizationDetail
                    organizationId={selectedorganizationId}
                    onClose={() => setSelectedorganizationId(null)}
                />
            ) : (
                <>
                    {/* Page header */}
                    <div style={{ marginBottom: 24 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: S.textMuted, letterSpacing: ".06em", textTransform: "uppercase", margin: "0 0 4px" }}>
                            Platform Administration
                        </p>
                        <h1 style={{ fontSize: 24, fontWeight: 750, color: S.dark, margin: 0 }}>
                            Organizations Management
                        </h1>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{ background: S.dangerBg, color: S.danger, borderRadius: 8, padding: "12px", fontSize: 13, marginBottom: 14 }}>
                            {error}
                        </div>
                    )}

                    {/* Table after */}
                    {renderOrganizations()}
                </>
            )}
        </div>
    );
}
