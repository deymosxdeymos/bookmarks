# AI Agent Guidelines - Bookmarks

## Commands

- **Dev:** `bun dev`
- **Build:** `bun run build` (uses Next.js with turbopack)  
- **Lint:** `bun run lint` (Biome)
- **Type Check:** `bun run check`
- **Format:** `bun run format` or `bun run fix`
- **Test (all):** `bun test`
- **Test (single file):** `bun test <file-path>`

## Code Style

- **Formatting:** Biome with tab indentation, double quotes
- **Imports:** Use `@/` alias, auto-organize imports  
- **Types:** Strict TypeScript, explicit for complex objects
- **Naming:** camelCase vars/functions, PascalCase components, kebab-case files
- **Error Handling:** Use proper try/catch blocks, return error states
- **Comments:** NEVER add useless comments. Only for race conditions, TODOs, or non-obvious complex code

## React & Next.js Patterns

- **Components:** Server Components by default, `"use client"` only for interactivity
- **State:** Skip local state (useState) unless absolutely needed. Use variables/useRef for non-reactive data
- **Effects:** Avoid useEffect. Only use for external system synchronization (DOM events)
- **UI:** Treat as thin layer over data. Derive state rather than store it
- **Forms:** React Hook Form + Zod validation
- **Auth:** Better Auth with proper session management

## Libraries & Tech Stack

- **UI:** shadcn/ui, Radix, Tailwind CSS, Lucide icons
- **Data:** TanStack Query for server state, Supabase for database
- **Utils:** clsx/cn for conditional classes, next-themes for dark mode
