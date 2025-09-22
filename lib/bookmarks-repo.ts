import { unstable_cache } from "next/cache";
import { query } from "@/lib/db";
import { getMetadata } from "@/lib/metadata";
import {
	type Bookmark,
	type BookmarkCreateInput,
	type BookmarkFilter,
	bookmarkCreateSchema,
	bookmarkFilterSchema,
	bookmarkRowSchema,
	bookmarkRowsSchema,
	categoryRowsSchema,
	mapBookmarkRow,
	mapCategoryRow,
} from "@/lib/schemas";

const selectColumns = `
		id,
		user_id,
		category_id,
		url,
		title,
		description,
		icon_url,
		domain,
		created_at,
		updated_at
	`;

export type ListResult = {
	items: Bookmark[];
	nextCursor?: string;
};

export async function listBookmarks(
	filter: BookmarkFilter,
): Promise<ListResult> {
	const parsed = bookmarkFilterSchema.parse(filter);
	const conditions = ["user_id = $1"];
	const params: unknown[] = [parsed.userId];

	if (parsed.categoryId) {
		conditions.push(`category_id = $${params.length + 1}`);
		params.push(parsed.categoryId);
	}

	if (parsed.search && parsed.search.trim().length > 0) {
		const term = `%${parsed.search.trim()}%`;
		const baseIndex = params.length;
		conditions.push(
			`(title ILIKE $${baseIndex + 1} OR domain ILIKE $${baseIndex + 2} OR url ILIKE $${baseIndex + 3})`,
		);
		params.push(term, term, term);
	}

	if (parsed.cursor) {
		const [timestamp, id] = parsed.cursor.split("|");
		const date = timestamp ? new Date(timestamp) : undefined;
		if (date && !Number.isNaN(date.getTime()) && id) {
			const comparator = parsed.sort === "created-asc" ? ">" : "<";
			conditions.push(
				`(created_at ${comparator} $${params.length + 1} OR (created_at = $${params.length + 1} AND id ${comparator} $${params.length + 2}))`,
			);
			params.push(date, id);
		}
	}

	const whereClause =
		conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
	const direction = parsed.sort === "created-asc" ? "ASC" : "DESC";
	const limit = parsed.limit + 1;
	params.push(limit);

	const result = await query(
		`
		SELECT ${selectColumns}
		FROM bookmarks
		${whereClause}
		ORDER BY created_at ${direction}, id ${direction}
		LIMIT $${params.length}
		`,
		params,
	);

	const rows = bookmarkRowsSchema.parse(result.rows);
	const sliced = rows.slice(0, parsed.limit);
	const nextCursor =
		rows.length > parsed.limit
			? `${sliced[sliced.length - 1]?.created_at.toISOString()}|${sliced[sliced.length - 1]?.id}`
			: undefined;

	return {
		items: sliced.map(mapBookmarkRow),
		nextCursor,
	};
}

function bookmarkTag(userId: string, categoryId?: string | null) {
	return `bookmarks:${userId}:${categoryId ?? "all"}`;
}

export async function listBookmarksCached(
	filter: BookmarkFilter,
): Promise<ListResult> {
	const cached = unstable_cache(
		async () => listBookmarks(filter),
		[
			"listBookmarks",
			filter.userId,
			filter.categoryId ?? "all",
			filter.search ?? "",
			filter.sort,
			String(filter.limit),
			filter.cursor ?? "",
		],
		{
			revalidate: 60,
			tags: [bookmarkTag(filter.userId, filter.categoryId ?? null)],
		},
	);
	return cached();
}

export async function createBookmark(
	userId: string,
	input: BookmarkCreateInput,
): Promise<Bookmark> {
	const data = bookmarkCreateSchema.parse(input);
	const fallbackDomain = (() => {
		try {
			const hostname = new URL(data.url).hostname.toLowerCase();
			return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
		} catch {
			return data.url;
		}
	})();

	const result = await query(
		`
		INSERT INTO bookmarks (user_id, category_id, url, title, description, icon_url, domain)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING ${selectColumns}
		`,
		[
			userId,
			data.categoryId ?? null,
			data.url,
			fallbackDomain,
			null,
			null,
			fallbackDomain,
		],
	);

	const row = bookmarkRowSchema.parse(result.rows[0]);

	void getMetadata(data.url)
		.then(async (metadata) => {
			try {
				await query(
					`
                    UPDATE bookmarks
                    SET title = $1, description = $2, icon_url = $3, domain = $4
                    WHERE id = $5 AND user_id = $6
                    `,
					[
						metadata.title,
						metadata.description ?? null,
						metadata.iconUrl ?? null,
						metadata.domain,
						row.id,
						userId,
					],
				);
			} catch {}
		})
		.catch(() => {});

	return mapBookmarkRow(row);
}

export async function deleteBookmark(
	userId: string,
	bookmarkId: string,
): Promise<void> {
	await query(`DELETE FROM bookmarks WHERE id = $1 AND user_id = $2`, [
		bookmarkId,
		userId,
	]);
}

export async function getBookmark(
	userId: string,
	bookmarkId: string,
): Promise<Bookmark | null> {
	const result = await query(
		`
		SELECT ${selectColumns}
		FROM bookmarks
		WHERE id = $1 AND user_id = $2
		`,
		[bookmarkId, userId],
	);

	if (result.rows.length === 0) {
		return null;
	}

	const row = bookmarkRowSchema.parse(result.rows[0]);
	return mapBookmarkRow(row);
}

export async function listCategories(userId: string) {
	const result = await query(
		`
		SELECT id, user_id, name, color, created_at
		FROM categories
		WHERE user_id = $1
		ORDER BY name ASC
		`,
		[userId],
	);

	const rows = categoryRowsSchema.parse(result.rows);

	return rows.map(mapCategoryRow);
}

function categoryTag(userId: string) {
	return `categories:${userId}`;
}

export async function listCategoriesCached(userId: string) {
	const cached = unstable_cache(
		async () => listCategories(userId),
		["listCategories", userId],
		{ revalidate: 300, tags: [categoryTag(userId)] },
	);
	return cached();
}

export async function setBookmarkCategory(
	userId: string,
	bookmarkId: string,
	categoryId: string | null,
): Promise<Bookmark | null> {
	const result = await query(
		`
		UPDATE bookmarks
		SET category_id = $1
		WHERE id = $2 AND user_id = $3
		RETURNING ${selectColumns}
		`,
		[categoryId, bookmarkId, userId],
	);

	if (result.rows.length === 0) {
		return null;
	}

	const row = bookmarkRowSchema.parse(result.rows[0]);
	return mapBookmarkRow(row);
}
