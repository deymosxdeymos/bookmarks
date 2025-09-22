import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listBookmarks } from "@/lib/bookmarks-repo";
import { bookmarkFilterInputSchema, bookmarkFilterSchema } from "@/lib/schemas";

export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const searchParams = request.nextUrl.searchParams;
		const filterInput = {
			categoryId: searchParams.get("categoryId") || undefined,
			search: searchParams.get("search") || undefined,
			sort: searchParams.get("sort") || undefined,
			cursor: searchParams.get("cursor") || undefined,
		};

		const validatedInput = bookmarkFilterInputSchema.parse(filterInput);
		const filter = bookmarkFilterSchema.parse({
			...validatedInput,
			userId: session.user.id,
		});

		const result = await listBookmarks(filter);
		return NextResponse.json(result);
	} catch (error) {
		console.error("Error fetching bookmarks:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
