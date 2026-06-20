// components/tickets/message-bubble.tsx
import { MessageLite } from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const TIER_LABELS: Record<NonNullable<MessageLite["tier"]>, string> = {
	TIER0: "Tier 0",
	TIER1: "Tier 1",
	TIER2: "Tier 2",
};

function bubbleAlignment(role: MessageLite["role"]) {
	return role === "CUSTOMER" ? "justify-start" : "justify-end";
}

function bubbleStyles(role: MessageLite["role"]) {
	switch (role) {
		case "CUSTOMER":
			return "bg-muted text-foreground";
		case "AI":
			return "bg-primary/10 text-foreground";
		case "HUMAN_AGENT":
			return "bg-primary text-primary-foreground";
	}
}

export function MessageBubble({ message }: { message: MessageLite }) {
	return (
		<div className={cn("flex", bubbleAlignment(message.role))}>
			<div
				className={cn(
					"max-w-[75%] rounded-lg px-3 py-2",
					bubbleStyles(message.role),
				)}
			>
				<div className="flex items-center gap-2 mb-1">
					<span className="text-[11px] font-medium opacity-70">
						{message.role === "CUSTOMER"
							? "Customer"
							: message.role === "AI"
								? "AI"
								: "Agent"}
					</span>
					{message.tier && (
						<span className="text-[10px] rounded-full bg-background/40 px-2 py-0.5">
							{TIER_LABELS[message.tier]}
						</span>
					)}
					<span className="text-[10px] opacity-50 ml-auto">
						{format(new Date(message.createdAt), "MMM d, h:mm a")}
					</span>
				</div>
				<p className="text-sm whitespace-pre-wrap">{message.content}</p>
			</div>
		</div>
	);
}
