# Implementation Plan: Hold-to-Delete Text Color Morphing

## Overview

Modify the category combobox's delete button to smoothly transition the text color from `text-muted-foreground` to `text-destructive` as the hold progress advances, creating a visual morphing effect.

## Implementation Details

### 1. CSS Custom Property Approach

Add a CSS custom property to control color interpolation:
- Use `--delete-text-progress` variable (0-1 range)
- Apply color-mix() or oklch interpolation between muted-foreground and destructive colors
- Update the variable via JavaScript as hold progress advances

### 2. Text Structure Modification

Current structure:
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

New structure:
```tsx
<span className="relative z-10 text-sm font-medium">
  <span
    className="block transition-opacity duration-100 group-hover:opacity-0 group-focus-visible:opacity-0 group-active:opacity-0"
    style={{ color: `oklch(from var(--muted-foreground) calc(l + (0.127 * var(--delete-text-progress, 0))) calc(c + (0.245 * var(--delete-text-progress, 0))) calc(h + (27.325 * var(--delete-text-progress, 0))))` }}
  >
    Delete Group
  </span>
  <span
    className="absolute inset-0 w-26 opacity-0 transition-opacity duration-100 group-hover:opacity-100 group-focus-visible:opacity-100"
    style={{ color: `oklch(from var(--muted-foreground) calc(l + (0.127 * var(--delete-text-progress, 0))) calc(c + (0.245 * var(--delete-text-progress, 0))) calc(h + (27.325 * var(--delete-text-progress, 0))))` }}
  >
    Hold to confirm
  </span>
</span>
```

### 3. JavaScript Progress Tracking

Modify the `startHold` function to update the CSS custom property:

```tsx
const startHold = useCallback(() => {
  if (!current?.id || deleteCategoryMutation.isPending || isHoldActive) return;

  resetHoldState();
  setIsHoldActive(true);

  const progressEl = holdProgressRef.current;
  const deleteItemEl = deleteItemRef.current; // Add ref to delete item

  if (progressEl) {
    progressEl.style.transition = "none";
    progressEl.style.width = "2%";

    requestAnimationFrame(() => {
      if (progressEl) {
        if (reducedMotionRef.current) {
          progressEl.style.transition = "none";
          progressEl.style.width = "100%";
          // Instantly set text to destructive color for reduced motion
          if (deleteItemEl) {
            deleteItemEl.style.setProperty('--delete-text-progress', '1');
          }
        } else {
          progressEl.style.transition = `width ${HOLD_DURATION_MS}ms linear`;
          progressEl.style.width = "100%";

          // Animate text color progress
          if (deleteItemEl) {
            deleteItemEl.style.transition = `--delete-text-progress ${HOLD_DURATION_MS}ms linear`;
            deleteItemEl.style.setProperty('--delete-text-progress', '1');
          }
        }
      }
    });
  }

  const holdDuration = reducedMotionRef.current ? 300 : HOLD_DURATION_MS;
  holdTimeoutRef.current = setTimeout(async () => {
    holdTimeoutRef.current = null;
    setIsHoldActive(false);
    await handleDelete();
  }, holdDuration);
}, [/* existing dependencies */]);
```

### 4. Reset State Handling

Update `resetHoldState` to reset the text color:

```tsx
const resetHoldState = useCallback(() => {
  setIsHoldActive(false);
  if (holdTimeoutRef.current) {
    clearTimeout(holdTimeoutRef.current);
    holdTimeoutRef.current = null;
  }

  if (holdProgressRef.current) {
    if (reducedMotionRef.current) {
      holdProgressRef.current.style.transition = "none";
      holdProgressRef.current.style.width = "0%";
    } else {
      holdProgressRef.current.style.transition = `width ${RESET_ANIMATION_DURATION_MS}ms var(--ease-out-quart)`;
      holdProgressRef.current.style.width = "0%";
    }
  }

  // Reset text color
  if (deleteItemRef.current) {
    if (reducedMotionRef.current) {
      deleteItemRef.current.style.transition = "none";
      deleteItemRef.current.style.setProperty('--delete-text-progress', '0');
    } else {
      deleteItemRef.current.style.transition = `--delete-text-progress ${RESET_ANIMATION_DURATION_MS}ms var(--ease-out-quart)`;
      deleteItemRef.current.style.setProperty('--delete-text-progress', '0');
    }
  }
}, []);
```

### 5. Fallback for Older Browsers

For browsers that don't support `oklch(from ...)` syntax, use color-mix as fallback:

```css
.delete-text-morph {
  color: color-mix(
    in oklch,
    var(--muted-foreground) calc(100% - (var(--delete-text-progress, 0) * 100%)),
    var(--destructive) calc(var(--delete-text-progress, 0) * 100%)
  );
}
```

### 6. Animation Timing

- **Hold Duration**: 500ms (existing)
- **Reset Duration**: 200ms (existing)
- **Easing**: `linear` for progress, `var(--ease-out-quart)` for reset
- **Sync**: Text color animation perfectly synced with progress bar

### 7. Accessibility Considerations

- Respect `prefers-reduced-motion` by instantly changing colors instead of animating
- Maintain existing ARIA labels and keyboard interactions
- Ensure sufficient color contrast throughout the transition

## Files to Modify

1. `components/dashboard/category-combobox.tsx`
   - Add `deleteItemRef` reference
   - Modify text rendering with dynamic color
   - Update `startHold` and `resetHoldState` functions
   - Add CSS custom property management

## Testing Checklist

- [ ] Text smoothly transitions from muted to destructive color during hold
- [ ] Color resets properly when hold is canceled
- [ ] Animation respects `prefers-reduced-motion`
- [ ] Works in both light and dark themes
- [ ] Fallback works for older browsers
- [ ] Keyboard interactions still work
- [ ] Touch interactions work on mobile
- [ ] Delete functionality remains intact
