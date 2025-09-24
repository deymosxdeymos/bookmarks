# TODO

- [x] Add label-specific class hooks and adjust utility classes in `components/dashboard/category-combobox.tsx` delete item.
- [x] Scope hover-only label swap in `app/globals.css` using `@media (hover: none)` to preserve default text on touch.
- [x] Run `bun run lint`.
- [x] Drop active-state text swap so hold keeps "Delete Group" visible while the overlay progresses.
- [x] Ensure touch hold overlay text shows "Delete Group" while desktop retains "Hold to Confirm".
- [x] Smooth first-hold progress by syncing CSS hold duration with JS timeout.
- [x] Keep destructive background neutral until the hold actually fires.
