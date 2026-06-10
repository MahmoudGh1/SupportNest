import { NextRequest, NextResponse } from "next/server";

const PUBLIC = ["/login", "/register"];
const ONBOARD = "/setup";

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

	// // We use sessionStorage (client-side only), so middleware just handles
	// // the root redirect. Client-side ProtectedRoute handles the rest.
	// if (pathname === "/") {
	// 	return NextResponse.redirect(new URL("/login", request.url));
	// }
	// return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
