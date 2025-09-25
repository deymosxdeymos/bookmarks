import { revalidateTag, unstable_cache } from "next/cache";
import { query } from "@/lib/db";
import { getMetadata } from "@/lib/metadata";
import {
	type Bookmark,
	type BookmarkCreateInput,
	type BookmarkFilter,
	type BookmarkUpdateInput,
	bookmarkCreateSchema,
	bookmarkFilterSchema,
	bookmarkRowSchema,
	bookmarkRowsSchema,
	bookmarkUpdateSchema,
	type CategoryCreateInput,
	categoryCreateSchema,
	categoryRowSchema,
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

let trigramSupport: boolean | undefined;

async function ensureTrigramSupport(): Promise<boolean> {
	if (typeof trigramSupport === "boolean") {
		return trigramSupport;
	}
	try {
		const result = await query<{ installed: boolean }>(
			"SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') AS installed",
		);
		trigramSupport = Boolean(result.rows[0]?.installed);
	} catch (error) {
		console.warn(
			"[bookmarks] failed to detect pg_trgm, defaulting to ILIKE",
			error,
		);
		trigramSupport = false;
	}
	if (!trigramSupport) {
		console.info("[bookmarks] pg_trgm not installed; using fallback search");
	}
	return trigramSupport;
}

export async function listBookmarks(
	filter: BookmarkFilter,
): Promise<ListResult> {
	const parsed = bookmarkFilterSchema.parse(filter);
	const conditions = ["user_id = $1"];
	const params: unknown[] = [parsed.userId];
	const trigramEnabled = await ensureTrigramSupport();

	if (parsed.categoryId) {
		conditions.push(`category_id = $${params.length + 1}`);
		params.push(parsed.categoryId);
	}

	const orderParts: string[] = [];
	const trimmedSearch = parsed.search?.trim();
	if (trimmedSearch && trimmedSearch.length > 0) {
		const likeTerm = `%${trimmedSearch}%`;
		if (trigramEnabled) {
			const searchParamIndex = params.length + 1;
			params.push(trimmedSearch);
			const similarityThreshold = computeSimilarityThreshold(trimmedSearch);
			const thresholdParamIndex = params.length + 1;
			params.push(similarityThreshold);
			const likeParamStart = params.length + 1;
			params.push(likeTerm, likeTerm, likeTerm);
			const similarityExpression = `GREATEST(similarity(lower(title), lower($${searchParamIndex})), similarity(lower(domain), lower($${searchParamIndex})), similarity(lower(url), lower($${searchParamIndex})))`;
			conditions.push(
				`(((${similarityExpression}) >= $${thresholdParamIndex}) OR title ILIKE $${likeParamStart} OR domain ILIKE $${likeParamStart + 1} OR url ILIKE $${likeParamStart + 2})`,
			);
			orderParts.push(`${similarityExpression} DESC`);
		} else {
			const likeParamStart = params.length + 1;
			params.push(likeTerm, likeTerm, likeTerm);
			conditions.push(
				`(title ILIKE $${likeParamStart} OR domain ILIKE $${likeParamStart + 1} OR url ILIKE $${likeParamStart + 2})`,
			);
		}
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
	orderParts.push(`created_at ${direction}`, `id ${direction}`);
	const orderClause = `ORDER BY ${orderParts.join(", ")}`;
	const limit = parsed.limit + 1;
	params.push(limit);

	const result = await query(
		`
		SELECT ${selectColumns}
		FROM bookmarks
		${whereClause}
		${orderClause}
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

function computeSimilarityThreshold(term: string): number {
	const length = term.length;
	if (length >= 12) {
		return 0.35;
	}
	if (length >= 7) {
		return 0.3;
	}
	if (length >= 4) {
		return 0.25;
	}
	return 0.2;
}

function bookmarkTag(userId: string, categoryId?: string | null) {
	return `bookmarks:${userId}:${categoryId ?? "all"}`;
}

async function _listBookmarksCached(
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

	void (async () => {
		try {
			const traceId = `${Date.now()}-${row.id}`;
			console.log("[createBookmark] enrich:start", {
				traceId,
				url: data.url,
				userId,
				bookmarkId: row.id,
			});
			const metadata = await getMetadata(data.url, traceId);
			console.log("[createBookmark] enrich:result", {
				traceId,
				titleSample: metadata.title?.slice(0, 80),
				hasDescription: Boolean(metadata.description),
				iconUrl: metadata.iconUrl,
				domain: metadata.domain,
			});
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
			console.log("[createBookmark] enrich:update:ok", {
				traceId,
				bookmarkId: row.id,
			});
			revalidateTag(bookmarkTag(userId, data.categoryId ?? null));
			revalidateTag(bookmarkTag(userId, null));
		} catch {}
	})();

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

export async function updateBookmark(
	userId: string,
	bookmarkId: string,
	input: BookmarkUpdateInput,
): Promise<Bookmark | null> {
	const data = bookmarkUpdateSchema.parse(input);
	const result = await query(
		`
		UPDATE bookmarks
		SET title = $1, updated_at = NOW()
		WHERE id = $2 AND user_id = $3
		RETURNING ${selectColumns}
		`,
		[data.title, bookmarkId, userId],
	);

	if (result.rows.length === 0) {
		return null;
	}

	const row = bookmarkRowSchema.parse(result.rows[0]);
	return mapBookmarkRow(row);
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
		SELECT c.id,
			c.user_id,
			c.name,
			c.color,
			c.created_at,
			COUNT(b.id) AS bookmark_count
		FROM categories c
		LEFT JOIN bookmarks b ON b.category_id = c.id
		WHERE c.user_id = $1
		GROUP BY c.id
		ORDER BY c.name ASC
		`,
		[userId],
	);

	const rows = categoryRowsSchema.parse(result.rows);

	return rows.map(mapCategoryRow);
}

function categoryTag(userId: string) {
	return `categories:${userId}`;
}

export async function createCategory(
	userId: string,
	input: CategoryCreateInput,
) {
	const data = categoryCreateSchema.parse(input);
	const result = await query(
		`
		INSERT INTO categories (user_id, name, color)
		VALUES ($1, $2, $3)
		RETURNING id, user_id, name, color, created_at
		`,
		[userId, data.name, data.color ?? null],
	);

	const row = categoryRowSchema.parse({
		...result.rows[0],
		bookmark_count: 0, // New categories always start with 0 bookmarks
	});
	return mapCategoryRow(row);
}

export async function deleteCategory(userId: string, categoryId: string) {
	await query(
		`
		DELETE FROM categories
		WHERE id = $1 AND user_id = $2
		`,
		[categoryId, userId],
	);
}

async function _listCategoriesCached(userId: string) {
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
