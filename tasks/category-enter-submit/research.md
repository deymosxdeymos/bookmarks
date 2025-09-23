# Research - Category Enter Submit

## Current behavior
- `components/dashboard/category-combobox.tsx` renders a creation form inside the command list when `isCreating` is true. The form relies on the native `<form onSubmit={handleCreateSubmit}>` handler to add a new category.
- `handleCreateSubmit` (category-combobox.tsx) prevents default, trims the input, calls `createCategoryMutation.mutateAsync`, then closes the popover and resets creation state.
- The text input is the shared `Input` component and currently has no explicit keyboard handling besides `onChange`.

## Observations
- The creation form lives inside a `cmdk` `<Command>` context. `cmdk` listens for the Enter key to trigger highlighted command items, so the keypress likely never reaches the form submit handler.
- `INTERFACE.md` mandates: "Enter submits focused text input". The current implementation violates this rule for the create-category input.

## Opportunities / patterns
- Other interactive inputs (e.g. `components/dashboard/primary-input.tsx`) attach custom `onKeyDown` handlers to coordinate with surrounding keyboard navigation.
- Adding an `onKeyDown` that intercepts Enter, prevents `cmdk` from hijacking it, and manually triggers the existing form submit path would align with the interface guidelines.
