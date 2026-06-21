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
    isPublic?: boolean;
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
    const [allTools, setAllTools] = useState<Tool[]>([]);
    const [publicTools, setPublicTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);
    const [movingVisibility, setMovingVisibility] = useState<string | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        Promise.all([api.getAllOrgTools(), api.getPublicOrgTools()])
            .then(([allData, publicData]) => {
                setAllTools(allData.tools);
                setPublicTools(publicData.tools);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const handleToggle = async (toolId: string) => {
        setToggling(toolId);
        try {
            const updated = await api.toggleOrgTool(toolId);
            setAllTools((prev) => prev.map((t) => t.id === toolId ? { ...t, isActive: updated.isActive } : t));
            setPublicTools((prev) => prev.map((t) => t.id === toolId ? { ...t, isActive: updated.isActive } : t));
        } catch (e: any) {
            setError(e.message ?? "Failed to toggle tool");
        } finally {
            setToggling(null);
        }
    };

    const handleVisibilityToggle = async (tool: Tool) => {
        setMovingVisibility(tool.id);
        try {
            const updated = await api.toggleToolVisibility(tool.id);
            if (updated.isPublic) {
                setAllTools((prev) => prev.filter((t) => t.id !== tool.id));
                setPublicTools((prev) => [...prev, { ...tool, isPublic: true }]);
            } else {
                setPublicTools((prev) => prev.filter((t) => t.id !== tool.id));
                setAllTools((prev) => [...prev, { ...tool, isPublic: false }]);
            }
        } catch (e: any) {
            setError(e.message ?? "Failed to update tool visibility");
        } finally {
            setMovingVisibility(null);
        }
    };

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: S.textMuted }}>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <i className="ti ti-loader-2" style={{ fontSize: 24, animation: "spin 1s linear infinite" }} />
            </div>
        );
    }

    return (
        // Adjusted layout container spacing to use fluid padding utilities
        <div style={{ padding: "clamp(1rem, 3vw, 1.5rem)" }}>
            {error && (
                <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, color: "#dc2626", marginBottom: 16 }}>
                    {error}
                </div>
            )}

            <ToolSection
                title="All Tools"
                subtitle="API endpoints extracted from your documentation"
                tools={allTools}
                toggling={toggling}
                movingVisibility={movingVisibility}
                onToggleActive={handleToggle}
                onToggleVisibility={handleVisibilityToggle}
                visibilityAction="public"
                emptyIcon="ti-plug-off"
                emptyText="No tools extracted yet."
                emptySubtext="Go to Knowledge Base → connect your API → submit a Swagger URL to extract tools."
            />

            <div style={{ height: 28 }} />

            <ToolSection
                title="Public Tools"
                subtitle="Visible to the AI agent for proactively answering customer questions (e.g. product lookups)"
                tools={publicTools}
                toggling={toggling}
                movingVisibility={movingVisibility}
                onToggleActive={handleToggle}
                onToggleVisibility={handleVisibilityToggle}
                visibilityAction="private"
                emptyIcon="ti-world-off"
                emptyText="No public tools yet."
                emptySubtext="Mark a tool as public from the All Tools table to make it available here."
            />
        </div>
    );
}

