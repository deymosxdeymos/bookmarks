# Research: Hold-to-Delete Comparison

## Reference Implementation (animations-dev)
- Component: `/home/deymos/Developer/animations-dev/app/exercises/hold-to-delete/component.tsx`
- Styling: `/home/deymos/Developer/animations-dev/app/exercises/hold-to-delete/component.module.css`
- Interaction model: Pure CSS `:active` state drives the hold interaction
  - Button structure: two identical content layers (`base`, `overlay`) stacked with absolute positioning
  - `overlay` layer initial state: `clip-path: inset(0 100% 0 0)` fully hiding destructive styling
  - Active state (`.button:active .overlay`): clip-path transitions to `inset(0 0 0 0)`
  - Transition duration: `1s linear`; no JS involvement, relies on continuous press
  - No cancellation logic; releasing pointer before 1s simply ends `:active` state instantly and animation snaps back due to `clip-path` revert
  - No accessibility affordances beyond default button behavior; text "Hold to Delete" visible at all times on both layers

## Bookmarks CategoryCombobox Implementation
- Component: `/home/deymos/Developer/bookmarks/components/dashboard/category-combobox.tsx`
- Context: Destructive action inside Radix `Command` list within `Popover`
- Interaction handled in React component with fine-grained control
  - Uses `useState`, `useRef`, and custom timers to manage hold lifecycle
  - Tracks `isHoldActive`, `holdTimeoutRef`, `holdProgressRef`, `deleteItemRef`, `reducedMotionRef`
  - Uses `HOLD_DURATION_MS = 500`, `RESET_ANIMATION_DURATION_MS = 200`
- Motion handling
  - On hold start: progress bar width animates from 0 to 100%; uses JS to toggle inline styles and transitions based on reduced motion preference
  - Text color morph achieved by manipulating CSS custom property `--delete-text-progress` and clip-path style per text span (`data-delete-clip`)
  - Uses `requestAnimationFrame` to ensure transition kicks in after style mutation
- Destructive action execution
  - After hold duration (500ms default, 300ms reduced motion), setTimeout triggers `handleDelete`
  - `handleDelete` calls `deleteCategoryMutation.mutateAsync` (Supabase), closes popover, clears selection, resets hold state
  - Uses toast feedback on failure and ensures hold state resets in finally block
- Cancellation logic
  - `cancelHold` resets progress if pointer leaves, mouseup, pointer cancel, or keyup events fire before timeout
  - `resetHoldState` clears timer, resets inline styles for progress bar, text morph, and clip-path transitions
- Accessibility / keyboard support
  - Handles space/enter keydown to start hold, keyup to cancel
  - Prefers reduced motion: listens to `(prefers-reduced-motion)` media query via effect, adjusts animation to instant transitions and shorter timeout
- Visual layers
  - Single `CommandItem` containing overlay div for progress plus nested spans for dual text states (default "Delete Group" and hover "Hold to confirm")
  - `ColorSwatch` reused for category color indicator consistency

## Observed Differences
- Reference relies on CSS-only `:active`; bookmarks component uses managed JS state and inline style manipulation
- Reference uses dual button layers; bookmarks uses single command item with animated overlay div and text morph spans
- Bookmarks implementation supports cancellation, reduced motion, async deletion, toasts, and router updates; reference does not
- Bookmarks hold duration 500ms vs reference 1000ms; includes easing resets and custom shadow states
- Bookmarks integrates with hotkey system, search params, and command list event management whereas reference is an isolated demo
