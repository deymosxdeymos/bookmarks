# Plan

1. Keep the shared `focusFirstBookmark` helper in the primary input so both the input handler and global shortcut reuse the same selector.
2. Document-level ArrowDown handler remains responsible for moving focus from anywhere on the dashboard to the first bookmark while skipping editable controls.
3. Update `handleItemKeyDown` in `components/dashboard/bookmarks-section.tsx` so when the user presses `ArrowUp` on the first bookmark it focuses the command input (`[data-command-target]`) instead of looping.
4. Prevent default scrolling when transferring focus back to the command input and bail out gracefully if the input is missing or disabled.
5. Retain existing ArrowUp behavior for other bookmarks so navigation inside the list is unchanged.
6. Manually verify ArrowDown still works from body/input, and ArrowUp on the top bookmark shifts focus to the command input, with no unexpected scroll jumps.
