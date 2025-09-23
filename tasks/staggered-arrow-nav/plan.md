# Plan

1. Enhance the bookmark row hover/focus styling so moving rapidly with Arrow keys feels smooth without slowing navigation.
2. Apply a motion-safe transition to row background/foreground shifts and introduce an overlay that fades between the date and shortcut chips instead of toggling display.
3. Ensure animations respect `prefers-reduced-motion`, use easing tokens from `app/globals.css`, and keep keyboard focus visible per INTERFACE.md.
4. Document manual verification: rapid Arrow navigation, hover, reduced-motion toggle.
