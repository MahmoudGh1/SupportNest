"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
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
