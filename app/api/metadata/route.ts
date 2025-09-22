import { NextResponse } from "next/server";

export const runtime = "edge";

const ONE_DAY_SECONDS = 60 * 60 * 24;

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const url = searchParams.get("url");
	if (!url) {
		return NextResponse.json({ error: "Missing url" }, { status: 400 });
	}

	try {
		const start = Date.now();
		const res = await fetch(url, {
			redirect: "follow",
			headers: {
				"user-agent":
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
				accept: "text/html,application/xhtml+xml",
				"accept-language": "en-US,en;q=0.9",
			},
		});
		console.log("[metadata-proxy] response", {
			url,
			ok: res.ok,
			status: res.status,
			contentType: res.headers.get("content-type"),
			ms: Date.now() - start,
		});
		const html = await res.text();
		return new NextResponse(html, {
			headers: {
				"content-type": "text/html; charset=utf-8",
				"cache-control": `public, s-maxage=${ONE_DAY_SECONDS}, stale-while-revalidate=${ONE_DAY_SECONDS}`,
			},
		});
	} catch (error) {
		console.log("[metadata-proxy] error", { url, error: String(error) });
		return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
	}
}
