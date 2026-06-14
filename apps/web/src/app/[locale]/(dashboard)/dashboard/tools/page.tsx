"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { S } from "@/components/ui";

type Tool = {
    id: string;
    name: string;
    description: string;
    method: string;
    path: string;
    isActive: boolean;
    createdAt: string;
    document: { title: string; type: string } | null;
};

const METHOD_COLORS: Record<string, { bg: string; color: string }> = {
    GET: { bg: "#eff6ff", color: "#2563eb" },
    POST: { bg: "#f0fdf4", color: "#16a34a" },
    PUT: { bg: "#fffbeb", color: "#d97706" },
    PATCH: { bg: "#fdf4ff", color: "#9333ea" },
    DELETE: { bg: "#fef2f2", color: "#dc2626" },
};

export default function ToolsPage() {
    const [tools, setTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        api.getAllOrgTools()
            .then((data) => setTools(data.tools))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const handleToggle = async (toolId: string) => {
        setToggling(toolId);
        try {
            const updated = await api.toggleOrgTool(toolId);
            setTools((prev) =>
                prev.map((t) => t.id === toolId ? { ...t, isActive: updated.isActive } : t)
            );
        } catch (e: any) {
            setError(e.message ?? "Failed to toggle tool");
        } finally {
            setToggling(null);
        }
    };

    const active = tools.filter((t) => t.isActive).length;
    const inactive = tools.filter((t) => !t.isActive).length;

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: S.textMuted }}>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <i className="ti ti-loader-2" style={{ fontSize: 24, animation: "spin 1s linear infinite" }} />
            </div>
        );
    }

    return (
        <div style={{ padding: "1.5rem" }}>
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 500, color: S.textMuted, letterSpacing: ".06em", textTransform: "uppercase" }}>
                    API Tools
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                    <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: S.dark }}>Tool Definitions</h1>
                    <div style={{ display: "flex", gap: 8 }}>
                        <Chip label={`${active} enabled`} color="#16a34a" bg="#f0fdf4" />
                        <Chip label={`${inactive} disabled`} color={S.textMuted} bg={S.bg} />
                    </div>
                </div>
            </div>

            {error && (
                <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, color: "#dc2626", marginBottom: 16 }}>
                    {error}
                </div>
            )}

            {tools.length === 0 ? (
                <div style={{
                    background: "#fff", border: `0.5px solid ${S.border}`, borderRadius: 12,
                    padding: "3rem", textAlign: "center",
                }}>
                    <i className="ti ti-plug-off" style={{ fontSize: 32, color: S.textMuted, display: "block", marginBottom: 12 }} />
                    <p style={{ margin: 0, fontSize: 13, color: S.textMuted }}>No tools extracted yet.</p>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: S.textMuted }}>
                        Go to Knowledge Base → connect your API → submit a Swagger URL to extract tools.
                    </p>
                </div>
            ) : (
                <div style={{ background: "#fff", border: `0.5px solid ${S.border}`, borderRadius: 12, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${S.border}`, background: S.bg }}>
                                {["Method", "Name", "Path", "Source Document", "Description", "Status", ""].map((h) => (
                                    <th key={h} style={{
                                        textAlign: "left", padding: "10px 14px",
                                        fontSize: 10, fontWeight: 600, color: S.textMuted,
                                        letterSpacing: ".05em", textTransform: "uppercase",
                                    }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tools.map((tool) => {
                                const mc = METHOD_COLORS[tool.method] ?? { bg: "#f3f4f6", color: "#6b7280" };
                                const isToggling = toggling === tool.id;
                                return (
                                    <tr key={tool.id} style={{ borderBottom: `0.5px solid ${S.border}` }}>
                                        {/* Method */}
                                        <td style={{ padding: "12px 14px" }}>
                                            <span style={{
                                                display: "inline-block", padding: "2px 8px", borderRadius: 4,
                                                fontSize: 10, fontWeight: 700, letterSpacing: ".04em",
                                                background: mc.bg, color: mc.color,
                                            }}>
                                                {tool.method}
                                            </span>
                                        </td>
                                        {/* Name */}
                                        <td style={{ padding: "12px 14px", color: S.dark, fontWeight: 500, maxWidth: 160 }}>
                                            <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {tool.name}
                                            </span>
                                        </td>
                                        {/* Path */}
                                        <td style={{ padding: "12px 14px", color: S.textMuted, fontFamily: "monospace", fontSize: 11, maxWidth: 200 }}>
                                            <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {tool.path}
                                            </span>
                                        </td>
                                        {/* Source */}
                                        <td style={{ padding: "12px 14px", color: S.textMuted, maxWidth: 140 }}>
                                            <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {tool.document?.title ?? "—"}
                                            </span>
                                        </td>
                                        {/* Description */}
                                        <td style={{ padding: "12px 14px", color: S.textMuted, maxWidth: 220 }}>
                                            <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {tool.description || "—"}
                                            </span>
                                        </td>
                                        {/* Status badge */}
                                        <td style={{ padding: "12px 14px" }}>
                                            <span style={{
                                                display: "inline-block", padding: "2px 8px", borderRadius: 10,
                                                fontSize: 10, fontWeight: 600,
                                                background: tool.isActive ? "#f0fdf4" : S.bg,
                                                color: tool.isActive ? "#16a34a" : S.textMuted,
                                            }}>
                                                {tool.isActive ? "Enabled" : "Disabled"}
                                            </span>
                                        </td>
                                        {/* Toggle */}
                                        <td style={{ padding: "12px 14px" }}>
                                            <button
                                                onClick={() => handleToggle(tool.id)}
                                                disabled={isToggling}
                                                style={{
                                                    padding: "5px 12px", borderRadius: 6, fontSize: 11,
                                                    fontWeight: 500, cursor: isToggling ? "not-allowed" : "pointer",
                                                    border: `1px solid ${tool.isActive ? "#fecaca" : S.purple}`,
                                                    background: tool.isActive ? "#fef2f2" : S.purpleBg,
                                                    color: tool.isActive ? "#dc2626" : S.purple,
                                                    transition: "all .15s", whiteSpace: "nowrap",
                                                }}
                                            >
                                                {isToggling ? "…" : tool.isActive ? "Disable" : "Enable"}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function Chip({ label, color, bg }: { label: string; color: string; bg: string }) {
    return (
        <span style={{
            padding: "4px 10px", borderRadius: 20, fontSize: 11,
            fontWeight: 500, background: bg, color,
        }}>
            {label}
        </span>
    );
}