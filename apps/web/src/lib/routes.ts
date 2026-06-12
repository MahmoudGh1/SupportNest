export const defaultLocale = "en";
export const locales = ["en", "ar"] as const;
export type AppLocale = (typeof locales)[number];

/** Build a user-facing path (no /en prefix for default locale). */
export function localePath(path: string, locale: AppLocale = defaultLocale): string {
	const normalized = path.startsWith("/") ? path : `/${path}`;
	if (locale === defaultLocale) {
		return normalized;
	}
	if (normalized === "/") {
		return `/${locale}`;
	}
	return `/${locale}${normalized}`;
}

/** Strip locale prefix from pathname; default locale has no visible prefix. */
export function stripLocale(pathname: string): {
	locale: AppLocale;
	pathname: string;
} {
	const segments = pathname.split("/").filter(Boolean);
	if (segments[0] === "ar") {
		const rest = segments.slice(1).join("/");
		return { locale: "ar", pathname: rest ? `/${rest}` : "/" };
	}
	if (segments[0] === "en") {
		const rest = segments.slice(1).join("/");
		return { locale: "en", pathname: rest ? `/${rest}` : "/" };
	}
	return { locale: defaultLocale, pathname: pathname || "/" };
}

/** Map pricing plan display name to payment page query key. */
export function planNameToPaymentKey(name: string): string {
	const key = name.toLowerCase();
	if (key === "starter") return "starter";
	if (key === "pro" || key === "growth") return "growth";
	if (key === "enterprise") return "enterprise";
	return "growth";
}
