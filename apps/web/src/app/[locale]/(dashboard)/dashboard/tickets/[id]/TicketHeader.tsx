"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { TicketDetail } from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.types";
import {
	PriorityBadge,
	StatusBadge,
} from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.mycomponents";
import { ReassignPopover } from "@/app/[locale]/(dashboard)/dashboard/tickets/[id]/ReassignPopover";
import { ChevronDown } from "lucide-react";

type TicketHeaderProps = {
	ticket: TicketDetail;
	canMutateWork: boolean;
	canReassignOrUnassign: boolean;
	canClaim: boolean;
	onStatusChange: (status: TicketDetail["status"]) => void;
	onPriorityChange: (priority: TicketDetail["priority"]) => void;
	onAssign: (agentId: string | null) => void;
	onAssignToMe: () => void;
};

function initials(firstName: string, lastName: string) {
	return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function TicketHeader({
	ticket,
	canMutateWork,
	canReassignOrUnassign,
	canClaim,
	onStatusChange,
	onPriorityChange,
	onAssign,
	onAssignToMe,
}: TicketHeaderProps) {
	return (
		<div className="flex items-center justify-between border-b border-border pb-4">
			<div className="flex items-center gap-3">
				{canMutateWork ? (
					<Select
						value={ticket.status}
						onValueChange={onStatusChange}
					>
						<SelectTrigger className="h-8 w-[140px] border-0 p-0 shadow-none focus:ring-0">
							<SelectValue>
								<StatusBadge status={ticket.status} />
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="OPEN">Open</SelectItem>
							<SelectItem value="IN_PROGRESS">In progress</SelectItem>
							<SelectItem value="RESOLVED">Resolved</SelectItem>
						</SelectContent>
					</Select>
				) : (
					<StatusBadge status={ticket.status} />
				)}

				{canMutateWork ? (
					<Select
						value={ticket.priority}
						onValueChange={onPriorityChange}
					>
						<SelectTrigger className="h-8 w-[110px] border-0 p-0 shadow-none focus:ring-0">
							<SelectValue>
								<PriorityBadge priority={ticket.priority} />
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="HIGH">High</SelectItem>
							<SelectItem value="MEDIUM">Medium</SelectItem>
							<SelectItem value="LOW">Low</SelectItem>
						</SelectContent>
					</Select>
				) : (
					<PriorityBadge priority={ticket.priority} />
				)}
				<span className="text-xs text-muted-foreground">
					{ticket.agentAttempts} agent attempt
					{ticket.agentAttempts === 1 ? "" : "s"}
				</span>
			</div>

			<div className="flex items-center gap-4">
				<span className="text-xs text-muted-foreground">
					Opened{" "}
					{formatDistanceToNow(new Date(ticket.createdAt), {
						addSuffix: true,
					})}
				</span>

				{ticket.assignedTo ? (
					canReassignOrUnassign ? (
						<ReassignPopover
							currentAssigneeId={ticket.assignedTo.id}
							onAssign={onAssign}
						>
							<button
								type="button"
								className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent"
							>
								<Avatar className="h-6 w-6">
									<AvatarFallback className="text-[10px]">
										{initials(
											ticket.assignedTo.firstName,
											ticket.assignedTo.lastName,
										)}
									</AvatarFallback>
								</Avatar>
								<span className="text-sm">
									{ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
								</span>
							</button>
						</ReassignPopover>
					) : (
						<div className="flex items-center gap-2 px-2 py-1">
							<Avatar className="h-6 w-6">
								<AvatarFallback className="text-[10px]">
									{initials(
										ticket.assignedTo.firstName,
										ticket.assignedTo.lastName,
									)}
								</AvatarFallback>
							</Avatar>
							<span className="text-sm">
								{ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
							</span>
						</div>
					)
				) : (
					<div className="flex items-center gap-1">
						{canClaim && (
							<Button
								variant="default"
								size="sm"
								onClick={onAssignToMe}
							>
								Assign to me
							</Button>
						)}
						{canReassignOrUnassign && (
							<ReassignPopover
								currentAssigneeId={null}
								onAssign={onAssign}
							>
								<Button
									variant="outline"
									size="icon"
									className="h-8 w-8"
								>
									<ChevronDown className="h-3 w-3" />
								</Button>
							</ReassignPopover>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
