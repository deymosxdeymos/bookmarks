# React Query Placeholder Data Refactor Plan

## Objective
Replace the manual optimistic list bookkeeping in `DashboardContent` with TanStack Query's `placeholderData`/`keepPreviousData` primitives while preserving the current UX.

## Constraints & Assumptions
- Bookmark list must stay populated during refetches and after mutation rollbacks.
- Suspense boundaries in `app/dashboard` must continue to show skeletons when no cached data exists.
- Mutation side-effects (focus management, URL restoration) remain the same.

## Work Plan
1. **Model current data flow**: Audit `useBookmarks`, `BookmarksSection`, and related mutation callbacks to map how bookmark arrays and derived ranks move through the UI.
2. **Introduce placeholder data**: Update `useBookmarks` to expose `placeholderData` that returns the last successful result via `queryClient.getQueryData` when a fetch starts, as recommended in the TanStack docs (https://tanstack.com/query/latest/docs/framework/react/reference/useQuery#placeholderdata).
3. **Enable keepPreviousData on search transitions**: Use the option (https://tanstack.com/query/latest/docs/framework/react/examples/pagination#using-keeppreviousdata) so changing `serverFilter` retains rows until new data arrives; remove `previousItemsRef`/`useEffect` once verified.
4. **Align optimistic updates**: Move mutation success/error handlers to `useCreateBookmark` so optimistic cache writes and rollbacks go through `queryClient.setQueryData`, guided by discussion in tanstack/query#5363 (https://github.com/TanStack/query/discussions/5363).
5. **Review Suspense behavior**: Confirm `placeholderData` does not bypass loading states for brand-new filters; re-introduce explicit loading UI if required per TkDodo's guidance (https://tkdodo.eu/blog/placeholder-data-and-initial-data-in-react-query).
6. **Refactor consumers**: Simplify `DashboardContent` to rely on `select` for shaping bookmark view models (https://tanstack.com/query/latest/docs/framework/react/reference/useQuery#select) and drop now-redundant memo hooks.
7. **Testing**: Add regression tests covering bookmark submission failure recovery, search transitions, and caching edge cases.
8. **Docs & follow-up**: Document the new pattern in `tasks/placeholder-data-refactor/notes.md` (optional) and communicate migration steps to teammates.

## Risks
- Placeholder data masking real loading states if not carefully gated.
- Optimistic cache mismatches causing stale ranks until recomputation.
- Potential breaking changes in shared components expecting memoized arrays.
