# Agent Context - Red Bull Racing Meal Booking Platform

**Purpose**: This document provides essential context for AI agents working on this codebase in future sessions.

**Last Updated**: October 22, 2025
**Project Version**: 2.5.10 (Production Ready)
**Status**: PRODUCTION READY

---

## Critical Context Summary

### Project Identity
- **Name**: Red Bull Racing Meal Booking Platform
- **Purpose**: Enterprise meal booking system for Oracle Red Bull Racing team
- **Architecture**: Full-stack Next.js 14 + PostgreSQL + Redis + Docker
- **Status**: Production ready after 8+ hours debugging session (October 20-22, 2025)

### Current State
- **✅ WORKING**: All authentication flows operational
- **✅ TESTED**: Playwright E2E tests passing (10/10)
- **✅ DEPLOYED**: Docker Compose 7-container stack running
- **✅ STABLE**: Next.js 14.2.18 + React 18.3.1 (downgraded for stability)

---

## Architectural Decisions

### 1. Next.js Version Downgrade (CRITICAL)

**Decision**: Use Next.js 14.2.18 instead of 15.x
**Date**: October 22, 2025
**Reason**: NextAuth v5.0.0-beta.22 incompatible with Next.js 15 due to immutable headers API

**Technical Details**:
- Next.js 15 introduced breaking changes in `headers()` API
- NextAuth v5 tries to modify headers after response started
- Error: `Headers cannot be modified after a SET operation`
- Solution: Downgrade to 14.2.18 (last stable version before breaking changes)

**Package Versions** (DO NOT CHANGE):
```json
{
  "next": "14.2.18",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "next-auth": "^5.0.0-beta.22"
}
```

**Future Upgrade Path**:
- Wait for NextAuth v5 stable release
- Or migrate to NextAuth v5 + Next.js 15 when compatibility fixed
- Monitor: https://github.com/nextauthjs/next-auth/issues

### 2. NextAuth v5 (Auth.js) Configuration

**Decision**: Use NextAuth v5 beta (not v4)
**Reason**: Modern API, better TypeScript support, Edge Runtime compatible

**Key Differences from v4**:
- Cookie name: `authjs.session-token` (NOT `next-auth.session-token`)
- Environment variables: `AUTH_SECRET` primary, `NEXTAUTH_SECRET` fallback
- Import path: `next-auth` (not `next-auth/react` for server)
- No `[...nextauth].ts` → now `[...nextauth]/route.ts` in App Router

**Configuration File**: `src/lib/auth.ts`
**Session Strategy**: JWT (not database)
**Session Duration**: 30 days
**JWT Secret**: Must be set via `AUTH_SECRET` env var

### 3. App Router Pattern (Next.js 14)

**Decision**: Use App Router (not Pages Router)
**Structure**:
```
src/app/
├── (auth)/          # Route group (no layout)
│   └── login/
├── (dashboard)/     # Route group (with sidebar)
│   ├── super-admin/
│   ├── kitchen/
│   ├── customer-admin/
│   └── booking/
└── api/             # API Routes
```

**Why Route Groups**:
- `(auth)` group has minimal layout (no sidebar)
- `(dashboard)` group has full dashboard layout (sidebar, header)
- Parentheses prevent route segment in URL

**Server Components by Default**:
- Use Server Components unless interactivity needed
- Add `'use client'` directive only when necessary (forms, hooks, event handlers)
- Fetch data server-side for better performance

### 4. Database Schema Design

**ORM**: Prisma 6.2.0
**Database**: PostgreSQL 16
**Migration Strategy**: `prisma migrate dev` in development, `prisma migrate deploy` in production

**Key Models**:
- **User**: Authentication, roles, budget tracking
- **Recipe**: Kitchen inventory with INRAN nutritional data
- **Menu**: Multi-course meal configurations
- **Booking**: Order management with granular items
- **PaymentGatewayConfig**: Encrypted credentials storage
- **AuditLog**: Immutable audit trail

**Naming Convention**:
- Model names: PascalCase singular (e.g., `User`, `Recipe`)
- Table names: snake_case plural via `@@map("users")`
- Fields: camelCase
- Enums: UPPER_SNAKE_CASE