function ToolSection({
    title,
    subtitle,
    tools,
    toggling,
    movingVisibility,
    onToggleActive,
    onToggleVisibility,
    visibilityAction,
    emptyIcon,
    emptyText,
    emptySubtext,
}: {
    title: string;
    subtitle: string;
    tools: Tool[];
    toggling: string | null;
    movingVisibility: string | null;
    onToggleActive: (toolId: string) => void;
    onToggleVisibility: (tool: Tool) => void;
    visibilityAction: "public" | "private";
    emptyIcon: string;
    emptyText: string;
    emptySubtext: string;
}) {
    const active = tools.filter((t) => t.isActive).length;
    const inactive = tools.filter((t) => !t.isActive).length;

    return (
        <div>
            <div style={{ marginBottom: 12 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 500, color: S.textMuted, letterSpacing: ".06em", textTransform: "uppercase" }}>
                    {subtitle}
                </p>
                {/* Changed layout container header to wrap beautifully on small devices */}
                <div style={{ display: "flex", alignItems: "sm-center", justifyContent: "space-between", marginTop: 4, flexWrap: "wrap", gap: 12 }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: S.dark }}>{title}</h2>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Chip label={`${active} enabled`} color="#16a34a" bg="#f0fdf4" />
                        <Chip label={`${inactive} disabled`} color={S.textMuted} bg={S.bg} />
                    </div>
                </div>
            </div>

            {tools.length === 0 ? (
                <div style={{
                    background: S.surface, border: `0.5px solid ${S.border}`, borderRadius: 12,
                    padding: "clamp(1.5rem, 5vw, 3rem)", textAlign: "center",
                }}>
                    <i className={`ti ${emptyIcon}`} style={{ fontSize: 32, color: S.textMuted, display: "block", marginBottom: 12 }} />
                    <p style={{ margin: 0, fontSize: 13, color: S.textMuted }}>{emptyText}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: S.textMuted }}>{emptySubtext}</p>
                </div>
            ) : (
                /* Main layout wrapper constraint for scrolling tables safely */
                <div style={{ background: S.bgSoft, border: `0.5px solid ${S.border}`, borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ overflowX: "auto", width: "100%", WebkitOverflowScrolling: "touch" }}>
                        <table style={{ width: "100%", minWidth: 800, borderCollapse: "collapse", fontSize: 12 }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${S.border}`, background: S.bg }}>
                                    {["Method", "Name", "Path", "Source Document", "Description", "Status", "", ""].map((h, i) => (
                                        <th key={`${h}-${i}`} style={{
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
                                    const isMoving = movingVisibility === tool.id;
                                    return (
                                        <tr key={tool.id} style={{ borderBottom: `0.5px solid ${S.border}` }}>
                                            <td style={{ padding: "12px 14px" }}>
                                                <span style={{
                                                    display: "inline-block", padding: "2px 8px", borderRadius: 4,
                                                    fontSize: 10, fontWeight: 700, letterSpacing: ".04em",
                                                    background: mc.bg, color: mc.color,
                                                }}>
                                                    {tool.method}
                                                </span>
                                            </td>
                                            <td style={{ padding: "12px 14px", color: S.textMuted, fontWeight: 500, maxWidth: 160 }}>
                                                <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {tool.name}
                                                </span>
                                            </td>
                                            <td style={{ padding: "12px 14px", color: S.textMuted, fontFamily: "monospace", fontSize: 11, maxWidth: 200 }}>
                                                <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {tool.path}
                                                </span>
                                            </td>
                                            <td style={{ padding: "12px 14px", color: S.textMuted, maxWidth: 140 }}>
                                                <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {tool.document?.title ?? "Swagger"}
                                                </span>
                                            </td>
                                            <td style={{ padding: "12px 14px", color: S.textMuted, maxWidth: 220 }}>
                                                <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {tool.description || "—"}
                                                </span>
                                            </td>
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
                                            <td style={{ padding: "12px 14px" }}>
                                                <button
                                                    onClick={() => onToggleActive(tool.id)}
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
                                            <td style={{ padding: "12px 14px" }}>
                                                <button
                                                    onClick={() => onToggleVisibility(tool)}
                                                    disabled={isMoving}
                                                    style={{
                                                        padding: "5px 12px", borderRadius: 6, fontSize: 11,
                                                        fontWeight: 500, cursor: isMoving ? "not-allowed" : "pointer",
                                                        border: `1px solid ${visibilityAction === "public" ? "#bfdbfe" : S.border}`,
                                                        background: visibilityAction === "public" ? "#eff6ff" : S.bg,
                                                        color: visibilityAction === "public" ? "#2563eb" : S.textMuted,
                                                        transition: "all .15s", whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {isMoving ? "…" : visibilityAction === "public" ? "Make Public" : "Make Private"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function Chip({ label, color, bg }: { label: string; color: string; bg: string }) {
    return (
        <span style={{
            padding: "4px 10px", borderRadius: 20, fontSize: 11,
            fontWeight: 500, background: bg, color, whitespace: "nowrap"
        }}>
            {label}
        </span>
    );
}
