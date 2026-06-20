import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ReportLite } from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.types";
import { Button } from "@/components/ui/button";

const SENTIMENT_STYLES: Record<NonNullable<ReportLite>["sentiment"], string> =
	{
		POSITIVE:
			"bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
		NEUTRAL: "bg-muted text-muted-foreground",
		NEGATIVE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
	};

const PIPELINE_STEPS = ["ROUTER", "TIER0", "TIER1", "TIER2"] as const;
const PIPELINE_LABELS: Record<(typeof PIPELINE_STEPS)[number], string> = {
	ROUTER: "Router",
	TIER0: "Tier 0",
	TIER1: "Tier 1",
	TIER2: "Tier 2",
};

function TierPipeline({
	tiersVisited,
	wasEscalated,
}: {
	tiersVisited: NonNullable<ReportLite>["tiersVisited"];
	wasEscalated: boolean;
}) {
	const visited = new Set<string>(tiersVisited);

	return (
		<div className="flex items-center gap-1">
			{PIPELINE_STEPS.map((step, i) => (
				<div
					key={step}
					className="flex items-center gap-1"
				>
					<span
						className={cn(
							"text-[10px] rounded-full px-2 py-0.5 border",
							visited.has(step)
								? "bg-primary text-primary-foreground border-primary"
								: "text-muted-foreground border-border",
						)}
					>
						{PIPELINE_LABELS[step]}
					</span>
					{i < PIPELINE_STEPS.length - 1 && (
						<span className="text-muted-foreground text-xs">→</span>
					)}
				</div>
			))}
			{wasEscalated && (
				<>
					<span className="text-muted-foreground text-xs">→</span>
					<span className="text-[10px] rounded-full px-2 py-0.5 bg-primary text-primary-foreground border border-primary">
						Human
					</span>
				</>
			)}
		</div>
	);
}

function ReportCardPending({
	hasTimedOut,
	onRetry,
}: {
	hasTimedOut: boolean;
	onRetry: () => void;
}) {
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-medium">AI Summary</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				{hasTimedOut ? (
					<>
						<p className="text-sm text-muted-foreground">
							Summary is taking longer than expected.
						</p>
						<Button
							variant="outline"
							size="sm"
							onClick={onRetry}
						>
							Check again
						</Button>
					</>
				) : (
					<>
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-5/6" />
						<Skeleton className="h-4 w-2/3" />
						<p className="text-xs text-muted-foreground pt-2">
							Generating summary — this updates automatically once ready.
						</p>
					</>
				)}
			</CardContent>
		</Card>
	);
}

export function ReportCard({
	report,
	hasTimedOut,
	onRetry,
}: {
	report: ReportLite;
	hasTimedOut: boolean;
	onRetry: () => void;
}) {
	if (!report)
		return (
			<ReportCardPending
				hasTimedOut={hasTimedOut}
				onRetry={onRetry}
			/>
		);

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center justify-between text-sm font-medium">
					AI Summary
					<Badge
						variant="outline"
						className={cn(
							"border-0 capitalize",
							SENTIMENT_STYLES[report.sentiment],
						)}
					>
						{report.sentiment.toLowerCase()}
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3 text-sm">
				<p className="text-foreground">{report.summary}</p>

				<TierPipeline
					tiersVisited={report.tiersVisited}
					wasEscalated={report.wasEscalated}
				/>

				<div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
					<div>
						<span className="block text-foreground capitalize">
							{report.issueType}
						</span>
						Issue type
					</div>
					<div>
						<span className="block text-foreground">
							{report.language.toUpperCase()}
						</span>
						Language
					</div>
				</div>

				{report.resolution && (
					<div className="border-t border-border pt-2">
						<span className="text-xs text-muted-foreground">
							AI&apos;s attempted resolution
						</span>
						<p className="text-foreground mt-0.5">{report.resolution}</p>
					</div>
				)}

				{!report.resolvedByAi && (
					<p className="text-xs text-amber-700 dark:text-amber-400">
						AI was unable to resolve this — needs human review.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
