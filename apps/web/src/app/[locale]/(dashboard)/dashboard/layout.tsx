"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { localePath, stripLocale, type AppLocale } from "@/lib/routes";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { ProtectedRoute } from "@/components/protected-route";
import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

export const getPageMeta = (): Record<string, string> => ({
	"/dashboard": t`Overview`,
	"/dashboard/conversations": t`Conversations`,
	"/dashboard/team": t`Team`,
	"/dashboard/tickets": t`Tickets`,
	"/dashboard/knowledge": t`Knowledge Base`,
	"/dashboard/tools": t`API Tools`,
	"/dashboard/analytics": t`Analytics`,
	"/dashboard/admin": t`Overview`,
	"/dashboard/organizations": t`Organizations`,
	"/dashboard/settings": t`Settings`,
	"/dashboard/profile": t`Profile`,
});

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { i18n } = useLingui();
	const locale = i18n.locale;
	const pathname = usePathname();
	const router = useRouter();
	const [collapsed, setCollapsed] = useState(false);

	const { pathname: pathnameWithoutLocale } = stripLocale(pathname);
	// Map pathname → sidebar page key
	const currentPage =
		pathnameWithoutLocale.replace("/dashboard", "").replace("/", "") ||
		"dashboard";

	const handleNavigate = (page: string) => {
		const path = page === "dashboard" ? "/dashboard" : `/dashboard/${page}`;
		router.push(localePath(path, locale as AppLocale));
	};

	const title = getPageMeta()[pathnameWithoutLocale] ?? t`Dashboard`;

	return (
		<ProtectedRoute>
			<div
				style={{
					display: "flex",
					height: "100vh",
					overflow: "hidden",
					fontFamily: "'Sora', system-ui, sans-serif",
				}}
			>
				<Sidebar
					currentPage={currentPage}
					onNavigate={handleNavigate}
					collapsed={collapsed}
					onToggle={() => setCollapsed((c) => !c)}
				/>
				<div
					style={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						overflow: "hidden",
					}}
				>
					<Topbar
						pageTitle={title}
						onToggleSidebar={() => setCollapsed((c) => !c)}
					/>
					<div style={{ flex: 1, overflow: "auto", background: "var(--color-bg-soft)" }}>
						{children}
					</div>
				</div>
			</div>
		</ProtectedRoute>
	);
}
