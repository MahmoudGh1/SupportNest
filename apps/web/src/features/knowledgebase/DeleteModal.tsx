import { S } from "@/components/ui";
import { KnowledgeDocument } from "@/types/types";

// ─── DELETE CONFIRM MODAL ─────────────────────────────────────────────────────
export default function DeleteModal({
	doc,
	onConfirm,
	onCancel,
	loading,
}: {
	doc: KnowledgeDocument;
	onConfirm: () => void;
	onCancel: () => void;
	loading: boolean;
}) {
	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(0,0,0,0.4)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 100,
				backdropFilter: "blur(2px)",
			}}
		>
			<div
				style={{
					background: "#fff",
					borderRadius: 14,
					padding: "1.75rem",
					maxWidth: 400,
					width: "90%",
					boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
				}}
			>
				<div
					style={{
						width: 44,
						height: 44,
						borderRadius: 10,
						background: S.dangerBg,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						marginBottom: 14,
					}}
				>
					<i
						className="ti ti-trash"
						style={{ fontSize: 22, color: S.danger }}
					/>
				</div>
				<div
					style={{
						fontSize: 16,
						fontWeight: 600,
						color: S.dark,
						marginBottom: 8,
					}}
				>
					Delete document?
				</div>
				<div
					style={{
						fontSize: 13,
						color: S.textMuted,
						lineHeight: 1.6,
						marginBottom: 20,
					}}
				>
					<strong style={{ color: S.dark }}>&quot;{doc.title}&quot;</strong>{" "}
					and all its embedded chunks will be permanently deleted. The AI
					pipeline will no longer use this document.
				</div>
				<div style={{ display: "flex", gap: 10 }}>
					<button
						onClick={onCancel}
						disabled={loading}
						style={{
							flex: 1,
							height: 38,
							background: "transparent",
							border: `1.5px solid ${S.border}`,
							borderRadius: 8,
							fontSize: 13,
							fontWeight: 500,
							fontFamily: "inherit",
							cursor: "pointer",
							color: S.dark,
						}}
					>
						Cancel
					</button>
					<button
						onClick={onConfirm}
						disabled={loading}
						style={{
							flex: 1,
							height: 38,
							background: "#E24B4A",
							border: "none",
							borderRadius: 8,
							fontSize: 13,
							fontWeight: 500,
							fontFamily: "inherit",
							cursor: loading ? "not-allowed" : "pointer",
							color: "#fff",
							opacity: loading ? 0.7 : 1,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: 6,
						}}
					>
						{loading ? (
							<>
								<i
									className="ti ti-loader-2"
									style={{
										fontSize: 14,
										animation: "spin 1s linear infinite",
									}}
								/>{" "}
								Deleting…
							</>
						) : (
							"Yes, delete"
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
