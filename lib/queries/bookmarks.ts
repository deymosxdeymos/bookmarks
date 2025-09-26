"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createBookmarkAction,
	deleteBookmarkAction,
	setBookmarkCategoryAction,
	updateBookmarkAction,
} from "@/app/actions/bookmarks";
import {
	BOOKMARK_STRONG_MATCH_THRESHOLD,
	rankBookmarks,
} from "@/lib/bookmark-search";
import type { ListResult } from "@/lib/bookmarks-repo";
import type {
	Bookmark,
	BookmarkCreateInput,
	BookmarkFilter,
} from "@/lib/schemas";

type BookmarksQueryKey = ReturnType<typeof bookmarksQueryKey>;

function invalidateBookmarkQueries(qc: ReturnType<typeof useQueryClient>) {
	qc.invalidateQueries({ queryKey: ["bookmarks"] });
}

function bookmarkMatchesSearch(
	bookmark: Bookmark,
	searchQuery?: string,
): boolean {
	if (!searchQuery || searchQuery.trim() === "") {
		return true;
	}

	const results = rankBookmarks([bookmark], searchQuery, {
		threshold: BOOKMARK_STRONG_MATCH_THRESHOLD,
	});

	return results.length > 0;
}

export function bookmarksQueryKey(filter: BookmarkFilter) {
	return [
		"bookmarks",
		{
			userId: filter.userId,
			categoryId: filter.categoryId ?? null,
			search: filter.search ?? "",
			sort: filter.sort,
			cursor: filter.cursor ?? null,
			limit: filter.limit,
		},
	] as const;
}

