import { z } from "zod";

export const sortOrderSchema = z.enum(["created-desc", "created-asc"]);

export const bookmarkSchema = z.object({
	id: z.string().uuid(),
	userId: z.string().min(1),
	categoryId: z.string().uuid().nullable(),
	url: z.string().url(),
	title: z.string().min(1),
	description: z.string().optional().nullable(),
	iconUrl: z.string().url().optional().nullable(),
	domain: z.string().min(1),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export type Bookmark = z.infer<typeof bookmarkSchema>;

export const bookmarkCreateSchema = z.object({
	url: z.string().url(),
	categoryId: z.string().uuid().optional().nullable(),
});

export type BookmarkCreateInput = z.infer<typeof bookmarkCreateSchema>;

export const bookmarkFilterSchema = z.object({
	userId: z.string().min(1),
	categoryId: z.string().uuid().optional().nullable(),
	search: z.string().optional().nullable(),
	sort: sortOrderSchema.default("created-desc"),
	limit: z.number().int().positive().max(100).default(50),
	cursor: z.string().optional().nullable(),
});

export type BookmarkFilter = z.infer<typeof bookmarkFilterSchema>;

export const bookmarkFilterInputSchema = bookmarkFilterSchema.partial({
	userId: true,
	categoryId: true,
	search: true,
	sort: true,
	limit: true,
	cursor: true,
});

export type BookmarkFilterInput = z.infer<typeof bookmarkFilterInputSchema>;

export const bookmarkRowSchema = z.object({
	id: z.string().uuid(),
	user_id: z.string(),
	category_id: z.string().uuid().nullable(),
	url: z.string().url(),
	title: z.string(),
	description: z.string().nullable(),
	icon_url: z.string().url().nullable(),
	domain: z.string(),
	created_at: z.coerce.date(),
	updated_at: z.coerce.date(),
});

export const bookmarkRowsSchema = z.array(bookmarkRowSchema);

export const categorySchema = z.object({
	id: z.string().uuid(),
	userId: z.string().min(1),
	name: z.string().min(1),
	color: z.string().optional().nullable(),
	bookmarkCount: z.number().nonnegative().default(0),
	createdAt: z.coerce.date(),
});

export type Category = z.infer<typeof categorySchema>;

export const categoryRowSchema = z.object({
	id: z.string().uuid(),
	user_id: z.string(),
	name: z.string(),
	color: z.string().nullable(),
	bookmark_count: z.coerce.number().nonnegative().default(0),
	created_at: z.coerce.date(),
});

export const categoryRowsSchema = z.array(categoryRowSchema);

export const categoryCreateSchema = z.object({
	name: z.string().min(1),
	color: z.string().optional().nullable(),
});

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;

export function mapBookmarkRow(
	row: z.infer<typeof bookmarkRowSchema>,
): Bookmark {
	return {
		id: row.id,
		userId: row.user_id,
		categoryId: row.category_id,
		url: row.url,
		title: row.title,
		description: row.description,
		iconUrl: row.icon_url,
		domain: row.domain,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

export function mapCategoryRow(
	row: z.infer<typeof categoryRowSchema>,
): Category {
	return {
		id: row.id,
		userId: row.user_id,
		name: row.name,
		color: row.color ?? undefined,
		bookmarkCount: row.bookmark_count,
		createdAt: row.created_at,
	};
}
