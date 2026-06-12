"use client";

import { useState } from "react";
import { Input, Btn, S } from "@/components/ui";
import { createApiKey } from "@/app/[locale]/apis/create_api";
import { ApiKey } from "@/types/profile.js";

// ─── CREATE API KEY MODAL ─────────────────────────────────────────────────────
export function CreateKeyModal({
	onClose,
	onCreate,
}: {
	onClose: () => void;
	onCreate: (key: ApiKey) => void;
}) {
	const [name, setName] = useState("");
	const [origins, setOrigins] = useState<string[]>([""]);
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const addOrigin = () => setOrigins((o) => [...o, ""]);
	const removeOrigin = (i: number) =>
		setOrigins((o) => o.filter((_, idx) => idx !== i));
	const setOrigin = (i: number, v: string) =>
		setOrigins((o) => o.map((x, idx) => (idx === i ? v : x)));

	const validate = () => {
		const e: Record<string, string> = {};
		if (!name.trim()) e.name = "Key name is required.";
		const validOrigins = origins.filter((o) => o.trim());
		if (validOrigins.length === 0)
			e.origins = "Add at least one allowed origin.";
		validOrigins.forEach((o, i) => {
			try {
				new URL(o);
			} catch {
				e[`origin_${i}`] = `Invalid URL: ${o}`;
			}
		});
		return e;
	};

	const handleCreate = async () => {
		const e = validate();
		if (Object.keys(e).length) {
			setErrors(e);
			return;
		}
		setLoading(true);
		setErrors({});
		try {
			const key = await createApiKey(
				name,
				origins.filter((origin) => origin.trim()),
			);
			onCreate(key);
		} catch (error: any) {
			setErrors({
				submit: error.message ?? "Failed to create API key.",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(26,24,48,0.45)",
				zIndex: 200,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: 16,
			}}
		>
			<div
				style={{
					background: "#fff",
					borderRadius: 16,
					width: "100%",
					maxWidth: 520,
					padding: "2rem",
					boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						marginBottom: 24,
					}}
				>
					<div>
						<h3
							style={{
								margin: 0,
								fontSize: 16,
								fontWeight: 600,
								color: S.dark,
							}}
						>
							Create API Key
						</h3>
						<p style={{ margin: "4px 0 0", fontSize: 12, color: S.textMuted }}>
							Keys are hashed — save the raw key immediately after creation.
						</p>
					</div>
					<button
						onClick={onClose}
						style={{
							background: "none",
							border: "none",
							cursor: "pointer",
							color: S.textMuted,
							fontSize: 20,
							lineHeight: 1,
						}}
					>
						×
					</button>
				</div>

				<Input
					label="Key name"
					value={name}
					onChange={setName}
					placeholder="e.g. Production, Staging"
					error={errors.name}
					icon="tag"
				/>

				<div style={{ marginBottom: 16 }}>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							marginBottom: 8,
						}}
					>
						<label style={{ fontSize: 13, fontWeight: 500, color: S.dark }}>
							Allowed origins
						</label>
						<button
							onClick={addOrigin}
							style={{
								background: "none",
								border: "none",
								cursor: "pointer",
								color: S.purple,
								fontSize: 12,
								fontWeight: 500,
								display: "flex",
								alignItems: "center",
								gap: 4,
							}}
						>
							<i
								className="ti ti-plus"
								style={{ fontSize: 14 }}
							/>{" "}
							Add origin
						</button>
					</div>

					<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
						{origins.map((o, i) => (
							<div
								key={i}
								style={{ display: "flex", gap: 8, alignItems: "center" }}
							>
								<div style={{ flex: 1, position: "relative" }}>
									<i
										className="ti ti-world"
										style={{
											position: "absolute",
											left: 10,
											top: "50%",
											transform: "translateY(-50%)",
											color: S.textMuted,
											fontSize: 15,
										}}
									/>
									<input
										value={o}
										onChange={(e) => {
											setOrigin(i, e.target.value);
											if (errors[`origin_${i}`])
												setErrors((ev) => ({ ...ev, [`origin_${i}`]: "" }));
										}}
										placeholder="https://yoursite.com"
										style={{
											width: "100%",
											boxSizing: "border-box",
											padding: "9px 10px 9px 32px",
											fontSize: 13,
											border: `1.5px solid ${errors[`origin_${i}`] ? "#E24B4A" : S.border}`,
											borderRadius: 8,
											outline: "none",
											fontFamily: "inherit",
											color: S.dark,
											transition: "border-color .15s",
										}}
										onFocus={(e) => (e.target.style.borderColor = S.purple)}
										onBlur={(e) =>
											(e.target.style.borderColor = errors[`origin_${i}`]
												? "#E24B4A"
												: S.border)
										}
									/>
									{errors[`origin_${i}`] && (
										<p
											style={{
												fontSize: 11,
												color: "#E24B4A",
												margin: "3px 0 0",
											}}
										>
											{errors[`origin_${i}`]}
										</p>
									)}
								</div>
								{origins.length > 1 && (
									<button
										onClick={() => removeOrigin(i)}
										style={{
											background: "none",
											border: "none",
											cursor: "pointer",
											color: "#E24B4A",
											fontSize: 18,
											lineHeight: 1,
											padding: "4px",
										}}
									>
										<i
											className="ti ti-trash"
											style={{ fontSize: 16 }}
										/>
									</button>
								)}
							</div>
						))}
					</div>

					{errors.origins && (
						<p style={{ fontSize: 12, color: "#E24B4A", marginTop: 6 }}>
							{errors.origins}
						</p>
					)}
					<p style={{ fontSize: 11, color: S.textMuted, marginTop: 8 }}>
						Only requests from these origins will be accepted.
					</p>
				</div>

				<div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
					{errors.submit && (
						<p
							style={{
								fontSize: 12,
								color: "#E24B4A",
								margin: "0 auto 0 0",
								alignSelf: "center",
							}}
						>
							{errors.submit}
						</p>
					)}
					<Btn
						variant="ghost"
						onClick={onClose}
					>
						Cancel
					</Btn>
					<Btn
						loading={loading}
						onClick={handleCreate}
					>
						<i
							className="ti ti-key"
							style={{ fontSize: 15 }}
						/>{" "}
						Generate key
					</Btn>
				</div>
			</div>
		</div>
	);
}

