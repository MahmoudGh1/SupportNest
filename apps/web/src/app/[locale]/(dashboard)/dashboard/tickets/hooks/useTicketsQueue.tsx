import {
	getTicketCounts,
	getTickets,
	TicketCounts,
	TicketSummary,
} from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.api";
import { useCallback, useEffect, useRef, useState } from "react";

export type QueueTab =
	| "all"
	| "open"
	| "in_progress"
	| "resolved"
	| "mine"
	| "unassigned";

function tabToFilters(tab: QueueTab, currentUserId: string) {
	switch (tab) {
		case "open":
			return { status: "OPEN" as const };
		case "in_progress":
			return { status: "IN_PROGRESS" as const };
		case "resolved":
			return { status: "RESOLVED" as const };
		case "mine":
			return { assignedToId: currentUserId };
		case "unassigned":
			return { assignedToId: "unassigned" };
		default:
			return {};
	}
}

export function useTicketsQueue(currentUserId: string) {
	const [activeTab, setActiveTabState] = useState<QueueTab>("all");
	const [page, setPage] = useState(1);
	const [tickets, setTickets] = useState<TicketSummary[]>([]);
	const [meta, setMeta] = useState<{
		total: number;
		totalPages: number;
	} | null>(null);
	const [counts, setCounts] = useState<TicketCounts | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	const abortRef = useRef<AbortController | null>(null);

	// switching tabs always resets to page 1 — staying on page 4 of a tab you just left makes no sense
	const setActiveTab = useCallback((tab: QueueTab) => {
		setActiveTabState(tab);
		setPage(1);
	}, []);

	const fetchTickets = useCallback(async () => {
		abortRef.current?.abort(); // cancel whatever was in flight — fixes the race condition
		const controller = new AbortController();
		abortRef.current = controller;

		setIsLoading(true);
		try {
			const result = await getTickets(
				{ ...tabToFilters(activeTab, currentUserId), page, limit: 20 },
				controller.signal,
			);
			setTickets(result.tickets);
			setMeta(result.meta);
			setError(null);
		} catch (err) {
			if ((err as Error).name === "AbortError") return; // expected when superseded — not a real error
			setError(err as Error);
		} finally {
			setIsLoading(false);
		}
	}, [activeTab, page, currentUserId]);

	const fetchCounts = useCallback(async () => {
		try {
			setCounts(await getTicketCounts());
		} catch {
			// counts are non-critical — tab badges just stay blank rather than breaking the page
		}
	}, []);

	useEffect(() => {
		fetchTickets();
		return () => abortRef.current?.abort();
	}, [fetchTickets]);

	useEffect(() => {
		fetchCounts();
	}, [fetchCounts]);

	const refetch = useCallback(() => {
		fetchTickets();
		fetchCounts();
	}, [fetchTickets, fetchCounts]);

	return {
		tickets,
		meta,
		counts,
		isLoading,
		error,
		activeTab,
		setActiveTab,
		page,
		setPage,
		refetch,
	};
}