### 5. Docker Compose Architecture

**Decision**: Multi-container production-ready stack (7 services)
**Services**:
1. **app**: Next.js (port 3001)
2. **postgres**: PostgreSQL 16 (port 5434)
3. **redis**: Redis 7 (port 6381)
4. **minio**: S3-compatible storage (ports 9004, 9005)
5. **nginx**: Reverse proxy (ports 8081, 8443)
6. **pgadmin**: Database UI (port 8082)
7. **portainer**: Container management (port 9100)

**Why Non-Standard Ports**:
- Avoid conflicts with other services on development machines
- PostgreSQL: 5434 (not 5432)
- Redis: 6381 (not 6379)
- All configurable via environment variables

**Health Checks**:
- All services have health checks with retry logic
- App waits for database/redis/minio to be healthy before starting
- Nginx waits for app to be healthy

### 6. Authentication Middleware Pattern

**File**: `src/middleware.ts`
**Function**: Route protection + security headers + CORS

**Pattern**:
```typescript
export async function middleware(req: NextRequest) {
  // 1. Get JWT token (not session from DB - Edge Runtime compatible)
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  // 2. Check if accessing protected route
  if (!token && isProtectedRoute(path)) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 3. Role-based authorization
  if (token && !hasAccess(token.role, path)) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  // 4. Add security headers
  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', cspHeader);
  // ... more security headers

  return response;
}
```

**Why JWT Instead of Database Session**:
- Edge Runtime compatible (no Prisma in middleware)
- Faster (no database query per request)
- Scales better (stateless)

**Security Headers Applied**:
- Content-Security-Policy (CSP)
- X-Frame-Options (DENY)
- X-Content-Type-Options (nosniff)
- Referrer-Policy
- Strict-Transport-Security (HSTS)
- Permissions-Policy

---

## Code Patterns Used

### 1. API Route Handler Pattern

**Location**: `src/app/api/**/route.ts`

**Standard Structure**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

