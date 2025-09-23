"use server";

import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
	createBookmark,
	deleteBookmark,
	getBookmark,
	listBookmarks,
	setBookmarkCategory,
} from "@/lib/bookmarks-repo";
import {
	type BookmarkCreateInput,
	type BookmarkFilterInput,
	bookmarkCreateSchema,
	bookmarkFilterInputSchema,
	bookmarkFilterSchema,
	bookmarkSchema,
} from "@/lib/schemas";

function bookmarkTag(userId: string, categoryId?: string | null) {
	return `bookmarks:${userId}:${categoryId ?? "all"}`;
}

async function requireSession() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session) {
		redirect("/login");
	}
	return session;
}

export async function listBookmarksAction(input: BookmarkFilterInput) {
	const session = await requireSession();
	const filter = bookmarkFilterSchema.parse({
		...bookmarkFilterInputSchema.parse(input),
		userId: session.user.id,
	});
	return listBookmarks(filter);
}

export async function createBookmarkAction(input: BookmarkCreateInput) {
	const session = await requireSession();
	const data = bookmarkCreateSchema.parse(input);
	const bookmark = await createBookmark(session.user.id, data);
	revalidateTag(bookmarkTag(session.user.id, data.categoryId ?? null));
	revalidateTag(bookmarkTag(session.user.id, null)); // "all" view
	return bookmarkSchema.parse(bookmark);
}

export async function deleteBookmarkAction(bookmarkId: string) {
	const session = await requireSession();
	const bookmark = await getBookmark(session.user.id, bookmarkId);
	await deleteBookmark(session.user.id, bookmarkId);
	revalidateTag(bookmarkTag(session.user.id, null));
	if (bookmark?.categoryId) {
		revalidateTag(bookmarkTag(session.user.id, bookmark.categoryId));
	}
}

export async function setBookmarkCategoryAction(
	bookmarkId: string,
	categoryId: string | null,
) {
	const session = await requireSession();
	const oldBookmark = await getBookmark(session.user.id, bookmarkId);
	const bookmark = await setBookmarkCategory(
		session.user.id,
		bookmarkId,
		categoryId,
	);
	revalidateTag(bookmarkTag(session.user.id, null));
	revalidateTag(bookmarkTag(session.user.id, categoryId));
	if (oldBookmark?.categoryId && oldBookmark.categoryId !== categoryId) {
		revalidateTag(bookmarkTag(session.user.id, oldBookmark.categoryId));
	}
	return bookmark ? bookmarkSchema.parse(bookmark) : null;
}
