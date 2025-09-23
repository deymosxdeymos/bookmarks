# Research - Category Hotkeys

## Current display
- `components/dashboard/category-combobox.tsx` renders each category option inside a `CommandItem` with the count pill `categoryOption.bookmarkCount ?? 0` positioned on the right.
- `options` is built from `All` plus the `categories` prop in order, so the menu already shows categories from oldest to newest.
- The UI shows a checkmark for the selected category, and the number area doubles as the count label.

## Keyboard behavior today
- There is no shortcut handling for numeric keys in `CategoryCombobox`.
- Other areas (e.g. `components/dashboard/primary-input.tsx`) add global `keydown` listeners that bail when the focus is inside editable elements, which we can mirror to avoid stealing digits while typing.

## Desired change
- Replace the count with deterministic numbering where `All` is `1` and other categories increment (`2…n`). The number should represent a keyboard shortcut for switching categories, not the bookmark count.
- Implement keyboard handling so pressing the displayed digit programmatically selects the matching category (closing the popover and updating the filter).
