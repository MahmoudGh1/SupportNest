"use client";

import AppControls from "@/components/AppControls";
import { NavigationSpinner } from "./NavigationSpinner.tsx";

export function AppShell({ children }: { children: React.ReactNode }) {
	return (
		<>
			<NavigationSpinner />
			<AppControls />
			{children}
		</>
	);
}
