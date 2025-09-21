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
		const res = await fetch(url, { redirect: "follow" });
		const html = await res.text();
		return new NextResponse(html, {
			headers: {
				"content-type": "text/html; charset=utf-8",
				"cache-control": `public, s-maxage=${ONE_DAY_SECONDS}, stale-while-revalidate=${ONE_DAY_SECONDS}`,
			},
		});
	} catch {
		return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
	}
}
