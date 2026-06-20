"use client";

import { I18nProvider } from "@lingui/react";
import { i18n } from "@lingui/core";
import { messages as enMessages } from "@/locales/en/messages";
import { messages as arMessages } from "@/locales/ar/messages";
import { useEffect } from "react";
import { LocaleContext } from "@/context/local-context";
import { usePathname, useRouter } from "next/navigation";
import { localePath, stripLocale, type AppLocale } from "@/lib/routes";
import { AppShell } from "@/components/AppShell";
import { GoogleOAuthProvider } from "@react-oauth/google";

export type Locale = "en" | "ar";
// console.log("Client ID:", process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

const catalogs = { en: enMessages, ar: arMessages } as const;

function activateLocale(locale: Locale) {
	i18n.load(locale, catalogs[locale]);
	i18n.activate(locale);
}

export function Providers({
	children,
	locale,
}: {
	children: React.ReactNode;
	locale: Locale;
}) {
	const router = useRouter();
	const pathname = usePathname();

	const setLocale = (newLocale: Locale) => {
		const { pathname: pathWithoutLocale } = stripLocale(pathname);
		router.push(localePath(pathWithoutLocale, newLocale as AppLocale));
	};

	useEffect(() => {
		activateLocale(locale);
	}, [locale]);

	return (
		<GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
			<I18nProvider i18n={i18n}>
				<LocaleContext.Provider value={{ locale, setLocale }}>
					<AppShell>{children}</AppShell>
				</LocaleContext.Provider>
			</I18nProvider>
		</GoogleOAuthProvider>
	);
}
