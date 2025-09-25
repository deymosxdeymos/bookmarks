import { createBrowserClient } from "@supabase/ssr";

type SupabaseBrowserClient = ReturnType<typeof createBrowserClient>;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const devOverride = process.env.NEXT_PUBLIC_USE_SUPABASE === "true";
const supabaseConfigured = Boolean(supabaseUrl && supabaseKey);
const shouldUseSupabase =
	(process.env.NODE_ENV === "production" || devOverride) && supabaseConfigured;

if (process.env.NODE_ENV === "production" && !supabaseConfigured) {
	throw new Error("Missing Supabase environment variables");
}

if (devOverride && !supabaseConfigured) {
	throw new Error(
		"Supabase override requested for development but credentials are missing",
	);
}

let browserClient: SupabaseBrowserClient | undefined;
let disabledClient: SupabaseBrowserClient | undefined;
let warnedAboutDisabledClient = false;

const disabledClientMessage =
	"Supabase client is disabled in development. Set NEXT_PUBLIC_USE_SUPABASE=true and provide credentials to enable it locally.";

function createDisabledClient(): SupabaseBrowserClient {
	const handler: ProxyHandler<Record<string, unknown>> = {
		get(_target, property) {
			if (
				property === Symbol.toStringTag ||
				property === "inspect" ||
				property === Symbol.for("nodejs.util.inspect.custom")
			) {
				return () => "SupabaseClient<disabled>";
			}

			if (!warnedAboutDisabledClient) {
				warnedAboutDisabledClient = true;
				console.warn(disabledClientMessage);
			}

			throw new Error(disabledClientMessage);
		},
	};

	return new Proxy({}, handler) as SupabaseBrowserClient;
}

export const createClient = () => {
	if (!shouldUseSupabase) {
		if (!disabledClient) {
			disabledClient = createDisabledClient();
		}
		return disabledClient;
	}

	if (!browserClient) {
		browserClient = createBrowserClient(
			supabaseUrl as string,
			supabaseKey as string,
		);
	}

	return browserClient;
};
