# Plan: Fix Login Redirect Loop in Production

## Problem Statement
Infinite redirect loop between `/login` and `/dashboard` in production due to inconsistent session validation between middleware and server-side auth checks.

## Root Cause
Better-auth configuration lacks production-specific settings, causing session validation mismatch.

## Solution Strategy
Enhance better-auth configuration with production-required settings to ensure consistent session validation.

## Implementation Plan

### Phase 1: Environment Variables Setup
**File:** `.env.example` (update documentation)
- Add `BETTER_AUTH_SECRET` variable
- Add `BETTER_AUTH_URL` variable
- Document production environment requirements

### Phase 2: Enhanced Auth Configuration
**File:** `lib/auth.ts`
- Add `baseURL` configuration for production
- Add `secret` configuration using environment variable
- Configure cookie settings for production (domain, secure, sameSite)
- Add proper session configuration
- Ensure consistent session validation

### Phase 3: Auth Client Configuration
**File:** `lib/auth-client.ts`
- Add `baseUrl` configuration to match server auth config
- Ensure client/server auth consistency

### Phase 4: Middleware Improvement (if needed)
**File:** `middleware.ts`
- Review cookie name consistency with better-auth configuration
- Consider using better-auth's built-in middleware if available

## Configuration Details

### Better-Auth Server Configuration
```typescript
export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  cookies: {
    sessionToken: {
      name: "better-auth.session_token",
      attributes: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN : undefined,
      },
    },
  },
});
```

### Auth Client Configuration
```typescript
export const authClient = createAuthClient({
  baseUrl: process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000",
});
```

## Environment Variables Required
- `BETTER_AUTH_SECRET`: Cryptographically secure random string for production
- `BETTER_AUTH_URL`: Full production URL (e.g., "https://bookmarks-lac.vercel.app")
- `NEXT_PUBLIC_AUTH_URL`: Same as above, for client-side
- `COOKIE_DOMAIN`: Production domain for cookies (optional, for subdomain sharing)

## Testing Strategy
1. Test locally with production-like environment variables
2. Deploy to staging/preview environment
3. Verify no redirect loops occur
4. Test login/logout flow completely
5. Verify session persistence across page refreshes

## Rollback Plan
If issues occur, can temporarily disable auth middleware or revert to previous auth configuration while debugging.

## Success Criteria
- No infinite redirect loops in production
- Successful login redirects to dashboard
- Session persistence works correctly
- Logout properly clears session and redirects to login
