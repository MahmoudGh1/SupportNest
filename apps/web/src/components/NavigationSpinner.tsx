"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLoading } from "@/context/loading-context";

function CubeStack() {
	return (
		<svg width="64" height="80" viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
			<style>{`
				@keyframes cube-drop-1 {
					0%, 100% { transform: translateY(0px); opacity: 1; }
					33% { transform: translateY(-10px); opacity: 0.4; }
				}
				@keyframes cube-drop-2 {
					0%, 100% { transform: translateY(0px); opacity: 1; }
					50% { transform: translateY(-10px); opacity: 0.4; }
				}
				@keyframes cube-drop-3 {
					0%, 100% { transform: translateY(0px); opacity: 1; }
					66% { transform: translateY(-10px); opacity: 0.4; }
				}
				.cube-1 { animation: cube-drop-1 1.4s ease-in-out infinite; }
				.cube-2 { animation: cube-drop-2 1.4s ease-in-out infinite; }
				.cube-3 { animation: cube-drop-3 1.4s ease-in-out infinite; }
			`}</style>
			<g className="cube-1">
				<polygon points="32,2 52,13 32,24 12,13" fill="#7C6FE0" />
				<polygon points="32,24 52,13 52,30 32,41" fill="#4A3FB5" />
				<polygon points="32,24 12,13 12,30 32,41" fill="#6357CC" />
			</g>
			<g className="cube-2">
				<polygon points="32,28 52,39 32,50 12,39" fill="#5B4FC7" />
				<polygon points="32,50 52,39 52,56 32,67" fill="#352D8A" />
				<polygon points="32,50 12,39 12,56 32,67" fill="#4A3FB5" />
			</g>
			<g className="cube-3">
				<polygon points="32,54 52,65 32,76 12,65" fill="#3D3D5C" />
				<polygon points="32,76 52,65 52,78 32,80" fill="#252538" />
				<polygon points="32,76 12,65 12,78 32,80" fill="#2E2E4A" />
			</g>
		</svg>
	);
}

export function NavigationSpinner() {
	const pathname = usePathname();
	const [navLoading, setNavLoading] = useState(false);
	const { isLoading: dataLoading } = useLoading();

	useEffect(() => {
		setNavLoading(true);
		const timer = setTimeout(() => setNavLoading(false), 600);
		return () => clearTimeout(timer);
	}, [pathname]);

	if (!navLoading && !dataLoading) return null;

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 9999,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				background: "var(--page-bg, #0e0e1a)",
				gap: 20,
			}}
		>
			<CubeStack />
			<span
				style={{
					fontSize: 13,
					fontWeight: 500,
					color: "#6357CC",
					letterSpacing: "0.08em",
					fontFamily: "'Sora', system-ui, sans-serif",
					opacity: 0.8,
				}}
			>
				LOADING
			</span>
		</div>
	);
}