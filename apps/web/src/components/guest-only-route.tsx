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
        if (user && !sessionStorage.getItem("pendingPaymentId")) {
            router.replace("/dashboard");
        }
    }, [user, loading, router]);

    if (loading) return <PageLoader />;
    if (user && !sessionStorage.getItem("pendingPaymentId")) return null;
    return <>{children}</>;
}

/** Payment: allow guests and subscribed users to view checkout states. */
export function PaymentRoute({ children }: { children: React.ReactNode }) {
	const { loading } = useAuth();

	if (loading) return <PageLoader />;
	return <>{children}</>;
}