// ─── KEY REVEAL MODAL ─────────────────────────────────────────────────────────
export function KeyRevealModal({
	apiKey,
	onClose,
}: {
	apiKey: ApiKey;
	onClose: () => void;
}) {
	const [copied, setCopied] = useState(false);
	const [copyError, setCopyError] = useState(false);

	const copy = async () => {
		const text = apiKey.raw_key ?? (apiKey as any).key ?? "";
		try {
			if (navigator.clipboard && window.isSecureContext) {
				await navigator.clipboard.writeText(text);
			} else {
				const ta = document.createElement("textarea");
				ta.value = text;
				ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
				document.body.appendChild(ta);
				ta.focus();
				ta.select();
				const ok = document.execCommand("copy");
				document.body.removeChild(ta);
				if (!ok) throw new Error("execCommand failed");
			}
			setCopied(true);
			setCopyError(false);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			setCopyError(true);
			setTimeout(() => setCopyError(false), 3000);
		}
	};

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(26,24,48,0.55)",
				zIndex: 300,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: 16,
			}}
		>
			<div
				style={{
					background: "#fff",
					borderRadius: 16,
					width: "100%",
					maxWidth: 500,
					padding: "2rem",
					boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
				}}
			>
				<div
					style={{
						display: "flex",
						gap: 12,
						alignItems: "flex-start",
						marginBottom: 20,
					}}
				>
					<div
						style={{
							width: 44,
							height: 44,
							borderRadius: 12,
							background: S.amberBg,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							flexShrink: 0,
						}}
					>
						<i
							className="ti ti-alert-triangle"
							style={{ fontSize: 22, color: "#D97706" }}
						/>
					</div>
					<div>
						<h3
							style={{
								margin: 0,
								fontSize: 16,
								fontWeight: 600,
								color: S.dark,
							}}
						>
							Save your API key now
						</h3>
						<p
							style={{
								margin: "4px 0 0",
								fontSize: 13,
								color: S.textMuted,
								lineHeight: 1.5,
							}}
						>
							This key will <strong>never be shown again</strong>. Copy it and
							store it securely.
						</p>
					</div>
				</div>

				<div
					style={{
						background: S.bg,
						border: `1.5px solid ${S.border}`,
						borderRadius: 10,
						padding: "14px 16px",
						marginBottom: 16,
					}}
				>
					<div
						style={{
							fontSize: 11,
							color: S.textMuted,
							marginBottom: 8,
							fontWeight: 500,
							textTransform: "uppercase",
							letterSpacing: ".06em",
						}}
					>
						{apiKey.name}
					</div>
					<div
						style={{
							fontFamily: "monospace",
							fontSize: 13,
							color: S.dark,
							wordBreak: "break-all",
							lineHeight: 1.6,
						}}
					>
						{apiKey.raw_key}
					</div>
				</div>

				<button
					onClick={copy}
					style={{
						width: "100%",
						padding: "11px 0",
						borderRadius: 9,
						background: copied
							? S.greenBg
							: copyError
								? S.dangerBg
								: S.purpleBg,
						border: `1.5px solid ${copied ? S.green : copyError ? "#E24B4A" : S.purple}`,
						color: copied ? "#0F6E56" : copyError ? S.danger : S.purple,
						fontSize: 14,
						fontWeight: 600,
						cursor: "pointer",
						fontFamily: "inherit",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: 8,
						transition: "all .15s",
						marginBottom: 16,
					}}
				>
					<i
						className={`ti ti-${copied ? "check" : copyError ? "alert-circle" : "copy"}`}
						style={{ fontSize: 16 }}
					/>
					{copied
						? "Copied!"
						: copyError
							? "Copy failed — select manually"
							: "Copy to clipboard"}
				</button>

				<div
					style={{
						background: S.bg,
						borderRadius: 9,
						padding: "12px 14px",
						marginBottom: 20,
					}}
				>
					<div
						style={{
							fontSize: 11,
							color: S.textMuted,
							fontWeight: 500,
							marginBottom: 8,
							textTransform: "uppercase",
							letterSpacing: ".06em",
						}}
					>
						Allowed origins
					</div>
					{apiKey?.allowed_origins?.map((o) => (
						<div
							key={o}
							style={{
								display: "flex",
								alignItems: "center",
								gap: 6,
								marginBottom: 4,
							}}
						>
							<div
								style={{
									width: 6,
									height: 6,
									borderRadius: "50%",
									background: S.green,
								}}
							/>
							<span
								style={{
									fontSize: 12,
									color: S.dark,
									fontFamily: "monospace",
								}}
							>
								{o}
							</span>
						</div>
					))}
				</div>

				<Btn
					fullWidth
					onClick={onClose}
					variant="outline"
				>
					I&apos;ve saved my key — close
				</Btn>
			</div>
		</div>
	);
}
