import { type NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
	const url = request.nextUrl;
	const pathname = url.pathname;

	// Check for session token cookie (better-auth uses this name)
	const sessionCookie = request.cookies.get("better-auth.session_token");
	// Only consider authenticated if cookie exists AND has a value
	const isAuthenticated = Boolean(
		sessionCookie?.value && sessionCookie.value.length > 0,
	);

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
