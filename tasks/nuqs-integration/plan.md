# Plan: nuqs Integration for Bookmarks App

## Overview
Replace all manual URL state management with nuqs library for type-safe, declarative URL state handling. Migrate component by component starting with dashboard search as highest impact.

## Pre-Implementation Setup

### 1. Install nuqs Adapter (Required First)
- **Location**: `app/layout.tsx`
- **Action**: Add `NuqsAdapter` from `nuqs/adapters/next/app` around children
- **Why**: nuqs requires adapter setup for Next.js App Router to function
- **Dependencies**: None (nuqs already installed by user)

### 2. Create Server-Side Search Params Cache
- **Location**: New file `lib/search-params.ts` (server-only)
- **Purpose**: Server-side parsing with Zod validation preserved
- **Why**: Maintains runtime validation while enabling nuqs server-side parsing

### 3. Create Client-Side Parser Definitions
- **Location**: Separate client parsers to avoid server/client boundary violations
- **Purpose**: Type-safe client-side URL state management
- **Why**: Prevents build failures from importing server modules in client components

## Migration Plan - Component by Component

### Phase 1: Dashboard Search (Highest Impact)
**Target**: `components/dashboard/dashboard-content.tsx` (Lines 73-189)

#### Current State Analysis:
- **116 lines** of manual URL state management
- Complex bidirectional sync between `searchDraft` state and URL
- Debounced search input with route synchronization
- Manual cursor clearing on search changes
- Multiple `useEffect` hooks for state synchronization
- Manual `URLSearchParams` creation and `router.replace` calls

#### nuqs Implementation Strategy:
1. **Replace manual hooks** with `useQueryStates` for batched updates:
   - `search`: `parseAsString.withDefault('')`
   - `cursor`: `parseAsString` (nullable for pagination reset)

2. **Preserve debouncing pattern** but simplify synchronization:
   - Keep `searchDraft` and `useDebouncedValue` for UI responsiveness
   - Sync debounced value to nuqs state instead of manual URL manipulation
   - **CRITICAL**: Guard against initial mount to preserve deep links

3. **Atomic cursor clearing**:
   - Use `useQueryStates` to update search + clear cursor in single operation
   - Only reset cursor when search actually changes (not on initial render)

#### Expected Reduction: 116 lines → ~35 lines

### Phase 2: Category Selection (Medium Impact)
**Target**: `components/dashboard/category-combobox.tsx` (Lines 104-116)

#### Current State Analysis:
- Manual `URLSearchParams` + `router.replace` for category changes
- Cursor clearing on category selection
- Simple parameter updates (12 lines of URL logic)

#### nuqs Implementation Strategy:
1. **Replace category parameter handling**:
   - `category`: `parseAsString` with UUID validation preserved

2. **Integrate with dashboard search params**:
   - Use same client parsers for consistency
   - Use `useQueryStates` for atomic category + cursor updates
   - Maintain existing scroll prevention behavior

#### Expected Reduction: 12 lines → ~5 lines

### Phase 3: Server-Side Parsing (Type Safety Impact)
**Target**: `app/dashboard/page.tsx` (Lines 15-68)

#### Current State Analysis:
- Manual Zod schema (`searchParamsSchema`)
- Custom parameter normalization (`normalizeParams`)
- Manual type conversion and validation (54 lines)

#### nuqs Implementation Strategy:
1. **Replace manual parsing with nuqs server cache**:
   - Use `createSearchParamsCache` with Zod validation preserved
   - Maintain existing validation guarantees
   - Eliminate manual normalization function

2. **Leverage nuqs server-side helpers**:
   - Built-in parameter parsing and type conversion
   - Automatic handling of optional/nullable values
   - Type inference from parser definitions

#### Expected Reduction: 54 lines → ~20 lines

## Implementation Details

### Server-Side Cache (`lib/search-params.ts`)
```typescript
import { parseAsString, createSearchParamsCache } from 'nuqs/server'
import { z } from 'zod'

// Server-side parsers with Zod validation preserved
const categoryParser = parseAsString.withOptions({
  scroll: false
}).withSchema(z.string().uuid().optional())

const sortOrderParser = parseAsString
  .withDefault('created-desc' as const)
  .withSchema(z.enum(['created-desc', 'created-asc']))

export const searchParamsParsers = {
  search: parseAsString.withDefault('').withOptions({
    scroll: false,
    clearOnDefault: true
  }),
  category: categoryParser,
  sort: sortOrderParser,
  cursor: parseAsString.withOptions({
    scroll: false
  })
}

// Server-side cache for SSR
export const searchParamsCache = createSearchParamsCache(searchParamsParsers)
```

### Client-Side Parsers (Component Files)
```typescript
// components/dashboard/dashboard-content.tsx
'use client'
import { useQueryStates, parseAsString } from 'nuqs'

// Client parsers (separate from server to avoid boundary violations)
const clientParsers = {
  search: parseAsString.withDefault('').withOptions({ scroll: false }),
  category: parseAsString.withOptions({ scroll: false }),
  cursor: parseAsString.withOptions({ scroll: false })
}
```

### Dashboard Search Implementation Pattern:
```typescript
const [{ search: routeSearch, cursor }, setUrlState] = useQueryStates(clientParsers)
const [searchDraft, setSearchDraft] = useState(routeSearch)
const debouncedSearchDraft = useDebouncedValue(searchDraft, SEARCH_INPUT_DEBOUNCE_MS)
const isInitialMount = useRef(true)

// Sync debounced draft to URL with deep link preservation
useEffect(() => {
  // Skip on initial mount to preserve deep links
  if (isInitialMount.current) {
    isInitialMount.current = false
    return
  }

  // Only update if search actually changed
  if (debouncedSearchDraft !== routeSearch) {
    setUrlState({
      search: debouncedSearchDraft || null,
      cursor: null // Only clear cursor when search changes
    })
  }
}, [debouncedSearchDraft, routeSearch, setUrlState])

// Handle category changes with atomic updates
const handleCategoryChange = useCallback((categoryId: string | null) => {
  setUrlState({
    category: categoryId,
    cursor: null // Clear pagination on filter change
  })
}, [setUrlState])
```

