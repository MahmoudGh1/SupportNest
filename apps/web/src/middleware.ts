import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC  = ["/login", "/register"]
const ONBOARD = "/setup"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  // We use sessionStorage (client-side only), so middleware just handles
  // the root redirect. Client-side ProtectedRoute handles the rest.
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
