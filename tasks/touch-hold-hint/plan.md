# Plan

1. Update the delete CommandItem markup in `components/dashboard/category-combobox.tsx` to tag the default and hover/hint label containers with dedicated class hooks (e.g., `.holdable-label`, `.holdable-hint`) without altering existing layout or behavior.
2. Limit the desktop-only text swap to hover (drop the active-state toggles) so holding down keeps "Delete Group" visible while the overlay progress runs.
3. In `app/globals.css`, scope the overlay text so coarse-pointer devices see “Delete Group” during the hold while fine pointers keep “Hold to Confirm”, avoiding blank progress states on touch.
4. Re-run `bun run lint` to ensure the change stays within style conventions.
