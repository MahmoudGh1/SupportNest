"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { S } from "@/components/ui";
import type { AdminOrganization, AdminOrganizationsResponse } from "@/types/types";

interface Props {
	onClose: () => void;
	onSuccess: () => void;
}

export function UserEditor({ onClose, onSuccess }: Props) {
	const [loading, setLoading] = useState(false);
	const [orgsLoading, setOrgsLoading] = useState(true);
	const [orgs, setOrgs] = useState<AdminOrganization[]>([]);
	const [error, setError] = useState("");
	const [form, setForm] = useState({
		email: "",
		password: "",
		first_name: "",
		last_name: "",
		role: "support_agent",
		organization_id: "",
	});

	useEffect(() => {
		api.getAdminOrganizations({ page: 1, limit: 100 })
			.then(res => {
				setOrgs(res.data);
				if (res.data.length > 0) {
					setForm(f => ({ ...f, organization_id: res.data[0].id }));
				}
			})
			.catch(err => setError("Failed to load organizations"))
			.finally(() => setOrgsLoading(false));
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.organization_id) {
			setError("Please select an organization");
			return;
		}
		setLoading(true);
		setError("");
		try {
			await api.createAdminOrgUser(form.organization_id, {
				email: form.email,
				password: form.password,
				first_name: form.first_name,
				last_name: form.last_name,
				role: form.role,
			});
			onSuccess();
		} catch (err) {
			if (err instanceof Error) {
				setError(err.message || "Failed to create user");
			} else {
				setError("An unexpected error occurred.");
			}
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
				maxWidth: 450,
				boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
			}}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
					<h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>New Platform User</h2>
					<button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: S.textMuted }}>
						<i className="ti ti-x" style={{ fontSize: 20 }} />
					</button>
				</div>

				<form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
						<div>
							<label style={{ display: "block", fontSize: 11, fontWeight: 600, color: S.textSecondary, marginBottom: 4 }}>First Name</label>
							<input
								required
								value={form.first_name}
								onChange={e => setForm({ ...form, first_name: e.target.value })}
								style={{ width: "100%", height: 36, borderRadius: 8, border: `1px solid ${S.border}`, padding: "0 12px", fontSize: 13 }}
							/>
						</div>
						<div>
							<label style={{ display: "block", fontSize: 11, fontWeight: 600, color: S.textSecondary, marginBottom: 4 }}>Last Name</label>
							<input
								required
								value={form.last_name}
								onChange={e => setForm({ ...form, last_name: e.target.value })}
								style={{ width: "100%", height: 36, borderRadius: 8, border: `1px solid ${S.border}`, padding: "0 12px", fontSize: 13 }}
							/>
						</div>
					</div>

					<div>
						<label style={{ display: "block", fontSize: 11, fontWeight: 600, color: S.textSecondary, marginBottom: 4 }}>Email Address</label>
						<input
							required
							type="email"
							value={form.email}
							onChange={e => setForm({ ...form, email: e.target.value })}
							style={{ width: "100%", height: 36, borderRadius: 8, border: `1px solid ${S.border}`, padding: "0 12px", fontSize: 13 }}
						/>
					</div>

					<div>
						<label style={{ display: "block", fontSize: 11, fontWeight: 600, color: S.textSecondary, marginBottom: 4 }}>Password</label>
						<input
							required
							type="password"
							value={form.password}
							onChange={e => setForm({ ...form, password: e.target.value })}
							placeholder="Min 8 characters"
							style={{ width: "100%", height: 36, borderRadius: 8, border: `1px solid ${S.border}`, padding: "0 12px", fontSize: 13 }}
						/>
					</div>

					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
						<div>
							<label style={{ display: "block", fontSize: 11, fontWeight: 600, color: S.textSecondary, marginBottom: 4 }}>Organization</label>
							<select
								required
								value={form.organization_id}
								onChange={e => setForm({ ...form, organization_id: e.target.value })}
								style={{ width: "100%", height: 36, borderRadius: 8, border: `1px solid ${S.border}`, padding: "0 8px", fontSize: 13, background: "#fff" }}
							>
								{orgsLoading ? <option>Loading...</option> : orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
							</select>
						</div>
						<div>
							<label style={{ display: "block", fontSize: 11, fontWeight: 600, color: S.textSecondary, marginBottom: 4 }}>Platform Role</label>
							<select
								required
								value={form.role}
								onChange={e => setForm({ ...form, role: e.target.value })}
								style={{ width: "100%", height: 36, borderRadius: 8, border: `1px solid ${S.border}`, padding: "0 8px", fontSize: 13, background: "#fff" }}
							>
								<option value="support_agent">Support Agent</option>
								<option value="org_admin">Organization Admin</option>
							</select>
						</div>
					</div>

					{error && <div style={{ color: S.danger, fontSize: 12, marginTop: 4 }}>{error}</div>}

					<div style={{ display: "flex", gap: 12, marginTop: 12 }}>
						<button
							type="button"
							onClick={onClose}
							style={{ flex: 1, height: 38, borderRadius: 8, border: `1px solid ${S.border}`, background: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
						>
							Cancel
						</button>
						<button
							disabled={loading || orgsLoading}
							style={{
								flex: 1,
								height: 38,
								borderRadius: 8,
								border: "none",
								background: S.purple,
								color: "#fff",
								fontWeight: 600,
								fontSize: 13,
								cursor: "pointer",
								opacity: (loading || orgsLoading) ? 0.7 : 1,
							}}
						>
							{loading ? "Creating..." : "Create User"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
