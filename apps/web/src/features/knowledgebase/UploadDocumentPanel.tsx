import { S } from "@/components/ui";
import { api } from "@/lib/api";
import { formatBytes } from "@/lib/utils/utils";
import { Trans, useLingui } from "@lingui/react/macro";
import { useRef, useState } from "react";
import { DocType } from "@/types/types";

// ─── UPLOAD DOCUMENT PANEL ───────────────────────────────────────────────────
export default function UploadDocumentPanel({
	onUploaded,
}: {
	onUploaded: () => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [file, setFile] = useState<File | null>(null);
	const [title, setTitle] = useState("");
	const [dragging, setDragging] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const allowedExtensions = [".pdf", ".csv", ".docx"];
	const allowedTypes = [
		"application/pdf",
		"text/csv",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	];

	const getDocType = (file: File): DocType => {
		if (file.name.endsWith(".pdf")) return "PDF";
		if (file.name.endsWith(".csv")) return "CSV";
		if (file.name.endsWith(".docx")) return "DOCX";
		return "PDF"; // fallback
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setDragging(false);
		const dropped = e.dataTransfer.files[0];
		if (
			dropped &&
			(allowedTypes.includes(dropped.type) ||
				allowedExtensions.some((ext) => dropped.name.endsWith(ext)))
		) {
			setFile(dropped);
			if (!title) setTitle(dropped.name.replace(/\.[^/.]+$/, ""));
			setError("");
		} else {
			setError("Only PDF, CSV, and DOCX files are supported.");
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const picked = e.target.files?.[0];
		console.log("picked", picked);
		if (!picked) return;
		setFile(picked);
		if (!title) setTitle(picked.name.replace(/\.[^/.]+$/, ""));
		setError("");
	};

	const handleSubmit = async () => {
		if (!file) {
			setError("Please select a file.");
			return;
		}
		if (!title.trim()) {
			setError("Please enter a document title.");
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			setError("File must be under 10 MB.");
			return;
		}
		setError("");
		setLoading(true);
		try {
			await api.uploadDocument({
				file,
				title: title.trim(),
				type: getDocType(file),
			});
			setFile(null);
			setTitle("");
			onUploaded();
		} catch (e: any) {
			setError(e.message);
		} finally {
			setLoading(false);
		}
	};

	const getIcon = () => {
		if (!file) return "ti-file-upload";
		if (file.name.endsWith(".pdf")) return "ti-file-type-pdf";
		if (file.name.endsWith(".csv")) return "ti-file-type-csv";
		if (file.name.endsWith(".docx")) return "ti-file-type-docx";
		return "ti-file";
	};

	return (
		<div
			style={{
				background: "var(--surface)",
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
						background: "var(--color-brand-faint)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<i
						className={`ti ${getIcon()}`}
						style={{ fontSize: 17, color: "var(--color-brand)" }}
					/>
				</div>
				<div>
					<div style={{ fontSize: 13, fontWeight: 600, color: S.dark }}>
						<Trans>Upload Document</Trans>
					</div>
					<div style={{ fontSize: 11, color: S.textMuted }}>
						<Trans>PDF, CSV, or DOCX · Max 10 MB</Trans>
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
					background: dragging ? S.purpleBg : file ? S.greenBg : S.bg,
					transition: "all .15s",
					marginBottom: 12,
				}}
			>
				<input
					ref={inputRef}
					type="file"
					accept=".pdf,.csv,.docx"
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
						<div style={{ textAlign: "left" }}>
							<div
								style={{
									fontSize: 13,
									fontWeight: 500,
									color: S.dark,
									maxWidth: 200,
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
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
								if (inputRef.current) {
									inputRef.current.value = "";
								}
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
							<Trans>Drop file here or click to browse</Trans>
						</div>
						<div style={{ fontSize: 11, color: S.textMuted, marginTop: 4 }}>
							<Trans>Support for PDF, CSV, and DOCX</Trans>
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
					<Trans>Document Title</Trans>
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
						background: "var(--surface-elevated)",
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
						<Trans>Uploading…</Trans>
					</>
				) : (
					<>
						<i
							className="ti ti-upload"
							style={{ fontSize: 15 }}
						/>{" "}
						<Trans>Upload Document</Trans>
					</>
				)}
			</button>
		</div>
	);
}
