# Red Bull Racing - Technology Stack Quick Reference

## Complete Stack Overview

### Frontend Stack
- **Next.js**: 15.1.4 (App Router)
- **React**: 19.0.0
- **TypeScript**: 5.7.2
- **Tailwind CSS**: 3.4.17
- **Framer Motion**: 12.0.0
- **shadcn/ui**: Latest (Radix UI primitives)
- **React Hook Form**: 7.54.2
- **Zod**: 3.24.1
- **Recharts**: 2.15.0
- **Lucide React**: 0.468.0

### Backend Stack
- **Next.js API Routes**: Server-side with Node.js runtime
- **NextAuth.js**: 5.0.0-beta.24 (Authentication)
- **Prisma**: 6.2.0 (ORM)
- **bcryptjs**: 2.4.3 (Password hashing)
- **PostgreSQL**: 16 (Database)

### Infrastructure Stack
- **Docker**: Multi-container setup
- **PostgreSQL**: 16
- **Redis**: 7-alpine
- **MinIO**: Latest (S3-compatible storage)
- **Nginx**: 1.29-alpine (Reverse proxy)
- **pgAdmin**: 4 (Database management)
- **Portainer**: CE-2.33.2 (Container management)

---

## Next.js 15 App Router Quick Reference

### File-Based Routing

```
app/
├── (auth)/              # Route group (no URL segment)
│   └── login/
│       └── page.tsx     # /login
├── (dashboard)/         # Route group (no URL segment)
│   ├── layout.tsx       # Shared layout for all dashboard routes
│   ├── booking/
│   │   └── page.tsx     # /booking
│   └── [role]/
│       └── page.tsx     # /[role] (dynamic route)
└── api/
    ├── resource/
    │   ├── route.ts     # /api/resource (GET, POST)
    │   └── [id]/
    │       └── route.ts # /api/resource/[id] (GET, PUT, DELETE)
    └── [[...slug]]/
        └── route.ts     # Optional catch-all route
```

### Key Directives

```typescript
// Mark component as client-side
'use client';

// Force dynamic rendering (disable caching)
export const dynamic = 'force-dynamic';

// Set runtime (default: nodejs)
export const runtime = 'edge'; // or 'nodejs'

// Revalidate static page after X seconds
export const revalidate = 60;
```

### Metadata API

```typescript
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description',
  openGraph: {
    title: 'OG Title',
    description: 'OG Description',
  },
};
```

### Server vs Client Components

**Server Components** (default):
- Can use async/await directly
- Direct database access
- No useState, useEffect, browser APIs
- Can import server-only code

**Client Components** ('use client'):
- Can use React hooks
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)
- Third-party interactive libraries

---

## React 19 Features

### New Hooks

```typescript
// useFormStatus - for form submission state
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>Submit</button>;
}

// useOptimistic - for optimistic UI updates
import { useOptimistic } from 'react';

const [optimisticState, addOptimistic] = useOptimistic(
  state,
  (currentState, optimisticValue) => {
    // Return new state
  }
);
```

### Server Actions (if needed in future)

```typescript
'use server';

export async function createItem(formData: FormData) {
  const name = formData.get('name');
  // Server-side logic
}
```

---

## Prisma 6.2.0 Quick Reference

### Common Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Push schema without migration
npx prisma db push

# Open Prisma Studio
npx prisma studio

# Reset database (DEV ONLY!)
npx prisma migrate reset

# Seed database
npx prisma db seed
```

### Query Operations

```typescript
// Find operations
findUnique({ where: { id } })
findFirst({ where: { ... }, orderBy: { ... } })
findMany({ where: { ... }, include: { ... }, take: 10 })

// Create operations
create({ data: { ... } })
createMany({ data: [...] })

// Update operations
update({ where: { id }, data: { ... } })
updateMany({ where: { ... }, data: { ... } })
upsert({ where: { id }, create: { ... }, update: { ... } })

// Delete operations
delete({ where: { id } })
deleteMany({ where: { ... } })

// Aggregation
count({ where: { ... } })
aggregate({ _count: true, _sum: { field }, _avg: { field } })
groupBy({ by: ['field'], _count: true })
```

### Relations

```typescript
// One-to-many
model User {
  id       String    @id
  bookings Booking[] // Relation field
}

model Booking {
  id     String @id
  userId String
  user   User   @relation(fields: [userId], references: [id])
}

// Query with relations
const user = await prisma.user.findUnique({
  where: { id },
  include: {
    bookings: {
      where: { status: 'CONFIRMED' },
      orderBy: { date: 'desc' },
    },
  },
});
```

### Transactions

```typescript
// Sequential operations
const [user, profile] = await prisma.$transaction([
  prisma.user.create({ data: userData }),
  prisma.profile.create({ data: profileData }),
]);

// Interactive transactions
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  await tx.audit.create({ data: { action: 'USER_CREATED', userId: user.id } });
});
```

---

## NextAuth.js 5 Beta Quick Reference

### Configuration

```typescript
// lib/auth.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        // Validation logic
        return user;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
});
```

### Usage in Server Components

```typescript
import { getServerSession } from '@/lib/auth';

const session = await getServerSession();
if (!session?.user) {
  redirect('/login');
}

const userId = (session.user as { id: string }).id;
const role = (session.user as { role: string }).role;
```

### Usage in Client Components

```typescript
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

function Component() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'unauthenticated') return <div>Not logged in</div>;

  return <div>Welcome {session.user?.email}</div>;
}
```

---

## Zod Validation Quick Reference

### Schema Definition

```typescript
import * as z from 'zod';

