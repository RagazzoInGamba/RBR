# Red Bull Racing - Code Templates

## Copy-Paste Ready Templates for Common Operations

### 1. New API Route Template

```typescript
// src/app/api/[resource]/route.ts
/**
 * Oracle Red Bull Racing - [Resource Name] API
 * [Brief description of what this API does]
 */

import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import * as z from 'zod';

export const dynamic = 'force-dynamic';

// ============= VALIDATION SCHEMAS =============

const createSchema = z.object({
  name: z.string().min(1, 'Campo obbligatorio'),
  description: z.string().optional(),
  // Add more fields as needed
});

const updateSchema = createSchema.partial();

// ============= GET =============

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const userRole = (session.user as { role: string }).role;
    const allowedRoles = ['SUPER_ADMIN', 'ROLE_NAME'];

    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.model.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.model.count(),
    ]);

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[API] GET error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// ============= POST =============

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const userRole = (session.user as { role: string }).role;
    const userId = (session.user as { id: string }).id;
    const allowedRoles = ['SUPER_ADMIN', 'ROLE_NAME'];

    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createSchema.parse(body);

    const created = await prisma.model.create({
      data: {
        ...validated,
        createdBy: userId,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('[API] POST error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
```

### 2. New API Route with ID Template

```typescript
// src/app/api/[resource]/[id]/route.ts
/**
 * Oracle Red Bull Racing - [Resource Name] by ID API
 */

import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import * as z from 'zod';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  // Add more fields as needed
});

// ============= GET BY ID =============

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const item = await prisma.model.findUnique({
      where: { id: params.id },
      include: {
        // Add relations as needed
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Risorsa non trovata' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('[API] GET by ID error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// ============= PUT/PATCH =============

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const userRole = (session.user as { role: string }).role;
    if (!['SUPER_ADMIN', 'ROLE_NAME'].includes(userRole)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateSchema.parse(body);

    const updated = await prisma.model.update({
      where: { id: params.id },
      data: validated,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[API] PUT error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// ============= DELETE =============

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const userRole = (session.user as { role: string }).role;
    if (!['SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    await prisma.model.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Risorsa eliminata con successo' });
  } catch (error) {
    console.error('[API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
```

### 3. New Dashboard Page Template

```typescript
// src/app/(dashboard)/[role]/page.tsx
/**
 * Oracle Red Bull Racing - [Role] Dashboard
 * [Brief description]
 */

'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardData {
  stats: {
    stat1: {
      value: number;
      formatted: string;
      trend?: { value: string; direction: 'up' | 'down' };
    };
    stat2: {
      value: number;
      formatted: string;
    };
  };
}

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
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
  },
};

export default function RoleDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/stats/role');
      if (!response.ok) {
        throw new Error('Errore nel caricamento delle statistiche');
      }

      const stats = await response.json();
      setData(stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
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
      <PageHeader
        title="Dashboard [Role]"
        subtitle="Descrizione della dashboard"
        action={
          <Button className="bg-racing-red-gradient hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" />
            Nuova Azione
          </Button>
        }
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-rbr-red" />
        </div>
      ) : error ? (
        <div className="racing-card p-6 text-center">
          <p className="text-rbr-red">{error}</p>
          <Button
            onClick={fetchStats}
            className="mt-4 bg-racing-red-gradient hover:opacity-90"
          >
            Riprova
          </Button>
        </div>
      ) : data ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={item}>
            <StatsCard
              icon={/* Icon */}
              label="Stat 1"
              value={data.stats.stat1.formatted}
              trend={{
                value: parseFloat(data.stats.stat1.trend?.value || '0'),
                direction: data.stats.stat1.trend?.direction || 'up'
              }}
              description="Descrizione"
              variant="red"
            />
          </motion.div>
          {/* Add more stats cards */}
        </motion.div>
      ) : null}
    </motion.div>
  );
}
```

### 4. Form Dialog Component Template

```typescript
// src/components/[feature]/[Name]FormDialog.tsx
/**
 * Oracle Red Bull Racing - [Name] Form Dialog
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Campo obbligatorio'),
  email: z.string().email('Email non valida'),
  // Add more fields
});

type FormValues = z.infer<typeof formSchema>;

interface NameFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: Partial<FormValues>;
  mode?: 'create' | 'edit';
  itemId?: string;
}

export function NameFormDialog({
  open,
  onOpenChange,
  onSuccess,
  initialData,
  mode = 'create',
  itemId,
}: NameFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = mode === 'edit';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: '',
      email: '',
    },
  });

  async function onSubmit(data: FormValues) {
    try {
      setIsSubmitting(true);

      const url = isEditing ? `/api/resource/${itemId}` : '/api/resource';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore durante il salvataggio');
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Submit error:', error);
      alert(error instanceof Error ? error.message : 'Errore sconosciuto');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] racing-card">
        <DialogHeader>
          <DialogTitle className="text-rbr-text-primary">
            {isEditing ? 'Modifica' : 'Crea Nuovo'}
          </DialogTitle>
          <DialogDescription className="text-rbr-text-secondary">
            {isEditing
              ? 'Modifica i dati del record'
              : 'Inserisci i dati per creare un nuovo record'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-rbr-text-primary">Nome *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Inserisci nome"
                      className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                    />
                  </FormControl>
                  <FormMessage className="text-rbr-red" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-rbr-text-primary">Email *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="email@example.com"
                      className="bg-rbr-dark-elevated border-rbr-border text-rbr-text-primary"
                    />
                  </FormControl>
                  <FormMessage className="text-rbr-red" />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="border-rbr-border text-rbr-text-secondary hover:bg-rbr-dark-elevated"
              >
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-racing-red-gradient hover:opacity-90"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Salva Modifiche' : 'Crea'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### 5. Data Table Page Template

```typescript
// src/app/(dashboard)/[role]/[resource]/page.tsx
/**
 * Oracle Red Bull Racing - [Resource] Management
 */