async function fetchBookmarks(filter: BookmarkFilter): Promise<ListResult> {
	const params = new URLSearchParams();
	if (filter.categoryId) params.set("categoryId", filter.categoryId);
	if (filter.search) params.set("search", filter.search);
	if (filter.sort) params.set("sort", filter.sort);
	if (filter.cursor) params.set("cursor", filter.cursor);

	const response = await fetch(`/api/bookmarks?${params}`, {
		credentials: "include",
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch bookmarks: ${response.statusText}`);
	}

	return response.json();
}

export function useBookmarks(filter: BookmarkFilter) {
	const queryClient = useQueryClient();

	return useQuery({
		queryKey: bookmarksQueryKey(filter),
		queryFn: () => fetchBookmarks(filter),
		staleTime: 60 * 1000,
		gcTime: 5 * 60 * 1000,
		placeholderData: (previousData, _previousQuery) => {
			// First try keepPreviousData for same filter
			if (previousData) {
				return previousData;
			}
			// Fall back to cached bookmark data for the same user and compatible filter
			// Only use data from the first page (cursor: null) to avoid pagination confusion
			const cachedQueries = queryClient.getQueriesData<ListResult>({
				queryKey: ["bookmarks"],
			});
			for (const [queryKey, cachedData] of cachedQueries) {
				if (cachedData?.items?.length) {
					const [, cachedParams] = queryKey as BookmarksQueryKey;
					// Only use cached data if it belongs to the same user, has compatible filter,
					// and is from the first page (cursor: null)
					const currentSort = filter.sort || "created-desc";
					const currentSearch = filter.search ?? "";
					const currentCategory: string | null = filter.categoryId ?? null;
					if (
						cachedParams?.userId === filter.userId &&
						cachedParams?.categoryId === currentCategory &&
						cachedParams?.search === currentSearch &&
						cachedParams?.sort === currentSort &&
						cachedParams?.cursor === null
					) {
						return cachedData;
					}
				}
			}
			return undefined;
		},
		select: (data: ListResult) => ({
			...data,
			items: data.items.map((bookmark) => ({
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
		}),
		refetchOnWindowFocus: false,
		refetchOnMount: true,
		refetchInterval: false,
	});
}

export function useCreateBookmark() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: BookmarkCreateInput) => {
			return createBookmarkAction(input);
		},
		onMutate: async (input) => {
			// Cancel outgoing refetches so they don't overwrite optimistic update
			await queryClient.cancelQueries({ queryKey: ["bookmarks"] });

			// Snapshot previous queries for rollback
			const previousQueries = new Map(
				queryClient.getQueriesData<ListResult>({ queryKey: ["bookmarks"] }),
			);

			// Get userId from any existing query
			const firstQueryKey = Array.from(previousQueries.keys())[0] as
				| BookmarksQueryKey
				| undefined;
			const userId = firstQueryKey?.[1]?.userId || "";

			// Create temporary optimistic bookmark
			const tempBookmark: Bookmark = {
				id: `temp-${Date.now()}`,
				title: "Loading...", // Will be replaced on success
				url: input.url,
				domain: new URL(input.url).hostname,
				iconUrl: null,
				categoryId: input.categoryId ?? null,
				userId,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			// Optimistically update relevant caches
			for (const [queryKey, existing] of previousQueries) {
				const [, params] = queryKey as BookmarksQueryKey;
				if (!existing || params?.cursor) {
					continue;
				}

				// Only add to queries that would include this bookmark
				const shouldInclude =
					(params?.categoryId === null ||
						params?.categoryId === input.categoryId ||
						params?.categoryId === undefined) &&
					bookmarkMatchesSearch(tempBookmark, params?.search);

				if (shouldInclude) {
					queryClient.setQueryData<ListResult>(queryKey, {
						...existing,
						items: [tempBookmark, ...existing.items],
					});
				}
			}

			return { previousQueries, tempBookmark };
		},
		onError: (_, __, context) => {
			// Rollback optimistic updates
			if (context?.previousQueries) {
				context.previousQueries.forEach((data, key) => {
					queryClient.setQueryData(key, data);
				});
			}
		},
		onSuccess: (bookmark, _input, context) => {
			const convertedBookmark: Bookmark = {
				...bookmark,
				createdAt:
					bookmark.createdAt instanceof Date
						? bookmark.createdAt
						: new Date(String(bookmark.createdAt)),
				updatedAt:
					bookmark.updatedAt instanceof Date
						? bookmark.updatedAt
						: new Date(String(bookmark.updatedAt)),
			};

			// Replace temporary bookmark with real one
			queryClient
				.getQueriesData<ListResult>({ queryKey: ["bookmarks"] })
				.forEach(([queryKey, existing]) => {
					const [, params] = queryKey as BookmarksQueryKey;
					if (!existing || params?.cursor) {
						return;
					}

					// Only replace bookmark if it would be included in this query
					const shouldInclude =
						(params?.categoryId === null ||
							params?.categoryId === convertedBookmark.categoryId ||
							params?.categoryId === undefined) &&
						bookmarkMatchesSearch(convertedBookmark, params?.search);

					if (!shouldInclude) {
						// Remove the temporary bookmark if the real one doesn't match the filter
						const items = existing.items.filter(
							(item) => item.id !== context?.tempBookmark.id,
						);
						queryClient.setQueryData<ListResult>(queryKey, {
							...existing,
							items,
						});
						return;
					}

					const items = existing.items.map((item) =>
						item.id === context?.tempBookmark.id ? convertedBookmark : item,
					);

					// Dedupe in case server added it elsewhere
					const deduped = items.filter(
						(item, index, arr) =>
							arr.findIndex((other) => other.id === item.id) === index,
					);

					queryClient.setQueryData<ListResult>(queryKey, {
						...existing,
						items: deduped,
					});
				});
		},
		onSettled: () => {
			invalidateBookmarkQueries(queryClient);
		},
	});
}

export function useDeleteBookmark() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (bookmarkId: string) => {
			await deleteBookmarkAction(bookmarkId);
			return bookmarkId;
		},
		onMutate: async (bookmarkId) => {
			await queryClient.cancelQueries({ queryKey: ["bookmarks"] });

			const previousQueries = new Map();
			queryClient
				.getQueriesData({ queryKey: ["bookmarks"] })
				.forEach(([queryKey, data]) => {
					previousQueries.set(queryKey, data);
				});

			queryClient.setQueriesData(
				{ queryKey: ["bookmarks"] },
				(old: ListResult | undefined) => {
					if (old?.items) {
						return {
							...old,
							items: old.items.filter(
								(bookmark: Bookmark) => bookmark.id !== bookmarkId,
							),
						};
					}
					return old;
				},
			);

			return { previousQueries, bookmarkId };
		},
		onError: (_, __, context) => {
			if (context?.previousQueries) {
				context.previousQueries.forEach((data, queryKey) => {
					queryClient.setQueryData(queryKey, data);
				});
			}
		},
		onSettled: () => {
			invalidateBookmarkQueries(queryClient);
		},
	});
}

type UpdateBookmarkVariables = {
	bookmarkId: string;
	title: string;
};

function normalizeBookmarkDates(bookmark: Bookmark): Bookmark {
	return {
		...bookmark,
		createdAt:
			bookmark.createdAt instanceof Date
				? bookmark.createdAt
				: new Date(String(bookmark.createdAt)),
		updatedAt:
			bookmark.updatedAt instanceof Date
				? bookmark.updatedAt
				: new Date(String(bookmark.updatedAt)),
	};
}

export function useUpdateBookmarkTitle() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ bookmarkId, title }: UpdateBookmarkVariables) => {
			const trimmed = title.trim();
			return updateBookmarkAction(bookmarkId, { title: trimmed });
		},
		onMutate: async (variables) => {
			await queryClient.cancelQueries({ queryKey: ["bookmarks"] });
			const previousQueries = new Map(
				queryClient.getQueriesData<ListResult>({ queryKey: ["bookmarks"] }),
			);

			for (const [queryKey, existing] of previousQueries) {
				if (!existing?.items) continue;
				const items = existing.items.map((item) =>
					item.id === variables.bookmarkId
						? {
								...item,
								title: variables.title.trim(),
								updatedAt: new Date(),
							}
						: item,
				);
				queryClient.setQueryData<ListResult>(queryKey, {
					...existing,
					items,
				});
			}

			return { previousQueries };
		},
		onError: (_error, _vars, context) => {
			if (!context?.previousQueries) return;
			context.previousQueries.forEach((data, key) => {
				queryClient.setQueryData(key, data);
			});
		},
		onSuccess: (bookmark) => {
			if (!bookmark) return;
			const converted = normalizeBookmarkDates(bookmark);
			const queryEntries = queryClient.getQueriesData<ListResult>({
				queryKey: ["bookmarks"],
			});
			for (const [queryKey, existing] of queryEntries) {
				if (!existing?.items) continue;
				const items = existing.items.map((item) =>
					item.id === converted.id ? converted : item,
				);
				queryClient.setQueryData<ListResult>(queryKey, {
					...existing,
					items,
				});
			}
		},
		onSettled: () => {
			invalidateBookmarkQueries(queryClient);
		},
	});
}

type SetBookmarkCategoryVariables = {
	bookmarkId: string;
	categoryId: string | null;
};

export function useSetBookmarkCategory() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			bookmarkId,
			categoryId,
		}: SetBookmarkCategoryVariables) => {
			return setBookmarkCategoryAction(bookmarkId, categoryId);
		},
		onMutate: async (variables) => {
			await queryClient.cancelQueries({ queryKey: ["bookmarks"] });
			const previousQueries = new Map(
				queryClient.getQueriesData<ListResult>({ queryKey: ["bookmarks"] }),
			);

			for (const [queryKey, existing] of previousQueries) {
				if (!existing?.items) continue;
				const [, params] = queryKey as BookmarksQueryKey;
				const filterCategory = params?.categoryId ?? null;
				const hasBookmark = existing.items.some(
					(item) => item.id === variables.bookmarkId,
				);
				if (!hasBookmark) continue;

				const shouldKeep =
					filterCategory === null || filterCategory === variables.categoryId;
				const items = shouldKeep
					? existing.items.map((item) =>
							item.id === variables.bookmarkId
								? { ...item, categoryId: variables.categoryId }
								: item,
						)
					: existing.items.filter((item) => item.id !== variables.bookmarkId);

				queryClient.setQueryData<ListResult>(queryKey, {
					...existing,
					items,
				});
			}

			return { previousQueries };
		},
		onError: (_error, _vars, context) => {
			if (!context?.previousQueries) return;
			context.previousQueries.forEach((data, key) => {
				queryClient.setQueryData(key, data);
			});
		},
		onSuccess: (bookmark, _variables) => {
			if (!bookmark) return;
			const converted = normalizeBookmarkDates(bookmark);
			const queryEntries = queryClient.getQueriesData<ListResult>({
				queryKey: ["bookmarks"],
			});
			for (const [queryKey, existing] of queryEntries) {
				if (!existing?.items) continue;
				const [, params] = queryKey as BookmarksQueryKey;
				const filterCategory = params?.categoryId ?? null;

				const shouldContain =
					filterCategory === null || filterCategory === converted.categoryId;
				const alreadyContains = existing.items.some(
					(item) => item.id === converted.id,
				);

				if (!shouldContain && alreadyContains) {
					queryClient.setQueryData<ListResult>(queryKey, {
						...existing,
						items: existing.items.filter((item) => item.id !== converted.id),
					});
					continue;
				}

				if (shouldContain) {
					const nextItems = alreadyContains
						? existing.items.map((item) =>
								item.id === converted.id ? converted : item,
							)
						: [...existing.items, converted];
					queryClient.setQueryData<ListResult>(queryKey, {
						...existing,
						items: nextItems,
					});
				}
			}
		},
		onSettled: () => {
			invalidateBookmarkQueries(queryClient);
			// Only invalidate categories since category counts may change
			queryClient.invalidateQueries({ queryKey: ["categories"] });
		},
	});
}
