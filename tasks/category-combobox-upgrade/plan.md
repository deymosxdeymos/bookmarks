# Plan

1. Refine combobox layout to mirror the reference: increase swatch size, adjust spacing/typography, align counts to the right, and ensure the action section matches the provided design with separators and icon styling.
2. Implement a hold-to-confirm delete affordance:
   - Change the action label to “Delete Group” by default, switching to “Hold to confirm” on hover/focus.
   - Start a timed confirmation when the control is pressed (pointer or Space/Enter); animate a red progress bar during the hold, cancel on release/leave, and execute deletion once the hold completes.
   - Honor `prefers-reduced-motion` by skipping the animation yet still requiring the hold duration unless reduced motion should shorten it (fall back to instant bar fill).
3. Keep accessibility intact: visible focus rings, aria labels/status updates if needed, keyboard parity, and motion-safe transitions consistent with `app/globals.css` easing tokens.
4. Re-run lint/check and outline manual verification (visual parity, hold action, reduced-motion behavior, keyboard use).
