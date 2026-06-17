"use client";

import { useState } from "react";
import { useTheme } from "@/context/theme-context";
import { useLocale } from "@/context/local-context";
import { useLingui } from "@lingui/react/macro";

export default function AppControls() {
    const { theme, toggleTheme } = useTheme();
    const { locale, setLocale } = useLocale();
    const { t } = useLingui();
    
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className={`fixed top-24 end-0 z-[200] flex items-center rounded-s-2xl border border-e-0 shadow-lg backdrop-blur-md transition-all duration-300 ${
                isOpen ? "opacity-100 translate-x-0" : "opacity-50"
            }`}
            style={{
                background: "var(--control-bg)",
                borderColor: "var(--control-border)",
            }}
        >
            {/* Arrow Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-9 h-10 flex items-center justify-center border-none cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-s-2xl"
                aria-label={isOpen ? t`Close controls` : t`Open controls`}
            >
                {/* Pure CSS Professional Chevron */}
                <span 
                    className={`w-2 h-2 border-b-2 border-l-2 transition-transform duration-300 transform ${
                        isOpen 
                            ? "rotate-[225deg] translate-x-0.5"
                            : "rotate-45 translate-x-[-1px]"
                    }`}
                    style={{ borderColor: "var(--page-text)" }}
                />
            </button>

            {/* Expandable Controls Panel */}
            <div
                className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${
                    isOpen ? "max-w-[200px] px-3 h-10" : "max-w-0 opacity-0 pointer-events-none"
                }`}
            >
                {/* Separator */}
                <div
                    className="w-px h-4"
                    style={{ background: "var(--control-border)" }}
                />

                {/* Language Switcher */}
                <button
                    type="button"
                    onClick={() => setLocale(locale === "en" ? "ar" : "en")}
                    className="text-[12px] font-semibold px-2 py-1.5 rounded-full border-none cursor-pointer whitespace-nowrap"
                    style={{ color: "var(--page-text)", background: "transparent" }}
                    aria-label={t`Change language`}
                >
                    {locale === "en" ? "العربية" : "English"}
                </button>

                {/* Separator */}
                <div
                    className="w-px h-4"
                    style={{ background: "var(--control-border)" }}
                />

                {/* Theme Switcher */}
                <button
                    type="button"
                    onClick={toggleTheme}
                    className="text-[15px] w-8 h-8 flex items-center justify-center rounded-full border-none cursor-pointer"
                    style={{ color: "var(--page-text)", background: "transparent" }}
                    aria-label={t`Toggle theme`}
                >
                    {theme === "dark" ? "☀" : "☾"}
                </button>
            </div>
        </div>
    );
}
