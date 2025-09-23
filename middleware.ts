import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
	const url = request.nextUrl;
	const pathname = url.pathname;

	const sessionCookie = getSessionCookie(request);
	const isAuthenticated = Boolean(sessionCookie);

	const isPublicAuthRoute =
		pathname === "/" ||
		pathname.startsWith("/login") ||
		pathname.startsWith("/sign-up");
	const isProtectedRoute = pathname.startsWith("/dashboard");

	if (isPublicAuthRoute && isAuthenticated) {
		url.pathname = "/dashboard";
		return NextResponse.redirect(url);
	}

	if (isProtectedRoute && !isAuthenticated) {
		url.pathname = "/login";
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/", "/login", "/sign-up", "/dashboard/:path*"],
};
