# Research Notes

## Existing keyboard flow
- `components/dashboard/primary-input.tsx` is the command box. It listens for `ArrowDown` on the input and focuses the first bookmark via `[data-bookmarks-root] [data-bookmark-link]`.
- The same component already installs a document-level handler for `⌘/Ctrl + F` to focus the input, so it is a natural place to extend global keyboard shortcuts.
- Once any bookmark link is focused, `components/dashboard/bookmarks-section.tsx` handles navigation with `ArrowDown`, `ArrowUp`, `Home`, and `End`, plus delete/undo flows.

## Observations
- There is no global handler that focuses the first bookmark when `ArrowDown` is pressed outside the command input, so keyboard users must focus the input first.
- Bookmark links expose `data-bookmark-link`/`data-bookmark-id` attributes and live under `[data-bookmarks-root]`, so we can reuse the existing selector for consistency.
- We should avoid hijacking `ArrowDown` presses when the active element is inside a text/textarea/select or when a modifier key is present, so other components keep their expected UX.

## Additional note
- `components/dashboard/bookmarks-section.tsx` already handles `ArrowUp` via `focusIndex(currentIndex - 1)`. We can branch when `currentIndex === 0` to move focus back to the command input.
- The command field is marked with `data-command-target`, so we can query it and call `focus({ preventScroll: true })` to keep visual stability.
