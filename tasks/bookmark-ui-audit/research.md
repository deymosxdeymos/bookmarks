# Research – Bookmark UI Audit

## Repository state
- `git status --short --branch` shows modified files touching bookmark flows: `app/actions/bookmarks.ts`, `components/dashboard/bookmarks-section.tsx`, `components/dashboard/dashboard-content.tsx`, `lib/bookmarks-repo.ts`, `lib/queries/bookmarks.ts`, `lib/schemas.ts`, and dependency updates (`package.json`, `bun.lock`). New UI modules include `components/dashboard/bookmark-context-menu.tsx`, `components/dashboard/bookmark-rename-dialog.tsx`, and `components/ui/context-menu.tsx`. A new Supabase migration (`20250924000000_optimize_rls_policies.sql`) is also untracked but unrelated to UI.

## Current implementation highlights
- **Copy feedback:** `components/dashboard/bookmarks-section.tsx:618-666` wraps each `<li>` in a `BookmarkContextMenu` and drives transient state via `feedback`. When `feedback` is set to `{ id, type: "copied" }`, the target row receives `bg-amber-100` and siblings get `opacity-50 motion-safe:blur-[2px]`. A floating pill with `Check` + “Copied” animates in from the top-left. This conflicts with the latest product feedback (“remove blur and yellow highlight on copy; only show checkmark animation”).
- **Rename flow:** `handleRenameConfirm` triggers `triggerFeedback` with type `"renamed"`, but the UI reuses the same highlight/blur scaffolding; there is no inline editing. Instead, `BookmarkRenameDialog` (new modal in `components/dashboard/bookmark-rename-dialog.tsx`) opens on rename actions, focusing an `<Input>`. This diverges from the desired inline edit experience (blur others and highlight the active row *during editing*, not via modal success feedback).
- **Focus management gaps:** The dialog resets `renameTarget` but never restores focus to the originating bookmark link once closed. `lastFocusedBookmarkIdRef` tracks IDs, yet there is no effect that re-focuses `data-bookmark-link` elements after rename completion, potentially violating the focus-return requirements in `INTERFACE.md`.
- **Keyboard shortcuts:** The regression called out earlier appears fixed—the new global handler gates on `event.metaKey || event.ctrlKey` before handling `c/e/z` (`components/dashboard/bookmarks-section.tsx:489-524`). Local `onKeyDown` also checks modifiers. No audit issues here, but documenting for completeness.
- **Context menu primitives:** `components/ui/context-menu.tsx` introduces Radix wrappers with animated portal content. Shortcuts render as plain text (e.g., `"⌘ C"` in `BookmarkContextMenu`), which does not use the non-breaking spaces mandated by `INTERFACE.md` for key chords (`⌘&nbsp;+&nbsp;K` etc.). Need to confirm whether the design requires the `+` glyph or spaced chords.

## Reference repo comparison
- Searched `~/Developer/animations-dev/app/exercises/` for bookmark-specific patterns (`rg "bookmark"`, `rg "context"`, `rg "copied"`)—no direct bookmark example exists. The exercises emphasize motion (e.g., `feedback/`, `toast-component/`) with inline edits and animated state changes, suggesting we should lean on localized motion rather than whole-list blurs.
- The `feedback` exercise demonstrates inline transitions without modal overlays: interactions stay within the component, and blur effects are reserved for intentional focus (success state blurs exiting content, not sibling items). This aligns with user feedback to keep editing inline and avoid heavy-handed list blurring for copy confirmation.

## Guideline checkpoints
- **INTERFACE.md:** requires focused elements to maintain visible focus, keyboard navigation parity, and proper ellipsis usage. The rename modal’s lack of focus restoration and the blurred list (which can obscure focus outlines) are risk areas. Non-breaking-space guidance for shortcut hints is currently unmet.
- **ANIMATIONS.md:** recommends short durations (~200–300 ms) and compositor-friendly props. The current blur animation on list items (`motion-safe:blur-[2px]`) animates filter, which is allowed but should remain <20 px (met) and used sparingly; user wants it removed for copy anyway. The floating “Copied” pill follows opacity/transform-friendly animation via Tailwind `motion-safe:animate-in`, within duration bounds.

## Open questions / uncertainties
- Need clarity on whether rename success should still show any confirmation UI once inline editing replaces the modal (e.g., toast vs. inline state).
- The design intent for shortcut hint typography (with or without `+` separators) should be validated against INTERFACE.md requirements.
- Determine if we should keep `toast.success("Copied")` when the row already shows an inline badge, or consolidate feedback into one channel.
