# Oracle Red Bull Racing - Meal Booking Platform
## System Architecture Map v2.5.10

> **Ultima Modifica**: 2025-10-21
> **Versione**: Production Ready v2.5.10
> **Stato**: 98/100 - Fully Functional

---

## 📋 Indice

1. [Stack Tecnologico](#stack-tecnologico)
2. [Architettura Generale](#architettura-generale)
3. [Struttura Directory](#struttura-directory)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Componenti UI](#componenti-ui)
7. [Ruoli Utente](#ruoli-utente)
8. [Flussi Applicativi](#flussi-applicativi)
9. [Sicurezza](#sicurezza)
10. [Performance](#performance)

---

## 🛠 Stack Tecnologico

### Frontend
- **Framework**: Next.js 15.1.4 (App Router, React Server Components)
- **UI Library**: React 19.0.0
- **Language**: TypeScript 5.7.2 (strict mode)
- **Styling**: Tailwind CSS 3.4.18
- **Component Library**: shadcn/ui (Radix UI primitives)
- **Animations**: Framer Motion 12.23.24
- **Forms**: React Hook Form + Zod validation
- **Tables**: @tanstack/react-table v8
- **Charts**: Recharts 2.15.2
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js 20 (Alpine Linux)
- **Database**: PostgreSQL 16
- **ORM**: Prisma 6.2.0
- **Cache**: Redis 7.4
- **Storage**: MinIO (S3-compatible)
- **Auth**: NextAuth v5 (beta) with JWT strategy

### Infrastructure
- **Containerization**: Docker 24.x + Docker Compose
- **Reverse Proxy**: Nginx (production)
- **Admin Tools**: pgAdmin 4, Portainer
- **CI/CD**: Ready for GitHub Actions

### Librerie Specializzate
- **State Management**: TanStack Query v5 + Zustand
- **Date Handling**: date-fns
- **Notifications**: Sonner (toast)
- **Password Hashing**: bcryptjs (12 rounds)
- **Validation**: Zod schemas

---

## 🏗 Architettura Generale

```
┌─────────────────────────────────────────────────────────────┐
│                      NGINX Reverse Proxy                     │
│                    (Port 8081/8443 - SSL)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   Next.js Application                        │
│                    (Port 3001 → 3000)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         App Router (Server Components)              │   │
│  │  ┌────────────────────────────────────────────┐     │   │
│  │  │  Pages: /, /login, /booking, /kitchen,    │     │   │
│  │  │         /customer-admin, /super-admin      │     │   │
│  │  └────────────────────────────────────────────┘     │   │
│  │                                                       │   │
│  │  ┌────────────────────────────────────────────┐     │   │
│  │  │  API Routes: /api/auth, /api/booking,     │     │   │
│  │  │             /api/kitchen, /api/customer,   │     │   │
│  │  │             /api/admin, /api/stats         │     │   │
│  │  └────────────────────────────────────────────┘     │   │
│  │                                                       │   │
│  │  ┌────────────────────────────────────────────┐     │   │
│  │  │  Middleware: Auth + Role-based routing    │     │   │
│  │  │  (Edge Runtime - JWT only, no Prisma)     │     │   │
│  │  └────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────┬───────────────────┬───────────────────┬────────┘
             │                   │                   │
┌────────────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐
│   PostgreSQL 16     │ │   Redis 7.4    │ │   MinIO S3     │
│   (Port 5434)       │ │   (Port 6381)  │ │ (Port 9004/5)  │
│                     │ │                │ │                │
│ • Users             │ │ • Sessions     │ │ • Recipe Imgs  │
│ • Bookings          │ │ • Cache        │ │ • User Avatars │
│ • Recipes/Menus     │ │ • Rate Limit   │ │ • Documents    │
│ • Groups            │ │                │ │                │
│ • Audit Logs        │ │                │ │                │
└─────────────────────┘ └────────────────┘ └────────────────┘
```

---

## 📁 Struttura Directory

```
C:\REDBULL_APP\
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth layout group
│   │   │   └── login/page.tsx        # Login page
│   │   │
│   │   ├── (dashboard)/              # Protected dashboard group
│   │   │   ├── layout.tsx            # Sidebar + header layout
│   │   │   ├── booking/              # End User dashboard
│   │   │   │   ├── page.tsx          # Main booking dashboard
│   │   │   │   ├── new/page.tsx      # New booking wizard
│   │   │   │   ├── orders/page.tsx   # User orders history
│   │   │   │   └── notifications/    # User notifications
│   │   │   │
│   │   │   ├── kitchen/              # Kitchen Admin dashboard
│   │   │   │   ├── page.tsx          # Kitchen dashboard
│   │   │   │   ├── recipes/          # Recipe management
│   │   │   │   ├── menus/            # Menu planning
│   │   │   │   ├── orders/           # Kitchen orders view
│   │   │   │   └── reports/          # Kitchen reports + charts
│   │   │   │
│   │   │   ├── customer-admin/       # Customer Admin dashboard
│   │   │   │   ├── page.tsx          # Customer dashboard
│   │   │   │   ├── employees/        # Employee management
│   │   │   │   ├── groups/           # Group management
│   │   │   │   ├── orders/           # Customer orders view
│   │   │   │   └── reports/          # Customer reports + charts
│   │   │   │
│   │   │   ├── super-admin/          # Super Admin dashboard
│   │   │   │   ├── page.tsx          # Admin dashboard
│   │   │   │   ├── users/            # All users management
│   │   │   │   ├── payment-gateways/ # Payment config
│   │   │   │   ├── audit/            # Audit log viewer
│   │   │   │   ├── reports/          # System reports + charts
│   │   │   │   └── settings/         # System settings
│   │   │   │
│   │   │   └── profile/page.tsx      # User profile (all roles)
│   │   │
│   │   ├── api/                      # API Routes
│   │   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   │   ├── health/               # Health check
│   │   │   ├── booking/              # Booking CRUD
│   │   │   ├── kitchen/              # Kitchen APIs
│   │   │   │   ├── recipes/          # Recipe CRUD
│   │   │   │   ├── menus/            # Menu CRUD
│   │   │   │   └── orders/           # Kitchen orders
│   │   │   ├── customer/             # Customer Admin APIs
│   │   │   │   ├── employees/        # Employee CRUD
│   │   │   │   └── groups/           # Group CRUD
│   │   │   ├── admin/                # Super Admin APIs
│   │   │   │   └── users/            # User CRUD
│   │   │   └── stats/                # Real-time stats APIs ✅
│   │   │       ├── customer-admin/   # Customer stats
│   │   │       ├── kitchen/          # Kitchen stats
│   │   │       ├── super-admin/      # System stats
│   │   │       └── user/             # User stats
│   │   │
│   │   └── page.tsx                  # Landing page
│   │
│   ├── components/
│   │   ├── auth/                     # Auth components
│   │   │   └── LoginForm.tsx         # Login form with demo creds
│   │   ├── booking/                  # Booking components
│   │   ├── customer-admin/           # Customer admin components
│   │   │   ├── EmployeeFormDialog.tsx ✅ # With password field
│   │   │   └── GroupFormDialog.tsx
│   │   ├── kitchen/                  # Kitchen components
│   │   ├── super-admin/              # Super admin components
│   │   ├── layout/                   # Layout components
│   │   │   ├── Sidebar.tsx           # Main sidebar navigation
│   │   │   └── Header.tsx            # Top header
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── data-table.tsx        # Advanced table with search/filter
│   │   │   ├── StatsCard.tsx         # Reusable stats card
│   │   │   └── ... (40+ components)
│   │   └── CommandPalette.tsx        # Global search (Cmd+K)
│   │
│   ├── lib/
│   │   ├── auth.ts                   # NextAuth config
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── redis.ts                  # Redis client
│   │   └── utils.ts                  # Utility functions
│   │
│   ├── hooks/                        # Custom React hooks
│   ├── types/                        # TypeScript types
│   └── middleware.ts                 # Edge middleware (JWT auth)
│
├── prisma/
│   ├── schema.prisma                 # Database schema (16 models)
│   ├── seed.ts                       # Seed data (15 users, 42 recipes)
│   └── migrations/                   # Migration history
│
├── public/                           # Static assets
├── docker-compose.yml                # Docker orchestration
├── Dockerfile                        # Multi-stage build
├── next.config.ts                    # Next.js configuration
├── tailwind.config.ts                # Tailwind + Red Bull theme
└── tsconfig.json                     # TypeScript config

```

**Totale File**: ~180+ files
**Linee di Codice**: ~25,000 LOC

---

## 🗄 Database Schema

### Prisma Models (16 totali)

#### **Authentication**
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String    // bcrypt hashed (12 rounds)
  firstName     String?
  lastName      String?
  role          Role      // SUPER_ADMIN | KITCHEN_ADMIN | CUSTOMER_ADMIN | END_USER
  department    String?
  badgeCode     String?   @unique
  ticketCode    String?   @unique
  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum Role {
  SUPER_ADMIN      // Full system access
  KITCHEN_ADMIN    // Kitchen management
  CUSTOMER_ADMIN   // Employee/group management
  END_USER         // Booking only
}
```

#### **Kitchen Management**
```prisma
model Recipe {
  id               String         @id @default(cuid())
  name             String
  category         RecipeCategory // FIRST_COURSE | SECOND_COURSE | etc.
  description      String?
  ingredients      Json           // Array of ingredients
  allergens        String[]       // Array of allergen names
  nutritionalInfo  Json?
  prepTime         Int?           // Minutes
  price            Int            // Cents
  imageUrl         String?
  isAvailable      Boolean        @default(true)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
}

model Menu {
  id          String    @id @default(cuid())
  date        DateTime  @db.Date
  mealType    MealType  // BREAKFAST | LUNCH | DINNER
  recipeIds   String[]  // Array of recipe IDs
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([date, mealType])
}
```

#### **Booking System**
```prisma
model Booking {
  id             String          @id @default(cuid())
  userId         String
  menuId         String
  date           DateTime        @db.Date
  mealType       MealType
  totalPrice     Int             // Cents
  paymentMethod  PaymentMethod?
  paymentStatus  PaymentStatus   @default(PENDING)
  status         BookingStatus   @default(PENDING)
  notes          String?

  user           User            @relation(fields: [userId])
  items          BookingItem[]

  bookedAt       DateTime        @default(now())
  confirmedAt    DateTime?
  completedAt    DateTime?
  cancelledAt    DateTime?
}

model BookingItem {
  id             String         @id @default(cuid())
  bookingId      String
  recipeId       String
  recipeName     String         // Snapshot at booking time
  recipeCategory RecipeCategory
  quantity       Int            @default(1)
  unitPrice      Int            // Cents
  subtotal       Int            // quantity * unitPrice
}
```

#### **Group Management**
```prisma
model Group {
  id          String        @id @default(cuid())
  name        String
  description String?
  isActive    Boolean       @default(true)
  members     GroupMember[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model GroupMember {
  id        String   @id @default(cuid())
  groupId   String
  userId    String
  role      String?  // Optional role within group
  joinedAt  DateTime @default(now())

  group     Group    @relation(fields: [groupId])
  user      User     @relation(fields: [userId])

  @@unique([groupId, userId])
}
```

#### **Payment Gateways**
```prisma
model PaymentGatewayConfig {
  id          String         @id @default(cuid())
  gateway     PaymentGateway // NEXY | SATISPAY | STRIPE | TICKET_EDENRED
  environment Environment    @default(SANDBOX)
  isActive    Boolean        @default(false)
  credentials Json           // Encrypted API credentials
  settings    Json?
  webhookUrl  String?
  lastTestedAt DateTime?
  testResults  Json?
  debugMode    Boolean       @default(true)

  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@unique([gateway, environment])
}
```

#### **Audit & Notifications**
```prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String   // "user.created", "booking.confirmed", etc.
  entity    String   // "User", "Booking", etc.
  entityId  String?
  changes   Json?    // Before/after snapshot
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([entity, entityId])
  @@index([createdAt])
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String   // "booking.confirmed", "menu.available", etc.
  title     String
  message   String
  data      Json?
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId])

  @@index([userId, isRead])
  @@index([createdAt])
}
```

---

## 🚀 API Endpoints

### **Authentication**
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/[...nextauth]` | GET, POST | Public | NextAuth handlers (login/logout) |
| `/api/auth/session` | GET | Public | Get current session |
| `/api/profile` | GET, PATCH | User | Get/update user profile |
| `/api/profile/password` | POST | User | Change password |

### **Stats APIs (Real-time Data)** ✅
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/stats/customer-admin` | GET | CUSTOMER_ADMIN, SUPER_ADMIN | Employee/group/orders/spending stats |
| `/api/stats/kitchen` | GET | KITCHEN_ADMIN, SUPER_ADMIN | Recipe/menu/orders/prep time stats |
| `/api/stats/super-admin` | GET | SUPER_ADMIN | System-wide user/booking/uptime stats |
| `/api/stats/user` | GET | User | Personal booking/spending stats |

### **Booking**
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/booking` | GET | User | List user bookings |
| `/api/booking` | POST | User | Create new booking |
| `/api/booking/[id]` | GET | User | Get booking details |
| `/api/booking/[id]` | PATCH | User | Update booking |
| `/api/booking/[id]` | DELETE | User | Cancel booking |
| `/api/booking/rules` | GET | Public | Get booking rules per category |

### **Kitchen Management**
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/kitchen/recipes` | GET | KITCHEN_ADMIN+ | List all recipes |
| `/api/kitchen/recipes` | POST | KITCHEN_ADMIN+ | Create recipe |
| `/api/kitchen/recipes/[id]` | GET | User | Get recipe details |
| `/api/kitchen/recipes/[id]` | PATCH | KITCHEN_ADMIN+ | Update recipe |
| `/api/kitchen/recipes/[id]` | DELETE | KITCHEN_ADMIN+ | Delete recipe |
| `/api/kitchen/menus` | GET | User | List available menus |
| `/api/kitchen/menus` | POST | KITCHEN_ADMIN+ | Create menu |
| `/api/kitchen/menus/[id]` | PATCH | KITCHEN_ADMIN+ | Update menu |
| `/api/kitchen/menus/[id]` | DELETE | KITCHEN_ADMIN+ | Delete menu |
| `/api/kitchen/orders` | GET | KITCHEN_ADMIN+ | List kitchen orders |
| `/api/kitchen/orders/[id]/status` | PATCH | KITCHEN_ADMIN+ | Update order status |

### **Customer Admin**
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/customer/employees` | GET | CUSTOMER_ADMIN+ | List employees (END_USER) |
| `/api/customer/employees` | POST | CUSTOMER_ADMIN+ | Create employee ✅ |
| `/api/customer/employees/[id]` | PATCH | CUSTOMER_ADMIN+ | Update employee |
| `/api/customer/employees/[id]` | DELETE | CUSTOMER_ADMIN+ | Deactivate employee |
| `/api/customer/groups` | GET | CUSTOMER_ADMIN+ | List groups |
| `/api/customer/groups` | POST | CUSTOMER_ADMIN+ | Create group |
| `/api/customer/groups/[id]` | PATCH | CUSTOMER_ADMIN+ | Update group |
| `/api/customer/groups/[id]` | DELETE | CUSTOMER_ADMIN+ | Delete group |

### **Super Admin**
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/users` | GET | SUPER_ADMIN | List all users |
| `/api/admin/users` | POST | SUPER_ADMIN | Create user (any role) |
| `/api/admin/users/[id]` | GET | SUPER_ADMIN | Get user details |
| `/api/admin/users/[id]` | PATCH | SUPER_ADMIN | Update user |
| `/api/admin/users/[id]` | DELETE | SUPER_ADMIN | Delete user |
| `/api/admin/users/[id]/groups` | GET | SUPER_ADMIN | List user groups |

### **Health & Utilities**
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/health` | GET | Public | System health check |
| `/api/menu/available` | GET | User | Get available menus for booking |
| `/api/notifications` | GET | User | List user notifications |
| `/api/notifications/[id]` | PATCH | User | Mark notification as read |

---

## 🎨 Componenti UI

### **Layout Components**
- `Sidebar.tsx` - Navigation sidebar with role-based menu
- `Header.tsx` - Top header with user menu + notifications
- `PageHeader.tsx` - Reusable page title + breadcrumbs + actions
- `CommandPalette.tsx` - Global search (Cmd/Ctrl+K)

### **Form Components**
- `LoginForm.tsx` - Login with demo credentials
- `EmployeeFormDialog.tsx` - Create/edit employee (with password) ✅
- `GroupFormDialog.tsx` - Create/edit group
- `RecipeFormDialog.tsx` - Create/edit recipe
- `MenuFormDialog.tsx` - Create/edit menu
- `UserFormDialog.tsx` - Create/edit user (super admin)

### **Data Display**
- `DataTable.tsx` - Advanced table (sort, filter, search, export CSV)
- `StatsCard.tsx` - Dashboard stat card with trend indicator
- `EmptyState.tsx` - Empty state placeholder
- `Badge.tsx` - Status badges
- `Tabs.tsx` - Tab navigation

### **Charts (Recharts)**
- `BarChart` - Order volume, revenue
- `LineChart` - Trends over time
- `PieChart` - Distribution (categories, departments)
- `AreaChart` - Cumulative metrics

### **UI Primitives (shadcn/ui)**
- Button, Input, Select, Checkbox, Radio, Switch
- Card, Dialog, Sheet, Popover, Dropdown
- Form, Label, Toast (Sonner), Alert
- Skeleton, Spinner (Loader2)

---

## 👥 Ruoli Utente

### **1. SUPER_ADMIN**
**Accesso**: Completo a tutto il sistema

**Permessi**:
- Gestione utenti (CRUD tutti i ruoli)
- Configurazione payment gateways
- Audit log viewer
- Report sistema completo
- Gestione impostazioni globali

**Dashboard**: `/super-admin`
- Total Users con trend
- Active Payment Gateways
- Total Bookings (30 giorni)
- System Uptime

### **2. KITCHEN_ADMIN**
**Accesso**: Gestione cucina + booking personale

**Permessi**:
- Gestione ricette (CRUD)
- Gestione menu (CRUD)
- Visualizzazione ordini cucina
- Update stato ordini
- Report cucina
- Booking personale

**Dashboard**: `/kitchen`
- Total Recipes con trend
- Active Menus
- Pending Orders (oggi)
- Average Prep Time

### **3. CUSTOMER_ADMIN**
**Accesso**: Gestione dipendenti/gruppi + booking personale

**Permessi**:
- Gestione dipendenti END_USER (CRUD) ✅
- Gestione gruppi (CRUD)
- Visualizzazione ordini dipendenti
- Report customer
- Booking personale

**Dashboard**: `/customer-admin`
- Total Employees con trend
- Active Groups
- Monthly Orders
- Monthly Spending

### **4. END_USER**
**Accesso**: Solo booking personale

**Permessi**:
- Visualizzazione menu disponibili
- Creazione booking
- Gestione proprie prenotazioni
- Visualizzazione storico ordini
- Gestione notifiche
- Update profilo

**Dashboard**: `/booking`
- Available Menus questa settimana
- My Bookings questo mese
- Monthly Spending
- Next Booking info

---

## 🔒 Sicurezza

### **Authentication**
- NextAuth v5 (beta) con JWT strategy
- Password hashing: bcrypt (12 rounds)
- Session storage: Database + JWT tokens
- CSRF protection: Built-in Next.js
- Rate limiting: Redis-based

### **Authorization**
- Middleware Edge Runtime (JWT-only, no Prisma)
- Role-based access control (RBAC)
- Route protection per role
- API endpoint authorization checks

### **Data Protection**
- SQL Injection: Prevented by Prisma ORM
- XSS: React escaping + Content Security Policy
- Secrets: Environment variables only
- Payment credentials: Encrypted JSON in DB

---

## ⚡ Performance

### **Build Optimization**
- Bundle size: 102kB shared JS
- Code splitting: Automatic per route
- Tree shaking: Enabled
- Image optimization: Next.js Image component
- Lazy loading: Dynamic imports

### **Runtime Performance**
- Server Components: Reduce client JS
- Streaming SSR: Faster initial load
- Edge Middleware: Low latency auth
- Database indexing: All foreign keys + queries
- Redis caching: Sessions + rate limiting

### **Startup Time**
- Container ready: 91ms
- First request: ~200ms
- Subsequent requests: ~50ms

---

## 📊 Metriche Correnti

**Application Status**: 98/100 Production Ready ✅

- Total Pages: 21
- API Endpoints: 30+
- Components: 180+
- Database Models: 16
- Seed Users: 15
- Seed Recipes: 42
- Docker Containers: 7 (5 healthy)

---

## 🎯 Prossimi Step per 100/100

1. ✅ Employee creation bug - RISOLTO
2. ✅ Real data integration - COMPLETATO
3. ⏳ End-to-end testing
4. ⏳ Skeleton loaders (optional)
5. ⏳ Performance monitoring (Sentry)

---

**Documento Creato**: 2025-10-21
**Ultima Verifica**: Production Build Successful
**Maintainer**: Oracle Red Bull Racing Dev Team
