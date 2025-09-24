# Research: Remove Cancel and Add Buttons from Category Group Creation

## Current Implementation

The category combobox (`bookmarks/components/dashboard/category-combobox.tsx`) currently shows Cancel and Add buttons when creating a new category group. These buttons appear in the form section when `isCreating` state is true.

### Current Flow:
1. User clicks "New Group" option
2. `isCreating` state becomes true
3. Form renders with:
   - Plus icon
   - Input field for group name
   - Cancel button (resets creation state)
   - Add button (submits form)

### Button Locations:
- **Cancel button** (lines 352-360): Resets `isCreating` to false and clears `createValue`
- **Add button** (lines 361-372): Submits the form with loading state and spinner

## Alternative Interaction Patterns

### Option 1: Auto-submit on Enter
- Remove both buttons
- Keep only the input field
- Submit automatically when user presses Enter (already implemented via `handleCreateInputKeyDown`)
- Cancel automatically when user presses Escape or clicks outside

### Option 2: Auto-submit on blur
- Submit when input loses focus (if value is not empty)
- Cancel when input loses focus (if value is empty)

### Option 3: Real-time creation
- Create category as user types (with debouncing)
- More complex but provides immediate feedback

## Recommended Approach

**Option 1** is the best choice because:
1. It maintains the existing keyboard interaction (Enter to submit)
2. Simplifies the UI by removing visual clutter
3. Users can still cancel by pressing Escape or clicking outside (popover will close)
4. Consistent with modern UI patterns where forms auto-submit on Enter

## Implementation Plan

1. Remove the Cancel and Add button elements from the form
2. Keep the existing `handleCreateInputKeyDown` function (handles Enter key)
3. Add Escape key handling to cancel creation
4. Ensure form submission still works via Enter key
5. Maintain loading state feedback in the input field or via a different visual indicator

## Files to Modify

- `bookmarks/components/dashboard/category-combobox.tsx`: Remove button elements and adjust form layout
