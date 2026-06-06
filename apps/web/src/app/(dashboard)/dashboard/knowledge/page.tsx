"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { S } from "@/components/ui";
import { DocStatus, DocType, KnowledgeDocument } from "@/types/types";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatBytes(bytes?: number) {
	if (!bytes) return "—";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: DocStatus }) {
	const map: Record<
		DocStatus,
		{ bg: string; color: string; label: string; icon: string }
	> = {
		READY: {
			bg: S.greenBg,
			color: S.green,
			label: "Ready",
			icon: "circle-check",
		},
		PROCESSING: {
			bg: "#EEF2FF",
			color: "#4F46E5",
			label: "Processing",
			icon: "loader-2",
		},
		FAILED: {
			bg: S.dangerBg,
			color: S.danger,
			label: "Failed",
			icon: "alert-circle",
		},
	};
	const s = map[status];
	console.log(s);
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

// ─── TYPE BADGE ───────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: DocType }) {
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

// ─── UPLOAD PDF PANEL ─────────────────────────────────────────────────────────
function UploadPdfPanel({ onUploaded }: { onUploaded: () => void }) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [file, setFile] = useState<File | null>(null);
	const [title, setTitle] = useState("");
	const [dragging, setDragging] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setDragging(false);
		const dropped = e.dataTransfer.files[0];
		if (dropped?.type === "application/pdf") {
			setFile(dropped);
			if (!title) setTitle(dropped.name.replace(".pdf", ""));
		} else {
			setError("Only PDF files are supported.");
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const picked = e.target.files?.[0];
		if (!picked) return;
		setFile(picked);
		if (!title) setTitle(picked.name.replace(".pdf", ""));
		setError("");
	};

	const handleSubmit = async () => {
		if (!file) {
			setError("Please select a PDF file.");
			return;
		}
		if (!title.trim()) {
			setError("Please enter a document title.");
			return;
		}
		if (file.size > 20 * 1024 * 1024) {
			setError("File must be under 20 MB.");
			return;
		}
		setError("");
		setLoading(true);
		try {
			await api.uploadPdf({ file, title: title.trim() });
			setFile(null);
			setTitle("");
			onUploaded();
		} catch (e: any) {
			setError(e.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			style={{
				background: "#fff",
				border: `0.5px solid ${S.border}`,
				borderRadius: 12,
				padding: "1.25rem",
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 8,
					marginBottom: 16,
				}}
			>
				<div
					style={{
						width: 32,
						height: 32,
						borderRadius: 8,
						background: "#FEF3C7",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<i
						className="ti ti-file-type-pdf"
						style={{ fontSize: 17, color: "#92400E" }}
					/>
				</div>
				<div>
					<div style={{ fontSize: 13, fontWeight: 600, color: S.dark }}>
						Upload PDF
					</div>
					<div style={{ fontSize: 11, color: S.textMuted }}>
						Max 20 MB · PDF only
					</div>
				</div>
			</div>

			{/* Drop zone */}
			<div
				onClick={() => inputRef.current?.click()}
				onDragOver={(e) => {
					e.preventDefault();
					setDragging(true);
				}}
				onDragLeave={() => setDragging(false)}
				onDrop={handleDrop}
				style={{
					border: `2px dashed ${dragging ? S.purple : file ? S.green : S.border}`,
					borderRadius: 10,
					padding: "1.25rem",
					textAlign: "center",
					cursor: "pointer",
					background: dragging ? S.purpleBg : file ? S.greenBg : "#fafafa",
					transition: "all .15s",
					marginBottom: 12,
				}}
			>
				<input
					ref={inputRef}
					type="file"
					accept=".pdf"
					style={{ display: "none" }}
					onChange={handleFileChange}
				/>
				{file ? (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: 8,
						}}
					>
						<i
							className="ti ti-file-check"
							style={{ fontSize: 20, color: S.green }}
						/>
						<div>
							<div style={{ fontSize: 13, fontWeight: 500, color: S.dark }}>
								{file.name}
							</div>
							<div style={{ fontSize: 11, color: S.textMuted }}>
								{formatBytes(file.size)}
							</div>
						</div>
						<button
							onClick={(e) => {
								e.stopPropagation();
								setFile(null);
								setTitle("");
							}}
							style={{
								background: "none",
								border: "none",
								cursor: "pointer",
								color: S.textMuted,
								marginLeft: 4,
								padding: 2,
							}}
						>
							<i
								className="ti ti-x"
								style={{ fontSize: 14 }}
							/>
						</button>
					</div>
				) : (
					<>
						<i
							className="ti ti-cloud-upload"
							style={{
								fontSize: 28,
								color: dragging ? S.purple : S.textMuted,
								marginBottom: 6,
							}}
						/>
						<div style={{ fontSize: 13, color: S.dark, fontWeight: 500 }}>
							Drop PDF here or click to browse
						</div>
						<div style={{ fontSize: 11, color: S.textMuted, marginTop: 4 }}>
							PDF files up to 20 MB
						</div>
					</>
				)}
			</div>

			{/* Title input */}
			<div style={{ marginBottom: 12 }}>
				<label
					style={{
						display: "block",
						fontSize: 12,
						fontWeight: 500,
						color: S.dark,
						marginBottom: 5,
					}}
				>
					Document Title
				</label>
				<input
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="e.g. Q3 Product FAQ"
					style={{
						width: "100%",
						boxSizing: "border-box",
						height: 38,
						padding: "0 12px",
						border: `1.5px solid ${S.border}`,
						borderRadius: 8,
						fontSize: 13,
						fontFamily: "inherit",
						color: S.dark,
						outline: "none",
						background: "#fafafa",
					}}
					onFocus={(e) => (e.target.style.borderColor = S.purple)}
					onBlur={(e) => (e.target.style.borderColor = S.border)}
				/>
			</div>

			{error && (
				<div
					style={{
						background: S.dangerBg,
						color: S.danger,
						fontSize: 12,
						padding: "7px 10px",
						borderRadius: 7,
						marginBottom: 10,
						display: "flex",
						gap: 6,
						alignItems: "center",
					}}
				>
					<i
						className="ti ti-alert-circle"
						style={{ fontSize: 14 }}
					/>{" "}
					{error}
				</div>
			)}

			<button
				onClick={handleSubmit}
				disabled={loading}
				style={{
					width: "100%",
					height: 38,
					background: loading ? S.purpleLight : S.purple,
					color: "#fff",
					border: "none",
					borderRadius: 8,
					fontSize: 13,
					fontWeight: 500,
					fontFamily: "inherit",
					cursor: loading ? "not-allowed" : "pointer",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					gap: 8,
					transition: "background .15s",
				}}
			>
				{loading ? (
					<>
						<i
							className="ti ti-loader-2"
							style={{ fontSize: 15, animation: "spin 1s linear infinite" }}
						/>{" "}
						Uploading…
					</>
				) : (
					<>
						<i
							className="ti ti-upload"
							style={{ fontSize: 15 }}
						/>{" "}
						Upload PDF
					</>
				)}
			</button>
		</div>
	);
}

// ─── UPLOAD FAQ PANEL ─────────────────────────────────────────────────────────
function UploadFaqPanel({ onUploaded }: { onUploaded: () => void }) {
	const [title, setTitle] = useState("");
	const [url, setUrl] = useState("");
	const [category, setCategory] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const isValidUrl = (v: string) => {
		try {
			new URL(v);
			return true;
		} catch {
			return false;
		}
	};

	const handleSubmit = async () => {
		if (!title.trim()) {
			setError("Title is required.");
			return;
		}
		if (!url.trim()) {
			setError("FAQ URL is required.");
			return;
		}
		if (!isValidUrl(url)) {
			setError("Enter a valid URL (must start with https://).");
			return;
		}
		setError("");
		setLoading(true);
		try {
			await api.uploadFaq({
				title: title.trim(),
				storagePath: url.trim(),
				faqCategory: category.trim() || undefined,
			});
			setTitle("");
			setUrl("");
			setCategory("");
			onUploaded();
		} catch (e: any) {
			setError(e.message);
		} finally {
			setLoading(false);
		}
	};

	const fieldStyle = {
		width: "100%",
		boxSizing: "border-box" as const,
		height: 38,
		padding: "0 12px",
		border: `1.5px solid ${S.border}`,
		borderRadius: 8,
		fontSize: 13,
		fontFamily: "inherit",
		color: S.dark,
		outline: "none",
		background: "#fafafa",
	};

	return (
		<div
			style={{
				background: "#fff",
				border: `0.5px solid ${S.border}`,
				borderRadius: 12,
				padding: "1.25rem",
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 8,
					marginBottom: 16,
				}}
			>
				<div
					style={{
						width: 32,
						height: 32,
						borderRadius: 8,
						background: S.purpleBg,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<i
						className="ti ti-link"
						style={{ fontSize: 17, color: S.purple }}
					/>
				</div>
				<div>
					<div style={{ fontSize: 13, fontWeight: 600, color: S.dark }}>
						Add FAQ URL
					</div>
					<div style={{ fontSize: 11, color: S.textMuted }}>
						Paste a link to your FAQ page
					</div>
				</div>
			</div>

			<div style={{ marginBottom: 12 }}>
				<label
					style={{
						display: "block",
						fontSize: 12,
						fontWeight: 500,
						color: S.dark,
						marginBottom: 5,
					}}
				>
					Title
				</label>
				<input
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="e.g. Refund Policy FAQ"
					style={fieldStyle}
					onFocus={(e) => (e.target.style.borderColor = S.purple)}
					onBlur={(e) => (e.target.style.borderColor = S.border)}
				/>
			</div>

			<div style={{ marginBottom: 12 }}>
				<label
					style={{
						display: "block",
						fontSize: 12,
						fontWeight: 500,
						color: S.dark,
						marginBottom: 5,
					}}
				>
					FAQ URL
				</label>
				<div style={{ position: "relative" }}>
					<i
						className="ti ti-link"
						style={{
							position: "absolute",
							left: 10,
							top: "50%",
							transform: "translateY(-50%)",
							fontSize: 15,
							color: S.textMuted,
						}}
					/>
					<input
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						placeholder="https://yoursite.com/faq"
						style={{ ...fieldStyle, paddingLeft: 32 }}
						onFocus={(e) => (e.target.style.borderColor = S.purple)}
						onBlur={(e) => (e.target.style.borderColor = S.border)}
					/>
				</div>
			</div>

			<div style={{ marginBottom: 12 }}>
				<label
					style={{
						display: "block",
						fontSize: 12,
						fontWeight: 500,
						color: S.dark,
						marginBottom: 5,
					}}
				>
					Category{" "}
					<span style={{ color: S.textMuted, fontWeight: 400 }}>
						(optional)
					</span>
				</label>
				<input
					value={category}
					onChange={(e) => setCategory(e.target.value)}
					placeholder="e.g. Billing, Shipping"
					style={fieldStyle}
					onFocus={(e) => (e.target.style.borderColor = S.purple)}
					onBlur={(e) => (e.target.style.borderColor = S.border)}
				/>
			</div>

			{error && (
				<div
					style={{
						background: S.dangerBg,
						color: S.danger,
						fontSize: 12,
						padding: "7px 10px",
						borderRadius: 7,
						marginBottom: 10,
						display: "flex",
						gap: 6,
						alignItems: "center",
					}}
				>
					<i
						className="ti ti-alert-circle"
						style={{ fontSize: 14 }}
					/>{" "}
					{error}
				</div>
			)}

			<button
				onClick={handleSubmit}
				disabled={loading}
				style={{
					width: "100%",
					height: 38,
					background: loading ? S.purpleLight : S.purple,
					color: "#fff",
					border: "none",
					borderRadius: 8,
					fontSize: 13,
					fontWeight: 500,
					fontFamily: "inherit",
					cursor: loading ? "not-allowed" : "pointer",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					gap: 8,
					transition: "background .15s",
				}}
			>
				{loading ? (
					<>
						<i
							className="ti ti-loader-2"
							style={{ fontSize: 15, animation: "spin 1s linear infinite" }}
						/>{" "}
						Adding…
					</>
				) : (
					<>
						<i
							className="ti ti-plus"
							style={{ fontSize: 15 }}
						/>{" "}
						Add FAQ
					</>
				)}
			</button>
		</div>
	);
}

// ─── DELETE CONFIRM MODAL ─────────────────────────────────────────────────────
function DeleteModal({
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

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function KnowledgePage() {
	const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
	const [pageLoading, setPageLoading] = useState(true);
	const [deleteTarget, setDeleteTarget] = useState<KnowledgeDocument | null>(
		null,
	);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [toast, setToast] = useState("");

	// ── Fetch ──────────────────────────────────────────────────────────────────
	const fetchDocs = async () => {
		const documents = (await api.getKnowledgeDocs()).data.documents;
		setDocs(documents);
	};

	useEffect(() => {
		fetchDocs().finally(() => setPageLoading(false));
	}, []);

	// ── Polling: only runs while any doc is "processing" ──────────────────────
	useEffect(() => {
		const hasProcessing = docs.some((d) => d.status === "PROCESSING");
		if (!hasProcessing) return;
		const timer = setInterval(fetchDocs, 3000);
		return () => clearInterval(timer);
	}, [docs]);

	// ── Toast helper ───────────────────────────────────────────────────────────
	const showToast = (msg: string) => {
		setToast(msg);
		setTimeout(() => setToast(""), 3000);
	};

	// ── Handlers ───────────────────────────────────────────────────────────────
	const handleUploaded = () => {
		fetchDocs();
		showToast("Document added — processing started.");
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setDeleteLoading(true);
		try {
			await api.deleteKnowledgeDoc(deleteTarget.id);
			await fetchDocs();
			showToast(`"${deleteTarget.title}" deleted.`);
			setDeleteTarget(null);
		} catch (e: any) {
			showToast("Delete failed: " + e.message);
		} finally {
			setDeleteLoading(false);
		}
	};

	// ── Stats ──────────────────────────────────────────────────────────────────
	const total = docs.length;
	const ready = docs.filter((d) => d.status === "READY").length;
	const processing = docs.filter((d) => d.status === "PROCESSING").length;
	const failed = docs.filter((d) => d.status === "FAILED").length;

	if (pageLoading) {
		return (
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					height: "100%",
					color: S.textMuted,
				}}
			>
				<i
					className="ti ti-loader-2"
					style={{ fontSize: 24, animation: "spin 1s linear infinite" }}
				/>
				<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
			</div>
		);
	}

	return (
		<>
			<style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        .kb-row:hover { background: #fafafa !important; }
        .kb-del-btn { opacity: 0 !important; transition: opacity .15s; }
        .kb-row:hover .kb-del-btn { opacity: 1 !important; }
      `}</style>

			<div style={{ padding: "1.5rem", maxWidth: 1100, margin: "0 auto" }}>
				{/* Header */}
				<div
					style={{
						display: "flex",
						alignItems: "flex-start",
						justifyContent: "space-between",
						marginBottom: "1.5rem",
					}}
				>
					<div>
						<h1
							style={{
								fontSize: 18,
								fontWeight: 600,
								color: S.dark,
								margin: "0 0 4px",
							}}
						>
							Knowledge Base
						</h1>
						<p style={{ fontSize: 13, color: S.textMuted, margin: 0 }}>
							Documents your AI pipeline uses to answer customer questions.
						</p>
					</div>
					{/* Live stats */}
					<div style={{ display: "flex", gap: 10 }}>
						{[
							{ label: "Total", value: total, color: S.dark },
							{ label: "Ready", value: ready, color: S.green },
							{ label: "Processing", value: processing, color: "#4F46E5" },
							{ label: "Failed", value: failed, color: S.danger },
						].map((s) => (
							<div
								key={s.label}
								style={{
									textAlign: "center",
									background: "#fff",
									border: `0.5px solid ${S.border}`,
									borderRadius: 10,
									padding: "8px 14px",
								}}
							>
								<div style={{ fontSize: 18, fontWeight: 600, color: s.color }}>
									{s.value}
								</div>
								<div
									style={{
										fontSize: 10,
										color: S.textMuted,
										textTransform: "uppercase",
										letterSpacing: ".05em",
									}}
								>
									{s.label}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Upload panels */}
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gap: 12,
						marginBottom: "1.5rem",
					}}
				>
					<UploadPdfPanel onUploaded={handleUploaded} />
					<UploadFaqPanel onUploaded={handleUploaded} />
				</div>

				{/* Processing notice */}
				{processing > 0 && (
					<div
						style={{
							background: "#EEF2FF",
							border: "0.5px solid #C7D2FE",
							borderRadius: 10,
							padding: "10px 14px",
							marginBottom: "1rem",
							display: "flex",
							alignItems: "center",
							gap: 10,
							fontSize: 13,
							color: "#3730A3",
						}}
					>
						<i
							className="ti ti-loader-2"
							style={{
								fontSize: 16,
								animation: "spin 1s linear infinite",
								flexShrink: 0,
							}}
						/>
						<span>
							<strong>{processing}</strong> document{processing > 1 ? "s" : ""}{" "}
							being processed by the AI pipeline. This page updates
							automatically.
						</span>
					</div>
				)}

				{/* Documents table */}
				<div
					style={{
						background: "#fff",
						borderRadius: 12,
						border: `0.5px solid ${S.border}`,
						overflow: "hidden",
					}}
				>
					{docs.length === 0 ? (
						<div
							style={{
								textAlign: "center",
								padding: "3rem",
								color: S.textMuted,
							}}
						>
							<i
								className="ti ti-book-off"
								style={{ fontSize: 36, marginBottom: 12, display: "block" }}
							/>
							<div
								style={{
									fontSize: 14,
									fontWeight: 500,
									color: S.dark,
									marginBottom: 4,
								}}
							>
								No documents yet
							</div>
							<div style={{ fontSize: 13 }}>
								Upload a PDF or add a FAQ URL above to get started.
							</div>
						</div>
					) : (
						<table
							style={{
								width: "100%",
								borderCollapse: "collapse",
								fontSize: 13,
							}}
						>
							<thead>
								<tr style={{ borderBottom: `0.5px solid ${S.border}` }}>
									{[
										"Document",
										"Type",
										"Status",
										"Size / Info",
										"Added",
										"",
									].map((h) => (
										<th
											key={h}
											style={{
												textAlign: "left",
												padding: "10px 16px",
												fontSize: 10,
												fontWeight: 600,
												color: S.textMuted,
												letterSpacing: ".06em",
												textTransform: "uppercase",
											}}
										>
											{h}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{docs.map((doc, i) => (
									<tr
										key={doc.id}
										className="kb-row"
										style={{
											borderBottom:
												i < docs.length - 1
													? `0.5px solid ${S.border}`
													: "none",
											background: "#fff",
											transition: "background .1s",
											animation: "fadeIn .2s ease",
										}}
									>
										{/* Title */}
										<td style={{ padding: "12px 16px", maxWidth: 260 }}>
											<div
												style={{
													fontWeight: 500,
													color: S.dark,
													whiteSpace: "nowrap",
													overflow: "hidden",
													textOverflow: "ellipsis",
												}}
											>
												{doc.title}
											</div>
											<div
												style={{
													fontSize: 11,
													color: S.textMuted,
													marginTop: 2,
													whiteSpace: "nowrap",
													overflow: "hidden",
													textOverflow: "ellipsis",
												}}
											>
												{doc.storagePath}
											</div>
										</td>
										{/* Type */}
										<td style={{ padding: "12px 16px" }}>
											<TypeBadge type={doc.type} />
										</td>
										{/* Status */}
										<td style={{ padding: "12px 16px" }}>
											<StatusBadge status={doc.status} />
										</td>
										{/* Meta */}
										<td
											style={{
												padding: "12px 16px",
												color: S.textMuted,
												fontSize: 12,
											}}
										>
											{doc.type === "PDF" ? (
												<div>
													<div>{formatBytes(doc.metadata.fileSize)}</div>
													{doc.metadata.pageCount ? (
														<div>{doc.metadata.pageCount} pages</div>
													) : null}
												</div>
											) : (
												<div>{doc.metadata.faqCategory || "—"}</div>
											)}
										</td>
										{/* Date */}
										<td
											style={{
												padding: "12px 16px",
												color: S.textMuted,
												fontSize: 12,
												whiteSpace: "nowrap",
											}}
										>
											{formatDate(doc.createdAt)}
										</td>
										{/* Delete */}
										<td style={{ padding: "12px 16px", textAlign: "right" }}>
											<button
												className="kb-del-btn"
												onClick={() => setDeleteTarget(doc)}
												style={{
													width: 30,
													height: 30,
													border: `0.5px solid ${S.border}`,
													borderRadius: 7,
													background: "#fff",
													cursor: "pointer",
													display: "inline-flex",
													alignItems: "center",
													justifyContent: "center",
													color: S.danger,
												}}
											>
												<i
													className="ti ti-trash"
													style={{ fontSize: 15 }}
												/>
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			</div>

			{/* Delete confirm modal */}
			{deleteTarget && (
				<DeleteModal
					doc={deleteTarget}
					onConfirm={handleDelete}
					onCancel={() => setDeleteTarget(null)}
					loading={deleteLoading}
				/>
			)}

			{/* Toast */}
			{toast && (
				<div
					style={{
						position: "fixed",
						bottom: 24,
						right: 24,
						background: S.dark,
						color: "#fff",
						fontSize: 13,
						padding: "10px 16px",
						borderRadius: 10,
						boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
						zIndex: 200,
						animation: "fadeIn .2s ease",
						display: "flex",
						alignItems: "center",
						gap: 8,
					}}
				>
					<i
						className="ti ti-check"
						style={{ fontSize: 15, color: S.green }}
					/>
					{toast}
				</div>
			)}
		</>
	);
}
