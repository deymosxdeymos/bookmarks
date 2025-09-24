# Research - Bookmark Context Menu

## Existing bookmark list implementation
- `components/dashboard/bookmarks-section.tsx` renders the bookmark rows and owns keyboard + deletion logic. Each row is a focusable `<a>` tag (`data-bookmark-link`) inside a `group` list item.
- The component keeps refs to the list root and uses DOM queries to manage focus during keyboard actions and accelerated delete (`⌘⌫`).
- Deletion already integrates with `useDeleteBookmark` and Sonner undo toasts; keyboard handler catches `Meta+Backspace` / `Ctrl+Backspace` both on the focused link and globally.

## Missing actions
- There is no client-side copy or rename flow yet: no clipboard helper, no optimistic UI for copy, no update mutation.
- Server layer only exposes `createBookmark`, `deleteBookmark`, and `setBookmarkCategory` actions. There is no action to update bookmark title or other fields.
- No hook exists to mutate bookmark category from the client (`setBookmarkCategoryAction` is exported server-side but unused client-side).

## UI building blocks already in the repo
- shadcn dropdown primitives live in `components/ui/dropdown-menu.tsx`; they include shortcut slots and submenus we can reuse for the “Move to…” list if we compose them inside a context menu.
- No context-menu wrapper is present yet (`rg "ContextMenu"` returns no hits). We’ll need to scaffold shadcn’s `context-menu` package (Radix) if we want native right-click support.
- Dialog, Popover, Command, Input components are available should we need modal rename input (see `components/ui/dialog.tsx`, `components/ui/popover.tsx`, `components/ui/command.tsx`).
- Sonner toasts are already wired globally via `app/layout.tsx` and the `toast` helper is used for deletes, so success states ("Copied", "Updated title") can be implemented consistently.

## Category data
- `useCategories` (lib/queries/categories.ts) fetches the list, and server exposes `setBookmarkCategoryAction(bookmarkId, categoryId)` for reassignment.
- We’ll likely want a dedicated client mutation for `setBookmarkCategoryAction` that keeps React Query caches coherent (similar to `useDeleteBookmark`).

## Styling and animation references
- `app/globals.css` defines easing custom properties like `--ease-out-quart` already used inside `BookmarksSection`. Motion-safe utility classes are sprinkled across list rows for hover/focus states.
- `ANIMATIONS.md` calls for compositor-friendly transforms/opacity, max durations ≈300ms, and prefers `ease-out` curves.
- Screenshots call for: (1) context menu with shortcuts, (2) rename success highlight (yellow row, blurred siblings), (3) Sonner toast with check icon, (4) copy acknowledgement with checklist/check badge.

## Constraints / guidelines to honor
- `INTERFACE.md` requires full keyboard support, visible focus rings, accessible labels, and using ellipsis (`…`) for follow-up actions.
- `AGENTS.md` mandates storing plan/todo in `tasks/<task-id>/` and following research → plan → implementation workflow.
- Animations must respect `prefers-reduced-motion` per `ANIMATIONS.md`.
