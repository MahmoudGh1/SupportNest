"use client";

import AppControls from "@/components/AppControls";
import { NavigationSpinner } from "./NavigationSpinner";

export function AppShell({ children }: { children: React.ReactNode }) {
	return (
		<>
			<NavigationSpinner />
			<AppControls />
			{children}
		</>
	);
}
