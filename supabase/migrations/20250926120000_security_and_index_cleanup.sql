-- Drop redundant index in favor of composite ordering index
DROP INDEX IF EXISTS public.bookmarks_user_id_created_idx;

-- Note: Uniqueness constraints intentionally not added automatically to avoid breaking existing data.
-- Consider adding a unique index on (user_id, name) for categories after deduplication.
