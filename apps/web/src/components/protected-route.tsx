"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { PageLoader } from "@/components/ui";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  // Strip locale prefix (e.g. /en/dashboard → /dashboard)
  const cleanPath = pathname.replace(/^\/(en|ar)/, "");

  const isSuperAdmin = user ? String(user.role).toUpperCase() === "SUPER_ADMIN" : false;

  // Super Admin on root dashboard → needs redirect
  const superAdminOnWrongPage = isSuperAdmin && cleanPath === "/dashboard";

  // Regular user on admin page → needs redirect
  const regularOnAdminPage = user && !isSuperAdmin && cleanPath.startsWith("/dashboard/admin");
  
  useEffect(() => {
	if (loading) return;
	if (!user) { router.replace("/login"); return; }
	if (superAdminOnWrongPage) { router.replace("/dashboard/admin"); return; }
	if (regularOnAdminPage)    { router.replace("/dashboard"); return; }  
  if (user.role === "ORG_ADMIN" && !user.hasActiveSubscription) {
			router.replace("/payment");
			return;
		}
  }, [user, loading, router, superAdminOnWrongPage, regularOnAdminPage]);
  
  // Show loader while auth is resolving
  if (loading) return <PageLoader />;

  // Not logged in
  if (!user) return null;
  
  if (user.role === "ORG_ADMIN" && !user.hasActiveSubscription) return null;

  // ── Block render until redirect happens ──────────────────────────────────
  // This prevents the flash — children never render if a redirect is pending
  if (superAdminOnWrongPage) return <PageLoader />;
  if (regularOnAdminPage)    return <PageLoader />;

  return <>{children}</>;
}



