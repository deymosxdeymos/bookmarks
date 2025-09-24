# Research - Bookmark Copy Feedback Audit

## Current copy interaction in `BookmarksSection`
- `components/dashboard/bookmarks-section.tsx` owns the copy flow via `handleCopyBookmark`, leveraging `navigator.clipboard.writeText` with a textarea fallback. Successes call `toast.success("Copied")`; failures raise `toast.error`.
- The component keeps `feedback` state (`{ id, type: "copied" | "renamed" }`) and a `feedbackTimeoutRef` that clears after 1400 ms, removing the visual badge without any exit animation.
- When `feedback.type === "copied"`, the list item renders an absolutely positioned badge (`absolute left-3 top-2`) with `Check` icon + "Copied" label. Styling uses `motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200 motion-safe:ease-[var(--ease-out-quart)]`, so it only animates on motion-safe devices and eases with the global quartic ease-out token.
- The badge is `pointer-events-none` and lacks explicit ARIA attributes; screen readers keep the list item contents (`aria-live` is not involved), so the acknowledgement is visual-only. Toasts (Sonner) deliver the accessible announcement instead.
- Copy is accessible across interaction modes: context menu "Copy" action, keyboard shortcut (`⌘/Ctrl+C`) on the focused row, and mouse/touch via the context menu button. Focus management tracks the last-focused bookmark to support global shortcuts per `INTERFACE.md` guidance.

## Animation + interface characteristics
- Tailwind `motion-safe` utilities respect `prefers-reduced-motion` automatically—animations collapse to instant transitions under reduced motion thanks to the global `@media (prefers-reduced-motion: reduce)` rule in `app/globals.css`.
- Duration is fixed at 200 ms (Tailwind `duration-200`) with `var(--ease-out-quart)`, aligning with `ANIMATIONS.md` recommendations (fast, ease-out curves, ≤300 ms). There is no paired fade-out; the badge disappears abruptly when `feedback` resets.
- The badge overlays the favicon area. Because it is absolutely positioned, the underlying link content remains in the DOM order, but visually the favicon/title shift is hidden while the badge shows. Siblings keep standard opacity unless rename feedback is active (which dims others to 40%).
- The toast confirmation uses Sonner's default slide animation (subject to global reduced motion overrides) and includes success styling, so users receive redundant cue (toast + inline badge). This redundancy can feel noisy but satisfies `INTERFACE.md` "redundant status cues" requirement.

## Reference snippet (`ui-snippet/app/test`)
- `page.tsx` demonstrates a button state machine (`idle` → `loading` → `success`) using `motion/react`'s `MotionConfig` with a spring transition (`type: "spring"`, `duration: 0.3`, `bounce: 0`).
- Copy text swaps are animated with `AnimatePresence` and `motion.span`, moving copy vertically (`initial y: -25`, `animate y: 0`, `exit y: 25`) while fading in/out to maintain continuity.
- The snippet leans on layout-preserving transitions (`mode="popLayout"`) to smoothly morph content without layout shift, emphasizing cause/effect clarity—a useful pattern for our inline badge or button states.

## Reference snippet (`animations-dev/app/exercises/download-arrow`)
- Hover interaction shows two stacked arrow icons that slide/translate along the Y axis using pure CSS transitions on `transform`.
- Entry/exit symmetry: the top arrow animates in from `-150%` to `0%` while the bottom arrow exits to `150%`, both over 250 ms with the custom cubic-bezier `(0.77, 0, 0.175, 1)` (similar to `var(--ease-in-out-quart)` in `app/globals.css`).
- The icons share the same origin (`grid-area: 1 / 1`), so motion feels anchored and doesn’t require background/border treatments—aligns with the requested checkmark-only cue.
- Pattern takeaway: stack success + default icons in the same container and animate them independently to create a smooth slide without layout shift or extra chrome.

## Guideline alignment + gaps
- ✅ `ANIMATIONS.md`: fast (200 ms) ease-out entry, compositor-friendly opacity translation (Tailwind animation). Respects reduced motion via `motion-safe` and global media query.
- ⚠️ No exit animation—the badge vanishes instantly at 1400 ms, breaking the "clarify cause/effect" spirit and feeling abrupt versus the reference's bidirectional motion.
- ⚠️ Badge location may overlap key content (favicon) and is not mirrored in DOM order. Consideration needed to avoid visual jitter when the badge appears/disappears, keeping list height stable.
- ⚠️ Duplicate feedback (inline badge + toast) might overwhelm. `INTERFACE.md` encourages polite `aria-live` toasts; we should audit whether both cues are necessary or if one can be demoted (e.g., toast `aria-live="polite"` only, inline badge exclusively visual).
- ✅ Keyboard+pointer parity already established; shortcuts follow `INTERFACE.md` expectations. Hit targets remain ≥24 px (`py-2`, `px-3`, icon button sizes) and focus rings are provided via Tailwind `focus-visible` styles.
- ⚠️ No explicit mention of timing alignment for the 1400 ms badge lifespan—`ANIMATIONS.md` suggests keeping animations short but purposeful; referencing the spring demo's dwell times could guide a smoother lifecycle (e.g., animate out before removal).

## Opportunities inspired by reference
- Animate the inline "Copied" state with `framer-motion` or Tailwind keyframes to mirror the reference's entrance/exit (e.g., slide from trigger origin with `transform-origin` near the favicon). Keep duration ≈200–250 ms.
- Reuse the existing `feedback` machine but add `AnimatePresence` around the badge so it fades/flies out instead of disappearing, optionally syncing with toasts or replacing them.
- Ensure motion respects `prefers-reduced-motion` by guarding `motion` components or providing static fallback, matching the current tailwind `motion-safe` approach.
