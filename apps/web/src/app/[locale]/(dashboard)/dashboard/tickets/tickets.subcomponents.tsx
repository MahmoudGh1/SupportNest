import { TicketSummary } from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.api";
import { T } from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.theme";
import { formatDistanceToNow } from "date-fns";

const PRIORITY_DOT: Record<TicketSummary["priority"], string> = {
	HIGH: T.danger,
	MEDIUM: T.warning,
	LOW: T.muted,
};

function initials(firstName: string, lastName: string) {
	return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function TicketRow({
	ticket,
	onClick,
}: {
	ticket: TicketSummary;
	onClick: () => void;
}) {
	const customer = ticket.conversation.customer;
	const preview =
		ticket.conversation.messages[0]?.content ?? "No messages yet";
	const displayName = customer.isAnonymous
		? "Anonymous"
		: (customer.name ?? customer.email ?? "Unknown");

	return (
		<button
			onClick={onClick}
			className="w-full flex items-center gap-3 px-4 sm:px-6 py-3 text-left border-b transition-colors"
			style={{ borderColor: T.border }}
		>
			<span
				className="w-2 h-2 rounded-full shrink-0"
				style={{ backgroundColor: PRIORITY_DOT[ticket.priority] }}
			/>

			<div className="flex-1 min-w-0">
				<div
					className="text-[13px] font-semibold truncate"
					style={{ color: T.text }}
				>
					{displayName}
				</div>
				<div
					className="text-[12px] truncate"
					style={{ color: T.muted }}
				>
					{preview}
				</div>
			</div>

			{ticket.assignedTo && (
				<span
					className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
					style={{ backgroundColor: T.brandFaint, color: T.brand }}
				>
					{initials(ticket.assignedTo.firstName, ticket.assignedTo.lastName)}
				</span>
			)}

			<span
				className="text-[11px] shrink-0"
				style={{ color: T.muted }}
			>
				{formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
			</span>
		</button>
	);
}
