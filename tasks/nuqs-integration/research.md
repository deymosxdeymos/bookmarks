# Research: nuqs Integration for Bookmarks App

## Overview
Replace all manual URL state management with nuqs library for type-safe, declarative URL state handling.

## nuqs Documentation Links
- [Basic Usage](https://nuqs.dev/docs/basic-usage)
- [Built-in Parsers](https://nuqs.dev/docs/parsers/built-in)
- [Custom Parsers](https://nuqs.dev/docs/parsers/making-your-own)
- [Options](https://nuqs.dev/docs/options)
- [Batching](https://nuqs.dev/docs/batching)
- [Server-Side Usage](https://nuqs.dev/docs/server-side)
- [Limits](https://nuqs.dev/docs/limits)
- [Tips & Tricks](https://nuqs.dev/docs/tips-tricks)

## Current URL State Patterns in Codebase

### 1. Dashboard Search State (`dashboard-content.tsx`)
**Current Implementation (Lines 73-189):**
- Manual `useSearchParams` + `useRouter` + `URLSearchParams`
- Complex state synchronization logic with `useEffect`s
- Debounced search with route sync
- Manual cursor param management

**Search Parameters:**
- `search`: string (search query)
- `cursor`: string (pagination)

**Key Issues:**
- 116 lines of manual URL state management
- Complex bidirectional sync between `searchDraft` and URL
- No type safety on search params
- Duplicate URLSearchParams creation

### 2. Category Selection (`category-combobox.tsx`)
**Current Implementation (Lines 104-116):**
- Manual `useSearchParams` + `useRouter` + `URLSearchParams`
- Simple parameter updates

**Search Parameters:**
- `category`: string (UUID)
- Clears `cursor` on category change

### 3. Server-Side Parsing (`app/dashboard/page.tsx`)
**Current Implementation (Lines 15-68):**
- Zod schema validation (`searchParamsSchema`)
- Manual parameter normalization
- Type conversion and validation

**Search Parameters:**
- `category`: UUID string (optional)
- `search`: string (optional) 
- `sort`: enum (optional)
- `cursor`: string (optional)

### 4. Auth Redirects (login/signup forms)
**Current Implementation:**
- Simple `router.push("/dashboard")` redirects
- No URL state management needed

## nuqs Capabilities Analysis

### Built-in Parsers Perfect for Our Use Case:
1. **`parseAsString`** - For search queries
2. **`parseAsStringLiteral`** - For sort order enum
3. **`parseAsString`** - For UUIDs (category, cursor)

### Advanced Features We Can Use:
1. **`useQueryStates`** - Batch multiple params (search + category + sort + cursor)
2. **`.withDefault()`** - Default values for params
3. **`.withOptions({ scroll: false })`** - Prevent scroll on URL changes
4. **Server-side parsing** - `nuqs/server` for app router

### Migration Strategy Benefits:
1. **Type Safety**: All params typed at parse-time
2. **Reduced Code**: Replace 100+ lines with ~10 lines per component
3. **Better DX**: Declarative vs imperative URL management
4. **Server Compatibility**: Works in both client and server components

## Existing Patterns to Preserve

### 1. Search Debouncing
- Current: `useDebouncedValue` + manual URL sync
- With nuqs: Can keep same debouncing pattern, just sync to `setSearch` instead of manual URL manipulation

### 2. Cursor Management
- Current: Clear cursor on search/category change
- With nuqs: Use `useQueryStates` to update multiple params atomically

### 3. Scroll Prevention
- Current: `{ scroll: false }`
- With nuqs: `.withOptions({ scroll: false })`

### 4. Server-Side Type Safety
- Current: Manual Zod parsing
- With nuqs: Use `nuqs/server` parsers for shared validation

## Key Components for Migration

### Priority Order (Dashboard Search First):
1. **`dashboard-content.tsx`** (Lines 73-189) - Most complex, highest impact
2. **`category-combobox.tsx`** (Lines 104-116) - Simple parameter updates  
3. **`app/dashboard/page.tsx`** (Lines 15-68) - Server-side parsing
4. **Auth components** - No changes needed (simple redirects)

### Dependencies Check:
- Current: `next/navigation` (useRouter, useSearchParams, usePathname)
- Add: `nuqs` (already installed based on user input)
- Framework: Next.js App Router ✓ (supported)

## Technical Considerations

### 1. Adapter Setup Required:
- Need to wrap app with nuqs adapter for Next.js App Router
- Should be added to `app/layout.tsx` or similar

### 2. Import Strategy:
- Client components: `import { useQueryState } from 'nuqs'`
- Server/shared: `import { parseAsString } from 'nuqs/server'`

### 3. Migration Complexity:
- **Low**: Category combobox (simple param updates)
- **Medium**: Server-side parsing (schema replacement)
- **High**: Dashboard search (complex bidirectional sync logic)

### 4. Testing Considerations:
- Existing search/filter functionality must continue working
- URL format can change (no backward compatibility required)
- Focus management and debouncing behavior must be preserved

## Research Conclusions

nuqs is an excellent fit for this codebase because:

1. **Reduces Complexity**: Will eliminate 100+ lines of manual URL state code
2. **Type Safety**: Built-in parsing and validation
3. **Server Compatibility**: Works with Next.js App Router patterns
4. **Performance**: Built-in optimizations and batching
5. **Maintainability**: Declarative vs imperative approach

The migration should proceed component-by-component starting with dashboard search as the highest impact area.