# Copy Bookmark Animation Research

## Current implementation
- `components/dashboard/bookmarks-section.tsx` renders the bookmark rows and owns the copy feedback. The `handleCopyBookmark` callback (lines ~130-170) writes the URL to the clipboard, calls `triggerFeedback(bookmark.id, "copied")`, and fires a global Sonner toast via `toast.success("Copied")`.
- Copy feedback state lives in `feedback` and is reset after 1400 ms inside `triggerFeedback`. When `feedback?.type === "copied"`, the list item renders an absolutely-positioned container (`absolute left-2 top-1/2`) with a single `<Check>` icon.
- The icon wrapper currently animates by toggling `-translate-y-full` → `translate-y-0` with `motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-[var(--ease-in-out-quart)]`. The `<Check>` icon is hard-coded to `text-emerald-500` and there is no accompanying “Copied” text.

## Animation + styling references
- `ANIMATIONS.md` defines house rules: target 200–300 ms runtime, use opacity/transform, prefer `ease-out`/custom bezier tokens, and respect `prefers-reduced-motion`.
- Custom easing tokens are exposed in `app/globals.css` (e.g. `--ease-out-quart`, `--ease-out-quint`, `--ease-in-out-quart`). Existing copy feedback already references `var(--ease-in-out-quart)`; we can swap to an ease-out variant for a downward entrance.
- The requested “animate in downwards” pattern is demonstrated in `/home/deymos/Developer/animations-dev/app/exercises/download-arrow`. That component overlaps two icons and drives a translateY transition (`transform: translateY(-150%) → 0`) with `transition: transform 250ms cubic-bezier(0.77, 0, 0.175, 1)`.

## Gaps vs desired behaviour
- There is no “Copied” label and the check icon color does not adapt to theme; requirements call for neutral (black/white) treatment.
- The current animation only affects the icon (no text) and uses a general transition class; we need a coordinated downwards entrance for both icon + label that matches the reference easing/direction.
- No dedicated styles exist yet for a pill/badge layout that can house both the checkmark and text while staying aligned with the list row typography.

## Animation patterns from `animations-dev`
- The `download-arrow` exercise stacks two identical SVGs, keeps them in a grid cell, and toggles `transform: translateY()` on hover. Core techniques: `overflow: hidden` container, translate values beyond 100% to fully swap visuals, `transition: transform 250ms cubic-bezier(0.77, 0, 0.175, 1)`.
- `toast-component` mounts toasts by toggling a `data-mounted` attribute. The toast starts at `opacity: 0` and `translateY(100%) scale(0.9)` and transitions to `translateY(calc(var(--index) * -120%)) scale(1)` over `400ms ease`, showing how staging via attributes plus CSS transitions keeps animations purely declarative.
- `feedback-component` relies on Motion/Framer's `AnimatePresence` and `layoutId`s for morphing states. Success content animates from `initial={{ y: -32, filter: 'blur(4px)' }}` to `animate={{ y: 0, filter: 'blur(0px)' }}` with a spring (duration 0.6, bounce 0), reinforcing the repo's preference for sliding content down into place combined with slight blur fades.
- Many exercises share the same building blocks: wrap animated content in an `overflow-hidden` container, move replacement content using `translateY` ±20–150%, and pair transform changes with opacity for clarity. Durations stay ≤400 ms and leverage the custom cubic-bezier easings enumerated in `ANIMATIONS.md`.
