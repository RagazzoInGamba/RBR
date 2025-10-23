# Red Bull Racing - Development Patterns & Best Practices

## Stack-Specific Development Guidelines

### Next.js 15.1.4 App Router Patterns

#### 1. Page Structure Pattern
```typescript
// src/app/(dashboard)/[role]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { motion } from 'framer-motion';

interface PageData {
  stats: {
    statName: {
      value: number;
      formatted: string;
      trend?: { value: string; direction: 'up' | 'down' };
    };
  };
}

export default function RoleDashboard() {
  const [data, setData] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/stats/role');
      if (!response.ok) throw new Error('Errore nel caricamento');
      const stats = await response.json();
      setData(stats);
    } catch (err) {
      console.error('Failed to fetch:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <PageHeader title="Dashboard" subtitle="Subtitle" />
      {/* Loading/Error/Data states */}
    </motion.div>
  );
}
```

#### 2. API Route Pattern (Node.js Runtime with Prisma)
```typescript
// src/app/api/[resource]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // ALWAYS include for real-time data

export async function GET() {
  try {
    // 1. Authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    // 2. Authorization
    const userRole = (session.user as { role: string }).role;
    if (!['ALLOWED_ROLE'].includes(userRole)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // 3. Date calculations (if needed)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 4. Parallel Prisma queries for performance
    const [resource1, resource2] = await Promise.all([
      prisma.model.findMany({ where: { /* ... */ } }),
      prisma.model.count({ where: { /* ... */ } }),
    ]);

    // 5. Return formatted data
    return NextResponse.json({
      data: resource1,
      count: resource2,
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
```

#### 3. Middleware Pattern (Edge Runtime - NO Prisma!)
```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};

export async function middleware(request: NextRequest) {
  // ONLY use JWT in Edge Runtime - NO Prisma calls!
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based routing
  const role = token.role as string;
  const path = request.nextUrl.pathname;

  // Simple route checks - no database calls
  if (path.startsWith('/super-admin') && role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}
```

### Prisma 6.2.0 Best Practices

#### 1. CRITICAL: Field Existence Check
**ALWAYS verify field exists in schema before querying!**

```typescript
// ❌ WRONG - May cause "Unknown argument" error
const users = await prisma.user.count({
  where: {
    isActive: true, // Does NOT exist in User model!
  },
});

// ✅ CORRECT - Only use existing fields
const users = await prisma.user.count({
  where: {
    role: 'END_USER', // EXISTS in User model
  },
});
```

**Models with isActive field:**
- `PaymentGatewayConfig`
- `Recipe`
- `Menu`
- `BookingRule`
- `Group`

**Models WITHOUT isActive field:**
- `User` ❌
- `Booking` ❌
- `AuditLog` ❌

#### 2. Optimized Query Patterns

