# Research: CSS Hold-to-Delete Refactor

## Reference (animations-dev)
- Location: `/home/deymos/Developer/animations-dev/app/exercises/hold-to-delete/component.tsx`
- Structure: `<button>` contains two identical children (`ButtonContent`) stacked; overlay positioned absolutely.
- Visual behavior: overlay uses `clip-path: inset(0 100% 0 0)` initially, transitions to `inset(0 0 0 0)` over `1s linear` while button is `:active`.
- Interaction: Pure CSS; no JavaScript timers. Hold is recognized by sustained `:active` state for the 1s transition duration.

## Current Bookmarks Implementation
- File: `/home/deymos/Developer/bookmarks/components/dashboard/category-combobox.tsx`
- Delete entry is a `CommandItem` with extensive JS-driven hold logic.
- Uses refs (`holdProgressRef`, `deleteItemRef`) and timers (`setTimeout`) to animate a progress bar and clip-path text reveal.
- Hold duration is `500ms` (or `300ms` with reduced motion) managed in JS; deletion triggers when timeout resolves.
- Provides cancellation handlers for pointer/keyboard events and resets inline styles on release.

## Constraints / Goals
- User wants parity with the reference interaction: CSS-driven overlay animation, 1s hold duration, clip-path reveal.
- Layout, padding, and positioning of the existing UI must remain unchanged.
- Must still trigger async deletion once hold completes; no JS timers per instruction "follow theirs".
- Need to reconcile CSS-driven animation with command item semantics and existing delete mutation flow.
