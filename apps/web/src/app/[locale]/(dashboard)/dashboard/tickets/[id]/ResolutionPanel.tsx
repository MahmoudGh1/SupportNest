// components/tickets/resolution-panel.tsx
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { TicketDetail } from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.types";

type ResolutionPanelProps = {
	status: TicketDetail["status"];
	resolutionNote: string | null;
	resolvedAt: TicketDetail["resolvedAt"];
	onResolutionNoteChange: (value: string) => void;
	onMarkResolved: () => void;
	isSubmitting?: boolean;
};

export function ResolutionPanel({
	status,
	resolutionNote,
	resolvedAt,
	onResolutionNoteChange,
	onMarkResolved,
	isSubmitting,
}: ResolutionPanelProps) {
	const isResolved = status === "RESOLVED";

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-medium">Resolution</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				<Textarea
					placeholder="What did you do to resolve this?"
					value={resolutionNote ? resolutionNote : ""}
					onChange={(e) => onResolutionNoteChange(e.target.value)}
					disabled={isResolved}
					rows={4}
					className="text-sm resize-none"
				/>

				{isResolved && resolvedAt ? (
					<p className="text-xs text-muted-foreground">
						Resolved {format(new Date(resolvedAt), "MMM d, yyyy 'at' h:mm a")}
					</p>
				) : (
					<Button
						onClick={onMarkResolved}
						disabled={
							(resolutionNote && !resolutionNote.trim()) || isSubmitting
						}
						className="w-full"
						size="sm"
					>
						{isSubmitting ? "Saving..." : "Mark Resolved"}
					</Button>
				)}
			</CardContent>
		</Card>
	);
}
