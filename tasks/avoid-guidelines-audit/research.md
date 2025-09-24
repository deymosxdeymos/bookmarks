# Research – AVOID.md Compliance

## Guideline summary
- Avoid fetching or deriving app state inside `useEffect`; reserve effects for non-React side effects (DOM listeners, analytics, subscriptions).
- Perform data loading via loaders/server functions rather than client effects.

## Code scan highlights
- `components/dashboard/primary-input.tsx`: two effects attach/remove DOM event listeners (`keydown`, `paste`) and guard against editable targets. No data fetching or state derivation.
- `components/dashboard/bookmarks-section.tsx`: effects update refs, manage timers, and register keyboard listeners (`useEffect` blocks at lines 69–104 and 524–578). They don’t fetch data; state mutations originate from handlers.
- Forms (`components/login-form.tsx`, `components/sign-up-form.tsx`) only use effects for window `beforeunload` prompts—permissible external side effects.
- `components/dashboard/category-combobox.tsx`, `components/loading-bar.tsx`, `components/text-entrance-animation.tsx`, and `app/error.tsx` restrict effects to DOM focus management, animation timers, or logging.

## Findings
- No instances of network/data fetching inside `useEffect` were found across `*.tsx` files.
- No effect imposes derived application state (e.g., calling `setState` to mirror props) beyond storing refs for focus management, which aligns with the “external side-effects only” rule.
- All current data mutations run through hooks (`useCreateBookmark`, `useUpdateBookmarkTitle`, etc.) outside of `useEffect`, respecting server-function/query patterns.

## Next steps
- If new features require loaders/server functions, ensure we keep following the pattern to avoid regressing into effect-based fetching.
