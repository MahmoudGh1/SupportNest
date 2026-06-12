import { S } from "@/components/ui";
import { StatsItemProps } from "@/features/knowledgebase/types";

const StatsItem = ({ label, value, color }: StatsItemProps) => {
	return (
		<div
			key={label}
			style={{
				textAlign: "center",
				background: "var(--surface)",
				border: `0.5px solid var(--card-border)`,
				borderRadius: 10,
				padding: "8px 14px",
			}}
		>
			<div style={{ fontSize: 18, fontWeight: 600, color: color }}>
				{value}
			</div>
			<div
				style={{
					fontSize: 10,
					color: "var(--page-muted)",
					textTransform: "uppercase",
					letterSpacing: ".05em",
				}}
			>
				{label}
			</div>
		</div>
	);
};

export default StatsItem;
