"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useLingui } from "@lingui/react/macro";

export default function Navbar() {
	const { user, loading, logout } = useAuth();
	const router = useRouter();
	const { t } = useLingui();

	async function handleLogout() {
		await logout();
		router.push("/");
	}

	const linkCls =
		"text-[14px] font-medium no-underline transition-colors px-1 hover:opacity-100 opacity-70";

	return (
		<div className="fixed top-0 left-0 right-0 z-[100] flex justify-center pt-4 px-4 pointer-events-none">
			<nav
				className="pointer-events-auto flex items-center gap-5 px-3 py-2 rounded-full border shadow-md backdrop-blur-md"
				style={{
					background: "var(--nav-bg)",
					borderColor: "var(--nav-border)",
					color: "var(--page-text)",
				}}
			>
				<Link href="/" className="flex items-center gap-2 no-underline pl-1 pr-2">
					<div className="relative w-6 h-5 shrink-0">
						<div
							className="absolute left-0 top-0 w-3.5 h-3.5 rounded-sm opacity-90"
							style={{ background: "var(--page-text)" }}
						/>
						<div
							className="absolute left-1.75 top-1.25 w-3.5 h-3.5 rounded-sm opacity-40"
							style={{ background: "var(--page-text)" }}
						/>
					</div>
					<span className="text-[15px] font-semibold tracking-tight">
						SupportNest
					</span>
				</Link>

				<div
					className="w-px h-4 shrink-0"
					style={{ background: "var(--nav-border)" }}
				/>

				<Link href="/pricing" className={linkCls}>
					{t`Pricing`}
				</Link>
				<Link href="/about" className={linkCls}>
					{t`About`}
				</Link>
				<Link href="/contact" className={linkCls}>
					{t`Contact`}
				</Link>

				{!loading && user ? (
					<>
						<Link href="/dashboard" className={linkCls}>
							{t`Dashboard`}
						</Link>
						<button
							type="button"
							onClick={handleLogout}
							className={`${linkCls} bg-transparent border-none cursor-pointer`}
						>
							{t`Logout`}
						</button>
					</>
				) : (
					!loading && (
						<Link href="/login" className={linkCls}>
							{t`Log in`}
						</Link>
					)
				)}

				{!loading && !user && (
					<Link
						href="/pricing"
						className="text-[14px] font-semibold no-underline px-5 py-1.75 rounded-full ml-1 shrink-0"
						style={{
							background: "var(--btn-primary-bg)",
							color: "var(--btn-primary-text)",
						}}
					>
						{t`Get Started`}
					</Link>
				)}
			</nav>
		</div>
	);
}
