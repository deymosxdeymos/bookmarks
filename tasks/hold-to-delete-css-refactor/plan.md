# Plan: Hold-to-Delete CSS Refactor

## Goal
Rework the destructive action in `components/dashboard/category-combobox.tsx` to mirror the animations-dev clip-path hold interaction while preserving layout and asynchronous deletion.

## Steps
1. **Simplify Hold Logic**
   - Remove timer-based state (`isHoldActive`, `holdProgressRef`, `deleteItemRef`, `holdTimeoutRef`, `reducedMotionRef`).
   - Introduce timestamp refs to measure hold duration (`performance.now()` based) and a small boolean to track active hold state.
   - Trigger deletion when the user holds for at least 1000ms, matching the reference duration.
2. **CSS Overlay Implementation**
   - Add a CSS module for the delete item to manage base/overlay layers with `clip-path` transitions identical to the reference (`clip-path: inset(0 100% 0 0)` → `0 0 0 0`, `transition: clip-path 1s linear`).
   - Ensure module styles complement existing Tailwind classes so spacing, padding, and positioning remain unchanged.
   - Apply the overlay class to the delete `CommandItem`, using a `data-holding` attribute to support keyboard-driven holds alongside `:active`.
3. **Event Handling Updates**
   - On pointer/keyboard down: start hold tracking if deletion is allowed.
   - On pointer/keyboard up: compute elapsed time; if ≥ 1000ms, call deletion; otherwise reset state.
   - On pointer leave/cancel or key cancel (Escape): clear hold state without triggering deletion.
4. **Clean Up & Verify**
   - Update imports and remove unused code.
   - Run lint/type checks if needed.
   - Manually confirm overlay animation, layout integrity, and deletion behavior via code review (no automated tests provided).
