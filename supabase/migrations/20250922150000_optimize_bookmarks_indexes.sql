create index if not exists bookmarks_user_created_id_idx
	on public.bookmarks (user_id, created_at desc, id desc);

create index if not exists bookmarks_user_category_created_idx
	on public.bookmarks (user_id, category_id, created_at desc, id desc);
