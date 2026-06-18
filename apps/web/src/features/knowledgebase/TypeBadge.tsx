import { S } from "@/components/ui";
import { DocType } from "@/types/types";

// ─── TYPE BADGE ───────────────────────────────────────────────────────────────
export default function TypeBadge({ type }: { type: DocType }) {
	const map: Record<string, { bg: string; color: string; icon: string }> = {
		PDF: { bg: "var(--color-warning-bg)", color: "var(--color-warning)", icon: "file-type-pdf" },
		FAQ: { bg: "var(--color-brand-faint)", color: "var(--color-brand)", icon: "link" },
		SWAGGER: { bg: "var(--color-info)", color: "var(--color-info)", icon: "bolt" },
		OPENAPI: { bg: "var(--color-info)", color: "var(--color-info)", icon: "bolt" },
		CSV: { bg: "#e0f2fe", color: "#0369a1", icon: "file-type-csv" },
		DOCX: { bg: "#eef2ff", color: "#4338ca", icon: "file-type-docx" },
	};

	const fallback = { bg: "var(--surface)", color: "var(--page-text)", icon: "file-text" };

	const normalizedType = (type ?? "").toUpperCase();
	const s = map[normalizedType] || fallback;

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
			{normalizedType}
		</span>
	);
}