// 1. Define input schema (Zod)
const schema = z.object({
  field: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    // 2. Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Check authorization (role)
    if (!canAccess(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4. Parse & validate input
    const body = await req.json();
    const data = schema.parse(body);

    // 5. Business logic
    const result = await prisma.entity.create({ data });

    // 6. Audit logging
    await logAudit({
      userId: session.user.id,
      action: 'entity.created',
      entity: 'Entity',
      entityId: result.id,
    });

    // 7. Return response
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    // 8. Error handling
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Key Principles**:
- Always validate input with Zod
- Check authentication BEFORE business logic
- Check authorization (role) AFTER authentication
- Log all mutations (create, update, delete) to audit log
- Consistent error response format
- HTTP status codes: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 500 (Internal Error)

### 2. Server Component Pattern

**When to Use**: Default for all pages unless interactivity needed

```typescript
// src/app/my-page/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function MyPage() {
  // 1. Get session server-side
  const session = await getServerSession();
  if (!session) redirect('/login');

  // 2. Check role
  if (session.user.role !== 'SUPER_ADMIN') {
    redirect('/unauthorized');
  }

  // 3. Fetch data (server-side, no loading state needed)
  const data = await prisma.entity.findMany({
    where: { userId: session.user.id },
    include: { relatedEntity: true },
  });

  // 4. Render (can use server-only packages like Prisma)
  return (
    <div>
      <h1>My Page</h1>
      {data.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

**Advantages**:
- No client-side JavaScript (faster initial load)
- Direct database access (no API route needed)
- SEO-friendly
- Automatic loading states (Suspense)

### 3. Client Component Pattern

**When to Use**: Forms, interactive UI, React hooks, event handlers

```typescript
// src/app/my-page/page.tsx
'use client'; // ← Required directive

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function MyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '' });

  // Handle loading
  if (status === 'loading') return <div>Loading...</div>;
  if (!session) return <div>Unauthorized</div>;

  // Event handler (requires client component)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/my-endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) router.push('/success');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => setFormData({ name: e.target.value })}
      />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

**When NOT to Use**:
- Static content display
- Data fetching without user interaction
- SEO-critical pages

### 4. Error Handling Pattern

**Consistent Error Response**:
```typescript
interface ErrorResponse {
  error: string;           // User-friendly message
  details?: unknown;       // Validation errors, stack trace (dev only)
  code?: string;           // Machine-readable error code
}
```

**Example**:
```typescript
try {
  // ... business logic
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: error.errors,
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Duplicate entry', code: 'DUPLICATE_ENTRY' },
        { status: 409 }
      );
    }
  }

  // Log unexpected errors
  console.error('Unexpected error:', error);

  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      // Only include details in development
      ...(process.env.NODE_ENV === 'development' && {
        details: error instanceof Error ? error.message : String(error),
      }),
    },
    { status: 500 }
  );
}
```

### 5. Logging Pattern (Winston)

**Configuration**: `src/lib/logger.ts`

**Usage**:
```typescript
import { logger } from '@/lib/logger';

// Info (general operations)
logger.info('User logged in', { userId: user.id, email: user.email });

// Warn (recoverable issues)
logger.warn('Payment gateway timeout, retrying', { gateway: 'NEXY', attempt: 2 });

// Error (failures)
logger.error('Database query failed', { error: error.message, query: 'SELECT * FROM users' });

// Debug (development only)
logger.debug('Request received', { method: req.method, url: req.url });
```

**Log Levels** (set via `LOG_LEVEL` env var):
- `debug`: Verbose (development only)
- `info`: General operations (default for production)
- `warn`: Warnings (non-critical issues)
- `error`: Errors (failures requiring attention)

**Log Output**:
- Console: Human-readable format
- File: JSON structured logs (`logs/app.log`)
- Rotation: Max 10MB per file, keep 7 days

---

## Conventions & Standards

### 1. File Naming

- **Components**: PascalCase (e.g., `UserForm.tsx`, `BookingWizard.tsx`)
- **Pages**: lowercase (e.g., `page.tsx`, `layout.tsx`)
- **API Routes**: lowercase (e.g., `route.ts`)
- **Utilities**: camelCase (e.g., `auth-utils.ts`, `prisma.ts`)
- **Types**: PascalCase with `.d.ts` (e.g., `next-auth.d.ts`)

### 2. Component Organization

```
src/components/
├── ui/              # shadcn/ui components (Button, Input, etc.)
├── auth/            # Auth-specific components
├── booking/         # Booking-specific components
├── kitchen/         # Kitchen-specific components
└── shared/          # Shared across features
```

**Import Pattern**:
```typescript
// Use absolute imports with @/ alias
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types';
```

### 3. API Response Format

**Success Response**:
```json
{
  "data": { ... },       // Single entity
  "items": [ ... ],      // List of entities
  "total": 100,          // Total count (for pagination)
  "page": 1,             // Current page
  "pages": 10            // Total pages
}
```

**Error Response**:
```json
{
  "error": "User-friendly message",
  "details": "Additional context",
  "code": "ERROR_CODE"
}
```

### 4. Database Query Patterns

**Always Include Relations**:
```typescript
const booking = await prisma.booking.findUnique({
  where: { id },
  include: {
    user: true,
    items: {
      include: {
        recipe: true,
      },
    },
  },
});
```

**Use Select for Performance**:
```typescript
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    // Exclude password
  },
});
```

**Soft Delete Pattern**:
```typescript
// Don't delete, mark as inactive
await prisma.user.update({
  where: { id },
  data: { isActive: false },
});

// Filter out inactive in queries
await prisma.user.findMany({
  where: { isActive: true },
});
```

### 5. TypeScript Conventions

**Strict Mode**: Enabled in `tsconfig.json`
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Type Imports**:
```typescript
// Use type-only imports when possible
import type { User, Role } from '@prisma/client';
import type { NextAuthConfig } from 'next-auth';
```

**Avoid `any`**:
```typescript
// Bad
function processData(data: any) { ... }

// Good
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    // Type narrowing
  }
}
```

---

## Dependency Management

### Core Dependencies (DO NOT REMOVE)

**Frontend**:
- `next@14.2.18` - Framework (DO NOT UPGRADE TO 15.x)
- `react@18.3.1` - UI library
- `next-auth@5.0.0-beta.22` - Authentication
- `@tanstack/react-query` - Data fetching
- `zustand` - State management
- `zod` - Validation
- `react-hook-form` - Forms

**Backend**:
- `@prisma/client@6.2.0` - Database ORM
- `bcryptjs` - Password hashing
- `ioredis` - Redis client
- `winston` - Logging

**UI**:
- `tailwindcss` - Styling
- `@radix-ui/*` - Unstyled primitives
- `lucide-react` - Icons
- `framer-motion` - Animations

### DevDependencies

**Testing**:
- `@playwright/test` - E2E testing
- `jest` - Unit testing
- `@testing-library/react` - Component testing

**Code Quality**:
- `typescript` - Type checking
- `eslint` - Linting
- `prettier` - Formatting

### Upgrade Strategy

**Safe to Upgrade**:
- Patch versions (e.g., `6.2.0` → `6.2.1`)
- Minor versions with caution (e.g., `6.2.0` → `6.3.0`)

**Do NOT Upgrade Without Testing**:
- `next` (stay on 14.x until NextAuth v5 stable + Next.js 15 compatible)
- `react` (stay on 18.x)
- `next-auth` (wait for v5 stable release)
- `@prisma/client` (major versions have breaking changes)

**Before Upgrading Any Dependency**:
1. Check changelog for breaking changes
2. Test in development environment
3. Run all tests (`npm run test` + `npm run test:e2e`)
4. Check build (`npm run build`)
5. Test production build locally (`npm run start`)

---

## Known Issues & Solutions (Quick Reference)

### Issue 1: Login Fails with "Headers Cannot Be Modified"
**Cause**: Next.js 15 incompatible with NextAuth v5
**Solution**: Downgrade to Next.js 14.2.18 + React 18.3.1
**Status**: ✅ RESOLVED

### Issue 2: Session Cookie Not Found
**Cause**: Looking for wrong cookie name (`next-auth.session-token` instead of `authjs.session-token`)
**Solution**: Use correct cookie name for NextAuth v5
**Status**: ✅ RESOLVED

### Issue 3: Middleware Crashes on Edge Runtime
**Cause**: Using Prisma in middleware (not Edge compatible)
**Solution**: Use JWT tokens via `getToken()` instead of database queries
**Status**: ✅ RESOLVED

### Issue 4: Rate Limiting Breaks Auth Routes
**Cause**: Rate limiter applied to NextAuth internal redirects
**Solution**: Exclude `/api/auth/*` from rate limiting in middleware
**Status**: ✅ RESOLVED

### Issue 5: Docker Port Conflicts
**Cause**: Default ports (5432, 6379) already in use
**Solution**: Use alternative ports (5434, 6381) in docker-compose.yml
**Status**: ✅ RESOLVED

---

## Testing Strategy

### E2E Tests (Playwright)

**Location**: `tests/`
**Run**: `npm run test:e2e`

**Coverage**:
- ✅ Authentication flows (login, logout, session)
- ✅ Booking wizard (multi-step form)
- ✅ Recipe management (CRUD)
- ✅ Menu creation
- ✅ Role-based access control

**Test Pattern**:
```typescript
test('should login successfully', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@redbullracing.com');
  await page.fill('input[name="password"]', 'Admin123!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/super-admin/dashboard');
});
```

### Unit Tests (Jest)

**Location**: `src/lib/__tests__/`
**Run**: `npm run test`

**Coverage**:
- Utility functions
- Auth helpers
- Validation schemas

### Manual Testing

**Scripts**:
- `test-login.ps1` - PowerShell login test
- `test-session.ps1` - Session verification
- `test-api-complete.js` - Full API test suite

---

## Performance Considerations

### 1. Database Queries

**Always Use Indexes**:
- Primary keys (automatic)
- Foreign keys (manual: `@@index([userId])`)
- Frequently queried fields (e.g., email, role, date)

**Avoid N+1 Queries**:
```typescript
// Bad (N+1)
const bookings = await prisma.booking.findMany();
for (const booking of bookings) {
  const user = await prisma.user.findUnique({ where: { id: booking.userId } });
}

// Good (1 query)
const bookings = await prisma.booking.findMany({
  include: { user: true },
});
```

### 2. Caching Strategy

**Redis Usage**:
- Session storage (30-day TTL)
- Rate limiting counters (1-minute TTL)
- Frequently accessed data (configurable TTL)

**Cache Invalidation**:
- Invalidate on mutations (create, update, delete)
- Use cache keys with version suffix (e.g., `menu:123:v2`)

### 3. Image Optimization

**MinIO Storage**:
- Store recipe images, user avatars
- Generate thumbnails on upload
- Serve via CDN in production

**Next.js Image Component**:
```typescript
import Image from 'next/image';

<Image
  src="/uploads/recipe-123.jpg"
  alt="Recipe"
  width={400}
  height={300}
  priority // For above-the-fold images
/>
```

### 4. Bundle Size

**Current Production Build** (~2MB gzipped):
- Next.js framework: ~600KB
- React + dependencies: ~800KB
- UI components: ~400KB
- Application code: ~200KB

**Optimization Strategies**:
- Dynamic imports for large components
- Tree-shaking (automatic in Next.js)
- Code splitting by route (automatic in App Router)

---

## Security Checklist

### Authentication & Authorization
- ✅ Passwords hashed with bcryptjs (12 rounds)
- ✅ JWT tokens with 30-day expiry
- ✅ Middleware protects all authenticated routes
- ✅ Role-based access control enforced
- ✅ Session tokens stored securely in HTTP-only cookies

### Input Validation
- ✅ Zod schemas for all API inputs
- ✅ SQL injection prevented (Prisma parameterized queries)
- ✅ XSS prevented (React escapes by default)
- ✅ CSRF protected (SameSite cookies)

### Security Headers
- ✅ Content-Security-Policy (CSP)
- ✅ X-Frame-Options (DENY)
- ✅ X-Content-Type-Options (nosniff)
- ✅ Strict-Transport-Security (HSTS in production)

### Data Protection
- ✅ Payment credentials encrypted (AES-256-GCM)
- ✅ Environment variables for secrets
- ✅ .env files excluded from git
- ✅ Audit logging for sensitive operations

### Rate Limiting
- ✅ Global rate limit (100 req/min per IP)
- ✅ Login rate limit (5 attempts/min per IP)
- ✅ Redis-backed (distributed across instances)

---

## Future Development Guidelines

### Adding New Features

1. **Plan First**:
   - Define API endpoints (REST conventions)
   - Design database schema (Prisma models)
   - Identify user roles with access
   - Document in `/docs/features/`

2. **Database Changes**:
   - Update `prisma/schema.prisma`
   - Run `npx prisma migrate dev --name descriptive_name`
   - Seed with test data
   - Update TypeScript types (`npx prisma generate`)

3. **API Development**:
   - Create `/api/**/route.ts` with standard pattern
   - Add Zod validation schemas
   - Implement role-based authorization
   - Add audit logging for mutations
   - Write API tests

4. **UI Development**:
   - Server Components by default
   - Client Components only when needed
   - Use shadcn/ui components
   - Follow Red Bull Racing theme
   - Test accessibility (WCAG 2.2 AA)

5. **Testing**:
   - Write Playwright E2E tests
   - Test all user roles
   - Test error cases
   - Test edge cases (empty states, loading, errors)

6. **Documentation**:
   - Update `/docs/APP_SPECIFICATION.md`
   - Add inline code comments for complex logic
   - Update API documentation
   - Create user guides if needed

### Refactoring Guidelines

**When to Refactor**:
- Code duplication (DRY principle)
- Complex functions (>50 lines)
- Deep nesting (>3 levels)
- Hard-to-test code
- Performance bottlenecks

**When NOT to Refactor**:
- It works and is well-tested
- Deadline pressure (refactor later)
- Unclear requirements
- Lack of test coverage (write tests first)

**Refactoring Checklist**:
- [ ] All tests passing before refactor
- [ ] Make small, incremental changes
- [ ] Run tests after each change
- [ ] Update documentation
- [ ] Review diff before committing

---

## Quick Troubleshooting

### App Won't Start

**Symptom**: `npm run dev` fails
**Checks**:
1. Node version: `node -v` (should be 20+)
2. Dependencies installed: `npm install`
3. Env vars set: Check `.env` file exists
4. Database running: `docker-compose ps`
5. Ports available: `netstat -ano | findstr :3001`

### Login Not Working

**Symptom**: Login form submits but no redirect
**Checks**:
1. Check browser console for errors
2. Check Network tab (should see POST to `/api/auth/signin`)
3. Check cookie (should see `authjs.session-token` in DevTools)
4. Check server logs: `docker-compose logs app`
5. Verify credentials in database:
   ```bash
   docker exec -it rbr-postgres psql -U rbr_user -d rbr_meals -c "SELECT email, role FROM users;"
   ```

### Database Connection Failed

**Symptom**: Prisma errors "Can't reach database"
**Checks**:
1. PostgreSQL running: `docker ps | grep rbr-postgres`
2. Database URL correct: `echo $DATABASE_URL`
3. Port accessible: `telnet localhost 5434`
4. Restart PostgreSQL: `docker-compose restart postgres`
5. Check logs: `docker-compose logs postgres`

### Redis Connection Failed

**Symptom**: Session storage errors
**Checks**:
1. Redis running: `docker ps | grep rbr-redis`
2. Test connection: `docker exec -it rbr-redis redis-cli ping` (should return PONG)
3. Check Redis URL: `echo $REDIS_URL`
4. Restart Redis: `docker-compose restart redis`

### Build Fails

**Symptom**: `npm run build` errors
**Checks**:
1. TypeScript errors: `npm run type-check`
2. ESLint errors: `npm run lint`
3. Clear cache: `rm -rf .next`
4. Reinstall dependencies: `rm -rf node_modules package-lock.json && npm install`
5. Check Next.js version: Should be 14.2.18

---

## Key Files Reference

### Configuration Files

- `next.config.js` - Next.js configuration (standalone output, env vars)
- `tsconfig.json` - TypeScript configuration (strict mode, paths)
- `tailwind.config.ts` - Tailwind CSS configuration (theme, plugins)
- `.eslintrc.json` - ESLint rules
- `.prettierrc` - Prettier formatting rules
- `playwright.config.ts` - Playwright E2E test configuration
- `jest.config.js` - Jest unit test configuration
- `prisma/schema.prisma` - Database schema
- `docker-compose.yml` - Production stack (7 services)
- `Dockerfile` - Multi-stage production build

### Critical Files

- `src/lib/auth.ts` - NextAuth v5 configuration (JWT, callbacks)
- `src/middleware.ts` - Route protection, security headers, CORS
- `src/lib/prisma.ts` - Prisma client singleton
- `src/lib/redis.ts` - Redis client singleton
- `src/lib/logger.ts` - Winston logger configuration
- `src/types/next-auth.d.ts` - NextAuth type augmentation (role, id)

### Entry Points

- `src/app/layout.tsx` - Root layout (providers, fonts, metadata)
- `src/app/page.tsx` - Landing page
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth handler
- `src/app/api/health/route.ts` - Health check endpoint

---

## Contact & Support

**Primary Documentation**: `/docs/APP_SPECIFICATION.md` (comprehensive technical spec)
**Architecture Diagrams**: `/docs/architecture/`
**Development Guides**: `/docs/development/`
**API Documentation**: `/docs/api/`

**For Future Agents**:
- Read this file FIRST before making any changes
- Refer to APP_SPECIFICATION.md for detailed API/schema documentation
- Check `/docs/troubleshooting/` for common issues
- Follow the patterns established in existing code
- Update this file when making architectural decisions

**Version History**:
- v1.0.0 (Oct 22, 2025): Initial documentation after production deployment

---

**Built with ❤️ for Oracle Red Bull Racing**
**Agent Framework**: Claude Sonnet 4.5 + universal-full-stack-architect
