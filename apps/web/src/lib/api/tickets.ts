import { TicketDetailResponse } from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.types";
import { apiFetch } from "./client";

export async function getTicketById(
	id: string,
): Promise<TicketDetailResponse> {
	const response = await apiFetch<{
		data: TicketDetailResponse;
		message: string;
		status: number;
	}>(`/tickets/${id}`);
	console.log(response.data);
	return response.data;
}
