# TODO — Bookmark (Raycast-like)

- [ ] Implement query-based bookmark listing with pagination
- [ ] Convert category mutations to React Query
- [ ] Add background refetching and error boundaries
- [ ] Optimize query deduplication and stale-while-revalidate
- [ ] Add mutation retry logic for offline support

# Security & Performance Hardening

- [x] Add SSRF protections and limits to metadata proxy
- [x] Add global security headers (CSP, Referrer, HSTS, etc.)
- [x] Tighten Next.js image remotePatterns to HTTPS only
- [x] Drop redundant bookmark index (keep composite ordering)
- [x] Enforce unique (user_id, lower(name)) on categories after dedupe
- [ ] Consider duplicate URL policy per user (app-level vs DB)
- [ ] Narrow React Query invalidations; rely on optimistic updates
- [ ] Replace silent catches with structured logging where applicable
- [ ] Remove or integrate unused cached list wrappers
