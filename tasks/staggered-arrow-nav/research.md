# Research Notes

## Existing behavior
- `components/dashboard/bookmarks-section.tsx` handles bookmark focus via `handleItemKeyDown`, moving one item per `ArrowDown`/`ArrowUp` press using `focusIndex`.
- Holding the key triggers repeated `keydown` events (browser auto-repeat), so focus advances rapidly but still hits every bookmark sequentially.
- No additional timers or animations are applied; focus changes are immediate.

## Accessibility guidance
- WAI-ARIA Authoring Practices for list-like widgets (menus, listbox, roving tabindex) specify that arrow keys move focus to the next/previous item on each key press, and browser key repeat is considered acceptable.
- Introducing artificial delays or animations between focus changes can make keyboard navigation feel laggy and may conflict with system repeat expectations, especially for power users.
- INTERFACE.md emphasizes “Full keyboard support per WAI-ARIA APG” and keeping interactions forgiving; slowing navigation risks violating these principles.

## Animation guidance
- ANIMATIONS.md recommends short, deliberate animations but also stresses responsiveness and honoring `prefers-reduced-motion`.
- Adding a staggered animation on focus change would require pausing between focus updates or animating focus styles, which could introduce perceptible latency.

## Conclusion from research
- Current behavior aligns with ARIA patterns: each key press (including auto-repeat) advances focus instantly without additional throttling.
- A stagger/delayed effect would deviate from APG expectations and could hinder keyboard accessibility; not recommended unless there is a strong UX rationale that outweighs accessibility impacts.

## Styling opportunity
- `li` elements already include `transition` but rely on Tailwind’s default (150ms, ease-in-out). We can make the highlight feel smoother by explicitly using `motion-safe:transition-colors`, `duration-200`, and an `ease-out` curve.
- Swapping the date with the shortcut chips currently uses `display: none` toggles, so there’s no cross-fade. Using opacity transitions with an overlay preserves alignment and gives a softer feel when holding Arrow keys.
