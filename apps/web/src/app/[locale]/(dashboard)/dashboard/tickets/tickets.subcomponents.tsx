// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

import {
	PRIORITY_LABEL,
	PRIORITY_STYLES,
	STATUS_LABEL,
	STATUS_STYLES,
} from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.constants";
import { T } from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.theme";
import {
	Message,
	Ticket,
	TicketPriority,
	TicketStatus,
} from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.types";
import {
	fmt,
	timeAgo,
} from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.utils";
import { useEffect, useRef, useState } from "react";
import { apiGetMessages } from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.api";
import { useAuth } from "@/context/auth-context";

export function PriorityBadge({ p }: { p: TicketPriority }) {
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

export function StatusBadge({ s }: { s: TicketStatus }) {
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
export function TicketRow({
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
				<span
					className="text-[11px] shrink-0"
					style={{ color: T.muted }}
				>
					{timeAgo(ticket.createdAt)}
				</span>
			</div>

			<div className="flex items-center gap-1.5 flex-wrap mt-1">
				<StatusBadge s={ticket.status} />
				<PriorityBadge p={ticket.priority} />
				{ticket.assignedTo && (
					<span
						className="text-[10px]"
						style={{ color: T.muted }}
					>
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
export function ResolveModal({
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
				<h3
					className="text-base font-bold mb-1"
					style={{ color: T.text }}
				>
					Resolve ticket
				</h3>
				<p
					className="text-[13px] mb-4"
					style={{ color: T.muted }}
				>
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
export function TicketDetail({
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
											{ticket.assignedTo.firstName}{" "}
											{ticket.assignedTo.lastName}
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
					<div
						className="text-center text-sm py-10"
						style={{ color: T.muted }}
					>
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
					<p
						className="text-[11px] mb-1.5 italic"
						style={{ color: T.muted }}
					>
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
