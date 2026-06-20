import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageLite } from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.types";
import { MessageBubble } from "@/app/[locale]/(dashboard)/dashboard/tickets/[id]/MessageBubble";

export function TranscriptPanel({ messages }: { messages: MessageLite[] }) {
	if (messages.length === 0) {
		return (
			<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
				No messages — escalated directly to a human.
			</div>
		);
	}

	return (
		<ScrollArea className="h-full min-h-0 pr-4">
			<div className="flex flex-col gap-3 py-2">
				{messages.map((message) => (
					<MessageBubble
						key={message.id}
						message={message}
					/>
				))}
			</div>
		</ScrollArea>
	);
}
