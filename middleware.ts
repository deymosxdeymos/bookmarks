import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
	const url = request.nextUrl;
	const pathname = url.pathname;

	try {
		// Use cookie-based session validation with default Better Auth configuration
		const sessionCookie = getSessionCookie(request);
		const isAuthenticated = Boolean(sessionCookie);

		// Add logging for debugging
		console.log(
			`[Middleware] ${pathname} - Auth: ${isAuthenticated}, Cookie: ${sessionCookie ? "exists" : "missing"}`,
		);

		const isPublicAuthRoute =
			pathname === "/" ||
			pathname.startsWith("/login") ||
			pathname.startsWith("/sign-up");
		const isProtectedRoute = pathname.startsWith("/dashboard");

		if (isPublicAuthRoute && isAuthenticated) {
			console.log(
				`[Middleware] Redirecting authenticated user from ${pathname} to /dashboard`,
			);
			url.pathname = "/dashboard";
			return NextResponse.redirect(url);
		}

		if (isProtectedRoute && !isAuthenticated) {
			console.log(
				`[Middleware] Redirecting unauthenticated user from ${pathname} to /login`,
			);
			url.pathname = "/login";
			return NextResponse.redirect(url);
		}

		return NextResponse.next();
	} catch (error) {
		console.error(`[Middleware] Session validation failed:`, error);
		// Fail open - allow request to continue and let pages handle auth
		return NextResponse.next();
	}
}

export const config = {
	matcher: ["/", "/login", "/sign-up", "/dashboard/:path*"],
};
