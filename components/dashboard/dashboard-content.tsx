"use client";

import { parseAsString, useQueryStates } from "nuqs";
import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import { BookmarksSection } from "@/components/dashboard/bookmarks-section";
import { DashboardNav } from "@/components/dashboard/nav";
import { PrimaryInput } from "@/components/dashboard/primary-input";
import { Separator } from "@/components/ui/separator";
import {
	BOOKMARK_STRONG_MATCH_THRESHOLD,
	extractComparableHostname,
	normalizeUrlForComparison,
	rankBookmarks,
} from "@/lib/bookmark-search";
import { useDebouncedValue, useGlobalCategoryHotkeys } from "@/lib/hooks";
import {
	bookmarksQueryKey,
	useBookmarks,
	useCreateBookmark,
} from "@/lib/queries/bookmarks";
import { useCategories } from "@/lib/queries/categories";
import type { Bookmark, BookmarkFilter } from "@/lib/schemas";

type SessionUser = {
	id: string;
	email?: string | null;
	name?: string | null;
};

type DashboardContentProps = {
	user: SessionUser;
	filter: BookmarkFilter;
};

const SEARCH_INPUT_DEBOUNCE_MS = 160;
const IS_DEV = process.env.NODE_ENV !== "production";

function debugLog(...arguments_: Parameters<typeof console.debug>) {
	if (!IS_DEV) {
		return;
	}
	console.debug(...arguments_);
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

// Client parsers (separate from server to avoid boundary violations)
const clientParsers = {
	search: parseAsString.withDefault("").withOptions({ scroll: false }),
	category: parseAsString.withOptions({ scroll: false }),
	cursor: parseAsString.withOptions({ scroll: false }),
};

export function DashboardContent({ user, filter }: DashboardContentProps) {
	const [{ search: routeSearch }, setUrlState] = useQueryStates(clientParsers);
	const createBookmarkMutation = useCreateBookmark();
	const debouncedSearch = useDebouncedValue(
		routeSearch,
		SEARCH_INPUT_DEBOUNCE_MS,
	);

	// Use server-side search to ensure we get results from the full dataset
	const serverFilter = useMemo(
		() => ({
			userId: filter.userId,
			categoryId: filter.categoryId,
			sort: filter.sort,
			cursor:
				debouncedSearch.trim() !== routeSearch.trim()
					? undefined
					: filter.cursor,
			limit: filter.limit,
			search: debouncedSearch.trim() || undefined,
		}),
		[
			filter.userId,
			filter.categoryId,
			filter.sort,
			filter.cursor,
			filter.limit,
			debouncedSearch,
			routeSearch,
		],
	);

	const {
		data: bookmarksResult,
		isLoading: bookmarksLoading,
		isFetching: bookmarksFetching,
		error: bookmarksError,
	} = useBookmarks(serverFilter);
	const { data: categories = [], error: categoriesError } = useCategories(
		user.id,
	);

	const handleCategoryChange = useCallback(
		(categoryId: string | null) => {
			setUrlState(
				{
					category: categoryId,
					cursor: null, // Clear pagination on filter change
				},
				{ shallow: false },
			);
		},
		[setUrlState],
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
	const enrichedItems: Bookmark[] = useMemo(
		() =>
			bookmarks.map((bookmark) => ({
				...bookmark,
				createdAt:
					bookmark.createdAt instanceof Date
						? bookmark.createdAt
						: new Date(String(bookmark.createdAt)),
				updatedAt:
					bookmark.updatedAt instanceof Date
						? bookmark.updatedAt
						: new Date(String(bookmark.updatedAt)),
			})),
		[bookmarks],
	);

	const previousItemsRef = useRef<Bookmark[]>(enrichedItems);
	useEffect(() => {
		if (bookmarksFetching) {
			return;
		}
		previousItemsRef.current = enrichedItems;
	}, [bookmarksFetching, enrichedItems]);

	const optimisticSource = useMemo(
		() => (bookmarksFetching ? previousItemsRef.current : enrichedItems),
		[bookmarksFetching, enrichedItems],
	);

	const rankedMatches = useMemo(() => {
		// When using server-side search, we trust the server's results
		if (debouncedSearch.trim()) {
			return optimisticSource.map((bookmark) => ({ bookmark, score: 1 }));
		}
		return rankBookmarks(optimisticSource, debouncedSearch);
	}, [optimisticSource, debouncedSearch]);

	const matchedBookmarks = useMemo(() => {
		// With server-side search, use all returned bookmarks when searching
		if (debouncedSearch.trim()) {
			return optimisticSource;
		}
		return rankedMatches.map((entry) => entry.bookmark);
	}, [optimisticSource, debouncedSearch, rankedMatches]);

	const focusBookmarkById = useCallback((bookmarkId: string) => {
		const anchor = document.querySelector<HTMLAnchorElement>(
			`[data-bookmarks-root] [data-bookmark-link][data-bookmark-id="${bookmarkId}"]`,
		);
		if (!anchor) {
			return false;
		}
		anchor.focus({ preventScroll: true });
		return true;
	}, []);

	const handleBookmarkSubmit = useCallback(
		async (url: string) => {
			const normalizedUrl = normalizeUrlForComparison(url);
			const exactMatch = optimisticSource.find(
				(bookmark) => normalizeUrlForComparison(bookmark.url) === normalizedUrl,
			);
			if (exactMatch) {
				focusBookmarkById(exactMatch.id);
				return;
			}

			const comparableHostname = extractComparableHostname(url);
			const hostnameMatch = optimisticSource.find(
				(bookmark) =>
					extractComparableHostname(bookmark.url) === comparableHostname,
			);
			if (hostnameMatch) {
				focusBookmarkById(hostnameMatch.id);
				return;
			}

			const topMatch = rankedMatches[0];
			if (
				topMatch &&
				topMatch.score >= BOOKMARK_STRONG_MATCH_THRESHOLD &&
				debouncedSearch.trim() === url.trim()
			) {
				focusBookmarkById(topMatch.bookmark.id);
				return;
			}

			const previousSearch = routeSearch;
			setUrlState({ search: null, cursor: null });
			try {
				await createBookmarkMutation.mutateAsync({
					url,
					categoryId: filter.categoryId ?? null,
				});
			} catch (error) {
				console.error("create bookmark failed", error);
				setUrlState((current) => {
					// Only restore if the user hasn't typed something new
					if (current.search?.trim().length === 0 || current.search === null) {
						return { search: previousSearch, cursor: null };
					}
					return current;
				});
			}
		},
		[
			createBookmarkMutation,
			filter.categoryId,
			focusBookmarkById,
			rankedMatches,
			optimisticSource,
			routeSearch,
			debouncedSearch,
			setUrlState,
		],
	);

	const matchCount =
		routeSearch.trim().length > 0 ? optimisticSource.length : null;
	const queryKey = bookmarksQueryKey(filter);

	const handleSearchChange = useCallback(
		(nextValue: string) => {
			debugLog("[dashboard-search] input", nextValue || "(empty)");
			setUrlState({
				search: nextValue || null,
				cursor: null,
			});
		},
		[setUrlState],
	);

	return (
		<div className="flex min-h-svh flex-col">
			<div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
				<DashboardNav
					user={user}
					categories={categories}
					filter={filter}
					onCategoryChange={handleCategoryChange}
				/>
				<PrimaryInput
					value={routeSearch}
					onValueChange={handleSearchChange}
					onSubmit={handleBookmarkSubmit}
					isSubmitting={createBookmarkMutation.isPending}
				/>
				<div>
					<header className="flex items-center justify-between text-sm text-muted-foreground">
						<span className="flex items-center gap-2">
							<span>Title</span>
							{matchCount !== null && (
								<span className="rounded-sm border border-transparent bg-muted px-2 py-0.5 text-[0.65rem] font-medium">
									{matchCount === 1 ? "1 match" : `${matchCount} matches`}
								</span>
							)}
						</span>
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
					{bookmarksLoading && !bookmarksResult ? (
						<div className="space-y-3">
							<RowSkeleton count={8} />
						</div>
					) : (
						<BookmarksSection
							initialItems={enrichedItems}
							queryKey={queryKey}
							categories={categories}
							filteredItems={matchedBookmarks}
							searchTerm={debouncedSearch}
						/>
					)}
				</Suspense>
			</div>
		</div>
	);
}
