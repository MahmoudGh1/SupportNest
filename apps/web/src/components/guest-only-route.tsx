"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { PageLoader } from "@/components/ui";

/** Redirect authenticated users away from login/register. */
export function GuestAuthRoute({ children }: { children: React.ReactNode }) {
	const { user, loading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (loading) return;
		if (user) router.replace("/");
	}, [user, loading, router]);

	if (loading) return <PageLoader />;
	if (user) return null;
	return <>{children}</>;
}

/** Payment: require login; block if subscription already active. */
export function PaymentRoute({ children }: { children: React.ReactNode }) {
	const { user, loading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (loading) return;
		if (!user) {
			router.replace("/login");
			return;
		}
		if (user.hasActiveSubscription) {
			router.replace("/");
		}
	}, [user, loading, router]);

	if (loading) return <PageLoader />;
	if (!user || user.hasActiveSubscription) return null;
	return <>{children}</>;
}
