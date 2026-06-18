"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/auth-context";

// ─── THEME TOKENS ──────────────────────────────────────────────────────────
const T = {
  surface: "var(--surface,    #ffffff)",
  surfaceSub: "var(--surface-sub, #f9f8ff)",
  pageBg: "var(--page-bg,    #f4f3fb)",
  brandFaint: "var(--color-brand-faint, #eeecfb)",
  text: "var(--page-text,  #1a1830)",
  muted: "var(--page-muted, #6b6a80)",
  brand: "var(--color-brand,       #534AB7)",
  brandLight: "var(--color-brand-light, #7F77DD)",
  danger: "var(--color-danger,  #E24B4A)",
  success: "var(--color-success, #0F6E56)",
  border: "var(--card-border,   rgba(0,0,0,0.09))",
} as const;

// ─── TYPES (inline so page is self-contained — matches api.ts types) ──────────
type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";
type TicketPriority = "LOW" | "MEDIUM" | "HIGH";

interface AssignedTo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Ticket {
  id: string;
  conversationId: string;
  organizationId: string;
  assignedToId: string | null;
  assignedTo: AssignedTo | null;
  status: TicketStatus;
  priority: TicketPriority;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  role: "customer" | "ai" | "human_agent";
  content: string;
  tier: "tier1" | "tier2" | null;
  createdAt: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

function normalizeApiBaseUrl(rawBaseUrl?: string) {
  const fallback =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
  const base = (rawBaseUrl ?? fallback).trim().replace(/\/+$/, "");
  return /\/api\/v1$/i.test(base) ? base : `${base}/api/v1`;
}

const BASE_URL = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE,
);

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

// Priority badge styles use theme tokens directly (inline) instead of hardcoded Tailwind hex classes
const PRIORITY_STYLES: Record<
  TicketPriority,
  { bg: string; color: string; border: string }
> = {
  HIGH: {
    bg: "color-mix(in srgb, var(--color-danger, #E24B4A) 12%, transparent)",
    color: T.danger,
    border: "color-mix(in srgb, var(--color-danger, #E24B4A) 30%, transparent)",
  },
  MEDIUM: {
    bg: "color-mix(in srgb, #d97706 12%, transparent)",
    color: "#d97706",
    border: "color-mix(in srgb, #d97706 30%, transparent)",
  },
  LOW: {
    bg: "color-mix(in srgb, var(--color-success, #0F6E56) 12%, transparent)",
    color: T.success,
    border:
      "color-mix(in srgb, var(--color-success, #0F6E56) 30%, transparent)",
  },
};

const STATUS_STYLES: Record<TicketStatus, { bg: string; color: string }> = {
  OPEN: { bg: T.brandFaint, color: T.brand },
  IN_PROGRESS: {
    bg: "color-mix(in srgb, #d97706 12%, transparent)",
    color: "#d97706",
  },
  RESOLVED: {
    bg: "color-mix(in srgb, var(--color-success, #0F6E56) 12%, transparent)",
    color: T.success,
  },
};

const STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── API CALLS ────────────────────────────────────────────────────────────────
async function apiGetTickets(filters?: {
  status?: TicketStatus;
  page?: number;
  limit?: number;
}): Promise<{ tickets: Ticket[]; meta: Meta }> {
  const qs = new URLSearchParams();
  if (filters?.status) qs.set("status", filters.status);
  if (filters?.page) qs.set("page", String(filters.page));
  qs.set("limit", String(filters?.limit ?? 50));
  const res = await fetch(`${BASE_URL}/tickets?${qs}`, {
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? "Failed to fetch tickets");
  return json.data;
}

async function apiGetMessages(conversationId: string): Promise<Message[]> {
  const res = await fetch(
    `${BASE_URL}/widget/conversations/${conversationId}/messages`,
    {
      credentials: "include",
    },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? "Failed to fetch messages");
  return json.data?.messages ?? json.data ?? [];
}

async function apiStart(id: string): Promise<Ticket> {
  const res = await fetch(`${BASE_URL}/tickets/${id}/start`, {
    method: "PATCH",
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? "Failed");
  return json.data?.ticket ?? json.data;
}

async function apiResolve(id: string, note: string): Promise<Ticket> {
  const res = await fetch(`${BASE_URL}/tickets/${id}/resolve`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resolutionNote: note }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? "Failed");
  return json.data?.ticket ?? json.data;
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function PriorityBadge({ p }: { p: TicketPriority }) {
  const s = PRIORITY_STYLES[p];
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
      style={{ backgroundColor: s.bg, color: s.color, borderColor: s.border }}
    >
      {PRIORITY_LABEL[p]}
    </span>
  );
}

function StatusBadge({ s }: { s: TicketStatus }) {
  const style = STATUS_STYLES[s];
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {STATUS_LABEL[s]}
    </span>
  );
}

