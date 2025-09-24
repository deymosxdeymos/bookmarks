# Plan

1. Update `components/dashboard/bookmark-context-menu.tsx` so the Copy, Rename…, and Delete menu items no longer call `event.preventDefault()` inside their `onSelect` handlers; keep the handlers but let Radix dismiss the menu automatically after the action fires.
2. Ensure the updated handlers still invoke the passed callbacks (`onCopy`, `onRename`, `onDelete`) without requiring the `event` argument.
3. Sanity-check that no other context menu logic requires manual dismissal and that TypeScript stays satisfied; rely on existing lint/type checks since no new behaviour beyond the dismissal change is introduced.
