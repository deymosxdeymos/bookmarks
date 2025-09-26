import { NextResponse } from "next/server";

export const runtime = "edge";

const ONE_DAY_SECONDS = 60 * 60 * 24;
const MAX_REDIRECTS = 3;
const REQUEST_TIMEOUT_MS = 7000;
const MAX_BYTES = 300_000; // ~300KB cap

function isBlockedHostname(hostname: string) {
	const lower = hostname.toLowerCase();
	if (lower === "localhost" || lower === "127.0.0.1" || lower === "::1")
		return true;
	// Common internal/reserved suffixes
	if (lower.endsWith(".local") || lower.endsWith(".internal")) return true;
	// IPv4 literal
	const ipv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
	if (ipv4.test(lower)) return true;
	// IPv6 literal
	if (lower.includes(":")) return true;
	return false;
}

function isAllowedUrl(u: URL) {
	if (u.protocol !== "https:" && u.protocol !== "http:") return false;
	if (isBlockedHostname(u.hostname)) return false;
	// Allow default ports for both HTTP (80) and HTTPS (443)
	if (u.port && u.port !== "443" && u.port !== "80") return false;
	return true;
}

async function fetchWithGuards(inputUrl: URL): Promise<Response> {
	let current = inputUrl;
	for (let i = 0; i <= MAX_REDIRECTS; i++) {
		if (!isAllowedUrl(current)) {
			return new Response(JSON.stringify({ error: "URL not allowed" }), {
				status: 400,
				headers: { "content-type": "application/json" },
			});
		}

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
		try {
			const res = await fetch(current.toString(), {
				redirect: "manual",
				headers: {
					"user-agent":
						"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
					accept: "text/html,application/xhtml+xml",
					"accept-language": "en-US,en;q=0.9",
				},
				signal: controller.signal,
			});
			clearTimeout(timeout);

			// Follow safe redirects manually
			if (res.status >= 300 && res.status < 400) {
				const location = res.headers.get("location");
				if (!location) {
					return new Response(
						JSON.stringify({ error: "Redirect without location" }),
						{
							status: 502,
							headers: { "content-type": "application/json" },
						},
					);
				}
				const nextUrl = new URL(location, current);
				current = nextUrl;
				continue;
			}

			return res;
		} catch (_error) {
			clearTimeout(timeout);
			return new Response(JSON.stringify({ error: "Upstream fetch failed" }), {
				status: 502,
				headers: { "content-type": "application/json" },
			});
		}
	}

	return new Response(JSON.stringify({ error: "Too many redirects" }), {
		status: 510,
		headers: { "content-type": "application/json" },
	});
}

async function readHtmlWithLimit(res: Response): Promise<string | null> {
	const ct = res.headers.get("content-type");
	if (!ct) return null;
	const lower = ct.toLowerCase();
	const allowed = ["text/html", "application/xhtml+xml"];
	if (!allowed.some((type) => lower.includes(type))) return null;
	if (!res.body) return null;

	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let received = 0;
	let html = "";
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		received += value.byteLength;
		if (received > MAX_BYTES) return null;
		html += decoder.decode(value, { stream: true });
	}
	html += decoder.decode();
	return html;
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const raw = searchParams.get("url");
	if (!raw) {
		return NextResponse.json({ error: "Missing url" }, { status: 400 });
	}

	let initial: URL;
	try {
		initial = new URL(raw);
	} catch {
		return NextResponse.json({ error: "Invalid url" }, { status: 400 });
	}

	const start = Date.now();
	const res = await fetchWithGuards(initial);
	if (!res.ok) {
		return NextResponse.json(
			await res.json().catch(() => ({ error: "Fetch failed" })),
			{ status: res.status },
		);
	}

	const html = await readHtmlWithLimit(res);
	if (!html) {
		return NextResponse.json(
			{ error: "Unsupported content or too large" },
			{ status: 415 },
		);
	}

	return new NextResponse(html, {
		headers: {
			"content-type": "text/html; charset=utf-8",
			"x-content-type-options": "nosniff",
			"cache-control": `public, s-maxage=${ONE_DAY_SECONDS}, stale-while-revalidate=${ONE_DAY_SECONDS}`,
			"x-metadata-fetch-ms": String(Date.now() - start),
		},
	});
}
