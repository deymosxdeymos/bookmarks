# Research

## Findings
- The delete option in `components/dashboard/category-combobox.tsx:162` swaps between two labels using Tailwind `group-hover:hidden` / `group-active:hidden` and `group-hover:flex` / `group-active:flex`, so pressing on touch triggers the "Hold to Confirm" label immediately instead of keeping "Delete Group".
- The hold interaction styling is centralized in `app/globals.css:212`, where the `.holdable` class drives the progress overlay via `::before` and `.holdable-overlay`, both toggled by `[data-holding="true"]` or `:active`.
- `ANIMATIONS.md` advises disabling hover transitions on touch devices with `@media (hover: hover) and (pointer: fine)`, suggesting hover-only affordances like the text swap should be scoped away from coarse pointers.
- `INTERFACE.md` (Touch/drag/scroll section) stresses designing forgiving touch interactions and avoiding finicky affordances, reinforcing the need to preserve the primary label on touch while still supporting the hold confirmation overlay.

## Open Questions
- None at this stage.
