"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useLingui } from "@lingui/react/macro";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { t } = useLingui();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.push("/");
    setMobileOpen(false);
  }

  const linkCls =
    "text-[14px] font-medium no-underline transition-colors px-1 hover:opacity-100 opacity-70";

  const mobileLinkCls =
    "text-[15px] font-medium no-underline transition-colors py-2 opacity-80 hover:opacity-100";

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center pt-4 px-4 pointer-events-none">
      <div className="pointer-events-auto flex flex-col items-center w-full sm:w-auto">
        <nav
          className="flex items-center gap-3 sm:gap-5 px-3 py-2 rounded-full border shadow-md backdrop-blur-md w-full sm:w-auto justify-between sm:justify-start"
          style={{
            background: "var(--nav-bg)",
            borderColor: "var(--nav-border)",
            color: "var(--page-text)",
          }}
        >
          <Link
            href="/"
            className="flex items-center gap-2 no-underline pl-1 pr-2 shrink-0"
          >
            <div className="relative w-6 h-5 shrink-0">
              <div
                className="absolute left-0 top-0 w-3.5 h-3.5 rounded-sm opacity-90"
                style={{ background: "var(--page-text)" }}
              />
              <div
                className="absolute left-1.75 top-1.25 w-3.5 h-3.5 rounded-sm opacity-40"
                style={{ background: "var(--page-text)" }}
              />
            </div>
            <span className="text-[15px] font-semibold tracking-tight whitespace-nowrap">
              SupportNest
            </span>
          </Link>

          <div
            className="hidden sm:block w-px h-4 shrink-0"
            style={{ background: "var(--nav-border)" }}
          />

          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-5">
            <Link href="/pricing" className={linkCls}>
              {t`Pricing`}
            </Link>
            <Link href="/about" className={linkCls}>
              {t`About`}
            </Link>
            <Link href="/contact" className={linkCls}>
              {t`Contact`}
            </Link>

            {!loading && user ? (
              <>
                <Link href="/dashboard" className={linkCls}>
                  {t`Dashboard`}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`${linkCls} bg-transparent border-none cursor-pointer`}
                >
                  {t`Logout`}
                </button>
              </>
            ) : (
              !loading && (
                <Link href="/login" className={linkCls}>
                  {t`Log in`}
                </Link>
              )
            )}

            {!loading && !user && (
              <Link
                href="/pricing"
                className="text-[14px] font-semibold no-underline px-5 py-1.75 rounded-full ml-1 shrink-0"
                style={{
                  background: "var(--btn-primary-bg)",
                  color: "var(--btn-primary-text)",
                }}
              >
                {t`Get Started`}
              </Link>
            )}
          </div>

          {/* Mobile: compact CTA + hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            {!loading && !user && (
              <Link
                href="/pricing"
                className="text-[13px] font-semibold no-underline px-4 py-1.5 rounded-full shrink-0"
                style={{
                  background: "var(--btn-primary-bg)",
                  color: "var(--btn-primary-text)",
                }}
              >
                {t`Get Started`}
              </Link>
            )}
            <button
              type="button"
              aria-label={mobileOpen ? t`Close menu` : t`Open menu`}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((prev) => !prev)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-transparent border-none cursor-pointer shrink-0"
              style={{ color: "var(--page-text)" }}
            >
              {mobileOpen ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </nav>

        {/* Mobile dropdown panel */}
        {mobileOpen && (
          <div
            className="sm:hidden mt-2 w-full flex flex-col px-5 py-3 rounded-2xl border shadow-md backdrop-blur-md"
            style={{
              background: "var(--nav-bg)",
              borderColor: "var(--nav-border)",
              color: "var(--page-text)",
            }}
          >
            <Link
              href="/pricing"
              className={mobileLinkCls}
              onClick={() => setMobileOpen(false)}
            >
              {t`Pricing`}
            </Link>
            <Link
              href="/about"
              className={mobileLinkCls}
              onClick={() => setMobileOpen(false)}
            >
              {t`About`}
            </Link>
            <Link
              href="/contact"
              className={mobileLinkCls}
              onClick={() => setMobileOpen(false)}
            >
              {t`Contact`}
            </Link>

            {!loading && user ? (
              <>
                <Link
                  href="/dashboard"
                  className={mobileLinkCls}
                  onClick={() => setMobileOpen(false)}
                >
                  {t`Dashboard`}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`${mobileLinkCls} bg-transparent border-none cursor-pointer text-left`}
                >
                  {t`Logout`}
                </button>
              </>
            ) : (
              !loading && (
                <Link
                  href="/login"
                  className={mobileLinkCls}
                  onClick={() => setMobileOpen(false)}
                >
                  {t`Log in`}
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
