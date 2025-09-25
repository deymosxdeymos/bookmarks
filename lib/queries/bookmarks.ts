"use client";

import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	createBookmarkAction,
	deleteBookmarkAction,
	setBookmarkCategoryAction,
	updateBookmarkAction,
} from "@/app/actions/bookmarks";
import type { ListResult } from "@/lib/bookmarks-repo";
import type {
	Bookmark,
	BookmarkCreateInput,
	BookmarkFilter,
} from "@/lib/schemas";

type BookmarksQueryKey = ReturnType<typeof bookmarksQueryKey>;

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
		placeholderData: keepPreviousData,
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
			queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
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
			queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
			queryClient.invalidateQueries({ queryKey: ["categories"] });
		},
	});
}
