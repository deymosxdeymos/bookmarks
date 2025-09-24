# Implementation Plan: Fix Hold-to-Delete Animation

## Overview

Fix the hold-to-delete animation in the category combobox to follow the ANIMATIONS.md guidelines religiously, using proper easing functions, durations, and reduced motion support.

## Current Issues to Fix

1. **Wrong Animation Duration**: Using 500ms for visual feedback (should be ~200ms)
2. **Inconsistent Easing**: Using `ease-out-quart` for all transitions
3. **Poor Reduced Motion Support**: Only disables main animation, not comprehensive
4. **Awkward Reset Timing**: 100ms reset feels disconnected
5. **Mixed Concerns**: Hold duration and animation duration are conflated

## Implementation Steps

### 1. Define Animation Constants

Add proper animation timing constants at the top of the file:

```typescript
const HOLD_DURATION_MS = 500; // Keep for UX timing
const PROGRESS_ANIMATION_DURATION_MS = 200; // Visual feedback
const RESET_ANIMATION_DURATION_MS = 150; // Clean reset
```

### 2. Update startHold Function

Replace the current animation logic with proper implementation:

```typescript
const startHold = useCallback(() => {
  if (!current?.id || deleteCategoryMutation.isPending || isHoldActive)
    return;
  resetHoldState();
  setIsHoldActive(true);

  const progressEl = holdProgressRef.current;
  if (progressEl) {
    // Immediate visual feedback (no animation)
    progressEl.style.transition = "none";
    progressEl.style.width = "2%";

    // Smooth progress animation
    requestAnimationFrame(() => {
      if (progressEl) {
        if (reducedMotionRef.current) {
          // Instant completion for reduced motion
          progressEl.style.transition = "none";
          progressEl.style.width = "100%";
        } else {
          // Smooth animation with proper easing
          progressEl.style.transition = `width ${PROGRESS_ANIMATION_DURATION_MS}ms var(--ease-out-cubic)`;
          progressEl.style.width = "100%";
        }
      }
    });
  }

  holdTimeoutRef.current = setTimeout(async () => {
    holdTimeoutRef.current = null;
    setIsHoldActive(false);
    await handleDelete();
  }, HOLD_DURATION_MS);
}, [
  current?.id,
  deleteCategoryMutation.isPending,
  handleDelete,
  isHoldActive,
  resetHoldState,
]);
```

### 3. Update resetHoldState Function

Improve the reset animation with proper easing and timing:

```typescript
const resetHoldState = useCallback(() => {
  setIsHoldActive(false);
  if (holdTimeoutRef.current) {
    clearTimeout(holdTimeoutRef.current);
    holdTimeoutRef.current = null;
  }
  if (holdProgressRef.current) {
    if (reducedMotionRef.current) {
      // Instant reset for reduced motion
      holdProgressRef.current.style.transition = "none";
      holdProgressRef.current.style.width = "0%";
    } else {
      // Smooth reset with proper easing
      holdProgressRef.current.style.transition = `width ${RESET_ANIMATION_DURATION_MS}ms var(--ease-out-quart)`;
      holdProgressRef.current.style.width = "0%";
    }
  }
}, []);
```

### 4. Enhanced Reduced Motion Detection

Improve the reduced motion detection to be more comprehensive:

```typescript
useEffect(() => {
  const updateReducedMotion = () => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = media.matches;
  };

  updateReducedMotion();
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", updateReducedMotion);

  return () => media.removeEventListener("change", updateReducedMotion);
}, []);
```

### 5. Adjust Hold Duration for Reduced Motion

For users with reduced motion preferences, consider shortening the hold duration since visual feedback is instant:

```typescript
// In startHold function, adjust timeout for reduced motion
const holdDuration = reducedMotionRef.current ? 300 : HOLD_DURATION_MS;

holdTimeoutRef.current = setTimeout(async () => {
  holdTimeoutRef.current = null;
  setIsHoldActive(false);
  await handleDelete();
}, holdDuration);
```

## Animation Specifications

### Easing Functions (from globals.css)
- **Progress Fill**: `var(--ease-out-cubic)` - `cubic-bezier(0.215, 0.61, 0.355, 1)`
- **Reset Animation**: `var(--ease-out-quart)` - `cubic-bezier(0.165, 0.84, 0.44, 1)`

### Timing
- **Progress Animation**: 200ms (follows guideline: "most should be around 0.2s to 0.3s")
- **Reset Animation**: 150ms (quick, decisive reset)
- **Hold Duration**: 500ms (UX timing, not animation timing)
- **Reduced Motion Hold**: 300ms (shorter since no visual buildup)

### Reduced Motion Behavior
- **Progress**: Instant jump to 100%
- **Reset**: Instant jump to 0%
- **Duration**: Reduced from 500ms to 300ms
- **All Transitions**: Set to "none"

## Code Quality Improvements

### 1. Separate Animation Logic
Create helper functions for cleaner code:

```typescript
const setProgressWidth = (width: string, animated = true) => {
  const progressEl = holdProgressRef.current;
  if (!progressEl) return;

  if (!animated || reducedMotionRef.current) {
    progressEl.style.transition = "none";
    progressEl.style.width = width;
  } else {
    const duration = width === "0%" ? RESET_ANIMATION_DURATION_MS : PROGRESS_ANIMATION_DURATION_MS;
    const easing = width === "0%" ? "var(--ease-out-quart)" : "var(--ease-out-cubic)";
    progressEl.style.transition = `width ${duration}ms ${easing}`;
    progressEl.style.width = width;
  }
};
```

### 2. Better State Management
Ensure animations are properly cleaned up and state is consistent.

### 3. Performance Optimization
- Use `requestAnimationFrame` for immediate visual feedback
- Minimize style recalculations
- Proper cleanup of timeouts and event listeners

## Testing Checklist

- [ ] Animation duration follows guidelines (200ms for progress, 150ms for reset)
- [ ] Proper easing functions are used (`ease-out-cubic` and `ease-out-quart`)
- [ ] Reduced motion preference is respected completely
- [ ] Immediate visual feedback (2% fill) happens instantly
- [ ] Progress animation feels smooth and natural
- [ ] Reset animation is quick and decisive
- [ ] No animation artifacts or jumps
- [ ] Performance is optimal (no jank)
- [ ] Works consistently across browsers
- [ ] Accessibility is maintained

## Success Criteria

1. **Smooth Animation**: Progress fill feels natural and responsive
2. **Proper Timing**: Follows 200ms guideline for UI animations
3. **Correct Easing**: Uses specified cubic-bezier functions from globals.css
4. **Accessibility**: Full reduced motion support with instant completion
5. **Performance**: No animation jank or unnecessary reflows
6. **Consistency**: Matches the animation feel of the rest of the application
