import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, locales } from "@/lib/routes";

function pathnameHasLocale(pathname: string) {
	return locales.some(
		(locale) =>
			pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
	);
}

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (pathnameHasLocale(pathname)) {
		// Hide default locale in the browser URL
		if (pathname === `/${defaultLocale}`) {
			return NextResponse.redirect(new URL("/", request.url));
		}
		if (pathname.startsWith(`/${defaultLocale}/`)) {
			const cleanPath =
				pathname.slice(`/${defaultLocale}`.length) || "/";
			return NextResponse.redirect(new URL(cleanPath, request.url));
		}
		return NextResponse.next();
	}

	// Internally serve default-locale routes without changing the visible URL
	const url = request.nextUrl.clone();
	url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
	return NextResponse.rewrite(url);
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
