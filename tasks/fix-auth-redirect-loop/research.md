# Research: Authentication Redirect Loop Issue

## Problem Summary

User experiences infinite redirect loops between `/login` and `/dashboard` pages in **production only** - this does not occur in development environment.

Network trace shows alternating 307 redirects:
- `/login` → `/dashboard`
- `/dashboard` → `/login`
- Repeats indefinitely

## Key Research Findings

### 1. Current Authentication Setup

**Middleware Logic** (`middleware.ts`):
- Uses `getSessionCookie()` from `better-auth/cookies`
- Redirects authenticated users from public routes (`/`, `/login`, `/sign-up`) to `/dashboard`
- Redirects unauthenticated users from protected routes (`/dashboard/*`) to `/login`
- Authentication check: `Boolean(sessionCookie)`

**Better-Auth Configuration** (`lib/auth.ts`):
- Uses `nextCookies()` plugin for Next.js integration
- Cookie cache enabled with 5-minute maxAge: `cookieCache: { enabled: true, maxAge: 5 * 60 }`
- Base URL fallback: `process.env.BETTER_AUTH_URL || "http://localhost:3000"`

**Page-Level Auth Checks**:
- `/login/page.tsx`: Uses `auth.api.getSession()` and redirects to `/dashboard` if session exists
- `/dashboard/page.tsx`: Uses `auth.api.getSession()` and redirects to `/login` if no session

### 2. Production vs Development Differences

**Potential Root Causes**:

1. **Environment Variables Mismatch**:
   - `BETTER_AUTH_URL` vs `NEXT_PUBLIC_BETTER_AUTH_URL` may have different values in prod
   - Client-side vs server-side base URL discrepancy

2. **Cookie Security Settings**:
   - Production HTTPS vs development HTTP affects cookie `secure` flag
   - `sameSite` cookie attributes may behave differently
   - Domain/subdomain cookie scope issues

3. **Session Cookie Reading Inconsistency**:
   - `getSessionCookie()` in middleware may fail to read session in production
   - Cookie cache (5min maxAge) might not sync properly with actual session state
   - Better-auth cookie format/signing differences between environments

4. **Race Condition**:
   - Middleware runs before page components
   - If middleware can't read session but page-level `auth.api.getSession()` can, creates conflict
   - Cookie cache vs database session state mismatch

### 3. Better-Auth Session Management Details

**Cookie Cache Behavior**:
- Stores session data in signed, short-lived cookie (5min in this app)
- Reduces database calls but can create sync issues
- If session revoked/expired, cookie should be invalidated but may not happen immediately

**Session Validation Methods**:
- `getSessionCookie()`: Reads from cookie cache (used in middleware)
- `auth.api.getSession()`: Can bypass cookie cache and hit database (used in pages)

## Hypothesis

The redirect loop occurs because:

1. **Middleware** reads session cookie and determines user is NOT authenticated (cookie missing/invalid/unreadable)
2. **Page component** calls `auth.api.getSession()` which bypasses cookie cache, finds valid session in database
3. This creates a contradiction where middleware thinks user needs login but page thinks user needs dashboard
4. Results in infinite 307 redirects

This only happens in production due to cookie security, domain, or environment variable differences that affect how `getSessionCookie()` reads the session cookie.

## Next Steps for Investigation

1. Check production environment variables (`BETTER_AUTH_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL`)
2. Examine cookie security settings and domain configuration
3. Test if `getSessionCookie()` and `auth.api.getSession()` return consistent results in production
4. Consider disabling cookie cache temporarily to isolate the issue
5. Add logging to middleware to see what session cookie value is being read
