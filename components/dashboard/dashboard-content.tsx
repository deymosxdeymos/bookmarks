"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";
import { BookmarksSection } from "@/components/dashboard/bookmarks-section";
import { DashboardNav } from "@/components/dashboard/nav";
import { PrimaryInput } from "@/components/dashboard/primary-input";
import { Separator } from "@/components/ui/separator";
import { useGlobalCategoryHotkeys } from "@/lib/hooks";
import { bookmarksQueryKey, useBookmarks } from "@/lib/queries/bookmarks";
import { useCategories } from "@/lib/queries/categories";
import type { BookmarkFilter } from "@/lib/schemas";

type SessionUser = {
	id: string;
	email?: string | null;
	name?: string | null;
};

type DashboardContentProps = {
	user: SessionUser;
	filter: BookmarkFilter;
};

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

export function DashboardContent({ user, filter }: DashboardContentProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const {
		data: bookmarksResult,
		isLoading: bookmarksLoading,
		error: bookmarksError,
	} = useBookmarks(filter);
	const { data: categories = [], error: categoriesError } = useCategories(
		user.id,
	);

	const handleCategoryChange = useCallback(
		(categoryId: string | null) => {
			const params = new URLSearchParams(searchParams.toString());
			if (categoryId) {
				params.set("category", categoryId);
			} else {
				params.delete("category");
			}
			params.delete("cursor");
			router.replace(`?${params.toString()}`, { scroll: false });
		},
		[router, searchParams],
	);

	useGlobalCategoryHotkeys({
		categories,
		onCategoryChange: handleCategoryChange,
	});

	if (bookmarksError) {
		console.error("failed to load bookmarks", bookmarksError);
	}

	if (categoriesError) {
		console.error("failed to load categories", categoriesError);
	}

	const bookmarks = bookmarksResult?.items ?? [];
	const enrichedItems = bookmarks.map((b) => ({
		...b,
		createdAt:
			b.createdAt instanceof Date ? b.createdAt : new Date(String(b.createdAt)),
		updatedAt:
			b.updatedAt instanceof Date ? b.updatedAt : new Date(String(b.updatedAt)),
	}));
	const queryKey = bookmarksQueryKey(filter);

	return (
		<div className="flex min-h-svh flex-col">
			<div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
				<DashboardNav user={user} categories={categories} filter={filter} />
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
					{bookmarksLoading ? (
						<div className="space-y-3">
							<RowSkeleton count={8} />
						</div>
					) : (
						<BookmarksSection
							initialItems={enrichedItems}
							queryKey={queryKey}
							categories={categories}
						/>
					)}
				</Suspense>
			</div>
		</div>
	);
}
