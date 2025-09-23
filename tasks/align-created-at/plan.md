# Plan

1. Keep the fixed-width, right-aligned trailing column adjustments from the prior step.
2. Replace the hover/focus destructive button with a neutral "Actions" button using the shared `Button` component for consistency.
3. Remove the now-unused `handleDeleteClick` helper and related imports, ensuring keyboard delete flows remain intact.
4. Confirm hover/focus states swap between the date and the new Actions button without layout shifts; verify keyboard accessibility (Tab/Shift+Tab) focuses the button when visible and that deletion still works via `⌘`+`Backspace` only.