```typescript
// Pattern 1: Parallel queries for dashboard stats
const [count1, count2, aggregate] = await Promise.all([
  prisma.model.count({ where: { /* ... */ } }),
  prisma.model.count({ where: { /* ... */ } }),
  prisma.model.aggregate({
    where: { /* ... */ },
    _sum: { totalPrice: true },
  }),
]);

// Pattern 2: Selective field fetching
const users = await prisma.user.findMany({
  select: {
    id: true,
    firstName: true,
    lastName: true,
    // Only select needed fields
  },
  where: { /* ... */ },
  orderBy: { createdAt: 'desc' },
  take: 10, // Limit results
});

// Pattern 3: Money handling (ALWAYS use cents!)
const totalPrice = 1250; // €12.50 in cents
const euros = totalPrice / 100; // Convert to euros for display
const formatted = `€${euros.toLocaleString('it-IT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`;
```

#### 3. Relation Loading

```typescript
// Include relations when needed
const booking = await prisma.booking.findUnique({
  where: { id: bookingId },
  include: {
    user: {
      select: { firstName: true, lastName: true, email: true },
    },
    items: {
      include: {
        // Nested relations
      },
    },
  },
});
```

### React Hook Form + Zod Pattern

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Define schema
const formSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(8, 'Minimo 8 caratteri'),
  role: z.enum(['END_USER', 'KITCHEN_ADMIN', 'CUSTOMER_ADMIN', 'SUPER_ADMIN']),
});

type FormValues = z.infer<typeof formSchema>;

function MyForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'END_USER',
    },
  });

  async function onSubmit(data: FormValues) {
    try {
      const response = await fetch('/api/resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Errore');

      const result = await response.json();
      // Handle success
    } catch (error) {
      // Handle error
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
}
```

### Framer Motion Animation Patterns

```typescript
// Container with stagger children
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  },
};

// Usage
<motion.div
  variants={container}
  initial="hidden"
  animate="show"
  className="grid gap-6"
>
  <motion.div variants={item}>
    <StatsCard {...props} />
  </motion.div>
</motion.div>
```

### TypeScript Type Patterns

```typescript
// Session type extension
import { Session } from 'next-auth';

interface ExtendedUser {
  id: string;
  role: string;
  email: string;
}

const session = await getServerSession();
const userId = (session?.user as ExtendedUser)?.id;
const userRole = (session?.user as ExtendedUser)?.role;

// API Response types
interface APIResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

interface StatsData {
  stats: {
    [key: string]: {
      value: number;
      formatted: string;
      trend?: {
        value: string;
        direction: 'up' | 'down';
      };
    };
  };
}
```

### Docker Development Commands

```bash
# Full rebuild (when dependencies change or schema changes)
docker-compose down
docker-compose build --no-cache app
docker-compose up -d

# Quick restart (code changes only)
docker-compose restart app

# View logs
docker logs rbr-app --tail 100 -f

# Database migrations
docker exec rbr-app npx prisma migrate dev --name migration_name
docker exec rbr-app npx prisma generate

# Access database
docker exec -it rbr-postgres psql -U postgres -d rbr_meal_booking

# Check health
docker ps --format "table {{.Names}}\t{{.Status}}"
curl -I http://localhost:3001
```

### Error Handling Patterns

```typescript
// Client-side error handling
try {
  setIsLoading(true);
  setError(null);

  const response = await fetch('/api/endpoint');

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Errore nel caricamento');
  }

  const data = await response.json();
  setData(data);
} catch (err) {
  console.error('Operation failed:', err);
  setError(err instanceof Error ? err.message : 'Errore sconosciuto');
} finally {
  setIsLoading(false);
}

// Server-side error handling
try {
  // Operation
} catch (error) {
  console.error('[API] Operation error:', error);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Risorsa già esistente' }, { status: 409 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Risorsa non trovata' }, { status: 404 });
    }
  }

  return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
}
```

### Performance Optimization

```typescript
// 1. Use dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <Loader2 className="animate-spin" />,
  ssr: false, // Client-side only if needed
});

// 2. Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return complexCalculation(data);
}, [data]);

// 3. Debounce search inputs
const debouncedSearch = useMemo(
  () =>
    debounce((value: string) => {
      performSearch(value);
    }, 300),
  []
);

// 4. Optimize Prisma queries with indexes
// Already defined in schema.prisma with @@index
// Always query indexed fields when possible
```

### Security Best Practices

```typescript
// 1. Always validate input
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

const validated = schema.parse(requestBody);

// 2. Always check authentication
const session = await getServerSession();
if (!session?.user) {
  return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
}

// 3. Always check authorization
const userRole = (session.user as { role: string }).role;
if (!allowedRoles.includes(userRole)) {
  return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
}

// 4. Never expose sensitive data
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    // password: true, ❌ NEVER select password!
  },
});

// 5. Hash passwords with bcrypt (12 rounds)
import bcrypt from 'bcryptjs';
const hashedPassword = await bcrypt.hash(password, 12);
const isValid = await bcrypt.compare(password, hashedPassword);
```

### File Organization Standards

```
src/
├── app/
│   ├── (auth)/              # Authentication pages (no auth required)
│   │   └── login/
│   ├── (dashboard)/         # Dashboard pages (auth required)
│   │   ├── booking/         # END_USER pages
│   │   ├── customer-admin/  # CUSTOMER_ADMIN pages
│   │   ├── kitchen/         # KITCHEN_ADMIN pages
│   │   └── super-admin/     # SUPER_ADMIN pages
│   └── api/
│       ├── auth/            # NextAuth routes
│       ├── booking/         # Booking operations
│       ├── customer/        # Customer admin operations
│       ├── kitchen/         # Kitchen operations
│       ├── stats/           # Statistics endpoints
│       └── admin/           # Super admin operations
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── [role]-[feature]/    # Role-specific components
│   └── forms/               # Form components
├── lib/
│   ├── auth.ts             # NextAuth configuration
│   ├── prisma.ts           # Prisma client singleton
│   └── utils.ts            # Utility functions
└── types/
    └── next-auth.d.ts      # Type extensions
```

### Common Pitfalls to Avoid

1. ❌ **Using Prisma in Edge Runtime (middleware)**
   - Edge Runtime = JWT only
   - Node Runtime = Prisma allowed

2. ❌ **Querying non-existent fields**
   - Always check schema first
   - User model has NO isActive field

3. ❌ **Forgetting `export const dynamic = 'force-dynamic'`**
   - Required for real-time data APIs
   - Prevents stale data caching

4. ❌ **Not handling cents to euros conversion**
   - Database stores cents (Int)
   - Display as euros (divide by 100)

5. ❌ **Missing authentication/authorization checks**
   - Every protected route needs session check
   - Every operation needs role check

6. ❌ **Not using parallel queries**
   - Use Promise.all() for independent queries
   - Significantly improves performance

7. ❌ **Exposing passwords in queries**
   - Use select to exclude password
   - Or use omit in newer Prisma versions

8. ❌ **Not using TypeScript types**
   - Always define interfaces for data
   - Use Zod for runtime validation

### Quick Reference: Model Fields

**User Model** (NO isActive):
- id, email, password, role, firstName, lastName
- badgeCode, ticketCode, eneredCode, stripeCustomerId
- department, dietaryRestrictions
- createdAt, updatedAt, lastLoginAt

**Group Model** (HAS isActive):
- id, name, description, customerId, isActive
- createdAt, updatedAt, createdBy

**Recipe Model** (HAS isAvailable - NOT isActive):
- id, name, description, category, ingredients
- instructions, prepTime, cookTime, servings
- calories, allergens, imageUrl, isAvailable
- isVegetarian, isVegan, isGlutenFree
- createdAt, updatedAt, createdBy

**Menu Model** (HAS isActive):
- id, name, date, mealType, recipes
- maxBookings, currentBookings, isActive
- createdAt, updatedAt, createdBy

**Booking Model** (NO isActive - has status instead):
- id, userId, menuId, date, mealType
- totalPrice, paymentMethod, paymentStatus
- paymentGateway, transactionId, status, notes
- bookedAt, confirmedAt, cancelledAt, completedAt

---

**Remember**: When in doubt, check the Prisma schema at `prisma/schema.prisma`!