// ─── TICKET LIST ITEM ─────────────────────────────────────────────────────────
function TicketRow({
  ticket,
  selected,
  onClick,
}: {
  ticket: Ticket;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3.5 border-b transition-all duration-150 group"
      style={{
        borderBottomColor: T.border,
        backgroundColor: selected ? T.surfaceSub : "transparent",
        borderLeft: `2px solid ${selected ? T.brand : "transparent"}`,
      }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.backgroundColor = T.surfaceSub;
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
            style={{ backgroundColor: T.brandFaint, color: T.brand }}
          >
            {ticket.assignedTo
              ? `${ticket.assignedTo.firstName[0]}${ticket.assignedTo.lastName[0]}`
              : "?"}
          </div>
          <span
            className="text-[13px] font-semibold truncate"
            style={{ color: T.text }}
          >
            Ticket #{ticket.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
        <span className="text-[11px] shrink-0" style={{ color: T.muted }}>
          {timeAgo(ticket.createdAt)}
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mt-1">
        <StatusBadge s={ticket.status} />
        <PriorityBadge p={ticket.priority} />
        {ticket.assignedTo && (
          <span className="text-[10px]" style={{ color: T.muted }}>
            → {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
          </span>
        )}
      </div>

      <p
        className="text-[12px] mt-1.5 line-clamp-1 leading-relaxed"
        style={{ color: T.muted }}
      >
        Conv: {ticket.conversationId.slice(0, 16)}…
      </p>
    </button>
  );
}

// ─── RESOLVE MODAL ────────────────────────────────────────────────────────────
function ResolveModal({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: (note: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [note, setNote] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm px-0 sm:px-4">
      <div
        className="rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 sm:p-7 w-full sm:max-w-[420px]"
        style={{ backgroundColor: T.surface }}
      >
        <h3 className="text-base font-bold mb-1" style={{ color: T.text }}>
          Resolve ticket
        </h3>
        <p className="text-[13px] mb-4" style={{ color: T.muted }}>
          Add a resolution note (optional but recommended).
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Describe what was done to resolve this issue…"
          rows={3}
          className="w-full text-sm px-3.5 py-2.5 rounded-xl outline-none resize-none transition-colors"
          style={{
            backgroundColor: T.surface,
            color: T.text,
            border: `1.5px solid ${T.border}`,
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = T.brand)}
          onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
        />
        <div className="flex gap-2 mt-4 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg transition-colors"
            style={{ color: T.muted }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = T.surfaceSub)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(note)}
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold rounded-lg disabled:opacity-60 transition-colors"
            style={{ backgroundColor: T.success, color: "#ffffff" }}
          >
            {loading ? "Resolving…" : "Mark resolved"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TICKET DETAIL ────────────────────────────────────────────────────────────
function TicketDetail({
  ticket,
  onUpdated,
  onBack,
}: {
  ticket: Ticket;
  onUpdated: (t: Ticket) => void;
  onBack?: () => void;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showResolve, setShowResolve] = useState(false);
  const [toast, setToast] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isCurrent = true;

    const loadMessages = async () => {
      setMsgLoading(true);
      try {
        const data = await apiGetMessages(ticket.conversationId);
        if (isCurrent) setMessages(data);
      } catch {
        if (isCurrent) setMessages([]);
      } finally {
        if (isCurrent) setMsgLoading(false);
      }
    };

    loadMessages();

    return () => {
      isCurrent = false;
    };
  }, [ticket.conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleStart = async () => {
    setActionLoading(true);
    try {
      const updated = await apiStart(ticket.id);
      onUpdated(updated);
      showToast("Ticket claimed — status set to In Progress");
    } catch (e) {
      if (e instanceof Error) {
        setToast("Error: " + e.message);
      } else {
        setToast("An unexpected error occurred.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async (note: string) => {
    setActionLoading(true);
    try {
      const updated = await apiResolve(ticket.id, note);
      onUpdated(updated);
      setShowResolve(false);
      showToast("Ticket resolved ✓");
    } catch (e) {
      if (e instanceof Error) {
        setToast("Error: " + e.message);
      } else {
        setToast("An unexpected error occurred.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const roleBubbleStyle = (role: Message["role"]): React.CSSProperties => {
    if (role === "customer")
      return {
        backgroundColor: T.surfaceSub,
        color: T.text,
        borderBottomRightRadius: "0.125rem",
      };
    if (role === "ai")
      return {
        backgroundColor: T.brand,
        color: "#ffffff",
        borderBottomLeftRadius: "0.125rem",
      };
    return {
      backgroundColor: T.text,
      color: "#ffffff",
      borderBottomLeftRadius: "0.125rem",
    };
  };

  const roleLabel = (role: Message["role"]) => {
    if (role === "customer") return "Customer";
    if (role === "ai") return "AI Agent";
    return "Agent";
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div
        className="px-3 sm:px-5 py-3 sm:py-4 border-b shrink-0"
        style={{ borderColor: T.border, backgroundColor: T.surface }}
      >
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex items-start gap-2 min-w-0">
            {onBack && (
              <button
                onClick={onBack}
                className="sm:hidden shrink-0 mt-0.5 p-1 -ml-1 rounded-lg transition-colors"
                style={{ color: T.muted }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = T.surfaceSub)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <i className="ti ti-arrow-left text-base" />
              </button>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-[14px] sm:text-[15px] font-bold"
                  style={{ color: T.text }}
                >
                  #{ticket.id.slice(0, 8).toUpperCase()}
                </span>
                <StatusBadge s={ticket.status} />
                <PriorityBadge p={ticket.priority} />
              </div>
              <p
                className="text-[11px] sm:text-[12px] mt-1 leading-relaxed"
                style={{ color: T.muted }}
              >
                Opened {fmt(ticket.createdAt)}
                {ticket.assignedTo && (
                  <>
                    {" "}
                    · Assigned to{" "}
                    <strong>
                      {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
                    </strong>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            {ticket.status === "OPEN" && (
              <button
                onClick={handleStart}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg disabled:opacity-60 transition-all"
                style={{ backgroundColor: T.brandFaint, color: T.brand }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = T.brand;
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = T.brandFaint;
                  e.currentTarget.style.color = T.brand;
                }}
              >
                {actionLoading ? "…" : "Claim"}
              </button>
            )}
            {ticket.status !== "RESOLVED" && (
              <button
                onClick={() => setShowResolve(true)}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg disabled:opacity-60 transition-all"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--color-success, #0F6E56) 12%, transparent)",
                  color: T.success,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = T.success;
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "color-mix(in srgb, var(--color-success, #0F6E56) 12%, transparent)";
                  e.currentTarget.style.color = T.success;
                }}
              >
                Resolve
              </button>
            )}
          </div>
        </div>

        {ticket.status === "RESOLVED" && ticket.resolutionNote && (
          <div
            className="mt-3 rounded-xl px-3.5 py-2.5 text-[12px] border"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--color-success, #0F6E56) 10%, transparent)",
              borderColor:
                "color-mix(in srgb, var(--color-success, #0F6E56) 25%, transparent)",
              color: T.success,
            }}
          >
            <strong>Resolution:</strong> {ticket.resolutionNote}
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-3 min-h-0"
        style={{ backgroundColor: T.pageBg }}
      >
        {msgLoading ? (
          <div className="flex items-center justify-center h-full">
            <div
              className="w-6 h-6 rounded-full animate-spin"
              style={{
                border: `2px solid ${T.brand}`,
                borderTopColor: "transparent",
              }}
            />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm py-10" style={{ color: T.muted }}>
            No messages yet.
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "customer" ? "justify-start" : "justify-end"}`}
            >
              <div className="max-w-[88%] sm:max-w-[75%]">
                <div
                  className={`text-[10px] font-semibold mb-1 ${msg.role === "customer" ? "text-left" : "text-right"}`}
                  style={{ color: T.muted }}
                >
                  {roleLabel(msg.role)}
                  {msg.tier && (
                    <span className="ml-1 opacity-60">({msg.tier})</span>
                  )}
                </div>
                <div
                  className="px-3.5 py-2.5 rounded-2xl text-[13px] leading-[1.6]"
                  style={roleBubbleStyle(msg.role)}
                >
                  {msg.content}
                </div>
                <div
                  className={`text-[10px] mt-0.5 ${msg.role === "customer" ? "text-left" : "text-right"}`}
                  style={{ color: T.muted }}
                >
                  {fmt(msg.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply box — hidden when resolved */}
      {ticket.status !== "RESOLVED" && (
        <div
          className="px-3 sm:px-4 py-3 border-t shrink-0"
          style={{ borderColor: T.border, backgroundColor: T.surface }}
        >
          <p className="text-[11px] mb-1.5 italic" style={{ color: T.muted }}>
            Reply functionality requires message-send endpoint from backend.
          </p>
          <div className="flex gap-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply...)"
              rows={2}
              className="flex-1 text-[13px] px-3 py-2 rounded-xl outline-none resize-none transition-colors"
              style={{
                backgroundColor: T.surface,
                color: T.text,
                border: `1.5px solid ${T.border}`,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = T.brand)}
              onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
            />
            <button
              disabled
              title="Wire up POST /messages endpoint to enable"
              className="px-4 py-2 text-[13px] font-semibold rounded-xl self-end opacity-40 cursor-not-allowed"
              style={{ backgroundColor: T.brand, color: "#ffffff" }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="absolute bottom-20 left-1/2 -translate-x-1/2 text-[12px] font-medium px-4 py-2 rounded-full shadow-lg whitespace-nowrap"
          style={{ backgroundColor: T.text, color: T.surface }}
        >
          {toast}
        </div>
      )}

      {showResolve && (
        <ResolveModal
          onConfirm={handleResolve}
          onCancel={() => setShowResolve(false)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS: { label: string; value: TicketStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Open", value: "OPEN" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Resolved", value: "RESOLVED" },
];

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function TicketsPage() {
  const { user } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TicketStatus | "ALL">("ALL");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [error, setError] = useState("");

  // Mobile: show either list or detail, never both at once
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  const fetchTickets = useCallback(async (status?: TicketStatus | "ALL") => {
    const runFetch = async () => {
      setError("");
      setLoading(true);
      try {
        const params = status && status !== "ALL" ? { status } : undefined;
        const { tickets: t, meta: m } = await apiGetTickets(params);
        setTickets(t);
        setMeta(m);
      } catch (e) {
        if (e instanceof Error) {
          setError("Error: " + e.message);
        } else {
          setError("An unexpected error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };
    runFetch();
  }, []);

  useEffect(() => {
    fetchTickets(activeTab);
  }, [activeTab, fetchTickets]);

  const handleUpdated = (updated: Ticket) => {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelected(updated);
  };

  const countForTab = (tab: TicketStatus | "ALL") => {
    if (tab === "ALL") return meta?.total ?? tickets.length;
    return tickets.filter((t) => t.status === tab).length;
  };

  const handleSelectTicket = (ticket: Ticket) => {
    const next = selected?.id === ticket.id ? null : ticket;
    setSelected(next);
    if (next) setMobileView("detail");
  };

  const handleBack = () => {
    setMobileView("list");
    setSelected(null);
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: T.surface }}
    >
      {/* Page header — hidden on mobile when detail is open */}
      <div
        className={`px-4 sm:px-6 py-3 sm:py-4 border-b shrink-0 ${mobileView === "detail" ? "hidden sm:block" : ""}`}
        style={{ borderColor: T.border }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1
              className="text-[16px] sm:text-[17px] font-bold"
              style={{ color: T.text }}
            >
              Ticket Inbox
            </h1>
            <p
              className="text-[12px] sm:text-[13px] mt-0.5"
              style={{ color: T.muted }}
            >
              {meta
                ? `${meta.total} total ticket${meta.total !== 1 ? "s" : ""}`
                : "Loading…"}
            </p>
          </div>
          <button
            onClick={() => fetchTickets(activeTab)}
            className="flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-lg transition-colors shrink-0"
            style={{ color: T.muted }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = T.surfaceSub)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <i className="ti ti-refresh text-base" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Tabs — horizontally scrollable on mobile */}
        <div className="flex gap-1 mt-3 overflow-x-auto pb-0.5 -mx-1 px-1">
          {TABS.map((tab) => {
            const active = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setActiveTab(tab.value);
                  setSelected(null);
                  setMobileView("list");
                }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-[12px] font-semibold rounded-lg transition-all whitespace-nowrap shrink-0"
                style={{
                  backgroundColor: active ? T.brand : "transparent",
                  color: active ? "#ffffff" : T.muted,
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    e.currentTarget.style.backgroundColor = T.surfaceSub;
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {tab.label}
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: active
                      ? "rgba(255,255,255,0.2)"
                      : T.border,
                    color: active ? "#ffffff" : T.muted,
                  }}
                >
                  {countForTab(tab.value)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Split view */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left — ticket list */}
        <div
          className={`border-r overflow-y-auto shrink-0 ${
            mobileView === "detail" ? "hidden sm:block" : "w-full sm:w-auto"
          } ${selected ? "sm:w-[320px]" : "sm:flex-1"}`}
          style={{ borderColor: T.border }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div
                className="w-6 h-6 rounded-full animate-spin"
                style={{
                  border: `2px solid ${T.brand}`,
                  borderTopColor: "transparent",
                }}
              />
            </div>
          ) : error ? (
            <div className="px-5 py-8 text-center">
              <div className="text-sm mb-3" style={{ color: T.danger }}>
                {error}
              </div>
              <button
                onClick={() => fetchTickets(activeTab)}
                className="text-[13px] font-semibold"
                style={{ color: T.brand }}
              >
                Try again
              </button>
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                style={{ backgroundColor: T.brandFaint }}
              >
                <i
                  className="ti ti-ticket text-2xl"
                  style={{ color: T.brand }}
                />
              </div>
              <p className="text-sm font-semibold" style={{ color: T.text }}>
                No tickets
              </p>
              <p className="text-[12px] mt-1" style={{ color: T.muted }}>
                {activeTab === "ALL"
                  ? "No tickets have been created yet."
                  : `No ${activeTab.toLowerCase().replace("_", " ")} tickets.`}
              </p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                selected={selected?.id === ticket.id}
                onClick={() => handleSelectTicket(ticket)}
              />
            ))
          )}
        </div>

        {/* Right — detail */}
        {selected ? (
          <div
            className={`flex-1 min-w-0 overflow-hidden flex-col ${
              mobileView === "list" ? "hidden sm:flex" : "flex"
            }`}
          >
            <TicketDetail
              key={selected.id}
              ticket={selected}
              onUpdated={handleUpdated}
              onBack={handleBack}
            />
          </div>
        ) : (
          <div
            className="hidden sm:flex flex-2 flex-col items-center justify-center text-center px-6"
            style={{ backgroundColor: T.pageBg }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: T.brandFaint }}
            >
              <i className="ti ti-ticket text-3xl" style={{ color: T.brand }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: T.text }}>
              Select a ticket
            </p>
            <p
              className="text-[13px] mt-1.5 max-w-[240px]"
              style={{ color: T.muted }}
            >
              Click any ticket on the left to view the conversation and take
              action.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
