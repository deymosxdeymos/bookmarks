# Plan - Bookmark Context Menu

1. **Scaffold primitives**
   - Generate shadcn `context-menu` component (if absent) to get Radix right-click support alongside existing dropdown shortcuts.
   - Audit lucide icons already installed (`Copy`, `Pencil`, `Trash2`, `FolderInput` or similar) and plan to reuse them for the menu.

2. **Server & query mutations**
   - Add `updateBookmark` helper in `lib/bookmarks-repo.ts` and expose `updateBookmarkAction` (“rename”) in `app/actions/bookmarks.ts`.
   - Create client hooks in `lib/queries/bookmarks.ts`: `useUpdateBookmarkTitle` for renames and `useSetBookmarkCategory` that wraps `setBookmarkCategoryAction` with optimistic cache updates, mirroring the delete hook.

3. **Context menu UI component**
   - Build `components/dashboard/bookmark-context-menu.tsx` that composes Radix `ContextMenu` + existing dropdown item styles.
   - Menu entries: Copy, Rename…, Delete (destructive), Move to → submenu listing categories plus “All bookmarks” / uncategorized.
   - Emit callbacks for each action so the parent (`BookmarksSection`) can run keyboard shortcuts and highlight logic consistently.

4. **Rename flow**
   - Implement an accessible rename dialog (Radix Dialog) that focuses an `Input`, validates non-empty title, and calls `useUpdateBookmarkTitle`.
   - On success, show Sonner success toast (`✓ Updated title`), trigger highlight effect on the updated row, and close the dialog. Handle optimistic cache update + error fallback.

5. **Copy / move integrations**
   - Copy action: write URL to clipboard, pessimistically report failure, display Sonner `Copied` toast on success, and trigger temporary row highlight + “checklist” feedback (following provided imagery).
   - Move action: call the new `useSetBookmarkCategory` mutation, optimistically update caches, and optionally toast (“Moved to …”). Ensure menu stays keyboard-accessible and closes after selection.

6. **BookmarksSection integration**
   - Pass categories data down from `DashboardContent` to `BookmarksSection`.
   - Wrap each `<li>` item in the new context menu component; wire callbacks to reuse `deleteBookmark`, new rename/copy/move handlers, and existing keyboard navigation (`⌘⌫`, `⌘E`, `⌘C`).
   - Manage transient UI state (e.g., `activeAction` with bookmark id + type) to add yellow highlight class on target and animate blur on siblings per `ANIMATIONS.md` and `prefers-reduced-motion`.
   - Ensure keyboard shortcuts call the same action handlers as the context menu and keep focus management intact.

7. **Polish & verification**
   - Add CSS utilities (e.g., `data-[action=...]` attributes) for highlight/blur animations, respecting reduced-motion media query.
   - Run lint/typecheck, verify no Biome formatting issues, and smoke-test accessibility (focus rings, Escape to close dialog, etc.).

