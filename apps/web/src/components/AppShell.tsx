"use client";

import AppControls from "@/components/AppControls";

export function AppShell({ children }: { children: React.ReactNode }) {
	return (
		<>
			<AppControls />
			{children}
		</>
	);
}