## Technical Considerations

### 1. Next.js App Router Adapter
- **Required**: Must be installed before any migration
- **Location**: Wrap children in `app/layout.tsx`
- **Import**: `nuqs/adapters/next/app`

### 2. Client/Server Boundary Separation
- **Server**: `import { createSearchParamsCache } from 'nuqs/server'`
- **Client**: `import { useQueryStates, parseAsString } from 'nuqs'`
- **Critical**: No shared parser files that import from `nuqs/server`

### 3. Validation Strategy
- **Server**: Preserve Zod validation via `.withSchema()`
- **Client**: Runtime validation handled by server parsers
- **Benefit**: Maintain existing validation guarantees

### 4. Deep Link Preservation
- **Critical**: Guard `useEffect` against initial mount
- **Pattern**: Use `useRef` to track first render
- **Why**: Prevents destroying valid pagination URLs on page load

### 5. URL Format (Phase 1: No Changes)
- **Current**: `?search=term&category=uuid&cursor=abc`
- **Phase 1**: Keep existing format for stability
- **Future**: Optional URL shortening in separate phase

## Phase 4 (Optional): URL Shortening
**Separate implementation after core migration**

### Impact Assessment Required:
- Invalidates existing saved URLs and bookmarks
- QA documentation updates needed
- Cypress test fixture changes
- Team coordination required

### Implementation:
```typescript
export const searchParamsCache = createSearchParamsCache(searchParamsParsers, {
  urlKeys: {
    search: 'q',    // ?q=search+term
    category: 'cat', // ?cat=uuid
    cursor: 'c'     // ?c=cursor-value
  }
})
```

## Testing Strategy

### 1. Deep Link Testing (Critical)
- **Direct URL access**: `/dashboard?search=test&cursor=abc123`
- **Pagination preservation**: Verify cursor isn't cleared on load
- **Back/forward buttons**: Ensure proper state restoration

### 2. Component-Level Testing
- **Search functionality**: Type in search, verify URL updates
- **Category filtering**: Select category, verify URL updates
- **Combined operations**: Search + filter, verify atomic updates

### 3. Server-Side Rendering
- **SSR with search params**: Verify no hydration mismatches
- **Validation**: Test invalid UUIDs and parameter values
- **Type safety**: Verify TypeScript compilation

### 4. Performance Testing
- **Debouncing**: Ensure search input remains responsive
- **URL batching**: Verify no multiple navigation calls
- **Initial render**: No unnecessary URL updates

## Risk Mitigation

### 1. Critical Issues Addressed
- **Client/server boundary**: Separate parser definitions
- **Deep link breaking**: Initial mount guards implemented
- **Validation loss**: Zod schemas preserved with `.withSchema()`
- **URL compatibility**: No format changes in Phase 1

### 2. Incremental Migration
- **Approach**: One component at a time
- **Rollback**: Each phase can be reverted independently
- **Testing**: Thorough validation before proceeding

### 3. Behavior Preservation
- **UI responsiveness**: Keep local state for immediate feedback
- **Existing patterns**: Preserve debouncing and focus management
- **Error handling**: Maintain existing error boundaries

## Implementation Order & Dependencies

### Step 1: Setup (Required First)
1. Add `NuqsAdapter` to `app/layout.tsx`
2. Create `lib/search-params.ts` with server cache
3. Test basic nuqs functionality

### Step 2: Dashboard Search (High Impact)
1. Create client parsers in `dashboard-content.tsx`
2. Replace manual URL state with `useQueryStates`
3. Implement deep link preservation guards
4. **Checkpoint**: Test thoroughly before proceeding

### Step 3: Category Selection (Medium Impact)
1. Update `category-combobox.tsx` with client parsers
2. Integrate with dashboard search state
3. Test category filtering with search
4. **Checkpoint**: Verify working before proceeding

### Step 4: Server-Side Parsing (Type Safety)
1. Replace manual parsing in `app/dashboard/page.tsx`
2. Use `searchParamsCache.parse()` for SSR
3. Test server-side rendering and validation
4. **Final verification**: End-to-end testing

### Step 5 (Optional): URL Shortening
1. Assess team coordination requirements
2. Document migration impact
3. Implement URL key mapping
4. Update tests and documentation

## Success Criteria

### 1. Code Reduction
- **Target**: Reduce URL state management code from ~180 lines to ~60 lines
- **Metric**: 65%+ reduction in manual URL manipulation code

### 2. Type Safety & Validation
- **Current**: Runtime validation with manual Zod schemas
- **Target**: nuqs parsers with Zod integration via `.withSchema()`
- **Benefit**: Maintained validation + improved type inference

### 3. Deep Link Compatibility
- **Critical**: No breaking of existing pagination URLs
- **Test**: `/dashboard?search=term&cursor=abc` works on direct access
- **Verification**: Back/forward navigation preserves state

### 4. Functional Preservation
- **Search**: Debounced input with URL synchronization
- **Filtering**: Category selection with pagination reset
- **Navigation**: Back/forward button support maintained
- **Performance**: No regression in responsiveness

This revised plan addresses the critical client/server boundary, deep link preservation, validation guarantees, and URL compatibility issues while maintaining the benefits of nuqs integration.