import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomerLite } from "@/app/[locale]/(dashboard)/dashboard/tickets/tickets.types";

export function CustomerCard({ customer }: { customer: CustomerLite }) {
	const metadataEntries = Object.entries(customer.metadata ?? {});

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center justify-between text-sm font-medium">
					Customer
					{customer.isAnonymous && (
						<Badge
							variant="outline"
							className="text-[10px] font-normal text-muted-foreground"
						>
							Anonymous
						</Badge>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2 text-sm">
				<div>
					<div className="text-foreground font-medium">
						{customer.name ?? "Unknown"}
					</div>
					{customer.email && (
						<div className="text-muted-foreground">{customer.email}</div>
					)}
				</div>

				{customer.externalId && (
					<div className="flex justify-between text-xs text-muted-foreground">
						<span>External ID</span>
						<span className="font-mono">{customer.externalId}</span>
					</div>
				)}

				{metadataEntries.length > 0 && (
					<div className="border-t border-border pt-2 mt-2 space-y-1">
						{metadataEntries.map(([key, value]) => (
							<div
								key={key}
								className="flex justify-between text-xs"
							>
								<span className="text-muted-foreground capitalize">{key}</span>
								<span className="font-mono truncate max-w-[140px]">
									{String(value)}
								</span>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
