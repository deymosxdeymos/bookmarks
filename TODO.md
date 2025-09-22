# TODO — Dashboard (Raycast-like)

Goal: Implement `app/dashboard/page.tsx` with a fast, accessible, server‑first UI. Use shadcn/ui, avoid client state where possible, and keep UI as a thin layer over data.

## Principles (apply throughout)
- UI is a thin layer over data. Prefer Server Components; isolate tiny client islands.
- Avoid `useState`; if reactivity isn’t needed, use variables or `useRef`.
- Derive data; don’t use `useEffect` except to sync with external systems (e.g., document events for a shortcut).
- Split complex conditionals into components; reserve inline ternaries for tiny, obvious cases.
- `setTimeout` is last resort; add a short comment only when necessary.
- Keep comments minimal; only for non-obvious logic or long‑term TODOs.

## Milestones
1) Route protection (server)
- Read session on server and redirect unauthenticated users before render.
- Add `app/dashboard/loading.tsx` and re‑use `app/error.tsx`.

2) Install missing UI primitives
- `bunx --bun shadcn@latest add command popover combobox avatar skeleton scroll-area`
- Optional: `badge` and `table` for richer list/table styling.

3) Data contracts (Zod)
- `lib/schemas.ts`: `Bookmark`, `BookmarkCreate`, `BookmarkFilter`, `Category`.
- Fields: `id`, `url`, `title`, `description?`, `iconUrl?`, `domain`, `createdAt`, `categoryId?`, `userId`.

4) Persistence
- Use Postgres (Supabase) in prod; allow SQLite locally if helpful.
- Table `bookmarks`: `id uuid pk`, `user_id`, `url`, `title`, `description`, `icon_url`, `domain`, `created_at timestamptz default now()`, `category_id`.
- Table `categories`: `id uuid pk`, `user_id`, `name`, `color`, `created_at`.
- RLS: row‑level by `user_id`; service role only in server actions.

5) Repository + server actions
- `lib/bookmarks-repo.ts`: typed queries (list/create/delete/update/find) with tags for cache invalidation.
- `app/actions/bookmarks.ts`: `listBookmarks`, `createBookmark`, `deleteBookmark`, `refreshMetadata` using Zod inputs and `revalidateTag("bookmarks:{user}:{category}")`.

6) Metadata extraction (server)
- `lib/metadata.ts`: fetch HTML, read `og:title`/`twitter:title`/`<title>`; extract description; resolve canonical URL; derive `domain`.
- Favicon strategy: page `<link rel="icon">` → `https://icons.duckduckgo.com/ip3/{domain}.ico` → placeholder.
- Cache responses for ~24h; allow manual refresh action.

7) Dashboard shell (Server Component)
- File: `app/dashboard/page.tsx` renders:
  - Top nav: logo `Link` + literal `/` + Category combobox; right side user combobox.
  - Below: command‑style input (“Insert a link…”) with paste‑to‑add.
  - Header row: `Title` | `Created at` with `Separator` beneath.
  - Bookmarks list section in Suspense (stream results).

8) Top nav components (client islands)
- `app/dashboard/_components/Nav.tsx`: layout and composition only.
- `CategoryCombobox.tsx`: Command+Popover combobox; writes selection to query param `category`.
- `UserMenu.tsx`: Avatar/combobox with Profile, Theme, Sign out.

9) Command palette
- `CommandPalette.tsx`: shadcn `Command` inside `Dialog`.
- Toggle with `Cmd/Ctrl+F` (single `useEffect` for document keydown; no other effects).
- Actions: Add bookmark (focus input), Filter by category, Open recent, Navigate.

10) Primary input (paste‑to‑add)
- `PrimaryInput.tsx`: uncontrolled input; on submit/paste, validate URL (Zod) → call `createBookmark`.
- Optimistic insert into list with a lightweight client store or cache mutation; reconcile on response.

11) Bookmarks list
- `BookmarksList.tsx` (client): virtualize when count is large (e.g., `virtua`).
- Row layout: favicon (`next/image`), title, domain (muted), created date (e.g., `Apr 29`). Row actions: open, copy, delete (with accessible labels).
- Sorting: default by `created_at desc`; client toggle to `asc/desc` via query param.

12) URL state
- Manage `?q=&category=&sort=&cursor=`. Consider `nuqs`; else read/write `URLSearchParams` directly.
- Back/forward restore filters and scroll.

13) States and a11y
- Empty, loading (skeleton), and error states mapped to repository results.
- Focus rings, correct roles/labels for combobox/command/list rows; `aria-live="polite"` for toasts.

14) Performance
- RSC for data fetching; memoize client islands; fixed image dimensions; lazy‑load below‑fold icons.
- Cache list queries per user/category; batch layout reads/writes; audit re‑renders.

15) QA & polish
- Keyboard: `/` focus input; `Enter` open; `Cmd+Enter` new tab; `j/k` navigate; `d` delete; `u` undo; `Cmd/Ctrl+F` command palette.
- Typecheck, lint, and format: `bun run typecheck && bun run lint && bun run format`.

## File Map (to create/update)
- `app/dashboard/page.tsx`
- `app/dashboard/loading.tsx`
- `app/dashboard/_components/Nav.tsx`
- `app/dashboard/_components/CategoryCombobox.tsx`
- `app/dashboard/_components/UserMenu.tsx`
- `app/dashboard/_components/CommandPalette.tsx`
- `app/dashboard/_components/PrimaryInput.tsx`
- `app/dashboard/_components/BookmarksList.tsx`
- `app/actions/bookmarks.ts`
- `lib/schemas.ts`
- `lib/metadata.ts`
- `lib/bookmarks-repo.ts`
- (DB migrations in Supabase or local SQLite as needed)

## Acceptance Criteria
- Auth‑protected route renders server‑side with streamed list and virtualized rows.
- Nav matches the reference: logo, `/`, category combobox; user combobox on the right.
- Command palette toggles with `Cmd/Ctrl+F` and is keyboard‑navigable.
- Paste or submit a URL adds a bookmark, fetches metadata/icon, and appears immediately (optimistic), with undo.
- URL reflects filters and sorting; Back/Forward preserves state and scroll.
- Meets accessibility and performance guidance from `INTERFACE.md`.
