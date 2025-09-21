"use server";
import { z } from "zod";

const bookmarkSchema = z.object({
	id: z.string().uuid().optional(),
	url: z.string().url(),
	title: z.string().min(1),
	description: z.string().optional().nullable(),
	image_url: z.string().url().optional().nullable(),
	favicon_url: z.string().url().optional().nullable(),
	site_name: z.string().optional().nullable(),
	type: z.string().optional().nullable(),
	tags: z.array(z.string()).default([]),
});

export type BookmarkInput = z.infer<typeof bookmarkSchema>;

export async function addBookmark(input: BookmarkInput) {
	const data = bookmarkSchema.parse(input);
	return data;
}

export async function deleteBookmark(id: string) {
	return { id };
}

export async function togglePin(id: string) {
	return { id };
}

export async function bulkImport(items: BookmarkInput[]) {
	const parsed = z.array(bookmarkSchema).parse(items);
	return parsed;
}

export async function exportAll() {
	return [] as BookmarkInput[];
}
