import { TicketHeader } from "@/app/[locale]/(dashboard)/dashboard/tickets/[id]/TicketHeader";
import PageContent from "@/app/[locale]/(dashboard)/dashboard/tickets/PageContent";
import { normalizeApiBaseUrl } from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.constants";
import { TicketDetailResponse } from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.types";
import { apiFetch } from "@/lib/api/client";
import { getTicketById } from "@/lib/api/tickets";

export default async function Page({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id: ticketId } = await params;
	console.log(ticketId);

	// const ticketData = await getTicketById(ticketId);
	// console.log(ticketData);
	return <PageContent ticketId={ticketId} />;
}
