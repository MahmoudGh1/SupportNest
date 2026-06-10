"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/app/providers";

interface LocaleContextType {
	locale: Locale;
	setLocale: (locale: Locale) => void;
}

export const LocaleContext = createContext<LocaleContextType | undefined>({
	locale: "en",
	setLocale: () => {},
});

export function useLocale() {
	const ctx = useContext(LocaleContext);
	if (!ctx) throw new Error("useLocale must be used within Providers");
	return ctx;
}
