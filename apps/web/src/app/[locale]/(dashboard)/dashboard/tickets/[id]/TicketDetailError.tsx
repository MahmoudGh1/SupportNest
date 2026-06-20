import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function TicketDetailError({ onRetry }: { onRetry: () => void }) {
	return (
		<div className="flex h-screen flex-col items-center justify-center gap-3 text-center">
			<AlertTriangle className="h-8 w-8 text-muted-foreground" />
			<p className="text-sm text-muted-foreground">
				Couldn&apos;t load this ticket. It may have been removed, or
				there&apos;s a connection issue.
			</p>
			<Button
				variant="outline"
				size="sm"
				onClick={onRetry}
			>
				Try again
			</Button>
		</div>
	);
}
