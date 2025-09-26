# Bookmark, inspired by bmrks by rauno

Trying to build a minimal bookmark app for for personal usage, designed with personal preferences. Bare-featured, minimal boring interface. Auto-detect input content type. Render links with page metadata. Keyboard-first design. Animated appropriately. Loads fast (citation needed). No onboarding. No tracking. No ads, ever.

The point of this is no fancy-ass interactions, make it responsive strive to be more like a terminal app response wise. Keyboard centric, all things have command for them.


Tools:
- NextJS framework
- Bun
- Shadcn/UI for ui components
- Supabase for database
- Tailwind for styling

## Development

- Run `bun dev` to start the app. The helper script ensures the Postgres service from `docker-compose.yml` is running (`docker compose up -d postgres`), waits for it to become ready, and then launches `next dev --turbopack`.
- Local defaults use the connection string `postgresql://postgres:postgres@127.0.0.1:5432/bookmarks`. Set `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, or `POSTGRES_PORT` before `bun dev` to override any of these values.
- The Supabase client is disabled outside production unless you explicitly opt in by setting `NEXT_PUBLIC_USE_SUPABASE=true` and providing `NEXT_PUBLIC_SUPABASE_URL` plus `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
