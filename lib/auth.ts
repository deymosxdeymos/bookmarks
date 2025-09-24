import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { pool } from "@/lib/db";

// Validate environment variables in production
const baseURL =
	process.env.BETTER_AUTH_URL ||
	process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
	"http://localhost:3000";
if (
	!process.env.BETTER_AUTH_URL &&
	!process.env.NEXT_PUBLIC_BETTER_AUTH_URL &&
	process.env.NODE_ENV === "production"
) {
	console.warn(
		"BETTER_AUTH_URL or NEXT_PUBLIC_BETTER_AUTH_URL should be set in production",
	);
}

export const auth = betterAuth({
	database: pool,
	emailAndPassword: {
		enabled: true,
	},
	plugins: [nextCookies()],
	baseURL,
	secret: process.env.BETTER_AUTH_SECRET,
	session: {
		// Re-enable cookie cache for middleware performance
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60, // 5 minutes
		},
	},
});
