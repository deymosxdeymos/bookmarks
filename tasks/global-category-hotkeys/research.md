# Research: Global Category Hotkeys

## Current Implementation Analysis

### Existing Hotkey System in CategoryCombobox
- Located in `components/dashboard/category-combobox.tsx`
- Uses keyboard numbers 1-9,0 to switch categories when combobox is open
- Implements `globalHotkeyHandler` that:
  - Listens for keydown events on document
  - Filters out modifier keys (meta, ctrl, alt, shift)
  - Ignores events from input/textarea/contenteditable elements
  - Maps keys to category IDs using `optionHotkeys` array
  - Calls `applySelection()` to update URL params and navigate

### Key Patterns Found
1. **Event Filtering**: Robust filtering to avoid conflicts with form inputs
2. **URL State Management**: Uses `useSearchParams` and `router.replace()` to update category filter
3. **Stable References**: Uses refs to avoid recreating event handlers
4. **Accessibility**: Respects focus states and prevents interference with inputs

### Current Scope Limitation
- Hotkeys only work when the category combobox popover is open
- Managed by `useEffect` that adds/removes the event listener based on `open` state
- This limits usability - user must click the category button first

## Target Implementation

### Goals
- Make category switching work globally in dashboard (1-9 keys)
- Maintain existing behavior when combobox is open
- Don't interfere with form inputs or other interactive elements
- Follow existing patterns for consistency

### Architecture Options

#### Option 1: Move Logic to Dashboard Level
- Extract hotkey logic from CategoryCombobox
- Create a hook or context provider at dashboard level
- Pass category data and selection function down
- Pros: Clean separation, reusable
- Cons: More complex data flow

#### Option 2: Always-On in CategoryCombobox
- Modify existing implementation to always listen for hotkeys
- Remove dependency on `open` state for global hotkeys
- Keep existing logic but make it globally active
- Pros: Minimal changes, leverages existing code
- Cons: Component doing more than UI concerns

#### Option 3: Custom Hook
- Extract hotkey logic into `useGlobalCategoryHotkeys` hook
- Use in dashboard page/layout
- Pass required data and handlers
- Pros: Reusable, clean separation of concerns
- Cons: Need to duplicate some existing logic

## Recommended Approach

**Option 3: Custom Hook** is most aligned with the codebase patterns:

1. **Follows CLAUDE.md guidelines**:
   - Separates business logic from UI components
   - Makes components focused on their primary concern
   - Reusable pattern

2. **Aligns with existing patterns**:
   - Similar to other query hooks in `lib/queries/`
   - Maintains stable event handlers using refs
   - Follows same event filtering logic

3. **Maintains component boundaries**:
   - CategoryCombobox stays focused on combobox UI
   - Dashboard-level logic handled at dashboard level
   - Clear data flow

## Implementation Plan

1. Create `useGlobalCategoryHotkeys` hook in `lib/hooks/`
2. Extract and adapt logic from CategoryCombobox
3. Use hook in dashboard page/layout where categories are available
4. Keep CategoryCombobox's existing hotkey behavior for when popover is open
5. Ensure no conflicts between global and local hotkeys

## Technical Details

### Hook Interface
```typescript
useGlobalCategoryHotkeys({
  categories: Category[],
  selectedId: string | null,
  onCategoryChange: (id: string | null) => void,
  enabled?: boolean // for disabling in certain contexts
})
```

### Event Filtering (reuse existing logic)
- Check for modifier keys
- Ignore contentEditable, input, textarea, select elements
- Prevent default and stop propagation when handling

### State Management
- Hook will call provided `onCategoryChange` callback
- Dashboard will handle URL updates (same as CategoryCombobox currently does)
