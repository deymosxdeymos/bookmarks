# Plan - Category Hotkeys

1. Extend `CategoryCombobox` to compute a `hotkey` label for each option (All plus categories) using the display order, and remove the bookmark-count pill in favor of a hotkey badge that hides when the option is currently selected.
2. Add a document-level `keydown` handler that listens for bare digit presses (ignoring modifier keys and editable targets) and calls `applySelection`/`setOpen(false)` for the matching option.
3. Update the render loop to show the hotkey badge (styled as a compact pill) and reuse the computed mapping for both the UI and the keyboard handler.
4. Run lint (and type-check if feasible) to ensure there are no regressions.
