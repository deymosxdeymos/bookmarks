import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
	const url = request.nextUrl;
	const pathname = url.pathname;

	const sessionCookie = request.cookies.get("better-auth.session_token");
	const isAuthenticated = Boolean(sessionCookie?.value);

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
