"use client";

import { useState } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AgentLite } from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.types";
import { getAssignableAgents } from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.api";

function initials(firstName: string, lastName: string) {
	return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

type ReassignPopoverProps = {
	currentAssigneeId: string | null;
	onAssign: (agentId: string | null) => void;
	children: React.ReactNode;
};

export function ReassignPopover({
	currentAssigneeId,
	onAssign,
	children,
}: ReassignPopoverProps) {
	const [agents, setAgents] = useState<AgentLite[] | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	async function handleOpenChange(open: boolean) {
		if (!open || agents !== null) return;
		setIsLoading(true);
		try {
			setAgents(await getAssignableAgents());
		} catch {
			setAgents([]);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Popover onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>{children}</PopoverTrigger>
			<PopoverContent
				className="w-64 p-1"
				align="end"
			>
				{isLoading && (
					<div className="px-2 py-3 text-xs text-muted-foreground">
						Loading agents…
					</div>
				)}
				{!isLoading && agents?.length === 0 && (
					<div className="px-2 py-3 text-xs text-muted-foreground">
						No agents available
					</div>
				)}
				{!isLoading &&
					agents?.map((agent) => (
						<button
							key={agent.id}
							onClick={() => onAssign(agent.id)}
							disabled={agent.id === currentAssigneeId}
							className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
						>
							<Avatar className="h-6 w-6">
								<AvatarFallback className="text-[10px]">
									{initials(agent.firstName, agent.lastName)}
								</AvatarFallback>
							</Avatar>
							<span className="truncate">
								{agent.firstName} {agent.lastName}
							</span>
							{agent.id === currentAssigneeId && (
								<span className="ml-auto text-[10px] text-muted-foreground">
									Current
								</span>
							)}
						</button>
					))}
				{currentAssigneeId && (
					<>
						<div className="my-1 h-px bg-border" />
						<button
							onClick={() => onAssign(null)}
							className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
						>
							Return to unassigned pool
						</button>
					</>
				)}
			</PopoverContent>
		</Popover>
	);
}
