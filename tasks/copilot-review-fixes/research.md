# Copilot Review Fixes - Research

## Task Overview
Research existing patterns in the bookmarks codebase to fix issues identified by Copilot review:
1. Schema patterns (Zod schemas, database vs API schemas)
2. Performance patterns (useCallback, useRef, useEffect)
3. Constants organization
4. Keyboard shortcut patterns

## Research Findings

### 1. Schema Patterns

**Key Files:**
- `/home/deymos/Developer/bookmarks/lib/schemas.ts` - Central schema definitions
- `/home/deymos/Developer/bookmarks/app/api/bookmarks/route.ts` - API usage
- `/home/deymos/Developer/bookmarks/lib/queries/categories.ts` - Client-side usage

**Patterns Found:**

1. **Database vs API Schema Separation:**
   - Database schemas: `bookmarkRowSchema`, `categoryRowSchema` (snake_case fields)
   - API/Client schemas: `bookmarkSchema`, `categorySchema` (camelCase fields)
   - Mapper functions: `mapBookmarkRow()`, `mapCategoryRow()` to transform between formats

2. **Input vs Output Schema Differentiation:**
   - Create inputs: `bookmarkCreateSchema`, `categoryCreateSchema` (minimal required fields)
   - Filter inputs: `bookmarkFilterInputSchema` (partial validation for user input)
   - Full filters: `bookmarkFilterSchema` (complete with defaults and user ID)

3. **Optional vs Required Fields:**
   - Uses `.optional().nullable()` for truly optional fields
   - Uses `.nullable()` for fields that can be null but are always present
   - Default values with `.default()` method

4. **JOIN Query Results:**
   - Separate row schemas for database results with computed fields like `bookmark_count`
   - Uses `z.coerce.number()` for computed aggregations from database

### 2. Performance Patterns

**Key Files:**
- `/home/deymos/Developer/bookmarks/components/dashboard/primary-input.tsx`
- `/home/deymos/Developer/bookmarks/components/dashboard/category-combobox.tsx`
- `/home/deymos/Developer/bookmarks/components/dashboard/bookmarks-section.tsx`

**Patterns Found:**

1. **useCallback Usage:**
   - Used for event handlers that are passed to children or used in dependencies
   - Used for functions that query DOM elements to avoid recreation
   - Example: `focusFirstBookmark`, `applySelection`, `resetHoldState`

2. **useRef Patterns:**
   - Form refs: `formRef`, `createFormRef` for imperative form operations
   - Input refs: `inputRef`, `createInputRef` for focus management
   - Timeout/interval refs: `holdTimeoutRef`, `deleteIntervalRef` for cleanup
   - State refs: `holdActiveRef`, `reducedMotionRef` for values that don't trigger re-renders
   - Data refs: `latestInitialItemsRef` to store latest props without causing re-renders

3. **useEffect Event Listeners:**
   - Global document listeners for keyboard shortcuts
   - Proper cleanup with return function
   - Event listener options (e.g., `{ capture: true }` for global handlers)
   - Media query listeners for responsive behavior

4. **Performance Optimizations:**
   - `useMemo` for expensive computations (category totals, option lists)
   - Refs for values that don't need reactivity but need persistence
   - Event delegation patterns for dynamic lists

### 3. Constants Organization

**Patterns Found:**

1. **Component-level Constants:**
   - Defined inside component files when specific to that component
   - Example: `HOTKEY_SEQUENCE` in category-combobox.tsx
   - Example: `HOLD_DURATION_MS` in category-combobox.tsx

2. **Module-level Constants:**
   - Utility constants in lib files (e.g., `userAgent` in metadata.ts)
   - Configuration objects and lookup tables
   - Keep related constants together in the same module

3. **UI Component Constants:**
   - Exported const components for reusable UI primitives
   - Pattern: `export const ComponentName = forwardRef<>(...)`
   - Found in all shadcn/ui components

4. **No Global Constants File:**
   - Constants are co-located with their usage
   - No central constants.ts file - keeps coupling low
   - Domain-specific constants stay in their respective modules

### 4. Keyboard Shortcut Patterns

**Key Files:**
- `/home/deymos/Developer/bookmarks/components/dashboard/primary-input.tsx`
- `/home/deymos/Developer/bookmarks/components/dashboard/category-combobox.tsx`
- `/home/deymos/Developer/bookmarks/components/dashboard/bookmarks-section.tsx`

**Patterns Found:**

1. **Global vs Local Event Handlers:**
   - Global: `document.addEventListener("keydown", handler)` for app-wide shortcuts
   - Local: `onKeyDown` props for component-specific behavior
   - Global handlers check for focus context to avoid conflicts

2. **Event Handler Structure:**
   ```typescript
   useEffect(() => {
     const handler = (event: KeyboardEvent) => {
       // Guard clauses for modifier keys, composing, focus context
       if (event.defaultPrevented || event.isComposing) return;
       if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;

       // Check if focus is in input/editable element
       const target = event.target;
       if (target instanceof HTMLElement) {
         if (target.isContentEditable) return;
         if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
       }

       // Handle specific keys
       if (event.key === "specificKey") {
         event.preventDefault();
         // action
       }
     };

     document.addEventListener("keydown", handler);
     return () => document.removeEventListener("keydown", handler);
   }, [dependencies]);
   ```

3. **Keyboard Shortcut Types:**
   - Modifier-based: `Cmd+F` for focus, `Cmd+Backspace` for delete
   - Number keys: `1-0` for category selection
   - Arrow keys: Navigation within lists
   - Special keys: `Enter` for actions, `Escape` implied for closing

4. **Focus Management:**
   - Extensive use of `focus()` and `blur()` for keyboard navigation
   - `preventScroll: true` option to avoid scroll jumps
   - Focus context checking to determine if shortcuts should apply

5. **Event Cleanup:**
   - Consistent cleanup in useEffect return functions
   - Clearing timeouts and intervals in cleanup
   - Using capture phase (`true` parameter) for global handlers when needed

---

*Research started: 2025-09-23*
