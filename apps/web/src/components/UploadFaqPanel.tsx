// ─── UPLOAD FAQ PANEL ─────────────────────────────────────────────────────────
// function UploadFaqPanel({ onUploaded }: { onUploaded: () => void }) {
// 	const [title, setTitle] = useState("");
// 	const [url, setUrl] = useState("");
// 	const [category, setCategory] = useState("");
// 	const [loading, setLoading] = useState(false);
// 	const [error, setError] = useState("");

// 	const isValidUrl = (v: string) => {
// 		try {
// 			new URL(v);
// 			return true;
// 		} catch {
// 			return false;
// 		}
// 	};

// 	const handleSubmit = async () => {
// 		if (!title.trim()) {
// 			setError("Title is required.");
// 			return;
// 		}
// 		if (!url.trim()) {
// 			setError("FAQ URL is required.");
// 			return;
// 		}
// 		if (!isValidUrl(url)) {
// 			setError("Enter a valid URL (must start with https://).");
// 			return;
// 		}
// 		setError("");
// 		setLoading(true);
// 		try {
// 			await api.uploadFaq({
// 				title: title.trim(),
// 				storagePath: url.trim(),
// 				faqCategory: category.trim() || undefined,
// 			});
// 			setTitle("");
// 			setUrl("");
// 			setCategory("");
// 			onUploaded();
// 		} catch (e: any) {
// 			setError(e.message);
// 		} finally {
// 			setLoading(false);
// 		}
// 	};

// 	const fieldStyle = {
// 		width: "100%",
// 		boxSizing: "border-box" as const,
// 		height: 38,
// 		padding: "0 12px",
// 		border: `1.5px solid ${S.border}`,
// 		borderRadius: 8,
// 		fontSize: 13,
// 		fontFamily: "inherit",
// 		color: S.dark,
// 		outline: "none",
// 		background: "#fafafa",
// 	};

// 	return (
// 		<div
// 			style={{
// 				background: "#fff",
// 				border: `0.5px solid ${S.border}`,
// 				borderRadius: 12,
// 				padding: "1.25rem",
// 			}}
// 		>
// 			<div
// 				style={{
// 					display: "flex",
// 					alignItems: "center",
// 					gap: 8,
// 					marginBottom: 16,
// 				}}
// 			>
// 				<div
// 					style={{
// 						width: 32,
// 						height: 32,
// 						borderRadius: 8,
// 						background: S.purpleBg,
// 						display: "flex",
// 						alignItems: "center",
// 						justifyContent: "center",
// 					}}
// 				>
// 					<i
// 						className="ti ti-link"
// 						style={{ fontSize: 17, color: S.purple }}
// 					/>
// 				</div>
// 				<div>
// 					<div style={{ fontSize: 13, fontWeight: 600, color: S.dark }}>
// 						Add FAQ URL
// 					</div>
// 					<div style={{ fontSize: 11, color: S.textMuted }}>
// 						Paste a link to your FAQ page
// 					</div>
// 				</div>
// 			</div>

// 			<div style={{ marginBottom: 12 }}>
// 				<label
// 					style={{
// 						display: "block",
// 						fontSize: 12,
// 						fontWeight: 500,
// 						color: S.dark,
// 						marginBottom: 5,
// 					}}
// 				>
// 					Title
// 				</label>
// 				<input
// 					value={title}
// 					onChange={(e) => setTitle(e.target.value)}
// 					placeholder="e.g. Refund Policy FAQ"
// 					style={fieldStyle}
// 					onFocus={(e) => (e.target.style.borderColor = S.purple)}
// 					onBlur={(e) => (e.target.style.borderColor = S.border)}
// 				/>
// 			</div>

// 			<div style={{ marginBottom: 12 }}>
// 				<label
// 					style={{
// 						display: "block",
// 						fontSize: 12,
// 						fontWeight: 500,
// 						color: S.dark,
// 						marginBottom: 5,
// 					}}
// 				>
// 					FAQ URL
// 				</label>
// 				<div style={{ position: "relative" }}>
// 					<i
// 						className="ti ti-link"
// 						style={{
// 							position: "absolute",
// 							left: 10,
// 							top: "50%",
// 							transform: "translateY(-50%)",
// 							fontSize: 15,
// 							color: S.textMuted,
// 						}}
// 					/>
// 					<input
// 						value={url}
// 						onChange={(e) => setUrl(e.target.value)}
// 						placeholder="https://yoursite.com/faq"
// 						style={{ ...fieldStyle, paddingLeft: 32 }}
// 						onFocus={(e) => (e.target.style.borderColor = S.purple)}
// 						onBlur={(e) => (e.target.style.borderColor = S.border)}
// 					/>
// 				</div>
// 			</div>

// 			<div style={{ marginBottom: 12 }}>
// 				<label
// 					style={{
// 						display: "block",
// 						fontSize: 12,
// 						fontWeight: 500,
// 						color: S.dark,
// 						marginBottom: 5,
// 					}}
// 				>
// 					Category{" "}
// 					<span style={{ color: S.textMuted, fontWeight: 400 }}>
// 						(optional)
// 					</span>
// 				</label>
// 				<input
// 					value={category}
// 					onChange={(e) => setCategory(e.target.value)}
// 					placeholder="e.g. Billing, Shipping"
// 					style={fieldStyle}
// 					onFocus={(e) => (e.target.style.borderColor = S.purple)}
// 					onBlur={(e) => (e.target.style.borderColor = S.border)}
// 				/>
// 			</div>

// 			{error && (
// 				<div
// 					style={{
// 						background: S.dangerBg,
// 						color: S.danger,
// 						fontSize: 12,
// 						padding: "7px 10px",
// 						borderRadius: 7,
// 						marginBottom: 10,
// 						display: "flex",
// 						gap: 6,
// 						alignItems: "center",
// 					}}
// 				>
// 					<i
// 						className="ti ti-alert-circle"
// 						style={{ fontSize: 14 }}
// 					/>{" "}
// 					{error}
// 				</div>
// 			)}

// 			<button
// 				onClick={handleSubmit}
// 				disabled={loading}
// 				style={{
// 					width: "100%",
// 					height: 38,
// 					background: loading ? S.purpleLight : S.purple,
// 					color: "#fff",
// 					border: "none",
// 					borderRadius: 8,
// 					fontSize: 13,
// 					fontWeight: 500,
// 					fontFamily: "inherit",
// 					cursor: loading ? "not-allowed" : "pointer",
// 					display: "flex",
// 					alignItems: "center",
// 					justifyContent: "center",
// 					gap: 8,
// 					transition: "background .15s",
// 				}}
// 			>
// 				{loading ? (
// 					<>
// 						<i
// 							className="ti ti-loader-2"
// 							style={{ fontSize: 15, animation: "spin 1s linear infinite" }}
// 						/>{" "}
// 						Adding…
// 					</>
// 				) : (
// 					<>
// 						<i
// 							className="ti ti-plus"
// 							style={{ fontSize: 15 }}
// 						/>{" "}
// 						Add FAQ
// 					</>
// 				)}
// 			</button>
// 		</div>
// 	);
// }
