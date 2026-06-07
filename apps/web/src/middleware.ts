import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // "/" → landing page (no redirect needed, (marketing)/page.tsx handles it)
  // All auth protection is handled client-side by ProtectedRoute component
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
