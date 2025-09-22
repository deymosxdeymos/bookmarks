import { Pool, type QueryResult, type QueryResultRow } from "pg";

type PoolStore = {
	bookmarksPool?: Pool;
};

const globalStore = globalThis as unknown as PoolStore;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error("DATABASE_URL is not defined");
}

export const pool =
	globalStore.bookmarksPool ??
	new Pool({
		connectionString,
		max: 10,
		connectionTimeoutMillis: 5000,
		idleTimeoutMillis: 30000,
		statement_timeout: 5000,
		query_timeout: 5000,
	});

if (process.env.NODE_ENV !== "production") {
	globalStore.bookmarksPool = pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
	text: string,
	params: unknown[] = [],
): Promise<QueryResult<T>> {
	const client = await pool.connect();
	try {
		return await client.query<T>(text, params);
	} finally {
		client.release();
	}
}
