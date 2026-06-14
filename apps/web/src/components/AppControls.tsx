"use client";

import { useTheme } from "@/context/theme-context";
import { useLocale } from "@/context/local-context";
import { useLingui } from "@lingui/react/macro";

export default function AppControls() {
	const { theme, toggleTheme } = useTheme();
	const { locale, setLocale } = useLocale();
	const { t } = useLingui();

	return (
		<div
			className="fixed top-4 end-4 z-[200] flex items-center gap-1.5 p-1 rounded-full border shadow-lg backdrop-blur-md"
			style={{
				background: "var(--control-bg)",
				borderColor: "var(--control-border)",
			}}
		>
			<button
				type="button"
				onClick={() => setLocale(locale === "en" ? "ar" : "en")}
				className="text-[12px] font-semibold px-3 py-1.5 rounded-full border-none cursor-pointer transition-colors"
				style={{ color: "var(--page-text)", background: "transparent" }}
				aria-label={t`Change language`}
			>
				{locale === "en" ? "العربية" : "English"}
			</button>
			<div
				className="w-px h-4"
				style={{ background: "var(--control-border)" }}
			/>
			<button
				type="button"
				onClick={toggleTheme}
				className="text-[15px] w-8 h-8 flex items-center justify-center rounded-full border-none cursor-pointer transition-colors"
				style={{ color: "var(--page-text)", background: "transparent" }}
				aria-label={t`Toggle theme`}
			>
				{theme === "dark" ? "☀" : "☾"}
			</button>
		</div>
	);
}
