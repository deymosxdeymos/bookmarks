# Findings

- `components/dashboard/bookmark-context-menu.tsx` hooks into Radix `ContextMenuItem.onSelect` and currently calls `event.preventDefault()` before invoking `onCopy`, `onRename`, and `onDelete`. Radix keeps the menu open when default is prevented, which matches the stuck overlay behaviour reported in review.
- The nested `ContextMenuRadioGroup` for "Move to…" relies on `onValueChange` without any manual event suppression and already dismisses as expected, so there is no need for special dismissal handling elsewhere in the component.
- No other context menu implementations exist in the codebase, so aligning with Radix defaults (letting `onSelect` dismiss automatically) will be consistent with component intent and matches broader Radix usage guidelines.
