-- Enable required extensions.
create extension if not exists "pgcrypto";

-- Categories table: stores user-specific organization buckets.
create table if not exists public.categories (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null,
	name text not null,
	color text,
	created_at timestamptz not null default now()
);

create index if not exists categories_user_id_name_idx
	on public.categories (user_id, name);

-- Bookmarks table: canonical storage for saved links.
create table if not exists public.bookmarks (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null,
	category_id uuid references public.categories (id) on delete set null,
	url text not null,
	title text not null,
	description text,
	icon_url text,
	domain text not null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists bookmarks_user_id_created_idx
	on public.bookmarks (user_id, created_at desc);

create index if not exists bookmarks_user_id_domain_idx
	on public.bookmarks (user_id, domain);

-- Automatically bump updated_at on change.
create or replace function public.handle_bookmarks_updated_at()
returns trigger as $$
begin
	new.updated_at = now();
	return new;
end;
$$ language plpgsql;

drop trigger if exists set_bookmarks_updated_at on public.bookmarks;
create trigger set_bookmarks_updated_at
	before update on public.bookmarks
	for each row execute procedure public.handle_bookmarks_updated_at();

-- Row level security and policies.
alter table public.categories enable row level security;
alter table public.bookmarks enable row level security;

drop policy if exists "Users manage categories" on public.categories;
create policy "Users manage categories"
	on public.categories
	for all
	to authenticated
	using (user_id = auth.uid())
	with check (user_id = auth.uid());

drop policy if exists "Users manage bookmarks" on public.bookmarks;
create policy "Users manage bookmarks"
	on public.bookmarks
	for all
	to authenticated
	using (user_id = auth.uid())
	with check (user_id = auth.uid());
