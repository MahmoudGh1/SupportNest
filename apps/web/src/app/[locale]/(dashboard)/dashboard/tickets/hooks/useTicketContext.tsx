import {
	getTicketById,
	updateTicket,
	UpdateTicketInput,
} from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.api";
import { TicketContext } from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.types";
import { useCallback, useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 12; // ~1 minute, then we stop and let the agent retry manually

export function useTicketContext(ticketId: string) {
	const [data, setData] = useState<TicketContext | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [hasTimedOut, setHasTimedOut] = useState(false);

	const attemptsRef = useRef(0);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const fetchTicket = useCallback(async () => {
		try {
			const result = await getTicketById(ticketId);
			setData(result);
			setError(null);
		} catch (err) {
			setError(err as Error);
		} finally {
			setIsLoading(false);
		}
	}, [ticketId]);

	// initial load — runs once per ticketId
	useEffect(() => {
		attemptsRef.current = 0;
		setHasTimedOut(false);
		fetchTicket();
	}, [ticketId, fetchTicket]);

	// poll only while report is missing
	useEffect(() => {
		const reportMissing = data !== null && data.report === null;
		if (!reportMissing || hasTimedOut) return;

		intervalRef.current = setInterval(async () => {
			attemptsRef.current += 1;
			if (attemptsRef.current >= MAX_POLL_ATTEMPTS) {
				setHasTimedOut(true);
				return;
			}
			await fetchTicket();
		}, POLL_INTERVAL_MS);

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [data, hasTimedOut, fetchTicket]);

	const retryReport = useCallback(() => {
		attemptsRef.current = 0;
		setHasTimedOut(false);
		fetchTicket();
	}, [fetchTicket]);

	const mutateTicket = useCallback(
		async (input: UpdateTicketInput) => {
			const updated = await updateTicket(ticketId, input);
			setData((prev) =>
				prev ? { ...prev, ticket: { ...prev.ticket, ...updated } } : prev,
			);
		},
		[ticketId],
	);

	return { data, isLoading, error, hasTimedOut, retryReport, mutateTicket };
}
