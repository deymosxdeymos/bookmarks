import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
	const url = request.nextUrl;
	const pathname = url.pathname;

	try {
		const sessionCookie = getSessionCookie(request);
		const isAuthenticated = Boolean(sessionCookie);

		const isPublicAuthRoute =
			pathname === "/" ||
			pathname.startsWith("/login") ||
			pathname.startsWith("/sign-up");
		const isProtectedRoute = pathname.startsWith("/dashboard");

		if (isPublicAuthRoute && isAuthenticated) {
			return NextResponse.redirect(new URL("/dashboard", request.url));
		}

		if (isProtectedRoute && !isAuthenticated) {
			return NextResponse.redirect(new URL("/login", request.url));
		}

		return NextResponse.next();
	} catch (_error) {
		return NextResponse.next();
	}
}

export const config = {
	matcher: ["/", "/login", "/sign-up", "/dashboard/:path*"],
};
