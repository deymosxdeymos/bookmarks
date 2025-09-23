# Plan: Fix Dialog Accessibility Warning

1. Update `components/ui/dialog.tsx` to expose Radix primitives for `DialogTitle` (and `DialogDescription` if needed) so downstream components can satisfy accessibility requirements without re-importing from Radix directly.
2. Add a meaningful `DialogTitle` to `CategoryCombobox`'s dialog content (visible or visually hidden with `sr-only`) so screen readers have an accessible label while keeping the existing UI layout.
3. Run `bun run lint` (fast Biome lint) to ensure the updated files conform to project standards and no new issues are introduced.

