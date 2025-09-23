# Research Notes

## Current rendering
- `components/dashboard/bookmarks-section.tsx` renders the metadata/date column inside a `<div className="ml-3 flex items-center gap-2">` container (line 417).
- The date lives in a `<time>` element with `group-hover:hidden group-focus-within:hidden`, and the shortcut + delete controls appear via `group-hover:flex group-focus-within:flex`.
- Because the container is left-aligned with a gap, the date doesn't line up with the header label when no controls are visible, and the width changes once the hover controls render.

## Existing patterns
- No other components in the repo swap metadata with controls on hover, so we can keep the logic local to `bookmarks-section.tsx`.
- Tailwind utilities like `min-w-*`, `justify-end`, and `text-right` are used elsewhere for column alignment (cf. skeleton rows in `dashboard-content.tsx`).

## Constraints
- INTERFACE.md emphasizes predictable layout and avoiding unwanted scroll/shift; we should reserve space for the hover controls so the column stays aligned and simply toggle visibility between the date and the hover UI.
- The header already expects right-aligned content, so constraining the column width and right-justifying both states should solve the misalignment.

## New requirement
- Hover/focus action row should no longer expose direct delete; deletion becomes keyboard-only (`⌘` + `Backspace`).
- We need to replace the trash icon button with a generic "Actions" button, reusing existing Button styles if possible, while keeping layout alignment from the previous change.
