# Plan: Fix Authentication Redirect Loop Issue

## Problem Analysis

Based on research, the redirect loop occurs in production due to inconsistent session validation between:
1. **Middleware** using `getSessionCookie()` (cookie-based)
2. **Page components** using `auth.api.getSession()` (database-based with potential cookie cache bypass)

This creates a state where middleware thinks user is unauthenticated while pages think user is authenticated.

## Root Cause Theories

1. **Cookie Security Issues**: Production HTTPS settings affect cookie `secure`, `sameSite`, `domain` attributes
2. **Environment Variable Mismatch**: Different base URLs between client/server in production
3. **Cookie Cache Desync**: 5-minute cache vs actual session state mismatch
4. **Better-Auth Cookie Format**: Different cookie handling between dev/prod environments

## Implementation Plan

### Phase 1: Diagnostic & Immediate Fix (High Priority)

#### 1.1 Add Comprehensive Logging
**File**: `middleware.ts`
- Log session cookie value, pathname, user-agent, request headers
- Add environment detection (dev vs prod)
- Log redirect decisions with reasoning

#### 1.2 Standardize Session Validation
**File**: `middleware.ts`
- Replace `getSessionCookie()` with `auth.api.getSession()` for consistency
- Both middleware and pages will use same session validation method
- Eliminates cookie vs database discrepancy

#### 1.3 Environment Variable Audit
**Files**: `lib/auth.ts`, `lib/auth-client.ts`
- Ensure `BETTER_AUTH_URL` and `NEXT_PUBLIC_BETTER_AUTH_URL` are properly set in production
- Add fallback handling for missing environment variables
- Verify base URL consistency between server and client

### Phase 2: Cookie Configuration Fix (Medium Priority)

#### 2.1 Production Cookie Settings
**File**: `lib/auth.ts`
- Configure explicit cookie settings for production:
  - `secure: true` for HTTPS
  - `sameSite: "lax"` for cross-origin compatibility
  - Proper `domain` configuration
- Add conditional cookie settings based on environment

#### 2.2 Disable Cookie Cache (Temporary)
**File**: `lib/auth.ts`
- Temporarily disable `cookieCache` to isolate if it's causing the issue
- If fix works, re-enable with proper configuration later

### Phase 3: Robust Error Handling (Low Priority)

#### 3.1 Middleware Error Boundaries
**File**: `middleware.ts`
- Add try-catch around session validation
- Graceful fallback when session check fails
- Log errors without breaking user flow

#### 3.2 Page-Level Auth Consistency
**Files**: `app/login/page.tsx`, `app/dashboard/page.tsx`
- Ensure both use identical session validation logic
- Add loading states during auth checks
- Handle edge cases (expired sessions, network errors)

## Implementation Details

### Step 1: Fix Middleware Session Validation

```typescript
// middleware.ts - New approach
import { auth } from "@/lib/auth";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
	const url = request.nextUrl;
	const pathname = url.pathname;

	try {
		// Use same session validation as pages for consistency
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		const isAuthenticated = Boolean(session);

		// Add logging for debugging
		console.log(`[Middleware] ${pathname} - Auth: ${isAuthenticated}, Prod: ${process.env.NODE_ENV === 'production'}`);

		const isPublicAuthRoute =
			pathname === "/" ||
			pathname.startsWith("/login") ||
			pathname.startsWith("/sign-up");
		const isProtectedRoute = pathname.startsWith("/dashboard");

		if (isPublicAuthRoute && isAuthenticated) {
			console.log(`[Middleware] Redirecting authenticated user from ${pathname} to /dashboard`);
			url.pathname = "/dashboard";
			return NextResponse.redirect(url);
		}

		if (isProtectedRoute && !isAuthenticated) {
			console.log(`[Middleware] Redirecting unauthenticated user from ${pathname} to /login`);
			url.pathname = "/login";
			return NextResponse.redirect(url);
		}

		return NextResponse.next();
	} catch (error) {
		console.error(`[Middleware] Session validation failed:`, error);
		// Fail open - allow request to continue and let pages handle auth
		return NextResponse.next();
	}
}
```

### Step 2: Update Better-Auth Configuration

```typescript
// lib/auth.ts - Enhanced configuration
export const auth = betterAuth({
	database: pool,
	emailAndPassword: {
		enabled: true,
	},
	plugins: [nextCookies()],
	baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
	secret: process.env.BETTER_AUTH_SECRET,
	session: {
		// Temporarily disable cookie cache to isolate issue
		cookieCache: {
			enabled: false,
		},
	},
	// Add explicit cookie configuration for production
	cookies: {
		sessionToken: {
			name: "better-auth.session_token",
			options: {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				maxAge: 60 * 60 * 24 * 7, // 7 days
			},
		},
	},
});
```

### Step 3: Environment Variable Validation

```typescript
// lib/auth.ts - Add validation
const baseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
if (!baseURL && process.env.NODE_ENV === "production") {
	throw new Error("BETTER_AUTH_URL or NEXT_PUBLIC_BETTER_AUTH_URL must be set in production");
}
```

## Testing Strategy

### 1. Development Testing
- Verify no regressions in dev environment
- Test login/logout flows still work
- Confirm middleware logging appears

### 2. Production Deployment Testing
- Deploy with logging enabled
- Monitor server logs for session validation behavior
- Test with different browsers/incognito modes
- Verify cookie attributes in browser dev tools

### 3. Rollback Plan
- Keep original middleware.ts as backup
- If issues persist, can quickly revert to original `getSessionCookie()` approach
- Re-enable cookie cache if performance is impacted

## Success Criteria

1. ✅ No redirect loops in production environment
2. ✅ Consistent session validation between middleware and pages
3. ✅ Proper cookie security settings for production
4. ✅ Comprehensive logging for future debugging
5. ✅ No performance regressions
6. ✅ All auth flows (login, logout, protected routes) work correctly

## Risks & Mitigation

**Risk**: Performance impact from middleware database calls
**Mitigation**: Re-enable optimized cookie cache after fixing core issue

**Risk**: Breaking existing auth flows
**Mitigation**: Thorough testing in staging environment before production

**Risk**: Environment variable issues in production
**Mitigation**: Add validation and clear error messages for missing vars

## Timeline

- **Day 1**: Implement middleware fix and enhanced logging
- **Day 2**: Update auth configuration and environment validation
- **Day 3**: Testing and production deployment
- **Day 4**: Monitor and optimize (re-enable cookie cache if needed)
