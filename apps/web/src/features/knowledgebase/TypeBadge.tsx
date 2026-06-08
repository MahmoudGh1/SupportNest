import { S } from "@/components/ui";
import { DocType } from "@/types/types";

// ─── TYPE BADGE ───────────────────────────────────────────────────────────────
export default function TypeBadge({ type }: { type: DocType }) {
	const map: Record<DocType, { bg: string; color: string; icon: string }> = {
		PDF: { bg: "#FEF3C7", color: "#92400E", icon: "file-type-pdf" },
		FAQ: { bg: S.purpleBg, color: S.purple, icon: "link" },
	};
	const s = map[type];
	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: 5,
				background: s.bg,
				color: s.color,
				fontSize: 11,
				fontWeight: 500,
				padding: "3px 9px",
				borderRadius: 999,
			}}
		>
			<i
				className={`ti ti-${s.icon}`}
				style={{ fontSize: 12 }}
			/>
			{type.toUpperCase()}
		</span>
	);
}
