import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type SupabaseServerClient = ReturnType<typeof createServerClient>;

const disabledClientMessage =
	"Supabase server client is disabled in development. Set NEXT_PUBLIC_USE_SUPABASE=true with credentials to enable it locally.";

let disabledClient: SupabaseServerClient | undefined;
let warnedAboutDisabledClient = false;

function createDisabledClient(): SupabaseServerClient {
	const handler: ProxyHandler<Record<string, unknown>> = {
		get(_target, property) {
			if (
				property === Symbol.toStringTag ||
				property === "inspect" ||
				property === Symbol.for("nodejs.util.inspect.custom")
			) {
				return () => "SupabaseServerClient<disabled>";
			}

			if (!warnedAboutDisabledClient) {
				warnedAboutDisabledClient = true;
				console.warn(disabledClientMessage);
			}

			throw new Error(disabledClientMessage);
		},
	};

	return new Proxy({}, handler) as SupabaseServerClient;
}

export async function createClient(): Promise<SupabaseServerClient> {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
	const devOverride = process.env.NEXT_PUBLIC_USE_SUPABASE === "true";
	const supabaseConfigured = Boolean(supabaseUrl && supabaseKey);
	const shouldUseSupabase =
		(process.env.NODE_ENV === "production" || devOverride) &&
		supabaseConfigured;

	if (process.env.NODE_ENV === "production" && !supabaseConfigured) {
		throw new Error("Missing Supabase environment variables");
	}

	if (devOverride && !supabaseConfigured) {
		throw new Error(
			"Supabase override requested for development but credentials are missing",
		);
	}

	if (!shouldUseSupabase) {
		if (!disabledClient) {
			disabledClient = createDisabledClient();
		}
		return disabledClient;
	}

	const cookieStore = await cookies();
	return createServerClient(supabaseUrl as string, supabaseKey as string, {
		cookies: {
			getAll() {
				return cookieStore.getAll();
			},
			setAll(cookiesToSet) {
				try {
					for (const { name, value, options } of cookiesToSet) {
						cookieStore.set(name, value, options);
					}
				} catch {}
			},
		},
	});
}
