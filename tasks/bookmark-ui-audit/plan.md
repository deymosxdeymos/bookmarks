# Plan – Bookmark UI Corrections

1. **Simplify copy feedback**
   - Retain Sonner toast but replace `feedback` blur/yellow logic with a concise inline badge animation per `ANIMATIONS.md` (opacity/transform, ≤300 ms) that honours `prefers-reduced-motion`.
   - Ensure removal of list-wide blur preserves visible focus per `INTERFACE.md`.

2. **Implement inline rename**
   - Replace modal dialog with inline edit surface that swaps the title block for an `<form>` inside the list item; keep other rows dimmed only while the edit field is focused, reverting smoothly when done.
   - Manage optimistic mutation via `useUpdateBookmarkTitle`, submit on Enter (with modifiers for new tab etc.), Esc to cancel, restore focus to the bookmark link after submit/cancel.

3. **State management & accessibility**
   - Extend local state to track `activeInlineEditId`, apply `aria-live` or appropriate attributes so announcements remain polite, and ensure keyboard shortcuts respect editing state (no global copy/rename while inline form is open).
   - Leverage existing `lastFocusedBookmarkIdRef` to re-focus after rename completion.

4. **Polish & shortcuts**
   - Update `ContextMenuShortcut` strings to use non-breaking spaces (`⌘ + C`) compliant with `INTERFACE.md`.
   - Verify animations mirror examples from `~/Developer/animations-dev/app/exercises/` or `~/Developer/ui-snippet/app/`, respecting reduced-motion, and adjust tests/linting as needed.

5. **Cleanup & verification**
   - Remove unused `BookmarkRenameDialog` component and related imports.
   - Run lint/type checks (`bun run lint`, `bun run check`) if time permits; prep summary of changes and outstanding questions.