// Basic types
z.string()
z.number()
z.boolean()
z.date()
z.array(z.string())
z.object({ field: z.string() })
z.enum(['A', 'B', 'C'])
z.literal('exact value')

// String validation
z.string()
  .min(1, 'Required')
  .max(100, 'Too long')
  .email('Invalid email')
  .url('Invalid URL')
  .regex(/pattern/, 'Invalid format')
  .trim()
  .toLowerCase()

// Number validation
z.number()
  .min(0, 'Min 0')
  .max(100, 'Max 100')
  .int('Must be integer')
  .positive('Must be positive')
  .nonnegative('Must be >= 0')

// Optional and nullable
z.string().optional() // string | undefined
z.string().nullable() // string | null
z.string().nullish() // string | null | undefined

// Default values
z.string().default('default value')

// Custom validation
z.string().refine(
  (val) => val.length > 5,
  { message: 'Must be longer than 5 characters' }
)

// Transformations
z.string().transform((val) => val.toUpperCase())

// Union types
z.union([z.string(), z.number()])

// Discriminated unions
z.discriminatedUnion('type', [
  z.object({ type: z.literal('A'), a: z.string() }),
  z.object({ type: z.literal('B'), b: z.number() }),
])
```

### Usage

```typescript
// Parse (throws on error)
const result = schema.parse(data);

// Safe parse (returns result object)
const result = schema.safeParse(data);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}

// Infer TypeScript type
type User = z.infer<typeof userSchema>;
```

---

## Tailwind CSS Customization

### Custom Colors (configured in tailwind.config.ts)

```typescript
// Red Bull Racing color palette
colors: {
  'rbr-red': '#0600EF',
  'rbr-navy': '#1e2440',
  'rbr-dark': '#0a0e27',
  'rbr-dark-elevated': '#12172e',
  'rbr-dark-lighter': '#1a1f3a',
  'rbr-accent-blue': '#3b82f6',
  'rbr-accent-green': '#10b981',
  'rbr-text-primary': '#ffffff',
  'rbr-text-secondary': '#a1a1aa',
  'rbr-text-muted': '#71717a',
  'rbr-border': '#27272a',
  'rbr-border-light': '#3f3f46',
}
```

### Custom Classes

```css
/* In globals.css */
.racing-card {
  @apply rounded-lg border bg-rbr-dark-elevated border-rbr-border p-6 shadow-lg;
}

.bg-racing-red-gradient {
  @apply bg-gradient-to-r from-rbr-red to-red-600;
}
```

---

## Framer Motion Quick Patterns

```typescript
// Basic animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
/>

// Variants
const variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

<motion.div
  variants={variants}
  initial="hidden"
  animate="visible"
/>

// Stagger children
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Hover and tap animations
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
/>

// Layout animations
<motion.div layout />

// Shared layout transitions
<motion.div layoutId="unique-id" />
```

---

## Docker Commands Reference

```bash
# Build services
docker-compose build
docker-compose build --no-cache app

# Start services
docker-compose up -d
docker-compose up -d app

# Stop services
docker-compose stop
docker-compose stop app

# Restart services
docker-compose restart app

# View logs
docker logs rbr-app
docker logs rbr-app --tail 100
docker logs rbr-app -f  # Follow logs

# Execute commands in container
docker exec rbr-app npm run build
docker exec -it rbr-postgres psql -U postgres

# Remove containers
docker-compose down
docker-compose down -v  # Also remove volumes

# List containers
docker ps
docker ps -a  # Include stopped

# Container health
docker inspect rbr-app --format='{{.State.Health.Status}}'

# System cleanup
docker system prune
docker system prune -a --volumes  # Remove everything
```

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# NextAuth
AUTH_SECRET=your-secret-key-min-32-chars
NEXTAUTH_URL=http://localhost:3000

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=production

# Redis
REDIS_URL=redis://localhost:6379

# MinIO / S3
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
```

---

## Common Error Solutions

### Prisma "Unknown argument" Error
**Problem**: Field doesn't exist in model
**Solution**: Check schema, use only existing fields

### NextAuth "No secret" Error
**Problem**: AUTH_SECRET not set
**Solution**: Add AUTH_SECRET to .env

### Docker "Port already in use"
**Problem**: Port conflict
**Solution**:
```bash
docker-compose down
# Find process using port
netstat -ano | findstr :3001
# Kill process or change port
```

### Prisma "Database not found"
**Problem**: Database doesn't exist
**Solution**:
```bash
docker exec -it rbr-postgres psql -U postgres
CREATE DATABASE rbr_meal_booking;
npx prisma migrate dev
```

### Build fails with "Module not found"
**Problem**: Dependencies not installed
**Solution**:
```bash
docker-compose build --no-cache app
```

---

## Performance Checklist

✅ Use `Promise.all()` for parallel Prisma queries
✅ Add indexes to frequently queried fields
✅ Use `select` to limit returned fields
✅ Implement pagination for large datasets
✅ Use `force-dynamic` for real-time data
✅ Optimize images with Next.js Image component
✅ Use Framer Motion's `layout` prop for smooth transitions
✅ Memoize expensive calculations with `useMemo`
✅ Debounce search inputs
✅ Lazy load heavy components with `dynamic`

---

## Security Checklist

✅ Always validate input with Zod
✅ Always check authentication in API routes
✅ Always check authorization for role-specific actions
✅ Never expose passwords in queries
✅ Use bcrypt with 12 rounds for password hashing
✅ Use parameterized queries (Prisma handles this)
✅ Set proper CORS headers
✅ Use HTTPS in production
✅ Sanitize user input
✅ Implement rate limiting for sensitive endpoints

---

**Quick Access**: Keep this file open while developing for instant technology-specific reference!
