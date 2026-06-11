"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

const PUBLIC_LINKS: [string, string][] = [
	["Pricing", "/pricing"],
	["About", "/about"],
	["Contact", "/contact"],
];

export default function Navbar() {
	const [scrolled, setScrolled] = useState(false);
	const { user, loading, logout } = useAuth();
	const router = useRouter();

	useEffect(() => {
		const fn = () => setScrolled(window.scrollY > 30);
		window.addEventListener("scroll", fn);
		return () => window.removeEventListener("scroll", fn);
	}, []);

	async function handleLogout() {
		await logout();
		router.push("/");
	}

	const displayName = user
		? `${user.firstName} ${user.lastName}`.trim()
		: "";

	return (
		<div className="fixed top-0 left-0 right-0 z-100 flex justify-center pt-4 px-4">
			<nav
				className={`
          flex items-center gap-6 px-3 py-2 rounded-full
          bg-white border border-black/9
          transition-all duration-300
          ${
						scrolled
							? "shadow-[0_8px_32px_rgba(0,0,0,0.10)]"
							: "shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
					}
        `}
			>
				<Link
					href="/"
					className="flex items-center gap-2 no-underline pl-1 pr-2"
				>
					<div className="relative w-6 h-5 shrink-0">
						<div className="absolute left-0 top-0 w-3.5 h-3.5 rounded-sm bg-[#111] opacity-90" />
						<div className="absolute left-1.75 top-1.25 w-3.5 h-3.5 rounded-sm bg-[#111] opacity-40" />
					</div>
					<span className="text-[#0d0d0d] text-[15px] font-semibold tracking-tight">
						SupportNest
					</span>
				</Link>

				<div className="w-px h-4 bg-black/10 shrink-0" />

				{PUBLIC_LINKS.map(([label, href]) => (
					<Link
						key={label}
						href={href}
						className="text-black/45 hover:text-black text-[14px] font-medium no-underline transition-colors duration-150 px-1"
					>
						{label}
					</Link>
				))}

				{!loading && user ? (
					<>
						<Link
							href="/dashboard"
							className="text-black/55 hover:text-black text-[14px] font-medium no-underline px-1"
						>
							{displayName}
						</Link>
						<button
							type="button"
							onClick={handleLogout}
							className="text-black/45 hover:text-black text-[14px] font-medium bg-transparent border-none cursor-pointer px-1"
						>
							Logout
						</button>
					</>
				) : (
					!loading && (
						<Link
							href="/login"
							className="text-black/45 hover:text-black text-[14px] font-medium no-underline transition-colors duration-150 px-1"
						>
							Log in
						</Link>
					)
				)}

				{user?.hasActiveSubscription ? (
					<Link
						href="/dashboard"
						className="bg-[#111] hover:bg-black text-white text-[14px] font-semibold no-underline px-5 py-1.75 rounded-full ml-1 shrink-0 transition-all duration-150"
					>
						Dashboard
					</Link>
				) : (
					<Link
						href="/pricing"
						className="bg-[#111] hover:bg-black text-white text-[14px] font-semibold no-underline px-5 py-1.75 rounded-full ml-1 shrink-0 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
					>
						Get Started
					</Link>
				)}
			</nav>
		</div>
	);
}
