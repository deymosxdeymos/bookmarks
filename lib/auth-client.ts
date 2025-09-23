import { createAuthClient } from "better-auth/react";

// Use same base URL resolution logic as server
const baseURL =
	process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
	process.env.BETTER_AUTH_URL ||
	"http://localhost:3000";

export const authClient = createAuthClient({
	baseURL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
