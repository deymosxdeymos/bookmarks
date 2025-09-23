# Research: Dialog Accessibility Error

## Triggering Context
- Console warns that `DialogContent` usage requires a sibling `DialogTitle` for screen reader accessibility (Radix UI requirement).
- Stack trace points to `components/ui/dialog.tsx` and `components/dashboard/category-combobox.tsx`.

## Existing Implementation
- `components/ui/dialog.tsx` re-exports Radix `Dialog` primitives but only defines `DialogContent` wrapper. No `DialogTitle` helper is exported, so downstream components must import `DialogPrimitive.Title` directly to satisfy Radix requirements.
- `CategoryCombobox` renders `DialogContent` with a `Command` list but does not provide any `DialogTitle`. This is the only usage of `DialogContent` in the repository (checked with `rg "<DialogContent"`).

## Considerations
- To keep API aligned with shadcn/ui, we can add `DialogTitle` (and optional `DialogHeader`/`DialogDescription`) wrapper components in `components/ui/dialog.tsx` just like the standard template, enabling simple reuse and consistent styling.
- If we need a non-visible title in `CategoryCombobox`, Radix recommends wrapping a `DialogTitle` with `VisuallyHidden`.

