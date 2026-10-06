import { NextResponse, type NextRequest } from "next/server";

// Only an early redirect for visitors with no session cookie. It doesn't validate the
// session: every admin page and server action does that itself via requireAdmin().
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  if (!request.cookies.has("tb_admin_session")) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
