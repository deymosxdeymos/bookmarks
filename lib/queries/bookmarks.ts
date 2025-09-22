"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createBookmarkAction,
	deleteBookmarkAction,
} from "@/app/actions/bookmarks";
import type { ListResult } from "@/lib/bookmarks-repo";
import type {
	Bookmark,
	BookmarkCreateInput,
	BookmarkFilter,
} from "@/lib/schemas";

export type BookmarksQueryKey = ReturnType<typeof bookmarksQueryKey>;

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
	return useQuery({
		queryKey: bookmarksQueryKey(filter),
		queryFn: () => fetchBookmarks(filter),
		staleTime: 60 * 1000,
		gcTime: 5 * 60 * 1000,
	});
}

export function useCreateBookmark() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: BookmarkCreateInput) => {
			return createBookmarkAction(input);
		},
		onSuccess: (bookmark) => {
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

			queryClient
				.getQueriesData<ListResult>({ queryKey: ["bookmarks"] })
				.forEach(([queryKey, existing]) => {
					const [, params] = queryKey as BookmarksQueryKey;
					if (!existing || params?.cursor) {
						return;
					}

					const deduped = existing.items.filter(
						(item) => item.id !== convertedBookmark.id,
					);
					const nextItems = [convertedBookmark, ...deduped];
					queryClient.setQueryData<ListResult>(queryKey, {
						...existing,
						items: nextItems,
					});
				});

			// Invalidate all bookmark queries to refetch fresh data
			queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
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
			// Cancel all bookmark queries
			await queryClient.cancelQueries({ queryKey: ["bookmarks"] });

			// Get all bookmark query data to restore on error
			const previousQueries = new Map();
			queryClient
				.getQueriesData({ queryKey: ["bookmarks"] })
				.forEach(([queryKey, data]) => {
					previousQueries.set(queryKey, data);
				});

			// Optimistically update all bookmark queries
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
			// Restore all previous queries on error
			if (context?.previousQueries) {
				context.previousQueries.forEach((data, queryKey) => {
					queryClient.setQueryData(queryKey, data);
				});
			}
		},
		onSettled: () => {
			// Invalidate all bookmark queries to refetch
			queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
		},
	});
}
