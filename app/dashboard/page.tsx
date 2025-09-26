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
import { searchParamsCache } from "@/lib/search-params";

type RawSearchParams = Record<string, string | string[] | undefined>;

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
	const { search, category, sort, cursor } =
		await searchParamsCache.parse(resolvedParams);

	// Preserve validation guarantees with Zod
	const validationSchema = z.object({
		category: z.string().uuid().optional(),
		search: z.string().optional(),
		sort: sortOrderSchema.optional(),
		cursor: z.string().optional(),
	});

	const validatedParams = validationSchema.safeParse({
		category: category || undefined,
		search: search || undefined,
		sort: sort || undefined,
		cursor: cursor || undefined,
	});

	const input = validatedParams.success ? validatedParams.data : {};
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
