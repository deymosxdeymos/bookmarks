# AI Agent Guidelines - Bookmarks

## Multi-step approach to Context Engineering

0. Tasks

- Operating on a task basis. Store all intermediate context in markdown files in
  tasks/<task-id>/ folders.
- Use semantic task id slugs

1. Research

- Find existing patterns in this codebase
- Search internet if relevant
- Start by asking follow up questions to set the direction of research
- Report findings in research.md file

2. Planning

- Read the research.md in tasks for <task-id>.
- Based on the research come up with a plan for implementing the user request.
  We should reuse existing patterns, components and code where possible.
- If needed, ask clarifying questions to user to understand the scope of the
  task
- Write the comprehensive plan to plan.md. The plan should include all context
  required for an engineer to implement the feature.

3. Implementation a. Read plan.md and create a todo-list with all items, then
   execute on the plan. b. Go for as long as possible. If ambiguous, leave all
   questions to the end and group them.

## Commands

- **Build:** `bun run build` (uses Next.js with turbopack)
- **Lint:** `bun run lint` (Biome)
- **Type Check:** `bun run check`
- **Format:** `bun run format` or `bun run fix`
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
- See @AVOID.md for data fetching patterns and useEffect guidelines
- Treat UIs as a thin layer over your data. Skip local state (like useState)
  unless it's absolutely needed and clearly separate from business logic. Choose
  variables and useRef if it doesn't need to be reactive.
- When you find yourself with nested if/else or complex conditional rendering,
  create a new component. Reserve inline ternaries for tiny, readable sections.
- Choose to derive data rather than use useEffect. Only use useEffect when you
  need to synchronize with an external system (e.g. document-level events). It
  causes misdirection of what the logic is. Choose to explicitly define
  logic rather than depend on implicit reactive behavior
- Treat setTimeout as a last resort (and always comment why)
- IMPORTANT: do not add useless comments. avoid adding comments unless you're
  clarifying a race condition (setTimeout), a long-term TODO, or clarifying a
  confusing piece of code even a senior engineer wouldn't initially understand.

## Key Libraries

- UI: shadcn/ui with Radix, Tailwind CSS, Lucide icons
- Forms: React Hook Form + Zod validation
- Utils: clsx/cn for conditional classes, next-themes for dark mode
- Database: Supabase
