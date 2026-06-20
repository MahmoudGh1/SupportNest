"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { BASE_URL } from "@/lib/api/client";

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

const PRIORITY_LABEL: Record<TicketPriority, string> = {
	HIGH: "High",
	MEDIUM: "Medium",
	LOW: "Low",
};
const PRIORITY_CLASSES: Record<TicketPriority, string> = {
	HIGH: "bg-red-50   text-red-600   border border-red-200",
	MEDIUM: "bg-amber-50 text-amber-600 border border-amber-200",
	LOW: "bg-[#E1F5EE] text-[#1D9E75] border border-[#1D9E75]/20",
};
const STATUS_CLASSES: Record<TicketStatus, string> = {
	OPEN: "bg-[#EEEDFE] text-[#534AB7]",
	IN_PROGRESS: "bg-amber-50  text-amber-600",
	RESOLVED: "bg-[#E1F5EE] text-[#1D9E75]",
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
	const res = await fetch(`${BASE_URL}/tickets?${qs}`, { credentials: "include" });
	const json = await res.json();
	if (!res.ok) throw new Error(json.message ?? "Failed to fetch tickets");
	return json.data;
}

async function apiGetMessages(conversationId: string): Promise<Message[]> {
	const res = await fetch(`${BASE_URL}/widget/conversations/${conversationId}/messages`, {
		credentials: "include",
	});
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
	return (
		<span
			className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_CLASSES[p]}`}
		>
			{PRIORITY_LABEL[p]}
		</span>
	);
}

function StatusBadge({ s }: { s: TicketStatus }) {
	return (
		<span
			className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CLASSES[s]}`}
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
			className={`w-full text-left px-4 py-3.5 border-b border-[#e8e6f0] transition-all duration-150 hover:bg-[#f6f5fc] group ${selected
				? "bg-[#f6f5fc] border-l-2 border-l-[#534AB7]"
				: "border-l-2 border-l-transparent"
				}`}
		>
			<div className="flex items-start justify-between gap-2 mb-1.5">
				<div className="flex items-center gap-2 min-w-0">
					<div className="w-7 h-7 rounded-full bg-[#EEEDFE] flex items-center justify-center shrink-0 text-[11px] font-bold text-[#534AB7]">
						{ticket.assignedTo
							? `${ticket.assignedTo.firstName[0]}${ticket.assignedTo.lastName[0]}`
							: "?"}
					</div>
					<span className="text-[13px] font-semibold text-[#1a1830] truncate">
						Ticket #{ticket.id.slice(0, 8).toUpperCase()}
					</span>
				</div>
				<span className="text-[11px] text-[#64607a] shrink-0">
					{timeAgo(ticket.createdAt)}
				</span>
			</div>

			<div className="flex items-center gap-1.5 flex-wrap mt-1">
				<StatusBadge s={ticket.status} />
				<PriorityBadge p={ticket.priority} />
				{ticket.assignedTo && (
					<span className="text-[10px] text-[#64607a]">
						→ {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
					</span>
				)}
			</div>

			<p className="text-[12px] text-[#64607a] mt-1.5 line-clamp-1 leading-relaxed">
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
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
			<div className="bg-white rounded-2xl shadow-2xl p-7 w-[420px] max-w-[90vw]">
				<h3 className="text-base font-bold text-[#1a1830] mb-1">
					Resolve ticket
				</h3>
				<p className="text-[13px] text-[#64607a] mb-4">
					Add a resolution note (optional but recommended).
				</p>
				<textarea
					value={note}
					onChange={(e) => setNote(e.target.value)}
					placeholder="Describe what was done to resolve this issue…"
					rows={3}
					className="w-full text-sm px-3.5 py-2.5 border-[1.5px] border-[#e8e6f0] rounded-xl outline-none resize-none focus:border-[#534AB7] transition-colors"
				/>
				<div className="flex gap-2 mt-4 justify-end">
					<button
						onClick={onCancel}
						className="px-4 py-2 text-sm text-[#64607a] rounded-lg hover:bg-[#f6f5fc] transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={() => onConfirm(note)}
						disabled={loading}
						className="px-5 py-2 text-sm font-semibold bg-[#1D9E75] text-white rounded-lg hover:bg-[#178a64] disabled:opacity-60 transition-colors"
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
}: {
	ticket: Ticket;
	onUpdated: (t: Ticket) => void;
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

	const roleBubble = (role: Message["role"]) => {
		if (role === "customer")
			return "bg-[#f6f5fc] text-[#1a1830] rounded-br-sm";
		if (role === "ai") return "bg-[#534AB7] text-white rounded-bl-sm";
		return "bg-[#1a1830] text-white rounded-bl-sm";
	};

	const roleLabel = (role: Message["role"]) => {
		if (role === "customer") return "Customer";
		if (role === "ai") return "AI Agent";
		return "Agent";
	};

	return (
		<div className="flex flex-col h-full relative">
			{/* Header */}
			<div className="px-5 py-4 border-b border-[#e8e6f0] bg-white shrink-0">
				<div className="flex items-start justify-between gap-3">
					<div>
						<div className="flex items-center gap-2 flex-wrap">
							<span className="text-[15px] font-bold text-[#1a1830]">
								#{ticket.id.slice(0, 8).toUpperCase()}
							</span>
							<StatusBadge s={ticket.status} />
							<PriorityBadge p={ticket.priority} />
						</div>
						<p className="text-[12px] text-[#64607a] mt-1">
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

					<div className="flex gap-2 shrink-0">
						{ticket.status === "OPEN" && (
							<button
								onClick={handleStart}
								disabled={actionLoading}
								className="px-3 py-1.5 text-xs font-semibold bg-[#EEEDFE] text-[#534AB7] rounded-lg hover:bg-[#534AB7] hover:text-white disabled:opacity-60 transition-all"
							>
								{actionLoading ? "…" : "Claim"}
							</button>
						)}
						{ticket.status !== "RESOLVED" && (
							<button
								onClick={() => setShowResolve(true)}
								disabled={actionLoading}
								className="px-3 py-1.5 text-xs font-semibold bg-[#E1F5EE] text-[#1D9E75] rounded-lg hover:bg-[#1D9E75] hover:text-white disabled:opacity-60 transition-all"
							>
								Resolve
							</button>
						)}
					</div>
				</div>

				{ticket.status === "RESOLVED" && ticket.resolutionNote && (
					<div className="mt-3 bg-[#E1F5EE] border border-[#1D9E75]/20 rounded-xl px-3.5 py-2.5 text-[12px] text-[#0F6E56]">
						<strong>Resolution:</strong> {ticket.resolutionNote}
					</div>
				)}
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto px-5 py-4 bg-[#fafafa] space-y-3 min-h-0">
				{msgLoading ? (
					<div className="flex items-center justify-center h-full">
						<div className="w-6 h-6 border-2 border-[#534AB7] border-t-transparent rounded-full animate-spin" />
					</div>
				) : messages.length === 0 ? (
					<div className="text-center text-sm text-[#64607a] py-10">
						No messages yet.
					</div>
				) : (
					messages.map((msg) => (
						<div
							key={msg.id}
							className={`flex ${msg.role === "customer" ? "justify-start" : "justify-end"}`}
						>
							<div className="max-w-[75%]">
								<div
									className={`text-[10px] font-semibold mb-1 ${msg.role === "customer" ? "text-left text-[#64607a]" : "text-right text-[#64607a]"}`}
								>
									{roleLabel(msg.role)}
									{msg.tier && (
										<span className="ml-1 opacity-60">({msg.tier})</span>
									)}
								</div>
								<div
									className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-[1.6] ${roleBubble(msg.role)}`}
								>
									{msg.content}
								</div>
								<div
									className={`text-[10px] text-[#64607a] mt-0.5 ${msg.role === "customer" ? "text-left" : "text-right"}`}
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
				<div className="px-4 py-3 border-t border-[#e8e6f0] bg-white shrink-0">
					<p className="text-[11px] text-[#64607a] mb-1.5 italic">
						Reply functionality requires message-send endpoint from backend.
					</p>
					<div className="flex gap-2">
						<textarea
							value={replyText}
							onChange={(e) => setReplyText(e.target.value)}
							placeholder="Type your reply...)"
							rows={2}
							className="flex-1 text-[13px] px-3 py-2 border-[1.5px] border-[#e8e6f0] rounded-xl outline-none resize-none focus:border-[#534AB7] transition-colors"
						/>
						<button
							disabled
							title="Wire up POST /messages endpoint to enable"
							className="px-4 py-2 bg-[#534AB7] text-white text-[13px] font-semibold rounded-xl self-end opacity-40 cursor-not-allowed"
						>
							Send
						</button>
					</div>
				</div>
			)}

			{/* Toast */}
			{toast && (
				<div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[#1a1830] text-white text-[12px] font-medium px-4 py-2 rounded-full shadow-lg whitespace-nowrap">
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
import {
	Meta,
	Ticket,
	TicketStatus,
} from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.types";
import { apiGetTickets } from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.api";
import { T } from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.theme";
import { TicketRow } from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.subcomponents";
import { useRouter } from "next/navigation";

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
	const router = useRouter();
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [currentTicket, setCurrentTicket] = useState(null);
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
		// const next = selected?.id === ticket.id ? null : ticket;
		// setSelected(next);
		// if (next) setMobileView("detail");
		router.push(`/dashboard/tickets/${ticket.id}`);
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

			<div className="flex flex-1 min-h-0 overflow-hidden">
				<div
					className={`border-r overflow-y-auto shrink-0 ${
						mobileView === "detail" ? "hidden sm:block" : "w-full sm:w-auto"
					} ${selected ? "sm:flex-1" : "sm:flex-1"}`}
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
							<div
								className="text-sm mb-3"
								style={{ color: T.danger }}
							>
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
							<p
								className="text-sm font-semibold"
								style={{ color: T.text }}
							>
								No tickets
							</p>
							<p
								className="text-[12px] mt-1"
								style={{ color: T.muted }}
							>
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
			</div>
		</div>
	);
}
