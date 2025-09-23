# Research Notes

## Current category picker
- `components/dashboard/category-combobox.tsx` renders a `Dialog` with `Command` inside; the trigger is an outline `Button`. The dialog centers on screen, which we want to replace with a popover-style combobox.
- Category options come from the `categories` prop (`Category[]`) plus a synthetic `{ id: null, name: "All" }` entry. Selecting updates the URL via router/`searchParams` and closes the dialog.
- There is no support for creating/deleting categories in the UI. The combobox only lists existing categories.

## Data layer capabilities
- `lib/bookmarks-repo.ts` exposes `listCategories` and caches but **no create/delete** helpers yet. DB schema stores `id`, `name`, `color`, `created_at`.
- `app/api/categories/route.ts` currently only supports `GET` (list categories). No POST/DELETE endpoints exist.
- `lib/queries/categories.ts` provides a simple React Query `useCategories` hook, but no mutations.

## UI building blocks
- The project already uses shadcn command components (`components/ui/command.tsx`) and dialogs. There is no `Popover` component yet, nor the `@radix-ui/react-popover` dependency.
- Buttons follow Tailwind classes with motion-safe transitions; `app/globals.css` defines custom easing tokens (e.g., `--ease-out-quart`) we can reuse.
- INTERFACE.md emphasizes ARIA-compliant keyboard support, visible focus rings, and predictable layout. ANIMATIONS.md suggests short (~200 ms) transitions with `ease-out` curves and respecting `prefers-reduced-motion`.

## Reference widget goals
- Replace the current dialog with a shadcn combobox popover anchored below the trigger.
- Display category rows with color dots and counts similar to the supplied reference image.
- Provide actions for creating a new group (category) and optionally deleting the current one. Creation should happen inline without leaving the flow.
- Keep keyboard interactions (Up/Down, typeahead) working via `cmdk` components and ensure new actions are reachable via keyboard.

## Reference alignment & delete interaction
- Reference dropdown shows larger color swatches (likely 16px) with gradient fills and consistent spacing; the list items use light text with counts right-aligned in muted gray.
- Action items (“New Group”, “Delete Group”) are separated by a divider and use leading icons.
- Delete should transform from a static label to a “Hold to confirm” affordance with a red progress indicator on press. Needs keyboard accessibility (Space/Enter) and respect for reduced motion (instant completion when reduced motion is set).

## Hold-to-confirm reference
- Reference shows the delete row turning red with a label “Hold to confirm” and a progress indicator filling under the text while the pointer is held down. The icon also tints red.
- Cursor visually changes to pointer; the hold area stays active while the pointer remains inside. Releasing early cancels the action.
- Goal: mirror this using CSS transitions (width/scale) and timers in JS, fall back to instant completion when reduced motion requested.
