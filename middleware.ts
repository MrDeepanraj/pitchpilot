import { NextRequest, NextResponse } from "next/server";

// Dummy auth gate: any page except /login, /signup and the public /form/* pages
// requires a session cookie; otherwise redirect to /login.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sid = req.cookies.get("sid")?.value;
  const isPublic = pathname === "/login" || pathname === "/signup" || pathname.startsWith("/form");

  // Only guard protected pages. We intentionally do NOT redirect authenticated
  // users away from /login — a stale cookie (e.g. after a DB reset) referencing a
  // missing seller must not bounce between /login and the app layout.
  if (!sid && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
