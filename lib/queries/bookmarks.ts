"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteBookmarkAction } from "@/app/actions/bookmarks";
import type { Bookmark } from "@/lib/schemas";

export function useDeleteBookmark() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (bookmarkId: string) => {
			await deleteBookmarkAction(bookmarkId);
			return bookmarkId;
		},
		onMutate: async (bookmarkId) => {
			await queryClient.cancelQueries({ queryKey: ["bookmarks"] });

			const previousBookmarks = queryClient.getQueryData<Bookmark[]>([
				"bookmarks",
			]);

			queryClient.setQueryData<Bookmark[]>(["bookmarks"], (old = []) =>
				old.filter((bookmark) => bookmark.id !== bookmarkId),
			);

			return { previousBookmarks, bookmarkId };
		},
		onError: (_, __, context) => {
			if (context?.previousBookmarks) {
				queryClient.setQueryData(["bookmarks"], context.previousBookmarks);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
		},
	});
}
