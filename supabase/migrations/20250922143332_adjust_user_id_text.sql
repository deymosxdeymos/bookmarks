drop policy if exists "Users manage categories" on public.categories;
drop policy if exists "Users manage bookmarks" on public.bookmarks;

alter table public.categories
	alter column user_id type text using user_id::text;

alter table public.bookmarks
	alter column user_id type text using user_id::text;

create policy "Users manage categories"
	on public.categories
	for all
	to authenticated
	using (user_id = auth.uid()::text)
	with check (user_id = auth.uid()::text);

create policy "Users manage bookmarks"
	on public.bookmarks
	for all
	to authenticated
	using (user_id = auth.uid()::text)
	with check (user_id = auth.uid()::text);
