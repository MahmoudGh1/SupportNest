import { S } from "@/components/ui";
import { api } from "@/lib/api";
import { formatBytes } from "@/lib/utils/utils";
import { useRef, useState } from "react";

// ─── UPLOAD PDF PANEL ─────────────────────────────────────────────────────────
export default function UploadPdfPanel({
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
