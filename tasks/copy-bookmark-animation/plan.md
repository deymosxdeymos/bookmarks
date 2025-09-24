# Plan

1. Audit copy feedback structure in `components/dashboard/bookmarks-section.tsx` and outline both the default bookmark row markup and the copy state glyph/text we need to replace.
   - Confirm how the favicon image + title/link block is rendered so we can stage both the default content and the “Copied” state inside the same footprint.
   - Note existing helpers (`showCopyFeedback`, timers) so we only swap visuals, not state management.
2. Design a dual-state container that lets us slide the normal content out and the copy confirmation in, following the `download-arrow`/`toast-component` patterns.
   - Wrap the favicon + text block in an `overflow-hidden` element that contains two rows stacked vertically: the default row and the copy confirmation row (`Check + Copied`).
   - Use `motion-safe` translateY/opacity transitions over ~220 ms with `var(--ease-out-quint)` for the downward reveal; ensure reduced-motion users see an instant swap.
   - Switch the icon colors to rely on theme tokens (foreground/background) instead of hard-coded green, and hide the timestamp while the copy state is active.
3. Polish behaviour & verify.
   - Make sure the title link/timestamp are visually replaced during feedback, with the favicon swapping to the check glyph within the same square footprint.
   - Confirm stacking/context (z-index, pointer-events) keeps the overlay from blocking interactions once it animates out.
   - Run `bun run lint` (and any targeted visual checks) after the JSX/CSS updates.
