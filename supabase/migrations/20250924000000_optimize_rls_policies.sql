-- Optimize RLS policies to prevent per-row auth function evaluation
-- https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- Categories policy
DROP POLICY IF EXISTS "Users manage categories" ON public.categories;
CREATE POLICY "Users manage categories" ON public.categories
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Bookmarks policy
DROP POLICY IF EXISTS "Users manage bookmarks" ON public.bookmarks;
CREATE POLICY "Users manage bookmarks" ON public.bookmarks
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));