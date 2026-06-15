"use client";

import { S } from "@/components/ui";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useLingui } from "@lingui/react/macro";

interface TopbarProps {
	pageTitle: string;
	onToggleSidebar: () => void;
}

export function Topbar({ pageTitle, onToggleSidebar }: TopbarProps) {
	const { user, logout } = useAuth();
	const router = useRouter();
	const { t } = useLingui();
	const initials = user
		? `${user.firstName?.[0]}${user.lastName?.[0]}`.toUpperCase()
		: "U";
	const displayName = user
		? `${user.firstName} ${user.lastName}`.trim()
		: "User";

	async function handleLogout() {
		await logout();
		router.push("/");
	}

	return (
		<div
			style={{
				background: "var(--surface)",
				borderBottom: "0.5px solid var(--card-border)",
				padding: "0 1.5rem",
				paddingInlineEnd: "7rem",
				height: 56,
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				flexShrink: 0,
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
				<button
					onClick={onToggleSidebar}
					style={{
						background: "none",
						border: "none",
						cursor: "pointer",
						color: S.textMuted,
						display: "flex",
						padding: 4,
						borderRadius: 6,
					}}
				>
					<i className="ti ti-menu-2" style={{ fontSize: 19 }} />
				</button>
				<span style={{ fontSize: 15, fontWeight: 600, color: "var(--page-text)" }}>
					{pageTitle}
				</span>
			</div>

			<div style={{ display: "flex", alignItems: "center", gap: 16 }}>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "flex-end",
						lineHeight: 1.3,
					}}
				>
					<span style={{ fontSize: 13, fontWeight: 600, color: "var(--page-text)" }}>
						{displayName}
					</span>
					{user?.organizationName && (
						<span style={{ fontSize: 11, color: S.textMuted }}>
							{user.organizationName}
						</span>
					)}
				</div>

				<div
					style={{
						width: 34,
						height: 34,
						borderRadius: "50%",
						background: "var(--color-brand)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						fontSize: 12,
						fontWeight: 500,
						color: "#fff",
					}}
				>
					{initials}
				</div>

				<button
					type="button"
					onClick={handleLogout}
					style={{
						background: "none",
						border: "1px solid var(--card-border)",
						borderRadius: 8,
						padding: "6px 12px",
						fontSize: 12,
						fontWeight: 500,
						color: S.textMuted,
						cursor: "pointer",
					}}
				>
					{t`Logout`}
				</button>
			</div>
		</div>
	);
}
