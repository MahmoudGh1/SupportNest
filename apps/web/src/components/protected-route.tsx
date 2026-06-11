"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { PageLoader } from "@/components/ui";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const { user, loading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (loading) return;
		if (!user) {
			router.replace("/login");
			return;
		}
		// if (!user.onboarded) {
		// 	router.replace("/setup");
		// 	return;
		// }
	}, [user, loading, router]);

	if (loading) return <PageLoader />;
	if (!user) return null;
	return <>{children}</>;
}
