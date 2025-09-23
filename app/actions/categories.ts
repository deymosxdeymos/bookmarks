"use server";

import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
	createCategory,
	deleteCategory,
	listCategories,
} from "@/lib/bookmarks-repo";
import {
	type CategoryCreateInput,
	categoryCreateSchema,
	categorySchema,
} from "@/lib/schemas";

function categoryTag(userId: string) {
	return `categories:${userId}`;
}

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

export async function listCategoriesAction() {
	const session = await requireSession();
	return listCategories(session.user.id);
}

export async function createCategoryAction(input: CategoryCreateInput) {
	const session = await requireSession();
	const data = categoryCreateSchema.parse(input);
	const category = await createCategory(session.user.id, data);
	revalidateTag(categoryTag(session.user.id));
	revalidateTag(bookmarkTag(session.user.id, null));
	return categorySchema.parse(category);
}

export async function deleteCategoryAction(categoryId: string) {
	const session = await requireSession();
	await deleteCategory(session.user.id, categoryId);
	revalidateTag(categoryTag(session.user.id));
	revalidateTag(bookmarkTag(session.user.id, null));
	revalidateTag(bookmarkTag(session.user.id, categoryId));
}
