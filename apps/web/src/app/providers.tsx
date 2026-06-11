"use client";

import { I18nProvider } from "@lingui/react";
import { i18n } from "@lingui/core";
import { messages } from "@/locales/en/messages";
import { useEffect, useState } from "react";
import { LocaleContext } from "@/context/local-context";
import { usePathname, useRouter } from "next/navigation";
import { localePath, stripLocale, type AppLocale } from "@/lib/routes";

export type Locale = "en" | "ar";

async function loadCatalog(locale: Locale) {
	const { messages } = await import(`@/locales/${locale}/messages`);
	i18n.load(locale, messages);
	i18n.activate(locale);
}

export function Providers({
	children,
	locale,
}: {
	children: React.ReactNode;
	locale: Locale;
}) {
	// const [locale, setLocale] = useState<Locale>("en");
	const [loaded, setLoaded] = useState(false);
	const router = useRouter();
	const pathname = usePathname();

	const setLocale = (newLocale: Locale) => {
		const { pathname: pathWithoutLocale } = stripLocale(pathname);
		router.push(localePath(pathWithoutLocale, newLocale as AppLocale));
	};

	useEffect(() => {
		loadCatalog(locale as Locale).then(() => setLoaded(true));
	}, [locale]);

	if (!loaded) return null;

	return (
		<I18nProvider i18n={i18n}>
			<LocaleContext.Provider value={{ locale, setLocale }}>
				<div dir={locale === "ar" ? "rtl" : "ltr"}>{children}</div>
			</LocaleContext.Provider>
		</I18nProvider>
	);
}
