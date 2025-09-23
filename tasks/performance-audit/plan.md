# Performance Optimization Plan

Based on research findings, here's the comprehensive plan to fix performance issues and code violations:

## Priority 1: Fix category-combobox.tsx (5 useEffect violations)

### Current Issues:
- 5 useEffect calls in one component
- Some effects managing state that could be derived
- Over-reactive patterns

### Fixes:
1. **useEffect for focus management (line 154)** → Keep (external DOM sync)
2. **useEffect for open state reset (line 160)** → Keep (cleanup on state change)
3. **useEffect for media query (line 168)** → Keep (external system sync)
4. **useEffect for cleanup (line 178)** → Simplify or remove if redundant
5. **useEffect for keyboard handlers (line 180)** → Keep (document event sync)

### Action Items:
- Review if any effects can be combined
- Check if state updates can be derived instead of reactive
- Optimize effect dependencies to prevent unnecessary re-runs

## Priority 2: Review primary-input.tsx

### Current Issues:
- Two useEffect calls that might be over-reactive
- Potential for derived state instead of effects

### Fixes:
1. Analyze both effects to see if they can be:
   - Combined into one
   - Replaced with derived state
   - Optimized with better dependencies

## Priority 3: General Optimizations

### useState → useRef Conversions
- Look for state that doesn't need reactive updates
- Convert to useRef for better performance

### Code Style Cleanup
- Remove any unnecessary comments per CLAUDE.md guidelines
- Extract complex conditional rendering to separate components

## Implementation Strategy

1. **Start with category-combobox.tsx** (highest impact)
2. **Test each change thoroughly** to ensure no regressions
3. **Measure before/after** performance if possible
4. **Follow CLAUDE.md patterns** throughout
5. **Run lint/typecheck** after each major change

## Success Criteria

- ✅ Reduce useEffect count in category-combobox.tsx by at least 1-2
- ✅ No performance regressions
- ✅ All tests pass
- ✅ Lint and typecheck pass
- ✅ Code follows CLAUDE.md guidelines
- ✅ No loss of functionality

## Files to Modify

1. `/components/dashboard/category-combobox.tsx` (primary target)
2. `/components/dashboard/primary-input.tsx` (secondary)
3. Any other files identified during implementation

## Testing Approach

- Manual testing of all interactive features
- Verify keyboard shortcuts still work
- Confirm form submissions work
- Check responsive behavior
- Run `bun run lint` and `bun run check`
