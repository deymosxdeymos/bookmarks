# Research – Global Paste to Bookmark

- Bookmark creation happens through `PrimaryInput` (`components/dashboard/primary-input.tsx`). Submitting the form calls `handleSubmit`, which normalizes the pasted string into a URL (prefixes `https://` when missing) and invokes `useCreateBookmark`.
- `handleSubmit` lives as a local async function; it isn't memoized, so any effect relying on it must treat it as a dependency or wrap it in `useCallback`.
- The command input is tagged with `data-command-target` and currently gains focus via keyboard shortcuts (`⌘/Ctrl+F`, Arrow navigation). Pasting while the input is focused inserts text but still requires Enter to create the bookmark.
- Existing global key handlers ignore modifier commands when focus is inside text inputs/textarea/contentEditable (`INTERFACE.md` compliance). We need similar guards to avoid hijacking paste when the user is editing inline (e.g., rename field) or in other forms.
- Clipboard access via `navigator.clipboard.readText()` requires user activation; capturing the `'paste'` event provides access to `event.clipboardData` without additional permissions and supports context-menu paste as well.
- `useCreateBookmark` automatically optimistically prepends the new bookmark in React Query caches, so consumers (BookmarksSection) will reflect the addition without extra wiring.

Open considerations:
- Avoid firing multiple creates while a mutation is pending.
- Trim/pick the first line from pasted content to prevent accidental multi-line submissions.
- Preserve native paste behavior for inputs/textareas/contentEditable to respect expectation per INTERFACE guidelines.
