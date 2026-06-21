"use client";

import { CustomerCard } from "@/app/[locale]/(dashboard)/dashboard/tickets/[id]/CustomerCard";
import { ReportCard } from "@/app/[locale]/(dashboard)/dashboard/tickets/[id]/ReportCard";
import { ResolutionPanel } from "@/app/[locale]/(dashboard)/dashboard/tickets/[id]/ResolutionPanel";
import { TicketDetailError } from "@/app/[locale]/(dashboard)/dashboard/tickets/[id]/TicketDetailError";
import { TicketDetailSkeleton } from "@/app/[locale]/(dashboard)/dashboard/tickets/[id]/TicketDetailSkeleton";
import { TicketHeader } from "@/app/[locale]/(dashboard)/dashboard/tickets/[id]/TicketHeader";
import { TranscriptPanel } from "@/app/[locale]/(dashboard)/dashboard/tickets/[id]/TranscriptPanel";
import { useTicketContext } from "@/app/[locale]/(dashboard)/dashboard/tickets/hooks/useTicketContext";
import { T } from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.theme";
import {
	TicketDetail,
	TicketDetailResponse,
} from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.types";
import { useAuth } from "@/context/auth-context";
import { Role } from "@/types/types";
import { useState } from "react";

const PageContent = ({ ticketId }: { ticketId: string }) => {
	const { user } = useAuth();
	const currentUserId = user?.id;
	const currentUserRole = user?.role;

	const [resolutionNote, setResolutionNote] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { data, isLoading, error, hasTimedOut, retryReport, mutateTicket } =
		useTicketContext(ticketId);

	if (isLoading) return <TicketDetailSkeleton />;
	if (error || !data)
		return <TicketDetailError onRetry={() => window.location.reload()} />;

	const { conversation, customer, messages, report, ticket } = data;

	const isAssignee = data.ticket.assignedTo?.id === currentUserId;
	const isAdmin =
		currentUserRole === "ORG_ADMIN" || currentUserRole === "SUPER_ADMIN";
	const isUnassigned = !data.ticket.assignedTo;

	const canMutateWork = isAssignee || isAdmin; // status / priority / resolution
	const canClaim = isUnassigned; // anyone, including agents
	const canReassignOrUnassign = isAdmin; // moving an already-claimed ticket

	const handleStatusChange = (status: TicketDetail["status"]) =>
		mutateTicket({ status });
	const handlePriorityChange = (priority: TicketDetail["priority"]) =>
		mutateTicket({ priority });
	const handleAssign = (agentId: string | null) =>
		mutateTicket({ assignedToId: agentId });
	const handleMarkResolved = () =>
		mutateTicket({ status: "RESOLVED", resolutionNote });
	const handleAssignToMe = () => mutateTicket({ assignedToId: currentUserId });

	return (
		<div className="flex flex-col h-screen p-6 gap-4">
			<TicketHeader
				ticket={ticket}
				canMutateWork={canMutateWork}
				canReassignOrUnassign={canReassignOrUnassign}
				canClaim={canClaim}
				onStatusChange={handleStatusChange}
				onPriorityChange={handlePriorityChange}
				onAssign={handleAssign}
				onAssignToMe={handleAssignToMe}
			/>

			<div className="grid grid-cols-[1fr_420px] gap-6 flex-1 min-h-0 grid-rows-[minmax(0,1fr)]">
				<TranscriptPanel messages={messages} />

				<div className="flex flex-col gap-4 overflow-y-auto min-h-0">
					<CustomerCard customer={customer} />
					<ReportCard
						report={report}
						hasTimedOut={hasTimedOut}
						onRetry={retryReport}
					/>
					<ResolutionPanel
						status={ticket.status}
						resolutionNote={resolutionNote}
						resolvedAt={ticket.resolvedAt}
						assignedTo={ticket.assignedTo}
						onResolutionNoteChange={setResolutionNote}
						onMarkResolved={handleMarkResolved}
						isSubmitting={isSubmitting}
						readOnly={!canMutateWork}
					/>
				</div>
			</div>
		</div>
	);
};

export default PageContent;
