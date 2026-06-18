"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { S } from "@/components/ui";

interface Props {
	onClose: () => void;
	onSuccess: () => void;
}

export function OrganizationEditor({ onClose, onSuccess }: Props) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [form, setForm] = useState({
		name: "",
		email: "",
		password: "",
		slug: "",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (form.password.length < 6) {
			setError("Password must be at least 6 characters");
			return;
		}
		setLoading(true);
		setError("");
		try {
			await api.createAdminOrganization(form);
			onSuccess();
		} catch (err: any) {
			setError(err.message || "Failed to create organization");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={{
			position: "fixed",
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			background: "rgba(0,0,0,0.4)",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			zIndex: 1000,
		}}>
			<div style={{
				background: "#fff",
				borderRadius: 12,
				padding: "1.5rem",
				width: "100%",
				maxWidth: 400,
				boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
			}}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
					<h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>New Organization</h2>
					<button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: S.textMuted }}>
						<i className="ti ti-x" style={{ fontSize: 20 }} />
					</button>
				</div>

				<form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
					<div>
						<label style={{ display: "block", fontSize: 12, fontWeight: 600, color: S.textSecondary, marginBottom: 6 }}>Org Name</label>
						<input
							required
							value={form.name}
							onChange={e => {
								const val = e.target.value;
								setForm({ ...form, name: val, slug: val.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") });
							}}
							placeholder="Acme Corp"
							style={{ width: "100%", height: 38, borderRadius: 8, border: `1px solid ${S.border}`, padding: "0 12px", fontSize: 14 }}
						/>
					</div>

					<div>
						<label style={{ display: "block", fontSize: 12, fontWeight: 600, color: S.textSecondary, marginBottom: 6 }}>Admin Email</label>
						<input
							required
							type="email"
							value={form.email}
							onChange={e => setForm({ ...form, email: e.target.value })}
							placeholder="admin@acme.com"
							style={{ width: "100%", height: 38, borderRadius: 8, border: `1px solid ${S.border}`, padding: "0 12px", fontSize: 14 }}
						/>
					</div>

					<div>
						<label style={{ display: "block", fontSize: 12, fontWeight: 600, color: S.textSecondary, marginBottom: 6 }}>Admin Password</label>
						<input
							required
							type="password"
							value={form.password}
							onChange={e => setForm({ ...form, password: e.target.value })}
							placeholder="••••••••"
							style={{ width: "100%", height: 38, borderRadius: 8, border: `1px solid ${S.border}`, padding: "0 12px", fontSize: 14 }}
						/>
					</div>

					<div>
						<label style={{ display: "block", fontSize: 12, fontWeight: 600, color: S.textSecondary, marginBottom: 6 }}>Slug</label>
						<input
							required
							value={form.slug}
							onChange={e => setForm({ ...form, slug: e.target.value })}
							placeholder="acme-corp"
							style={{ width: "100%", height: 38, borderRadius: 8, border: `1px solid ${S.border}`, padding: "0 12px", fontSize: 14 }}
						/>
					</div>

					{error && <div style={{ color: S.danger, fontSize: 13 }}>{error}</div>}

					<div style={{ display: "flex", gap: 12, marginTop: 8 }}>
						<button
							type="button"
							onClick={onClose}
							style={{ flex: 1, height: 40, borderRadius: 8, border: `1px solid ${S.border}`, background: "#fff", fontWeight: 600, cursor: "pointer" }}
						>
							Cancel
						</button>
						<button
							disabled={loading}
							style={{
								flex: 1,
								height: 40,
								borderRadius: 8,
								border: "none",
								background: S.purple,
								color: "#fff",
								fontWeight: 600,
								cursor: "pointer",
								opacity: loading ? 0.7 : 1,
							}}
						>
							{loading ? "Creating..." : "Create Org"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
