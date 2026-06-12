import { S } from "@/components/ui";
import { DocStatus } from "@/types/types";

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
export default function StatusBadge({ status }: { status: DocStatus }) {
	const map: Record<
		DocStatus,
		{ bg: string; color: string; label: string; icon: string }
	> = {
		READY: {
			bg: "var(--color-success-bg)",
			color: "var(--color-success)",
			label: "Ready",
			icon: "circle-check",
		},
		PROCESSING: {
			bg: "var(--color-brand-faint)",
			color: "var(--color-brand)",
			label: "Processing",
			icon: "loader-2",
		},
		FAILED: {
			bg: "var(--color-danger-bg)",
			color: "var(--color-danger)",
			label: "Failed",
			icon: "alert-circle",
		},
	};
	const s = map[status];
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
				style={{
					fontSize: 12,
					animation:
						status === "PROCESSING" ? "spin 1s linear infinite" : "none",
				}}
			/>
			{s.label}
		</span>
	);
}
