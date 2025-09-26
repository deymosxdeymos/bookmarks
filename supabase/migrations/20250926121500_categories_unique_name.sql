-- Preserve bookmark category assignments when deduplicating categories
-- First, update all bookmarks pointing to duplicate categories to point to the surviving category

WITH ranked AS (
	SELECT 
		id,
		user_id,
		name,
		ROW_NUMBER() OVER (PARTITION BY user_id, LOWER(name) ORDER BY created_at ASC, id ASC) AS rn
	FROM public.categories
),
survivors AS (
	SELECT id AS survivor_id, user_id, LOWER(name) AS lower_name
	FROM ranked 
	WHERE rn = 1
),
duplicates AS (
	SELECT id AS duplicate_id, user_id, LOWER(name) AS lower_name
	FROM ranked 
	WHERE rn > 1
)
UPDATE public.bookmarks 
SET category_id = s.survivor_id
FROM duplicates d
JOIN survivors s ON (d.user_id = s.user_id AND d.lower_name = s.lower_name)
WHERE bookmarks.category_id = d.duplicate_id;

-- Now safe to delete duplicate categories (bookmarks already re-pointed)
WITH ranked AS (
	SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, LOWER(name) ORDER BY created_at ASC, id ASC) AS rn
	FROM public.categories
)
DELETE FROM public.categories c USING ranked r
WHERE c.id = r.id AND r.rn > 1;

-- Enforce uniqueness (case-insensitive)
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'categories_user_lower_name_unique_idx'
	) THEN
		CREATE UNIQUE INDEX categories_user_lower_name_unique_idx
		ON public.categories (user_id, LOWER(name));
	END IF;
END $$;