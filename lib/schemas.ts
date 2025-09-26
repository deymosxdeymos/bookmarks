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

export const bookmarkUpdateSchema = z.object({
	title: z.string().trim().min(1, "Title is required").max(256),
});

export type BookmarkUpdateInput = z.infer<typeof bookmarkUpdateSchema>;

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
	bookmarkCount: z.number().nonnegative(),
	createdAt: z.coerce.date(),
});

export type Category = z.infer<typeof categorySchema>;

export const categoryRowSchema = z.object({
	id: z.string().uuid(),
	user_id: z.string(),
	name: z.string(),
	color: z.string().nullable(),
	bookmark_count: z.coerce.number().nonnegative(),
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

export const loginSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "Enter your email address.")
		.email("Enter a valid email address."),
	password: z
		.string()
		.transform((val) => val.replace(/\s+$/, ""))
		.pipe(z.string().min(1, "Enter your password.")),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signUpSchema = z
	.object({
		email: z
			.string()
			.trim()
			.min(1, "Enter your email address.")
			.email("Enter a valid email address."),
		username: z
			.string()
			.trim()
			.min(1, "Enter a username (3+ characters).")
			.min(3, "Username must be at least 3 characters."),
		password: z
			.string()
			.transform((val) => val.replace(/\s+$/, ""))
			.pipe(z.string().min(8, "Password must be at least 8 characters.")),
		confirmPassword: z.string().transform((val) => val.replace(/\s+$/, "")),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match.",
		path: ["confirmPassword"],
	});

export type SignUpInput = z.infer<typeof signUpSchema>;
