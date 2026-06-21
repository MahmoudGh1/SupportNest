"use client";
import { useState } from "react";
import { S } from "@/components/ui";
import { useAuth } from "@/context/auth-context";
import { msg, t } from "@lingui/core/macro";
import type { MessageDescriptor } from "@lingui/core";
import { i18n } from "@lingui/core";
import { Trans } from "@lingui/react/macro";
import { Role } from "@/types/types";
import { api } from "@/lib/api";

export const ROLE_TRANSLATIONS: Record<Role, MessageDescriptor> = {
	ORG_ADMIN: msg`Org Admin`,
	SUPPORT_AGENT: msg`Support Agent`,
	SUPER_ADMIN: msg`Super Admin`,
};

const navItems = [
	{ icon: "layout-dashboard", label: msg`Overview`, page: "dashboard" },
	{ icon: "ticket", label: msg`Tickets`, page: "tickets" },
	{
		icon: "book",
		label: msg({ message: "Knowledge Base" }),
		page: "knowledge",
	},
	{ icon: "users", label: msg`Team`, page: "team" },
	{ icon: "chart-bar", label: msg`Analytics`, page: "analytics" },
	{
		icon: "layout-dashboard",
		label: msg`Overview`,
		page: "admin",
		superAdminOnly: true,
	},
	{
		icon: "building-skyscraper",
		label: msg`Organizations`,
		page: "organizations",
		superAdminOnly: true,
	},
	// { icon: "code", label: msg({ message: "API & Widget" }), page: "api" },
	{ icon: "settings", label: msg`Settings`, page: "settings" },
	{ icon: "plug", label: msg`API Tools`, page: "tools" },
	{ icon: "user-circle", label: msg`Profile`, page: "profile" },
	// In navItems array, after "organizations":
	{
		icon: "mail",
		label: msg`Contact Submissions`,
		page: "contact-submissions",
		superAdminOnly: true,
	},
];

interface SidebarProps {
	currentPage: string;
	onNavigate: (page: string) => void;
	collapsed: boolean;
	onToggle: () => void;
}