'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Plus, Loader2 } from 'lucide-react';
import { NameFormDialog } from '@/components/[feature]/NameFormDialog';
import { columns } from './columns';

interface Resource {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  // Add more fields
}

export default function ResourcePage() {
  const [data, setData] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Resource | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/resource');
      if (!response.ok) throw new Error('Errore nel caricamento');
      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleEdit(item: Resource) {
    setSelectedItem(item);
    setDialogOpen(true);
  }

  function handleCreateNew() {
    setSelectedItem(null);
    setDialogOpen(true);
  }

  function handleSuccess() {
    fetchData();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestione [Resource]"
        subtitle="Visualizza e gestisci i dati"
        action={
          <Button
            onClick={handleCreateNew}
            className="bg-racing-red-gradient hover:opacity-90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuovo
          </Button>
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/role' },
          { label: 'Resource' },
        ]}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-rbr-red" />
        </div>
      ) : (
        <div className="racing-card">
          <DataTable
            columns={columns}
            data={data}
            searchKey="name"
            onEdit={handleEdit}
          />
        </div>
      )}

      <NameFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
        initialData={selectedItem || undefined}
        mode={selectedItem ? 'edit' : 'create'}
        itemId={selectedItem?.id}
      />
    </div>
  );
}
```

### 6. Utility Functions Template

```typescript
// src/lib/utils/[category].ts

/**
 * Date formatting utilities
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Adesso';
  if (diffMins === 1) return '1 minuto fa';
  if (diffMins < 60) return `${diffMins} minuti fa`;
  if (diffHours === 1) return '1 ora fa';
  if (diffHours < 24) return `${diffHours} ore fa`;
  if (diffDays === 1) return '1 giorno fa';
  return `${diffDays} giorni fa`;
}

/**
 * Money formatting utilities
 */
export function centsToEuros(cents: number): number {
  return cents / 100;
}

export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

export function formatCurrency(cents: number): string {
  const euros = centsToEuros(cents);
  return `€${euros.toLocaleString('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Validation utilities
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function isStrongPassword(password: string): boolean {
  // Min 8 chars, 1 uppercase, 1 number, 1 special char
  const regex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
  return regex.test(password);
}

/**
 * Array utilities
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}
```

### 7. Prisma Query Templates

```typescript
// Common Prisma queries

// 1. Get all with pagination
const items = await prisma.model.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' },
});

// 2. Get with relations
const item = await prisma.model.findUnique({
  where: { id: itemId },
  include: {
    relation1: true,
    relation2: {
      select: {
        id: true,
        name: true,
      },
    },
  },
});

// 3. Create with relation
const created = await prisma.model.create({
  data: {
    name: 'Name',
    relation: {
      connect: { id: relationId },
    },
  },
});

// 4. Update with partial data
const updated = await prisma.model.update({
  where: { id: itemId },
  data: validatedData,
});

// 5. Soft delete pattern (if using isActive)
const softDeleted = await prisma.model.update({
  where: { id: itemId },
  data: { isActive: false },
});

// 6. Aggregate functions
const stats = await prisma.booking.aggregate({
  where: { userId: userId },
  _count: true,
  _sum: { totalPrice: true },
  _avg: { totalPrice: true },
});

// 7. Count with conditions
const count = await prisma.model.count({
  where: {
    status: 'ACTIVE',
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  },
});

// 8. Complex where conditions
const items = await prisma.model.findMany({
  where: {
    AND: [
      { status: 'ACTIVE' },
      {
        OR: [
          { category: 'A' },
          { category: 'B' },
        ],
      },
    ],
  },
});

// 9. Bulk operations
const created = await prisma.model.createMany({
  data: [
    { name: 'Item 1' },
    { name: 'Item 2' },
  ],
  skipDuplicates: true,
});

// 10. Transaction pattern
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  const profile = await tx.profile.create({
    data: { userId: user.id, ...profileData },
  });
  return { user, profile };
});
```

---

**Usage**: Copy the appropriate template and customize it for your specific use case. All templates follow the established patterns and best practices for this project.
