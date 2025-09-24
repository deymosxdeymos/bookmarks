# Plan

1. Add a `commandRef` to `components/dashboard/category-combobox.tsx` and attach it to the `<Command>` root so we can programmatically focus the list when the popover opens.
2. When `open` becomes true, schedule a focus call on the command root (`commandRef.current?.focus({ preventScroll: true })`) to ensure keyboard users land inside the list. Use `requestAnimationFrame` to avoid racing Popover mount timing.
3. Ensure the command root is focusable by explicitly setting `tabIndex={-1}` (cmdk adds it, but we’ll be defensive) so arrow navigation is available immediately.
4. Verify Radix returns focus to the trigger on close; no additional work should be necessary, but test manually.
5. Run `bun run lint` and `bun run check`.