export function Sidebar({
	currentPage,
	onNavigate,
	collapsed,
	onToggle: _onToggle,
}: SidebarProps) {
	const { user, logout } = useAuth();
	const initials = user
		? `${user.firstName?.[0]}${user.lastName?.[0]}`.toUpperCase()
		: "U";
	const isSuperAdmin = String(user?.role).toUpperCase() === Role.SUPER_ADMIN;
	const isSupportAgent =
		String(user?.role).toUpperCase() === Role.SUPPORT_AGENT;
		const [showHelp, setShowHelp] = useState(false);
  const [helpForm, setHelpForm] = useState({ subject: "", message: "" });
  const [helpLoading, setHelpLoading] = useState(false);
  const [helpSent, setHelpSent] = useState(false);

  const handleHelpSubmit = async () => {
    if (!helpForm.subject || !helpForm.message) return;
    setHelpLoading(true);
    try {
      await api.submitHelpRequest(helpForm);
      setHelpSent(true);
      setTimeout(() => {
        setShowHelp(false);
        setHelpSent(false);
        setHelpForm({ subject: "", message: "" });
      }, 2000);
	   } catch (e) {
      console.error(e);
    } finally {
      setHelpLoading(false);
    }
  };
	return (
		<div
			style={{
				width: collapsed ? 64 : 220,
				minWidth: collapsed ? 64 : 220,
				background: "var(--sidebar-bg)",
				display: "flex",
				flexDirection: "column",
				transition: "width .2s, min-width .2s",
				overflow: "hidden",
			}}
		>
			{/* Logo */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 10,
					padding: "1.25rem 1rem 1rem",
					borderBottom: "0.5px solid var(--sidebar-border)",
					minWidth: 0,
				}}
			>
				<div
					style={{
						width: 32,
						height: 32,
						background: "var(--color-brand)",
						borderRadius: 8,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flexShrink: 0,
					}}
				>
					<i
						className="ti ti-shield-check"
						style={{ color: "#fff", fontSize: 16 }}
					/>
				</div>
				{!collapsed && (
					<div style={{ minWidth: 0 }}>
						<div
							style={{
								color: "var(--sidebar-text-active)",
								fontSize: 13,
								fontWeight: 600,
								whiteSpace: "nowrap",
							}}
						>
							SupportNest
						</div>
						<div
							style={{
								color: "var(--sidebar-text)",
								fontSize: 10,
								whiteSpace: "nowrap",
								overflow: "hidden",
								textOverflow: "ellipsis",
							}}
						>
							{user?.orgName || t`Your workspace`}
						</div>
					</div>
				)}
			</div>

			{/* Nav items */}
			<div
				style={{
					flex: 1,
					padding: "1rem 0.6rem",
					display: "flex",
					flexDirection: "column",
					gap: 2,
				}}
			>
				{navItems
					.filter((item) => {
						if (isSuperAdmin) {
							// For Super Admin, only show Admin, Organizations, and Profile
							return [
								"admin",
								"organizations",
								"contact-submissions",
								"profile",
							].includes(item.page);
						}
						if (isSupportAgent) {
							// For Support Agent, show Overview, Tickets, and Profile
							return ["dashboard", "tickets", "profile"].includes(item.page);
						}
						// For others (ORG_ADMIN), show everything EXCEPT Admin
						return !item.superAdminOnly;
					})
					.map((item) => {
						const isActive = currentPage === item.page;
						return (
							<button
								key={item.page}
								onClick={() => onNavigate(item.page)}
								title={collapsed ? i18n._(item.label) : ""}
								style={{
									display: "flex",
									alignItems: "center",
									gap: 10,
									padding: collapsed ? "9px 14px" : "8px 10px",
									borderRadius: 8,
									cursor: "pointer",
									border: "none",
									background: isActive ? S.purple : "transparent",
									color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
									fontSize: 13,
									fontFamily: "inherit",
									transition: "all .15s",
									whiteSpace: "nowrap",
									justifyContent: collapsed ? "center" : "flex-start",
								}}
								onMouseEnter={(e) => {
									if (!isActive) {
										const el = e.currentTarget as HTMLElement;
										el.style.background = "rgba(255,255,255,0.06)";
										el.style.color = "rgba(255,255,255,0.85)";
									}
								}}
								onMouseLeave={(e) => {
									if (!isActive) {
										const el = e.currentTarget as HTMLElement;
										el.style.background = "transparent";
										el.style.color = "rgba(255,255,255,0.5)";
									}
								}}
							>
								<i
									className={`ti ti-${item.icon}`}
									style={{ fontSize: 17, flexShrink: 0 }}
								/>
								{!collapsed && <span>{i18n._(item.label)}</span>}
							</button>
						);
					})}
			</div>

			{/* AI Mode button */}
			{!collapsed && (
				<div style={{ padding: "0 0.75rem 0.75rem" }}>
					<button
						style={{
							width: "100%",
							background: "var(--color-brand)",
							border: "none",
							borderRadius: 8,
							color: "#fff",
							fontFamily: "inherit",
							fontSize: 12,
							fontWeight: 500,
							padding: "10px 14px",
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							gap: 8,
						}}
					>
						<i
							className="ti ti-bolt"
							style={{ fontSize: 15 }}
						/>{" "}
						<Trans>AI Mode</Trans>
					</button>
				</div>
			)}

			{/* Bottom: user info + logout */}
			<div
				style={{
					padding: "0.75rem",
					borderTop: "0.5px solid rgba(255,255,255,0.08)",
					display: "flex",
					flexDirection: "column",
					gap: 2,
				}}
			>
				{!collapsed && (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 8,
							padding: "8px 10px",
							borderRadius: 8,
						}}
					>
						<div
							style={{
								width: 28,
								height: 28,
								borderRadius: "50%",
								background: "var(--color-brand)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: 11,
								fontWeight: 500,
								color: "#fff",
								flexShrink: 0,
							}}
						>
							{initials}
						</div>
						<div style={{ minWidth: 0 }}>
							<div
								style={{
									fontSize: 12,
									fontWeight: 500,
									color: "var(--sidebar-text-active)",
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
								}}
							>
								{user?.firstName} {user?.lastName}
							</div>
							<div
								style={{
									fontSize: 10,
									color: "var(--sidebar-text)",
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
								}}
							>
								{user?.role ? i18n._(ROLE_TRANSLATIONS[user.role]) : ""}
							</div>
						</div>
					</div>
				)}
				{/* Help Center button */}
{!isSuperAdmin && (
  <button
    onClick={() => setShowHelp(true)}
    title={collapsed ? t`Help` : ""}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: collapsed ? "9px 14px" : "8px 10px",
      borderRadius: 8,
      cursor: "pointer",
      border: "none",
      background: "transparent",
      color: "var(--sidebar-text)",
      fontFamily: "inherit",
      fontSize: 12,
      justifyContent: collapsed ? "center" : "flex-start",
    }}
  >
    <i className="ti ti-help-circle" style={{ fontSize: 16 }} />
    {!collapsed && t`Help & Support`}
  </button>
)}
				<button
					onClick={logout}
					title={collapsed ? t`Logout` : ""}
					style={{
						display: "flex",
						alignItems: "center",
						gap: 8,
						padding: collapsed ? "9px 14px" : "8px 10px",
						borderRadius: 8,
						cursor: "pointer",
						border: "none",
						background: "transparent",
						color: "var(--sidebar-text)",
						fontFamily: "inherit",
						fontSize: 12,
						justifyContent: collapsed ? "center" : "flex-start",
					}}
				>
					<i
						className="ti ti-logout"
						style={{ fontSize: 16 }}
					/>
					{!collapsed && t`Logout`}
				</button>
			</div>
			{showHelp && (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  }}>
    <div style={{
      background: "#fff", borderRadius: 16, width: "100%", maxWidth: 440,
      padding: "1.75rem", boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
    }}>
      {helpSent ? (
        <div style={{ textAlign: "center", padding: "2rem 0" }}>
          <i className="ti ti-circle-check" style={{ fontSize: 48, color: S.green, display: "block", marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: S.dark }}>Message sent!</div>
          <div style={{ fontSize: 13, color: S.textMuted, marginTop: 4 }}>We'll get back to you soon.</div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: S.dark }}>Help & Support</div>
              <div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>Send a message to our team</div>
            </div>
            <button onClick={() => setShowHelp(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: S.textMuted }}>×</button>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: S.dark, marginBottom: 5 }}>Subject</label>
            <input
              value={helpForm.subject}
              onChange={e => setHelpForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="What do you need help with?"
              style={{ width: "100%", boxSizing: "border-box", height: 38, padding: "0 12px", border: `1.5px solid ${S.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none" }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: S.dark, marginBottom: 5 }}>Message</label>
            <textarea
              value={helpForm.message}
              onChange={e => setHelpForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Describe your issue in detail..."
              rows={4}
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: `1.5px solid ${S.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setShowHelp(false)} style={{ padding: "9px 18px", borderRadius: 8, border: `1.5px solid ${S.border}`, background: "transparent", color: S.textMuted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              Cancel
            </button>
            <button
              onClick={handleHelpSubmit}
              disabled={helpLoading || !helpForm.subject || !helpForm.message}
              style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: S.purple, color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, opacity: helpLoading ? 0.7 : 1 }}
            >
              {helpLoading && <i className="ti ti-loader-2" style={{ fontSize: 14, animation: "spin 1s linear infinite" }} />}
              Send message
            </button>
          </div>
        </>
      )}
    </div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
)}
		</div>
	);
}
