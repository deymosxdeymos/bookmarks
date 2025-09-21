# AI Agent Guidelines - Bookmarks

## Commands

- **Build:** `bun run build` (uses Next.js with turbopack)
- **Lint:** `bun run lint` (Biome)
- **Type Check:** `bun run check`
- **Format:** `bun run format` or `npm run fix`
- **Dev:** `bun dev`

## Code Style

- **Formatting:** Biome with tab indentation, double quotes
- **Imports:** Use `@/` alias, auto-organize imports
- **Types:** Strict TypeScript, explicit for complex objects
- **Naming:** camelCase vars/functions, PascalCase components, kebab-case files
- **Components:** Server Components by default, `"use client"` only for
  interactivity

## Next.js Patterns

- Server Components for data fetching, Client Components for state/interactivity
- Use proper loading.tsx, error.tsx boundaries
- Implement Suspense for async components
- Use Zod for validation, shadcn/ui for components

## Key Libraries

- UI: shadcn/ui with Radix, Tailwind CSS, Lucide icons
- Forms: React Hook Form + Zod validation
- Utils: clsx/cn for conditional classes, next-themes for dark mode
