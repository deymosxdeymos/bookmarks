import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
	const url = request.nextUrl;
	const pathname = url.pathname;

	try {
		// Use same session validation as pages for consistency
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		const isAuthenticated = Boolean(session);

		// Add logging for debugging
		console.log(
			`[Middleware] ${pathname} - Auth: ${isAuthenticated}, Prod: ${process.env.NODE_ENV === "production"}`,
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
