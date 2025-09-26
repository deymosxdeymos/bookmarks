# React Query Placeholder/Keep Previous Data Research

## Goals
- Eliminate the manual `useEffect`/ref bookkeeping in `DashboardContent` while preserving the optimistic bookmark list during refetches.
- Ensure bookmark search input/state remains responsive when mutations run.

## Key Findings
- `placeholderData` lets queries suspend behind cached results while a fresh fetch runs, avoiding UI flicker, and pairs well with `queryClient.setQueryData` for optimistic writes. Source: TanStack Query Docs, "Query Placeholder Data" (https://tanstack.com/query/latest/docs/framework/react/reference/useQuery#placeholderdata).
- `keepPreviousData` automatically keeps the last result in place when query keys change, ideal for pagination or search scenarios so the UI stays populated during transitions. Source: TanStack Query Docs, "Paginated Queries" (https://tanstack.com/query/latest/docs/framework/react/examples/pagination#using-keeppreviousdata).
- When composing `placeholderData` with asynchronous mutations, normalize identity (e.g. add stable `id`s or `queryFn` keys) to prevent React from remounting items; otherwise scrolling/focus can jump. Source: "Placeholder Data best practices" discussion (https://tanstack.com/query/latest/docs/framework/react/guides/placeholder-query-data#placeholder-data-best-practices).
- `keepPreviousData` avoids manual `useEffect` ref copies; however, when the previous result differs from optimistic cache entries, ensure mutation rollbacks write back via `onError` to keep UI consistent. Source: GitHub Issue tanstack/query#5363 (https://github.com/TanStack/query/discussions/5363).
- Leveraging `placeholderData` for empty states requires an explicit guard so loading indicators still appear for truly new filters. Source: TkDodo Blog, "Data fetching on steroids" (https://tkdodo.eu/blog/placeholder-data-and-initial-data-in-react-query).
- For best UX, pair placeholder data with query selection (`select`) to precompute view models instead of per-render memoization hooks. Source: TanStack Query Docs, "useQuery select option" (https://tanstack.com/query/latest/docs/framework/react/reference/useQuery#select).

## Open Questions
- Should optimistic bookmark inserts live in a dedicated mutation cache updater so list modules (combobox, grid) stay in sync?
- How to reconcile `placeholderData` with Suspense fallbacks in the dashboard route?
