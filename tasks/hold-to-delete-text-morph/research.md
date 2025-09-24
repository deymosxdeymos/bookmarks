# Research: Hold-to-Delete Text Morphing Feature

## Current Implementation Analysis

The category combobox already has a hold-to-delete functionality implemented with:

1. **Hold Progress Animation**: A background fill that animates from 0% to 100% width over 500ms
2. **Visual Feedback**: The progress bar has a destructive color background with opacity
3. **Text States**: Currently shows "Delete Group" that changes to "Hold to confirm" on hover/focus

## Required Changes Based on Image

From the image description, the requirement is to make the text morph into `text-destructive` color as the progress loads, not just change the text content.

## Current Text Implementation

The current implementation has:
```tsx
<span className="relative z-10 text-sm font-medium">
  <span className="text-muted-foreground block transition-opacity duration-100 group-hover:opacity-0 group-focus-visible:opacity-0 group-active:opacity-0">
    Delete Group
  </span>
  <span className="absolute inset-0 w-26 text-muted-foreground opacity-0 transition-opacity duration-100 group-hover:opacity-100 group-focus-visible:opacity-100">
    Hold to confirm
  </span>
</span>
```

## Animation Guidelines Compliance

From ANIMATIONS.md:
- Use custom easings from globals.css
- Keep animations fast (0.2s - 0.3s typical, max 1s)
- Use `ease-out` for user-initiated interactions
- Origin-aware animations where applicable
- Accessibility with `prefers-reduced-motion`

## Available Custom Easings

From globals.css, relevant easings:
- `--ease-out-quad`: `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- `--ease-out-cubic`: `cubic-bezier(0.215, 0.61, 0.355, 1)`
- `--ease-out-quart`: `cubic-bezier(0.165, 0.84, 0.44, 1)`

## Color Tokens

From globals.css:
- `--color-destructive`: `oklch(0.577 0.245 27.325)` (light mode)
- `--color-destructive`: `oklch(0.704 0.191 22.216)` (dark mode)
- `--color-muted-foreground`: Current text color

## Implementation Strategy

1. **Text Color Transition**: Instead of changing text content, morph the color from `text-muted-foreground` to `text-destructive` as progress increases
2. **Progress Synchronization**: Sync the text color change with the hold progress (0-100%)
3. **Smooth Animation**: Use CSS custom properties and transitions for smooth color morphing
4. **Accessibility**: Ensure the animation respects `prefers-reduced-motion`

## Technical Approach

1. Use CSS custom properties to control the color interpolation
2. Update the CSS variable as the hold progress advances
3. Apply the color transition using the existing progress timeline (500ms hold duration)
4. Maintain the current text content but change the visual appearance
