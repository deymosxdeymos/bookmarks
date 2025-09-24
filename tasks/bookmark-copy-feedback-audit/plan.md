# Plan - Bookmark Copy Feedback Audit

## Objectives
- Evaluate the current inline "Copied" acknowledgement for bookmark rows.
- Compare the behavior against `ANIMATIONS.md`, `INTERFACE.md`, and the `ui-snippet/app/test` reference.
- Outline concrete recommendations (animation timing, easing, layout, accessibility) for improving the copy feedback without introducing a spinner.

## Key Inputs
- `components/dashboard/bookmarks-section.tsx` – owns `handleCopyBookmark`, toast usage, and inline badge rendering.
- `app/globals.css` – defines custom easing variables (e.g., `--ease-out-quart`, `--ease-out-cubic`) and global reduced-motion rules.
- `ANIMATIONS.md`, `INTERFACE.md` – repository guidelines for motion, accessibility, and interaction semantics.
- `ui-snippet/app/test/page.tsx` – reference showing `AnimatePresence` driven success state swap without a spinner.

## Audit Checklist
1. **Trigger Coverage** – Confirm copy works via context menu, keyboard shortcut, and pointer tap, keeping focus consistent.
2. **Feedback Modes** – Determine whether inline badge + toast both satisfy `INTERFACE.md` "redundant status cues" or create noise.
3. **Animation Lifecycle** – Measure entry/exit behavior; ensure durations (<300 ms) and easing reuse `app/globals.css` tokens.
4. **Reduced Motion** – Verify `motion-safe` classes and global media query remove motion for `prefers-reduced-motion` users.
5. **Layout/Hit Target** – Check badge position, overlap with favicon/title, and ensure 24 px hit targets remain.
6. **Accessibility Semantics** – Evaluate whether additional `aria-live` or labeling is needed beyond Sonner toast.

## Reference-Informed Improvement Ideas
- Replace abrupt badge removal by wrapping the checkmark in `AnimatePresence`/`motion.div` so it slides in/out (e.g., translateX/translateY using `var(--ease-in-out-quart)` or the download arrow curve) while respecting `prefers-reduced-motion` via `MotionConfig` or conditional rendering.
- Split the feedback into icon + text zones: keep the bookmark text static while a discrete check icon animates alongside it (no background/border) to satisfy the new visual spec.
- Anchor the icon motion to the favicon origin or a dedicated inline wrapper per `ANIMATIONS.md` "origin-aware" rule to avoid covering the favicon.
- Align show/hide timing with references: 200–250 ms transition, short dwell (~1000 ms) before animating out, ensuring symmetry between entry/exit.
- Consider demoting the toast to `aria-live="polite"` only (visual minimal) or removing inline toast in favor of the sliding icon if redundancy feels excessive.
- Reserve layout space or use transform-based motion so the icon slide doesn’t introduce jank; leverage CSS stacking similar to `download-arrow` (stacked icons transitioning in opposite directions).

## Deliverables
- Written audit summarizing findings against each checklist item.
- Actionable recommendations referencing easing tokens in `app/globals.css` and the reference animation pattern, explicitly noting spinner-free approach and checkmark usage.

## Next Steps After Audit
- If pursuing implementation, create tasks for refining the inline badge component, adding exit motion, and reconciling toast usage.
