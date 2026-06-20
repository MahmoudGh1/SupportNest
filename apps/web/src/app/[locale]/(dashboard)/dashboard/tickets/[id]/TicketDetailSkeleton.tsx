import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function TicketDetailSkeleton() {
	return (
		<div className="flex flex-col h-screen p-6 gap-4">
			<div className="flex items-center justify-between border-b border-border pb-4">
				<div className="flex items-center gap-3">
					<Skeleton className="h-7 w-20" />
					<Skeleton className="h-7 w-20" />
				</div>
				<Skeleton className="h-6 w-32" />
			</div>

			<div className="grid grid-cols-[1fr_360px] gap-6 flex-1 min-h-0">
				<div className="flex flex-col gap-3 min-h-0">
					<Skeleton className="h-16 w-2/3" />
					<Skeleton className="h-16 w-2/3 ml-auto" />
					<Skeleton className="h-16 w-1/2" />
				</div>

				<div className="flex flex-col gap-4 min-h-0">
					{[0, 1, 2].map((i) => (
						<Card key={i}>
							<CardHeader className="pb-2">
								<Skeleton className="h-4 w-24" />
							</CardHeader>
							<CardContent className="space-y-2">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-5/6" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</div>
	);
}
