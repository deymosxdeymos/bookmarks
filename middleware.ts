import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
	const url = request.nextUrl;
	const pathname = url.pathname;

	// Use the same session validation as pages
	const session = await auth.api.getSession({
		headers: request.headers,
	});
	const isAuthenticated = Boolean(session);

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
