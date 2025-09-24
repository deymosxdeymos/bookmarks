# Research

## Current implementation (`components/dashboard/category-combobox.tsx`)
- Client component handles category selection and deletion along with creating categories.
- Hold-to-delete logic uses React state/refs, manual timeouts, and inline style mutations (`holdTimeoutRef`, `holdProgressRef`, `deleteItemRef`).
- Animations rely on JS-driven transitions for width (progress bar) and `clip-path`. Reduced-motion preference toggles instant completion.
- Delete button uses multiple event handlers (`pointer`, `mouse`, `keyboard`) to manage hold start/cancel, and resets via `resetHoldState`.

## Reference implementation (`~/Developer/animations-dev/app/exercises/hold-to-delete/component.{tsx,module.css}`)
- Pure CSS approach: overlay div stacked above base content; both share same markup.
- Uses `.button:active .overlay { clip-path: inset(0 0 0 0); }` with `transition: clip-path 1s linear` so holding active state animates clip from 100% to 0%.
- No JS state changes; relies on `:active` state and CSS transition for the hold duration.

## Guidelines
- `ANIMATIONS.md`: prefer fast animations, use provided easing tokens, respect reduced motion by disabling transforms. Reference implementation uses `1s linear` clip-path.
- `AGENTS.md`: complete work via research → plan → implementation; reuse code patterns where possible; avoid unnecessary comments.

## Considerations
- Need to align dashboard delete control visuals with clip-path overlay pattern (base + overlay) instead of JS-timed progress.
- Must preserve deletion behavior (mutation call after hold completes). Likely need to trigger deletion after hold duration using pointer events since CSS alone can't run async actions.
- Should review if reference repo triggers actual delete or is purely visual; ensure new approach still calls `handleDelete` once hold completes.
