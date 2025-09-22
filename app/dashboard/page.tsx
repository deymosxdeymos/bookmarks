import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { BookmarksSection } from "@/components/dashboard/bookmarks-section";
import { DashboardNav } from "@/components/dashboard/nav";
import { PrimaryInput } from "@/components/dashboard/primary-input";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";
import {
	type ListResult,
	listBookmarksCached,
	listCategoriesCached,
} from "@/lib/bookmarks-repo";
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
	cursor: z.string().datetime({ offset: true }).optional(),
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
	const requestId = process.env.NODE_ENV !== "production" ? Date.now() : null;
	if (process.env.NODE_ENV !== "production") {
		console.time(`dashboard:total:${requestId}`);
		console.time(`dashboard:getSession:${requestId}`);
	}
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (process.env.NODE_ENV !== "production") {
		console.timeEnd(`dashboard:getSession:${requestId}`);
	}

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

	if (process.env.NODE_ENV !== "production") {
		console.time(`dashboard:listCategories:${requestId}`);
		console.time(`dashboard:listBookmarks:${requestId}`);
	}
	const categoriesPromise = listCategoriesCached(session.user.id).then(
		(value) => {
			if (process.env.NODE_ENV !== "production") {
				console.timeEnd(`dashboard:listCategories:${requestId}`);
			}
			return value;
		},
	);
	const bookmarksPromise = listBookmarksCached(filter).then((value) => {
		if (process.env.NODE_ENV !== "production") {
			console.timeEnd(`dashboard:listBookmarks:${requestId}`);
		}
		return value;
	});
	const [categoriesResult, bookmarksResult] = await Promise.allSettled([
		categoriesPromise,
		bookmarksPromise,
	]);
	if (process.env.NODE_ENV !== "production") {
		console.timeEnd(`dashboard:total:${requestId}`);
	}

	const categories =
		categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
	const initialBookmarks: ListResult =
		bookmarksResult.status === "fulfilled"
			? {
					items: bookmarksResult.value.items.map((b) => ({
						...b,
						createdAt:
							b.createdAt instanceof Date
								? b.createdAt
								: new Date(String(b.createdAt)),
						updatedAt:
							b.updatedAt instanceof Date
								? b.updatedAt
								: new Date(String(b.updatedAt)),
					})),
					nextCursor: bookmarksResult.value.nextCursor,
				}
			: { items: [] };

	if (categoriesResult.status === "rejected") {
		console.error("failed to load categories", categoriesResult.reason);
	}

	if (bookmarksResult.status === "rejected") {
		console.error("failed to load bookmarks", bookmarksResult.reason);
	}

	return (
		<div className="flex min-h-svh flex-col">
			<div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
				<DashboardNav
					user={session.user}
					categories={categories}
					filter={filter}
				/>
				<PrimaryInput categoryId={filter.categoryId ?? null} />
				<div>
					<header className="flex items-center justify-between text-sm text-muted-foreground">
						<span>Title</span>
						<span>Created at</span>
					</header>
					<Separator className="mt-3" />
				</div>
				<Suspense
					fallback={
						<div className="space-y-3">
							<RowSkeleton count={8} />
						</div>
					}
				>
					<BookmarksSection initialItems={initialBookmarks.items} />
				</Suspense>
			</div>
		</div>
	);
}

function RowSkeleton({ count }: { count: number }) {
	return (
		<>
			{Array.from({ length: count }, (_, index) => `row-skeleton-${index}`).map(
				(key) => (
					<div
						key={key}
						className="flex items-center justify-between rounded-lg border border-transparent px-3 py-3"
					>
						<div className="flex items-center gap-3">
							<div className="h-6 w-6 rounded bg-muted" />
							<div className="h-4 w-40 rounded bg-muted" />
						</div>
						<div className="h-4 w-16 rounded bg-muted" />
					</div>
				),
			)}
		</>
	);
}
