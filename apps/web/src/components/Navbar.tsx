"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useTheme } from "@/context/theme-context";

const PUBLIC_LINKS: [string, string][] = [
	["Pricing", "/pricing"],
	["About", "/about"],
	["Contact", "/contact"],
];

export default function Navbar() {
	const [scrolled, setScrolled] = useState(false);
	const { user, loading, logout } = useAuth();
	const { theme, toggleTheme } = useTheme();
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

	const isDark = theme === "dark";

	return (
		<div className="fixed top-0 left-0 right-0 z-100 flex justify-center pt-4 px-4">
			<nav
				className={`
          flex items-center gap-5 px-3 py-2 rounded-full border transition-all duration-300
          ${
						isDark
							? "bg-[#161616] border-white/10 text-white"
							: "bg-white border-black/9 text-[#0d0d0d]"
					}
          ${
						scrolled
							? "shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
							: "shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
					}
        `}
			>
				<Link href="/" className="flex items-center gap-2 no-underline pl-1 pr-2">
					<div className="relative w-6 h-5 shrink-0">
						<div
							className={`absolute left-0 top-0 w-3.5 h-3.5 rounded-sm opacity-90 ${isDark ? "bg-white" : "bg-[#111]"}`}
						/>
						<div
							className={`absolute left-1.75 top-1.25 w-3.5 h-3.5 rounded-sm opacity-40 ${isDark ? "bg-white" : "bg-[#111]"}`}
						/>
					</div>
					<span className="text-[15px] font-semibold tracking-tight">SupportNest</span>
				</Link>

				<div className={`w-px h-4 shrink-0 ${isDark ? "bg-white/10" : "bg-black/10"}`} />

				{PUBLIC_LINKS.map(([label, href]) => (
					<Link
						key={label}
						href={href}
						className={`text-[14px] font-medium no-underline transition-colors px-1 ${
							isDark ? "text-white/50 hover:text-white" : "text-black/45 hover:text-black"
						}`}
					>
						{label}
					</Link>
				))}

				<button
					type="button"
					onClick={toggleTheme}
					className={`text-[14px] font-medium bg-transparent border-none cursor-pointer px-1 ${
						isDark ? "text-white/50 hover:text-white" : "text-black/45 hover:text-black"
					}`}
					aria-label="Toggle theme"
				>
					{isDark ? "☀" : "☾"}
				</button>

				{!loading && user ? (
					<>
						<Link
							href="/dashboard"
							className={`text-[14px] font-medium no-underline px-1 ${
								isDark ? "text-white/70 hover:text-white" : "text-black/55 hover:text-black"
							}`}
						>
							Dashboard
						</Link>
						<button
							type="button"
							onClick={handleLogout}
							className={`text-[14px] font-medium bg-transparent border-none cursor-pointer px-1 ${
								isDark ? "text-white/50 hover:text-white" : "text-black/45 hover:text-black"
							}`}
						>
							Logout
						</button>
					</>
				) : (
					!loading && (
						<>
							<Link
								href="/login"
								className={`text-[14px] font-medium no-underline px-1 ${
									isDark ? "text-white/50 hover:text-white" : "text-black/45 hover:text-black"
								}`}
							>
								Log in
							</Link>
							<Link
								href="/pricing"
								className={`text-[14px] font-semibold no-underline px-5 py-1.75 rounded-full ml-1 shrink-0 ${
									isDark ? "bg-white text-[#111] hover:bg-white/90" : "bg-[#111] text-white hover:bg-black"
								}`}
							>
								Get Started
							</Link>
						</>
					)
				)}
			</nav>
		</div>
	);
}
