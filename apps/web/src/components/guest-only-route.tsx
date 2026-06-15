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
        // Only redirect to dashboard if fully onboarded AND has active subscription
        if (user && user.onboarded && user.hasActiveSubscription) {
            router.replace("/dashboard");
        }
        // If logged in but no subscription yet, send them to payment
        if (user && user.onboarded && !user.hasActiveSubscription) {
            router.replace("/payment");
        }
    }, [user, loading, router]);

    if (loading) return <PageLoader />;
    if (user && user.onboarded && user.hasActiveSubscription) return null;
    if (user && user.onboarded && !user.hasActiveSubscription) return null;
    return <>{children}</>;
}

/** Payment: only for logged-in users who haven't paid yet. */
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
            router.replace("/dashboard");
        }
    }, [user, loading, router]);

    if (loading) return <PageLoader />;
    if (!user || user.hasActiveSubscription) return null;
    return <>{children}</>;
}