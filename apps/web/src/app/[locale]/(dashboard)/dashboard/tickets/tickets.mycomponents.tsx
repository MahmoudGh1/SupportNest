// components/tickets/priority-badge.tsx
import { TicketDetail } from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES: Record<TicketDetail["priority"], string> = {
	HIGH: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
	MEDIUM:
		"bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
	LOW: "bg-muted text-muted-foreground",
};

export function PriorityBadge({
	priority,
}: {
	priority: TicketDetail["priority"];
}) {
	return (
		<Badge
			variant="outline"
			className={cn("border-0 capitalize", PRIORITY_STYLES[priority])}
		>
			{priority.toLowerCase()}
		</Badge>
	);
}

const STATUS_STYLES: Record<TicketDetail["status"], string> = {
	OPEN: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
	IN_PROGRESS:
		"bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
	RESOLVED:
		"bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

export function StatusBadge({ status }: { status: TicketDetail["status"] }) {
	return (
		<Badge
			variant="outline"
			className={cn("border-0 capitalize", STATUS_STYLES[status])}
		>
			{status.toLowerCase().replace("_", " ")}
		</Badge>
	);
}
