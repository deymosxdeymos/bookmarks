# Plan

1. Remove the JS-driven progress UI from `components/dashboard/category-combobox.tsx` (state setters, refs, timeout reset helpers) so the hold interaction is no longer manipulating DOM styles directly.
2. Rebuild the delete command item markup to use the clip-path overlay pattern from animations-dev: duplicate content layers (base + overlay), default overlay clip-path inset to 100%, and rely on the `:active` state to animate the overlay to 0 via a 1s linear transition.
3. Update hold logic to a minimal timer that triggers `handleDelete` after the hold duration (match the 1s animation); clear the timer on cancel paths (pointer/key release, leave, cancel, popover close).
4. Verify accessibility interactions (keyboard activation, reduced-motion behaviour) still work and adjust styling/utilities as needed to align with project guidelines and ANIMATIONS.md.
