import { NextRequest, NextResponse } from "next/server";

const defaultLocale = "en"; // your default
const locales = ["en", "ar"]; // all supported

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Check if the pathname already has a locale
	const hasLocale = locales.some(
		(locale) =>
			pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
	);

	if (!hasLocale) {
		// Redirect / → /en  (or /ar etc.)
		return NextResponse.redirect(
			new URL(`/${defaultLocale}${pathname}`, request.url),
		);
	}
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
