# Research: Fix Copilot Review Issues

## Issues Identified by Copilot

1. **Schema Issue**: `bookmarkCount` field uses `.default(0)` but comes from database JOIN query that always returns a count
2. **Repository Hardcoding**: Hardcoding `bookmark_count: 0` for new categories bypasses schema validation
3. **Hotkey Limitation**: Only 10 categories can have hotkeys (1-9,0) with no validation/handling for more
4. **Performance Issue**: Global keyboard handler recreates on every `optionHotkeys` change
5. **Constants Placement**: `HOLD_DURATION_MS` defined inside component

## Research Questions

- How are Zod schemas used for database results vs API inputs in this codebase?
- What patterns exist for handling optional fields vs required fields?
- How are performance optimizations handled in other components?
- Are there existing patterns for keyboard shortcuts/hotkeys?
- How should constants be organized?

## Research Findings

### 1. Schema Patterns
- **Separation of Concerns**: Database schemas (`bookmarkRowSchema`) use snake_case while API schemas (`bookmarkSchema`) use camelCase
- **Transformation Layer**: Dedicated mapper functions (`mapBookmarkRow`, `mapCategoryRow`) handle conversion
- **Input Validation**: Separate schemas for different use cases - create inputs, filter inputs, and complete entities
- **Default Values**: Proper use of `.default()` for fallback values and `.optional().nullable()` for truly optional fields

### 2. Performance Patterns
- **useCallback**: Used for event handlers and DOM query functions that are dependencies or passed to children
- **useRef**: Extensively used for DOM references, timeout/interval management, and storing values that shouldn't trigger re-renders
- **useEffect**: Global event listeners are properly cleaned up, with careful focus context checking
- **useMemo**: Used for expensive computations like category totals and option lists

### 3. Constants Organization
- **Component-level**: Constants specific to components are defined within the component files
- **Module-level**: Utility constants live in their respective lib modules
- **No Global Constants**: Avoids a central constants file, keeping coupling low

### 4. Keyboard Shortcut Patterns
- **Global vs Local**: Clear separation between document-level and component-level handlers
- **Focus Context**: Careful checking to avoid conflicts with input elements
- **Event Structure**: Consistent guard clauses for modifiers, composing, and focus states
- **Cleanup**: Proper event listener cleanup and timeout management

## Key Issues to Address

1. **Schema**: `bookmarkCount.default(0)` is misleading - JOIN always returns count
2. **Repository**: Hardcoded `bookmark_count: 0` bypasses validation
3. **Performance**: Global keyboard handler recreates unnecessarily
4. **UX**: No handling for >10 categories (hotkey limitation)
5. **Style**: Constants should follow existing patterns
