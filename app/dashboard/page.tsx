import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { auth } from "@/lib/auth";
import {
	type BookmarkFilter,
	bookmarkFilterInputSchema,
	bookmarkFilterSchema,
	sortOrderSchema,
} from "@/lib/schemas";

type RawSearchParams = Record<string, string | string[] | undefined>;

const searchParamsSchema = z.object({
	category: z.string().uuid().optional(),
	search: z.string().optional(),
	sort: sortOrderSchema.optional(),
	cursor: z.string().optional(),
});

function normalizeParams(params: RawSearchParams) {
	return {
		category:
			typeof params.category === "string" && params.category.length > 0
				? params.category
				: undefined,
		search:
			typeof params.search === "string" && params.search.length > 0
				? params.search
				: undefined,
		sort:
			typeof params.sort === "string" && params.sort.length > 0
				? params.sort
				: undefined,
		cursor:
			typeof params.cursor === "string" && params.cursor.length > 0
				? params.cursor
				: undefined,
	};
}

export default async function DashboardPage({
	searchParams,
}: {
	searchParams: Promise<RawSearchParams>;
}) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	const resolvedParams = await searchParams;
	const normalized = normalizeParams(resolvedParams);
	const parsedParams = searchParamsSchema.safeParse(normalized);
	const input = parsedParams.success ? parsedParams.data : {};
	const filter: BookmarkFilter = bookmarkFilterSchema.parse({
		...bookmarkFilterInputSchema.parse({
			categoryId: input.category,
			search: input.search,
			sort: input.sort,
			cursor: input.cursor,
		}),
		userId: session.user.id,
	});

	return <DashboardContent user={session.user} filter={filter} />;
}
