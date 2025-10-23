# Red Bull Racing Meal Booking Platform - Complete Technical Specification

**Version**: 2.5.10 (Production Ready)
**Last Updated**: October 22, 2025
**Status**: PRODUCTION READY
**Build**: Next.js 14.2.18 + React 18.3.1 (Stable)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Core Features](#4-core-features)
5. [Database Schema](#5-database-schema)
6. [API Endpoints](#6-api-endpoints)
7. [Environment Variables](#7-environment-variables)
8. [Docker Compose Services](#8-docker-compose-services)
9. [Known Issues & Solutions](#9-known-issues--solutions)
10. [Best Practices for Development](#10-best-practices-for-development)
11. [Testing](#11-testing)
12. [Deployment](#12-deployment)

---

## 1. Project Overview

### Description
Enterprise-grade meal booking platform designed for Oracle Red Bull Racing team members. Enables efficient management of daily meals with role-based access control, payment gateway integration, and comprehensive audit logging.

### Technology Stack

#### Frontend
- **Framework**: Next.js 14.2.18 (App Router, Server Components)
- **Runtime**: React 18.3.1 (downgraded from 19.x for stability)
- **Language**: TypeScript 5.7.2 (strict mode)
- **UI Components**: shadcn/ui + Radix UI primitives
- **Styling**: Tailwind CSS 3.4.18 + class-variance-authority
- **Forms**: React Hook Form 7.65.0 + Zod 3.25.76 validation
- **State Management**: Zustand 5.0.2 + TanStack Query 5.62.11
- **Icons**: Lucide React 0.468.0
- **Animations**: Framer Motion 12.23.24
- **Theme**: next-themes 0.4.6 (dark mode support)

#### Backend
- **Runtime**: Node.js 20+
- **Database**: PostgreSQL 16 (alpine)
- **ORM**: Prisma 6.2.0
- **Authentication**: NextAuth v5.0.0-beta.22 (Auth.js)
- **Cache/Sessions**: Redis 7 (alpine) with IORedis 5.4.2
- **Storage**: MinIO (S3-compatible) + AWS SDK 3.914.0
- **Logging**: Winston 3.17.0 (structured JSON logging)
- **Password Hashing**: bcryptjs 2.4.3

#### DevOps & Infrastructure
- **Containerization**: Docker + Docker Compose (7 containers)
- **Reverse Proxy**: Nginx (alpine)
- **Database Admin**: pgAdmin 4
- **Container Management**: Portainer CE
- **Testing**: Playwright 1.56.1 + Jest 30.2.0
- **Code Quality**: ESLint 8.57.1 + Prettier 3.4.2

### Key Features
- Multi-tenant architecture (group-based access)
- Role-based access control (4 roles)
- Real-time meal booking system
- Payment gateway configuration (Nexy, Satispay, Stripe, Edenred)
- Comprehensive audit logging
- INRAN/CREA nutritional database integration
- WCAG 2.2 AA accessibility compliance
- Red Bull Racing custom theme

---

## 2. System Architecture

### Next.js App Router Structure

```
src/app/
├── (auth)/                  # Auth route group (no layout)
│   ├── login/              # Login page
│   ├── logout/             # Logout redirect
│   └── unauthorized/       # 403 page
├── (dashboard)/            # Dashboard route group (with sidebar)
│   ├── super-admin/       # Super admin dashboard
│   ├── kitchen/           # Kitchen admin dashboard
│   ├── customer-admin/    # Customer admin dashboard
│   └── booking/           # End user booking
├── api/                    # API Routes (REST)
│   ├── auth/[...nextauth]/ # NextAuth v5 handler
│   ├── admin/             # Super admin endpoints
│   ├── kitchen/           # Kitchen endpoints
│   ├── customer/          # Customer admin endpoints
│   ├── booking/           # Booking endpoints
│   ├── menu/              # Public menu endpoints
│   ├── profile/           # User profile endpoints
│   ├── stats/             # Statistics endpoints
│   ├── notifications/     # Notification endpoints
│   └── health/            # Health check
├── layout.tsx             # Root layout (providers)
├── page.tsx               # Landing page
├── globals.css            # Global styles
├── error.tsx              # Error boundary
└── not-found.tsx          # 404 page
```

### Authentication Flow (NextAuth v5)

1. **Login Request** → `/api/auth/signin` (POST)
2. **Credentials Verification** → Prisma DB query + bcrypt compare
3. **JWT Token Generation** → `authjs.session-token` cookie (NOTE: NOT `next-auth.session-token`)
4. **Session Storage** → Redis (30-day TTL)
5. **Middleware Check** → `src/middleware.ts` validates JWT on protected routes
6. **Role Authorization** → Route-specific role checks

### Database Schema Overview

**PostgreSQL 16** with Prisma ORM manages:
- User authentication & authorization
- Meal recipes & menus
- Booking & order management
- Payment gateway configuration
- Audit logging
- Notifications & groups

### Middleware & Route Protection

```typescript
// src/middleware.ts
Protected Routes:
- /super-admin/*      → SUPER_ADMIN only
- /kitchen/*          → SUPER_ADMIN, KITCHEN_ADMIN
- /customer-admin/*   → SUPER_ADMIN, CUSTOMER_ADMIN
- /booking/*          → All authenticated users
```

### API Design Patterns

- **RESTful** endpoints with standard HTTP methods
- **JSON** request/response format
- **Zod** validation for all inputs
- **Error handling** with consistent format:
  ```json
  {
    "error": "Error message",
    "details": "Additional context",
    "code": "ERROR_CODE"
  }
  ```
- **Rate limiting** via Redis (configurable per endpoint)
- **Audit logging** for all mutations

---

## 3. User Roles & Permissions

### SUPER_ADMIN
**Description**: Full system administrator with unrestricted access

**Permissions**:
- Full CRUD on all entities
- User management (create, edit, delete, assign roles)
- Payment gateway configuration
- System settings
- Audit log access
- Database management (via pgAdmin)
- Container management (via Portainer)

**Routes**:
- `/super-admin/dashboard` - Overview stats
- `/super-admin/users` - User management
- `/super-admin/payment-gateways` - Payment configuration
- `/super-admin/audit-logs` - System audit logs
- `/super-admin/settings` - System settings

**API Endpoints**:
- `/api/admin/users/*` (GET, POST, PUT, DELETE)
- `/api/admin/payment-gateways/*`
- `/api/stats/super-admin/*`

---

### KITCHEN_ADMIN
**Description**: Kitchen staff responsible for menu creation and order fulfillment

**Permissions**:
- Recipe management (CRUD)
- Menu creation & publishing
- View all bookings/orders
- Update order status (PREPARING → READY → COMPLETED)
- Kitchen statistics & reports
- Read-only user profiles (dietary restrictions)

**Routes**:
- `/kitchen/dashboard` - Kitchen overview
- `/kitchen/recipes` - Recipe management
- `/kitchen/menus` - Menu planning
- `/kitchen/orders` - Active orders
- `/kitchen/reports` - Kitchen analytics

**API Endpoints**:
- `/api/kitchen/recipes/*` (GET, POST, PUT, DELETE)
- `/api/kitchen/menus/*` (GET, POST, PUT, DELETE)
- `/api/kitchen/orders/*` (GET, PATCH)
- `/api/stats/kitchen/*`

---

### CUSTOMER_ADMIN
**Description**: Department/team manager for employee meal oversight

**Permissions**:
- Employee management within assigned group
- View group bookings & consumption
- Monthly budget allocation
- Employee profile management (within group)
- Consumption reports
- Booking approval (optional)

**Routes**:
- `/customer-admin/dashboard` - Group overview
- `/customer-admin/employees` - Employee list
- `/customer-admin/groups` - Group management
- `/customer-admin/reports` - Consumption analytics

**API Endpoints**:
- `/api/customer/employees/*` (GET, POST, PUT, DELETE)
- `/api/customer/groups/*` (GET, POST, PUT, DELETE)
- `/api/stats/customer-admin/*`

---

### END_USER
**Description**: Regular team member who books meals

**Permissions**:
- View available menus
- Create/cancel bookings (within time limits)
- View personal booking history
- Update profile & dietary restrictions
- View notifications
- Payment method selection

**Routes**:
- `/booking/wizard` - Meal booking wizard
- `/booking/history` - Personal order history
- `/booking/profile` - Profile & preferences

**API Endpoints**:
- `/api/booking/*` (GET, POST, DELETE)
- `/api/menu/available` (GET)
- `/api/profile/*` (GET, PUT)
- `/api/notifications/*` (GET, PATCH)
- `/api/stats/user/*`

---

## 4. Core Features

### 4.1 Meal Booking System

**Booking Wizard** (Multi-step form):
1. **Date Selection** → Choose meal date & type (Breakfast/Lunch/Dinner)
2. **Menu Selection** → View available menus with nutritional info
3. **Course Selection** → Pick items from each category:
   - Antipasto (Appetizer)
   - Primo (First Course)
   - Secondo (Second Course)
   - Contorno (Side Dish)
   - Dolce (Dessert)
   - Bevanda (Beverage)
4. **Booking Rules Validation** → Min/max quantities per category
5. **Review & Confirm** → Summary with total price
6. **Payment Method** → Badge, Ticket Restaurant, Satispay, Nexy, etc.

**Features**:
- Real-time availability checking
- Allergen warnings
- Dietary restriction filtering (vegetarian, vegan, gluten-free)
- Nutritional information display
- Order deadline enforcement
- Cancellation with refund logic

### 4.2 Menu Management (Kitchen Admin)

**Recipe Management**:
- Recipe CRUD with rich editor
- INRAN/CREA nutritional data integration
- Allergen tagging (EU Regulation 1169/2011)
- Image upload (MinIO S3)
- Ingredient tracking with INRAN codes
- Portion size calculation

**Menu Creation**:
- Multi-course menu builder (drag-and-drop)
- Date range validity
- Max booking capacity
- Menu type (Standard, Vegetarian, Vegan, Celiac, Low Sodium)
- Auto-calculated nutritional summary
- Publishing workflow (draft → active)

### 4.3 Order Management (Kitchen)

**Order Status Workflow**:
```
PENDING → CONFIRMED → PREPARING → READY → COMPLETED
              ↓
          CANCELLED
```

**Kitchen Dashboard**:
- Real-time order feed
- Filtering by status, date, meal type
- Order grouping by recipe (production planning)
- Preparation time tracking
- Order completion notifications

### 4.4 User & Group Management

**User Management** (Super Admin, Customer Admin):
- Create users with role assignment
- Bulk import from CSV
- Monthly budget allocation (END_USER)
- Dietary restriction configuration
- Payment method setup (Badge, Ticket codes)
- Group membership

**Group Management** (Customer Admin):
- Create departments/teams
- Assign employees to groups
- Group-level budget tracking
- Group consumption reports

### 4.5 Payment Gateway Configuration (Super Admin)

**Supported Gateways**:
- **NEXY** (Italian payment gateway)
- **SATISPAY** (Digital wallet)
- **STRIPE** (Global payments)
- **TICKET_EDENRED** (Meal vouchers)

**Configuration UI**:
- Environment selection (Sandbox/Production)
- Encrypted credential storage (AES-256-GCM)
- Connection testing interface
- Real-time debug console
- Webhook configuration
- Transaction logging

### 4.6 Notifications

**Notification Types**:
- **BOOKING**: Order confirmation, status updates
- **PAYMENT**: Transaction success/failure
- **SYSTEM**: Menu updates, maintenance alerts
- **WARNING**: Budget limits, cancellation deadlines
- **ERROR**: Failed operations

**Delivery**:
- In-app notification center
- Real-time updates (polling or WebSocket)
- Mark as read/unread
- Deep links to related entities

### 4.7 Reports & Analytics

**Super Admin Dashboard**:
- Total bookings & revenue
- User activity trends
- Payment gateway performance
- System health metrics

**Kitchen Dashboard**:
- Daily/weekly order volume
- Popular recipes & menus
- Preparation time analytics
- Waste tracking

**Customer Admin Dashboard**:
- Group consumption reports
- Budget utilization
- Employee booking patterns
- Cost per meal trends

**End User Dashboard**:
- Personal spending history
- Nutritional intake summary
- Favorite meals

### 4.8 Audit Logging

**Logged Events**:
- User authentication (login, logout)
- Entity mutations (create, update, delete)
- Role changes
- Payment transactions
- Configuration changes

**Audit Log Storage**:
- PostgreSQL `audit_logs` table
- Fields: userId, action, entity, entityId, changes (JSON), ipAddress, userAgent
- Immutable records
- Indexed by userId, action, createdAt

---

## 5. Database Schema

### 5.1 User & Authentication

#### User Model
```prisma
model User {
  id        String  @id @default(cuid())
  email     String  @unique
  password  String? // Nullable for OAuth
  role      Role    @default(END_USER)
  firstName String
  lastName  String

  // Payment integration
  badgeCode        String? // RFID badge
  ticketCode       String? // Edenred
  eneredCode       String? // Endered
  stripeCustomerId String?

  // Preferences
  department          String?
  dietaryRestrictions Json? // {allergies: [], preferences: []}

  // Employee fields
  position        String?
  monthlyBudget   Int      @default(0) // cents
  spentThisMonth  Int      @default(0) // cents
  isActive        Boolean  @default(true)

  // Relations
  accounts Account[]
  sessions Session[]
  Booking  Booking[]

  // Audit
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  lastLoginAt DateTime?

  @@index([email])
  @@index([role])
  @@index([isActive])
  @@map("users")
}

enum Role {
  SUPER_ADMIN
  KITCHEN_ADMIN
  CUSTOMER_ADMIN
  END_USER
}
```

#### Account Model (NextAuth OAuth)
```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}
```

#### Session Model
```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}
```

### 5.2 Kitchen Management

#### Recipe Model
```prisma
model Recipe {
  id           String         @id @default(cuid())
  name         String
  description  String?        @db.Text
  category     RecipeCategory
  ingredients  Json // [{name, quantity, unit, inranCode?}]
  instructions String         @db.Text
  prepTime     Int // minutes
  cookTime     Int
  servings     Int
  portionSize  Int? // grams
  allergens    String[] // EU Regulation 1169/2011
  imageUrl     String?
  isAvailable  Boolean @default(true)
  isVegetarian Boolean @default(false)
  isVegan      Boolean @default(false)
  isGlutenFree Boolean @default(false)

  // INRAN/CREA Nutritional Data
  nutritionalValues Json? // Full spec: src/lib/inran-nutrition.ts
  inranCode         String?
  nutritionalSource String? @default("MANUAL") // INRAN | CREA | MANUAL

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?

  @@map("recipes")
}

enum RecipeCategory {
  APPETIZER      // Antipasto
  FIRST_COURSE   // Primo
  SECOND_COURSE  // Secondo
  SIDE_DISH      // Contorno
  DESSERT        // Dolce
  BEVERAGE       // Bevanda
  EXTRA          // Extra
}
```

#### Menu Model
```prisma
model Menu {
  id        String   @id @default(cuid())
  name      String
  startDate DateTime @db.Date
  endDate   DateTime @db.Date
  mealType  MealType
  menuType  MenuType @default(STANDARD)

  // Multi-course structure
  courses Json // {antipasto: [{recipeId, recipeName, quantity}], ...}

  maxBookings     Int     @default(100)
  currentBookings Int     @default(0)
  isActive        Boolean @default(true)

  nutritionalSummary Json? // Aggregate values
  targetDiners       Int?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?

  @@map("menus")
}

enum MenuType {
  STANDARD
  VEGETARIAN
  VEGAN
  CELIAC
  LOW_SODIUM
}

enum MealType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
}
```

### 5.3 Booking & Orders

#### Booking Model
```prisma
model Booking {
  id             String          @id @default(cuid())
  userId         String
  menuId         String
  date           DateTime        @db.Date
  mealType       MealType
  totalPrice     Int // cents
  paymentMethod  PaymentMethod?
  paymentStatus  PaymentStatus   @default(PENDING)
  paymentGateway PaymentGateway?
  transactionId  String?
  status         BookingStatus   @default(PENDING)
  notes          String?         @db.Text

  user  User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  items BookingItem[]

  bookedAt    DateTime  @default(now())
  confirmedAt DateTime?
  cancelledAt DateTime?
  completedAt DateTime?

  @@map("bookings")
}

enum BookingStatus {
  PENDING
  CONFIRMED
  PREPARING
  READY
  COMPLETED
  CANCELLED
}

enum PaymentMethod {
  CREDIT_CARD
  BADGE
  TICKET_RESTAURANT
  SATISPAY
  NEXY
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
}
```

#### BookingItem Model
```prisma
model BookingItem {
  id             String         @id @default(cuid())
  bookingId      String
  recipeId       String
  recipeName     String // Snapshot
  recipeCategory RecipeCategory
  quantity       Int            @default(1)
  unitPrice      Int // cents
  subtotal       Int // cents

  booking Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@map("booking_items")
}
```

#### BookingRule Model
```prisma
model BookingRule {
  id          String         @id @default(cuid())
  mealType    MealType
  category    RecipeCategory
  minQuantity Int            @default(0)
  maxQuantity Int            @default(99)
  isRequired  Boolean        @default(false)
  isActive    Boolean        @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([mealType, category])
  @@map("booking_rules")
}
```

### 5.4 Payment Gateways

#### PaymentGatewayConfig Model
```prisma
model PaymentGatewayConfig {
  id          String         @id @default(cuid())
  gateway     PaymentGateway
  environment Environment    @default(SANDBOX)
  isActive    Boolean        @default(false)

  credentials Json // Encrypted: {keyId, apiKey, secretKey}
  settings    Json? // Gateway-specific
  webhookUrl  String?

  lastTestedAt DateTime?
  testResults  Json?
  debugMode    Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?

  @@unique([gateway, environment])
  @@map("payment_gateway_configs")
}

enum PaymentGateway {
  NEXY
  SATISPAY
  STRIPE
  TICKET_EDENRED
}

enum Environment {
  SANDBOX
  PRODUCTION
}
```

#### PaymentLog Model
```prisma
model PaymentLog {
  id           String         @id @default(cuid())
  gateway      PaymentGateway
  endpoint     String
  method       String
  requestData  Json?
  responseData Json?
  statusCode   Int?
  duration     Int? // milliseconds
  error        String? @db.Text
  createdAt    DateTime @default(now())

  @@map("payment_logs")
}
```

### 5.5 Groups & Notifications

#### Group Model
```prisma
model Group {
  id          String   @id @default(cuid())
  name        String
  description String?  @db.Text
  customerId  String? // Multi-tenant
  isActive    Boolean  @default(true)

  members GroupMember[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?

  @@map("groups")
}

model GroupMember {
  id      String @id @default(cuid())
  groupId String
  userId  String
  role    String @default("MEMBER") // ADMIN, MEMBER

  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)

  addedAt DateTime @default(now())
  addedBy String?

  @@unique([groupId, userId])
  @@map("group_members")
}
```

#### Notification Model
```prisma
model Notification {
  id      String           @id @default(cuid())
  userId  String
  type    NotificationType @default(INFO)
  title   String
  message String           @db.Text
  read    Boolean          @default(false)

  actionUrl String?
  entityId  String?
  entity    String?

  createdAt DateTime  @default(now())
  readAt    DateTime?

  @@map("notifications")
}

enum NotificationType {
  INFO
  SUCCESS
  WARNING
  ERROR
  BOOKING
  PAYMENT
  SYSTEM
}
```

### 5.6 Audit Logging

#### AuditLog Model
```prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String // "order.created", "menu.updated"
  entity    String // "Order", "Recipe"
  entityId  String?
  changes   Json? // {before: {...}, after: {...}}
  ipAddress String?
  userAgent String?  @db.Text
  createdAt DateTime @default(now())

  @@map("audit_logs")
}
```

---

## 6. API Endpoints

### 6.1 Authentication (`/api/auth/*`)

#### POST `/api/auth/signin`
**Description**: User login with credentials
**Auth Required**: No
**Request Body**:
```json
{
  "email": "admin@redbullracing.com",
  "password": "Admin123!"
}
```
**Response**:
```json
{
  "user": {
    "id": "cuid...",
    "email": "admin@redbullracing.com",
    "role": "SUPER_ADMIN",
    "firstName": "Admin",
    "lastName": "User"
  },
  "token": "jwt-token-here"
}
```
**Cookie**: `authjs.session-token` (30 days)

#### GET `/api/auth/session`
**Description**: Get current session
**Auth Required**: Yes
**Response**:
```json
{
  "user": {
    "id": "cuid...",
    "email": "admin@redbullracing.com",
    "role": "SUPER_ADMIN",
    "firstName": "Admin",
    "lastName": "User"
  },
  "expires": "2025-11-21T..."
}
```

#### POST `/api/auth/signout`
**Description**: User logout
**Auth Required**: Yes
**Response**: `{ "message": "Logged out successfully" }`

---

### 6.2 Admin Endpoints (`/api/admin/*`)

#### GET `/api/admin/users`
**Description**: List all users
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN
**Query Params**:
- `page` (default: 1)
- `limit` (default: 20)
- `role` (filter by role)
- `search` (email, name)

**Response**:
```json
{
  "users": [
    {
      "id": "cuid...",
      "email": "user@example.com",
      "role": "END_USER",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true,
      "createdAt": "2025-10-01T..."
    }
  ],
  "total": 150,
  "page": 1,
  "pages": 8
}
```

#### POST `/api/admin/users`
**Description**: Create new user
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN, CUSTOMER_ADMIN (within group)
**Request Body**:
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "role": "END_USER",
  "firstName": "Jane",
  "lastName": "Smith",
  "department": "Engineering",
  "monthlyBudget": 20000 // cents = $200
}
```
**Response**: Created user object

#### PUT `/api/admin/users/[id]`
**Description**: Update user
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN, CUSTOMER_ADMIN (own group)
**Request Body**: Partial user object
**Response**: Updated user object

#### DELETE `/api/admin/users/[id]`
**Description**: Delete user (soft delete: isActive = false)
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN
**Response**: `{ "message": "User deleted successfully" }`

#### GET `/api/admin/users/[id]/groups`
**Description**: Get user's group memberships
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN, CUSTOMER_ADMIN
**Response**: Array of groups

---

### 6.3 Kitchen Endpoints (`/api/kitchen/*`)

#### GET `/api/kitchen/recipes`
**Description**: List all recipes
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN, KITCHEN_ADMIN
**Query Params**:
- `category` (RecipeCategory)
- `isAvailable` (boolean)
- `isVegetarian` (boolean)
- `search` (name)

**Response**:
```json
{
  "recipes": [
    {
      "id": "cuid...",
      "name": "Pasta Carbonara",
      "category": "FIRST_COURSE",
      "prepTime": 10,
      "cookTime": 15,
      "allergens": ["eggs", "dairy"],
      "isAvailable": true,
      "nutritionalValues": {...}
    }
  ],
  "total": 45
}
```

#### POST `/api/kitchen/recipes`
**Description**: Create new recipe
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN, KITCHEN_ADMIN
**Request Body**:
```json
{
  "name": "Pasta Carbonara",
  "description": "Traditional Italian pasta dish",
  "category": "FIRST_COURSE",
  "ingredients": [
    {"name": "Pasta", "quantity": 100, "unit": "g", "inranCode": "001001"},
    {"name": "Eggs", "quantity": 2, "unit": "pcs"},
    {"name": "Guanciale", "quantity": 50, "unit": "g"}
  ],
  "instructions": "1. Boil pasta...",
  "prepTime": 10,
  "cookTime": 15,
  "servings": 1,
  "portionSize": 250,
  "allergens": ["eggs", "dairy"],
  "isVegetarian": false,
  "nutritionalSource": "INRAN"
}
```
**Response**: Created recipe object

#### PUT `/api/kitchen/recipes/[id]`
**Description**: Update recipe
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN, KITCHEN_ADMIN
**Request Body**: Partial recipe object
**Response**: Updated recipe object

#### DELETE `/api/kitchen/recipes/[id]`
**Description**: Delete recipe (soft delete)
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN, KITCHEN_ADMIN
**Response**: `{ "message": "Recipe deleted successfully" }`

---

#### GET `/api/kitchen/menus`
**Description**: List all menus
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN, KITCHEN_ADMIN
**Query Params**:
- `startDate` (ISO date)
- `endDate` (ISO date)
- `mealType` (MealType)
- `isActive` (boolean)

**Response**:
```json
{
  "menus": [
    {
      "id": "cuid...",
      "name": "Menu Settimanale 21-25 Ottobre",
      "startDate": "2025-10-21",
      "endDate": "2025-10-25",
      "mealType": "LUNCH",
      "menuType": "STANDARD",
      "courses": {
        "antipasto": [{"recipeId": "...", "recipeName": "Bruschetta"}],
        "primo": [{"recipeId": "...", "recipeName": "Pasta Carbonara"}]
      },
      "maxBookings": 100,
      "currentBookings": 45,
      "isActive": true
    }
  ],
  "total": 12
}
```

#### POST `/api/kitchen/menus`
**Description**: Create new menu
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN, KITCHEN_ADMIN
**Request Body**:
```json
{
  "name": "Menu Settimanale 21-25 Ottobre",
  "startDate": "2025-10-21",
  "endDate": "2025-10-25",
  "mealType": "LUNCH",
  "menuType": "STANDARD",
  "courses": {
    "antipasto": [{"recipeId": "cuid1", "recipeName": "Bruschetta", "quantity": 1}],
    "primo": [{"recipeId": "cuid2", "recipeName": "Pasta Carbonara", "quantity": 1}],
    "secondo": [{"recipeId": "cuid3", "recipeName": "Chicken Breast", "quantity": 1}],
    "contorno": [{"recipeId": "cuid4", "recipeName": "Mixed Salad", "quantity": 1}],
    "dessert": [{"recipeId": "cuid5", "recipeName": "Tiramisu", "quantity": 1}]
  },
  "maxBookings": 100,
  "targetDiners": 80
}
```
**Response**: Created menu object with auto-calculated `nutritionalSummary`

#### PUT `/api/kitchen/menus/[id]`
**Description**: Update menu
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN, KITCHEN_ADMIN
**Request Body**: Partial menu object
**Response**: Updated menu object

#### DELETE `/api/kitchen/menus/[id]`
**Description**: Delete menu (soft delete)
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN, KITCHEN_ADMIN
**Response**: `{ "message": "Menu deleted successfully" }`

---

#### GET `/api/kitchen/orders`
**Description**: List all bookings/orders
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN, KITCHEN_ADMIN
**Query Params**:
- `date` (ISO date)
- `mealType` (MealType)
- `status` (BookingStatus)

**Response**:
```json
{
  "orders": [
    {
      "id": "cuid...",
      "userId": "cuid...",
      "userName": "John Doe",
      "date": "2025-10-22",
      "mealType": "LUNCH",
      "status": "CONFIRMED",
      "totalPrice": 1200,
      "items": [
        {
          "recipeId": "cuid...",
          "recipeName": "Pasta Carbonara",
          "category": "FIRST_COURSE",
          "quantity": 1
        }
      ],
      "bookedAt": "2025-10-20T10:30:00Z"
    }
  ],
  "total": 78
}
```

#### PATCH `/api/kitchen/orders/[id]/status`
**Description**: Update order status
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN, KITCHEN_ADMIN
**Request Body**:
```json
{
  "status": "PREPARING" // CONFIRMED → PREPARING → READY → COMPLETED
}
```
**Response**: Updated booking object
**Side Effects**: Notification sent to user

---

### 6.4 Customer Admin Endpoints (`/api/customer/*`)

#### GET `/api/customer/employees`
**Description**: List employees in customer admin's group(s)
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN, CUSTOMER_ADMIN
**Query Params**:
- `groupId` (filter by specific group)
- `isActive` (boolean)
- `search` (name, email)

**Response**:
```json
{
  "employees": [
    {
      "id": "cuid...",
      "email": "employee@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "department": "Engineering",
      "monthlyBudget": 20000,
      "spentThisMonth": 15000,
      "isActive": true,
      "groups": [{"id": "grp1", "name": "Engineering Team"}]
    }
  ],
  "total": 25
}
```

#### POST `/api/customer/employees`
**Description**: Create employee (within group)
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN, CUSTOMER_ADMIN
**Request Body**: Similar to `/api/admin/users` POST
**Response**: Created user object
**Side Effects**: Automatically added to customer admin's group

#### PUT `/api/customer/employees/[id]`
**Description**: Update employee
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN, CUSTOMER_ADMIN (own group)
**Request Body**: Partial user object
**Response**: Updated user object

#### DELETE `/api/customer/employees/[id]`
**Description**: Deactivate employee
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN, CUSTOMER_ADMIN
**Response**: `{ "message": "Employee deactivated" }`

---

#### GET `/api/customer/groups`
**Description**: List groups managed by customer admin
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN, CUSTOMER_ADMIN
**Response**:
```json
{
  "groups": [
    {
      "id": "cuid...",
      "name": "Engineering Team",
      "description": "Software engineers",
      "memberCount": 25,
      "isActive": true,
      "createdAt": "2025-01-15T..."
    }
  ],
  "total": 3
}
```

#### POST `/api/customer/groups`
**Description**: Create new group
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN, CUSTOMER_ADMIN
**Request Body**:
```json
{
  "name": "Engineering Team",
  "description": "Software development department",
  "customerId": "customer-id-optional"
}
```
**Response**: Created group object

#### PUT `/api/customer/groups/[id]`
**Description**: Update group
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN, CUSTOMER_ADMIN
**Request Body**: Partial group object
**Response**: Updated group object

#### DELETE `/api/customer/groups/[id]`
**Description**: Delete group (soft delete)
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN, CUSTOMER_ADMIN
**Response**: `{ "message": "Group deleted successfully" }`

---

### 6.5 Booking Endpoints (`/api/booking/*`)

#### GET `/api/booking`
**Description**: List current user's bookings
**Auth Required**: Yes
**Roles Allowed**: All authenticated users
**Query Params**:
- `startDate` (ISO date)
- `endDate` (ISO date)
- `status` (BookingStatus)

**Response**:
```json
{
  "bookings": [
    {
      "id": "cuid...",
      "menuId": "cuid...",
      "menuName": "Menu Settimanale",
      "date": "2025-10-22",
      "mealType": "LUNCH",
      "status": "CONFIRMED",
      "totalPrice": 1200,
      "paymentStatus": "COMPLETED",
      "items": [
        {
          "recipeId": "cuid...",
          "recipeName": "Pasta Carbonara",
          "category": "FIRST_COURSE",
          "quantity": 1,
          "unitPrice": 500
        }
      ],
      "bookedAt": "2025-10-20T10:30:00Z"
    }
  ],
  "total": 12
}
```

#### POST `/api/booking`
**Description**: Create new booking
**Auth Required**: Yes
**Roles Allowed**: All authenticated users
**Request Body**:
```json
{
  "menuId": "cuid...",
  "date": "2025-10-22",
  "mealType": "LUNCH",
  "items": [
    {"recipeId": "cuid1", "quantity": 1},
    {"recipeId": "cuid2", "quantity": 1},
    {"recipeId": "cuid3", "quantity": 1}
  ],
  "paymentMethod": "BADGE",
  "notes": "No onions please"
}
```
**Response**: Created booking object
**Validation**:
- Check menu availability (date range, max bookings)
- Validate booking rules (min/max quantities per category)
- Check user budget (if applicable)
- Verify allergen compatibility with dietary restrictions
**Side Effects**:
- Decrement user `monthlyBudget`
- Increment `spentThisMonth`
- Increment menu `currentBookings`
- Create notification
- Create audit log

#### GET `/api/booking/[id]`
**Description**: Get booking details
**Auth Required**: Yes
**Roles Allowed**: Owner, SUPER_ADMIN, KITCHEN_ADMIN
**Response**: Full booking object with items

#### DELETE `/api/booking/[id]`
**Description**: Cancel booking
**Auth Required**: Yes
**Roles Allowed**: Owner, SUPER_ADMIN
**Request Body**: Optional `{ "reason": "Changed plans" }`
**Response**: `{ "message": "Booking cancelled successfully" }`
**Validation**:
- Must be at least 24 hours before meal date
- Booking must not be in PREPARING/READY/COMPLETED status
**Side Effects**:
- Update booking status to CANCELLED
- Refund user budget
- Decrement menu currentBookings
- Send notification
- Create audit log

---

#### GET `/api/booking/rules`
**Description**: Get booking rules for a meal type
**Auth Required**: Yes
**Roles Allowed**: All authenticated users
**Query Params**:
- `mealType` (required) (BREAKFAST, LUNCH, DINNER, SNACK)

**Response**:
```json
{
  "rules": [
    {
      "category": "FIRST_COURSE",
      "minQuantity": 1,
      "maxQuantity": 1,
      "isRequired": true
    },
    {
      "category": "SECOND_COURSE",
      "minQuantity": 1,
      "maxQuantity": 1,
      "isRequired": true
    },
    {
      "category": "DESSERT",
      "minQuantity": 0,
      "maxQuantity": 2,
      "isRequired": false
    }
  ]
}
```

---

### 6.6 Menu Endpoints (`/api/menu/*`)

#### GET `/api/menu/available`
**Description**: Get available menus for booking
**Auth Required**: Yes
**Roles Allowed**: All authenticated users
**Query Params**:
- `date` (ISO date, required)
- `mealType` (MealType, required)
- `menuType` (filter by menu type: STANDARD, VEGETARIAN, etc.)

**Response**:
```json
{
  "menus": [
    {
      "id": "cuid...",
      "name": "Menu Settimanale Standard",
      "startDate": "2025-10-21",
      "endDate": "2025-10-25",
      "mealType": "LUNCH",
      "menuType": "STANDARD",
      "courses": {
        "antipasto": [
          {
            "recipeId": "cuid...",
            "recipeName": "Bruschetta",
            "description": "Toasted bread with tomato",
            "allergens": ["gluten"],
            "nutritionalValues": {...},
            "imageUrl": "https://..."
          }
        ],
        "primo": [...],
        "secondo": [...],
        "contorno": [...],
        "dessert": [...]
      },
      "nutritionalSummary": {
        "energy_kcal": 850,
        "protein": 45,
        "carbohydrates": 120,
        "fats": 25
      },
      "maxBookings": 100,
      "currentBookings": 45,
      "availableSlots": 55
    }
  ]
}
```

---

### 6.7 Profile Endpoints (`/api/profile/*`)

#### GET `/api/profile`
**Description**: Get current user's profile
**Auth Required**: Yes
**Roles Allowed**: All authenticated users
**Response**:
```json
{
  "id": "cuid...",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "END_USER",
  "department": "Engineering",
  "position": "Software Engineer",
  "dietaryRestrictions": {
    "allergies": ["peanuts", "shellfish"],
    "preferences": ["vegetarian"]
  },
  "monthlyBudget": 20000,
  "spentThisMonth": 15000,
  "remainingBudget": 5000,
  "badgeCode": "RBR-12345",
  "ticketCode": "EDEN-67890",
  "lastLoginAt": "2025-10-22T08:30:00Z"
}
```

#### PUT `/api/profile`
**Description**: Update current user's profile
**Auth Required**: Yes
**Roles Allowed**: All authenticated users
**Request Body** (partial):
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "department": "Engineering",
  "position": "Senior Software Engineer",
  "dietaryRestrictions": {
    "allergies": ["peanuts"],
    "preferences": ["vegetarian"]
  }
}
```
**Response**: Updated profile object
**Restrictions**: Cannot update `role`, `monthlyBudget`, `spentThisMonth` (admin-only fields)

#### PUT `/api/profile/password`
**Description**: Change password
**Auth Required**: Yes
**Roles Allowed**: All authenticated users
**Request Body**:
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePassword123!"
}
```
**Response**: `{ "message": "Password updated successfully" }`
**Validation**:
- Current password must match
- New password must meet requirements (8+ chars, uppercase, lowercase, number, special)
- bcrypt hash with 12 rounds
**Side Effects**: Invalidate all existing sessions (force re-login)

---

### 6.8 Notifications Endpoints (`/api/notifications/*`)

#### GET `/api/notifications`
**Description**: Get current user's notifications
**Auth Required**: Yes
**Roles Allowed**: All authenticated users
**Query Params**:
- `unreadOnly` (boolean, default: false)
- `limit` (default: 20)

**Response**:
```json
{
  "notifications": [
    {
      "id": "cuid...",
      "type": "BOOKING",
      "title": "Booking Confirmed",
      "message": "Your lunch booking for Oct 22 has been confirmed.",
      "read": false,
      "actionUrl": "/booking/history/cuid...",
      "entityId": "cuid...",
      "entity": "Booking",
      "createdAt": "2025-10-20T10:30:00Z"
    }
  ],
  "total": 15,
  "unreadCount": 5
}
```

#### PATCH `/api/notifications/[id]`
**Description**: Mark notification as read
**Auth Required**: Yes
**Roles Allowed**: Owner
**Request Body**: `{ "read": true }`
**Response**: Updated notification object

#### DELETE `/api/notifications/[id]`
**Description**: Delete notification
**Auth Required**: Yes
**Roles Allowed**: Owner
**Response**: `{ "message": "Notification deleted" }`

---

### 6.9 Statistics Endpoints (`/api/stats/*`)

#### GET `/api/stats/super-admin`
**Description**: Super admin dashboard statistics
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN
**Response**:
```json
{
  "users": {
    "total": 500,
    "active": 485,
    "byRole": {
      "SUPER_ADMIN": 5,
      "KITCHEN_ADMIN": 10,
      "CUSTOMER_ADMIN": 15,
      "END_USER": 470
    }
  },
  "bookings": {
    "today": 150,
    "thisWeek": 780,
    "thisMonth": 3200,
    "totalRevenue": 3840000 // cents = $38,400
  },
  "paymentGateways": {
    "NEXY": {"transactions": 120, "successRate": 98.5},
    "SATISPAY": {"transactions": 80, "successRate": 99.2},
    "BADGE": {"transactions": 200, "successRate": 100}
  },
  "topRecipes": [
    {"id": "cuid...", "name": "Pasta Carbonara", "orders": 245},
    {"id": "cuid...", "name": "Chicken Salad", "orders": 198}
  ]
}
```

#### GET `/api/stats/kitchen`
**Description**: Kitchen dashboard statistics
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN, KITCHEN_ADMIN
**Response**:
```json
{
  "orders": {
    "today": {
      "BREAKFAST": 45,
      "LUNCH": 150,
      "DINNER": 80
    },
    "byStatus": {
      "PENDING": 10,
      "CONFIRMED": 120,
      "PREPARING": 45,
      "READY": 15,
      "COMPLETED": 85
    }
  },
  "recipes": {
    "total": 120,
    "available": 105,
    "byCategory": {
      "FIRST_COURSE": 25,
      "SECOND_COURSE": 30,
      "SIDE_DISH": 20
    }
  },
  "avgPreparationTime": 18, // minutes
  "popularRecipes": [
    {"id": "cuid...", "name": "Pasta Carbonara", "orders": 245}
  ]
}
```

#### GET `/api/stats/customer-admin`
**Description**: Customer admin dashboard statistics
**Auth Required**: Yes
**Roles Allowed**: SUPER_ADMIN, CUSTOMER_ADMIN
**Response**:
```json
{
  "employees": {
    "total": 50,
    "active": 48
  },
  "budget": {
    "allocated": 1000000, // cents = $10,000/month
    "spent": 750000,
    "remaining": 250000
  },
  "bookings": {
    "thisMonth": 320,
    "avgPerEmployee": 6.4
  },
  "topEmployees": [
    {"userId": "cuid...", "name": "John Doe", "bookings": 18, "spent": 21600}
  ]
}
```

#### GET `/api/stats/user`
**Description**: End user personal statistics
**Auth Required**: Yes
**Roles Allowed**: All authenticated users
**Response**:
```json
{
  "bookings": {
    "thisMonth": 12,
    "lastMonth": 15,
    "total": 145
  },
  "spending": {
    "thisMonth": 14400, // cents = $144
    "lastMonth": 18000,
    "avgPerBooking": 1200
  },
  "favoriteRecipes": [
    {"recipeId": "cuid...", "recipeName": "Pasta Carbonara", "timesOrdered": 8}
  ],
  "nutritionalSummary": {
    "avgCalories": 850,
    "avgProtein": 45,
    "avgCarbs": 120
  }
}
```

---

### 6.10 Health Check (`/api/health`)

#### GET `/api/health`
**Description**: System health check (for load balancers, monitoring)
**Auth Required**: No
**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-22T12:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "minio": "connected"
  },
  "version": "2.5.10"
}
```
**Error Response** (503):
```json
{
  "status": "unhealthy",
  "timestamp": "2025-10-22T12:00:00Z",
  "services": {
    "database": "disconnected",
    "redis": "connected",
    "minio": "error"
  },
  "error": "Database connection failed"
}
```

---

## 7. Environment Variables

### Required Variables

```bash
# Application
NODE_ENV=production                    # development | production | test
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Database - PostgreSQL 16
DATABASE_URL=postgresql://rbr_user:rbr_password@localhost:5434/rbr_meals
# Production: postgresql://user:pass@host:5432/dbname?schema=public&sslmode=require

# Redis - Cache & Sessions
REDIS_URL=redis://localhost:6381
# Production: redis://:password@host:6379

# NextAuth v5 (Auth.js)
# CRITICAL: Use AUTH_SECRET as primary (NextAuth v5 standard)
AUTH_SECRET=generate-with-openssl-rand-base64-32
AUTH_URL=http://localhost:3001
# Backward compatibility (optional)
NEXTAUTH_SECRET=${AUTH_SECRET}
NEXTAUTH_URL=${AUTH_URL}

# Generate secret: openssl rand -base64 32
# Example: Kv+5nV8rF2pQ9wX3yH7mA1bC4dE6fG8hI0jK2lM4nP6qR8sT0u
```

### Optional Variables

```bash
# MinIO S3 - Object Storage
MINIO_ENDPOINT=localhost
MINIO_PORT=9004
MINIO_ACCESS_KEY=rbr_admin
MINIO_SECRET_KEY=rbr_admin_2024
MINIO_BUCKET=rbr-meals
MINIO_REGION=us-east-1
MINIO_USE_SSL=false

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100           # Requests per window
RATE_LIMIT_WINDOW=60                  # Window in seconds
RATE_LIMIT_LOGIN_MAX=5                # Login attempts per minute

# Logging - Winston
LOG_LEVEL=info                        # debug | info | warn | error
LOG_FILE_PATH=./logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=7

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Feature Flags
ENABLE_AUDIT_LOGGING=true
ENABLE_RATE_LIMITING=true
ENABLE_IMAGE_UPLOAD=true
ENABLE_PAYMENT_GATEWAYS=false         # Set to true when gateways configured

# Database Connection Pool
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_POOL_TIMEOUT=20000

# Email (Future Implementation)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# SMTP_FROM=noreply@redbullracing.com

# Monitoring - Sentry (Future)
# SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
# SENTRY_ENV=production
# SENTRY_TRACES_SAMPLE_RATE=0.1

# Payment Gateways (Configured via Admin UI)
# These are stored encrypted in database, not as env vars
# NEXY_API_KEY=...
# SATISPAY_API_KEY=...
# STRIPE_SECRET_KEY=...

# Development & Debug
DEBUG_MODE=false
MOCK_DATA=false
DISABLE_AUTH=false                     # DANGER: DEV ONLY!
NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS=true
```

### Docker Compose Ports

```bash
APP_PORT=3001
POSTGRES_PORT=5434
REDIS_PORT=6381
MINIO_PORT=9004
MINIO_CONSOLE_PORT=9005
PGADMIN_PORT=8082
NGINX_PORT=8081
NGINX_SSL_PORT=8443
PORTAINER_PORT=9100
```

---

## 8. Docker Compose Services

### Service Overview (7 Containers)

```yaml
services:
  app:           # Next.js Application
  postgres:      # PostgreSQL 16 Database
  redis:         # Redis 7 Cache
  minio:         # MinIO S3 Storage
  nginx:         # Nginx Reverse Proxy
  pgadmin:       # Database Admin UI
  portainer:     # Container Management UI
```

### 8.1 App (Next.js)

```yaml
app:
  build:
    context: .
    dockerfile: Dockerfile
    target: runner
  container_name: rbr-app
  ports:
    - "3001:3000"
  environment:
    - NODE_ENV=production
    - DATABASE_URL=postgresql://rbr_user:rbr_password@postgres:5432/rbr_meals
    - REDIS_URL=redis://redis:6379
    - AUTH_SECRET=${AUTH_SECRET}
    - AUTH_URL=${AUTH_URL}
  depends_on:
    postgres: { condition: service_healthy }
    redis: { condition: service_healthy }
    minio: { condition: service_healthy }
  healthcheck:
    test: ["CMD", "wget", "--spider", "http://localhost:3000/api/health"]
    interval: 30s
    timeout: 10s
    retries: 3
  restart: unless-stopped
```

**Multi-stage Dockerfile** (optimized for production):
- Stage 1: Dependencies (npm ci)
- Stage 2: Builder (next build)
- Stage 3: Runner (standalone output, <200MB)

### 8.2 PostgreSQL 16

```yaml
postgres:
  image: postgres:16-alpine
  container_name: rbr-postgres
  environment:
    POSTGRES_USER: rbr_user
    POSTGRES_PASSWORD: rbr_password
    POSTGRES_DB: rbr_meals
  ports:
    - "5434:5432"
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
  command:
    - "postgres"
    - "-c" "max_connections=200"
    - "-c" "shared_buffers=256MB"
    - "-c" "effective_cache_size=1GB"
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U rbr_user -d rbr_meals"]
    interval: 10s
    timeout: 5s
    retries: 5
  restart: unless-stopped
```

**Performance Tuning**:
- max_connections: 200 (supports high concurrency)
- shared_buffers: 256MB (in-memory cache)
- effective_cache_size: 1GB (query planner optimization)
- Persistent volume: `rbr_postgres_data`

### 8.3 Redis 7

```yaml
redis:
  image: redis:7-alpine
  container_name: rbr-redis
  ports:
    - "6381:6379"
  volumes:
    - redis_data:/data
  command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
  restart: unless-stopped
```

**Configuration**:
- Persistence: AOF (append-only file)
- Max Memory: 256MB
- Eviction Policy: allkeys-lru (least recently used)
- Use Case: Sessions, rate limiting, caching

### 8.4 MinIO (S3 Storage)

```yaml
minio:
  image: minio/minio:latest
  container_name: rbr-minio
  ports:
    - "9004:9000"  # API
    - "9005:9001"  # Console
  environment:
    MINIO_ROOT_USER: rbr_admin
    MINIO_ROOT_PASSWORD: rbr_admin_2024
  command: server /data --console-address ":9001"
  volumes:
    - minio_data:/data
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
    interval: 30s
  restart: unless-stopped
```

**Usage**:
- Bucket: `rbr-meals`
- Recipe images, user avatars
- S3-compatible API (AWS SDK v3)
- Web Console: http://localhost:9005

### 8.5 Nginx (Reverse Proxy)

```yaml
nginx:
  image: nginx:alpine
  container_name: rbr-nginx
  ports:
    - "8081:80"
    - "8443:443"
  volumes:
    - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./docker/nginx/ssl:/etc/nginx/ssl:ro
  depends_on:
    - app
  restart: unless-stopped
```

**Configuration** (`docker/nginx/nginx.conf`):
- Reverse proxy to `app:3000`
- Gzip compression
- SSL/TLS termination (production)
- Request buffering
- Timeouts: 60s

### 8.6 pgAdmin

```yaml
pgadmin:
  image: dpage/pgadmin4:latest
  container_name: rbr-pgadmin
  environment:
    PGADMIN_DEFAULT_EMAIL: admin@redbullracing.com
    PGADMIN_DEFAULT_PASSWORD: Admin123!
  ports:
    - "8082:80"
  volumes:
    - pgadmin_data:/var/lib/pgadmin
    - ./docker/postgres/servers.json:/pgadmin4/servers.json:ro
  depends_on:
    - postgres
  restart: unless-stopped
```

**Access**:
- URL: http://localhost:8082
- Email: admin@redbullracing.com
- Password: Admin123!
- Pre-configured connection to `rbr-postgres`

### 8.7 Portainer

```yaml
portainer:
  image: portainer/portainer-ce:latest
  container_name: rbr-portainer
  ports:
    - "9100:9000"
    - "9101:9443"
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
    - portainer_data:/data
  restart: unless-stopped
```

**Access**:
- URL: http://localhost:9100
- First-time setup creates admin account
- Container management, logs, stats, exec

### Volumes (Persistent Data)

```yaml
volumes:
  postgres_data:    # Database files
  redis_data:       # Redis AOF persistence
  minio_data:       # S3 object storage
  pgadmin_data:     # pgAdmin settings
  portainer_data:   # Portainer config
```

### Network

```yaml
networks:
  rbr-network:
    driver: bridge
    name: rbr_network
```

All containers communicate via `rbr-network` bridge network.

---

## 9. Known Issues & Solutions

### 9.1 NextAuth v5 + Next.js 15 Incompatibility (RESOLVED)

**Issue**:
NextAuth v5.0.0-beta.22 is incompatible with Next.js 15.x due to breaking changes in the headers API. Login fails with error:
```
Error: Headers cannot be modified after a SET operation
```

**Root Cause**:
Next.js 15 introduced immutable headers in middleware/API routes, breaking NextAuth's cookie-setting mechanism.

**Solution**:
**Downgrade to Next.js 14.2.18 + React 18.3.1**

```json
{
  "dependencies": {
    "next": "14.2.18",       // ← Downgraded from 15.1.4
    "react": "^18.3.1",      // ← Downgraded from 19.0.0
    "react-dom": "^18.3.1",
    "next-auth": "^5.0.0-beta.22"  // ← Keep v5 beta
  }
}
```

**Steps to Apply**:
1. Update `package.json` with versions above
2. Delete `node_modules`, `package-lock.json`, `.next`
3. Run `npm install`
4. Run `npm run build`
5. Verify login works

**Status**: ✅ RESOLVED (October 22, 2025)

### 9.2 Cookie Name Discrepancy

**Issue**:
NextAuth v5 uses `authjs.session-token` cookie, NOT `next-auth.session-token` (v4 name).

**Solution**:
Update any hardcoded cookie name references:
```typescript
// Correct (v5)
const token = cookies().get('authjs.session-token');

// Incorrect (v4)
const token = cookies().get('next-auth.session-token');
```

**Environment Variables**:
Use `AUTH_SECRET` and `AUTH_URL` as primary (v5 standard):
```bash
AUTH_SECRET=your-secret-here
AUTH_URL=http://localhost:3001
# Backward compatibility (optional)
NEXTAUTH_SECRET=${AUTH_SECRET}
NEXTAUTH_URL=${AUTH_URL}
```

### 9.3 Rate Limiting Conflicts with Auth Routes

**Issue**:
Applying rate limiting middleware to `/api/auth/*` routes can interfere with NextAuth's internal redirects.

**Solution**:
Exclude NextAuth routes from rate limiting:
```typescript
// src/middleware.ts
if (path.startsWith('/api/auth/')) {
  return NextResponse.next(); // Skip rate limiting for auth routes
}
```

Or use route-specific rate limits in individual API handlers.

### 9.4 Prisma Client Generation

**Issue**:
After schema changes, TypeScript errors appear due to outdated Prisma Client.

**Solution**:
Always regenerate Prisma Client after schema changes:
```bash
npx prisma generate
# Or
npm run prisma:generate
```

Add to CI/CD pipeline:
```bash
npm ci
npx prisma generate
npm run build
```

### 9.5 Docker Compose Port Conflicts

**Issue**:
Default ports (5432, 6379, 9000) may conflict with other services.

**Solution**:
Use alternative ports in `docker-compose.yml`:
- PostgreSQL: 5434 (not 5432)
- Redis: 6381 (not 6379)
- MinIO API: 9004 (not 9000)
- MinIO Console: 9005 (not 9001)

Update `DATABASE_URL` and `REDIS_URL` accordingly.

### 9.6 CORS Issues in Development

**Issue**:
API requests from different ports (e.g., `localhost:3000` → `localhost:3001`) blocked by CORS.

**Solution**:
Configure CORS in middleware:
```typescript
// src/middleware.ts
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3001',
  'http://localhost:3000',
];
if (origin && allowedOrigins.includes(origin)) {
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
}
```

### 9.7 Session Expiry Not Updating

**Issue**:
JWT token expires but user remains logged in due to Redis session cache.

**Solution**:
Sync Redis TTL with JWT expiry:
```typescript
// In NextAuth callbacks
callbacks: {
  async session({ session, token }) {
    // Update Redis session TTL
    const redisKey = `session:${token.sessionToken}`;
    await redis.expire(redisKey, 30 * 24 * 60 * 60); // 30 days
    return session;
  }
}
```

### 9.8 Build Errors on Windows

**Issue**:
Path-related build errors on Windows due to backslash separators.

**Solution**:
Use forward slashes in Next.js config:
```javascript
// next.config.js
const path = require('path');
module.exports = {
  webpack: (config) => {
    config.resolve.alias['@'] = path.join(__dirname, 'src');
    return config;
  }
};
```

### 9.9 Playwright Tests Timeout

**Issue**:
E2E tests timeout waiting for app to start.

**Solution**:
Increase timeout and verify app health:
```typescript
// playwright.config.ts
export default defineConfig({
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    timeout: 120000, // 2 minutes
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },
});
```

---

## 10. Best Practices for Development

### 10.1 Adding New API Endpoints

1. **Create Route File**:
   ```typescript
   // src/app/api/my-endpoint/route.ts
   import { NextRequest, NextResponse } from 'next/server';
   import { getServerSession } from 'next-auth';
   import { z } from 'zod';
   import { prisma } from '@/lib/prisma';
   import { logAudit } from '@/lib/audit';

   // Input validation schema
   const schema = z.object({
     field1: z.string().min(1),
     field2: z.number().int().positive(),
   });

   export async function POST(req: NextRequest) {
     try {
       // 1. Authentication check
       const session = await getServerSession();
       if (!session) {
         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
       }

       // 2. Role authorization
       if (session.user.role !== 'SUPER_ADMIN') {
         return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
       }

       // 3. Parse and validate request body
       const body = await req.json();
       const data = schema.parse(body);

       // 4. Business logic
       const result = await prisma.myEntity.create({
         data: {
           ...data,
           createdBy: session.user.id,
         },
       });

       // 5. Audit logging
       await logAudit({
         userId: session.user.id,
         action: 'myEntity.created',
         entity: 'MyEntity',
         entityId: result.id,
         changes: { after: result },
       });

       // 6. Return response
       return NextResponse.json(result, { status: 201 });
     } catch (error) {
       // 7. Error handling
       if (error instanceof z.ZodError) {
         return NextResponse.json(
           { error: 'Validation failed', details: error.errors },
           { status: 400 }
         );
       }
       console.error('Error in POST /api/my-endpoint:', error);
       return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
       );
     }
   }
   ```

2. **Add Rate Limiting** (if needed):
   ```typescript
   import { rateLimit } from '@/lib/rate-limit';

   export async function POST(req: NextRequest) {
     const limitResult = await rateLimit(req, { max: 10, windowSec: 60 });
     if (!limitResult.success) {
       return NextResponse.json(
         { error: 'Too many requests', retryAfter: limitResult.retryAfter },
         { status: 429 }
       );
     }
     // ... rest of handler
   }
   ```

3. **Add to Middleware** (if protected):
   ```typescript
   // src/middleware.ts
   export const config = {
     matcher: [
       '/api/my-endpoint/:path*', // Add new route
       // ... existing routes
     ],
   };
   ```

### 10.2 Creating New Pages

1. **Server Component** (default, no interactivity):
   ```typescript
   // src/app/my-page/page.tsx
   import { getServerSession } from 'next-auth';
   import { redirect } from 'next/navigation';
   import { prisma } from '@/lib/prisma';

   export default async function MyPage() {
     const session = await getServerSession();
     if (!session) redirect('/login');

     // Fetch data server-side
     const data = await prisma.myEntity.findMany();

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

2. **Client Component** (interactivity, hooks):
   ```typescript
   // src/app/my-page/page.tsx
   'use client'; // Add this directive

   import { useState, useEffect } from 'react';
   import { useSession } from 'next-auth/react';

   export default function MyPage() {
     const { data: session, status } = useSession();
     const [data, setData] = useState([]);

     useEffect(() => {
       fetch('/api/my-endpoint')
         .then((res) => res.json())
         .then(setData);
     }, []);

     if (status === 'loading') return <div>Loading...</div>;
     if (!session) return <div>Unauthorized</div>;

     return <div>{/* ... */}</div>;
   }
   ```

3. **Route Protection**:
   - Middleware handles auth redirects automatically
   - For role-specific pages, add check in component:
     ```typescript
     if (session.user.role !== 'SUPER_ADMIN') {
       redirect('/unauthorized');
     }
     ```

### 10.3 Database Migrations

1. **Edit Schema**:
   ```prisma
   // prisma/schema.prisma
   model MyNewModel {
     id        String   @id @default(cuid())
     name      String
     createdAt DateTime @default(now())
     @@map("my_new_models")
   }
   ```

2. **Generate Migration**:
   ```bash
   npx prisma migrate dev --name add_my_new_model
   ```

3. **Verify in Database**:
   ```bash
   # Connect to PostgreSQL
   docker exec -it rbr-postgres psql -U rbr_user -d rbr_meals

   # Check table
   \dt
   SELECT * FROM my_new_models;
   \q
   ```

4. **Update Prisma Client**:
   ```bash
   npx prisma generate
   ```

5. **Production Deployment**:
   ```bash
   npx prisma migrate deploy
   # Or
   npm run prisma:migrate
   ```

### 10.4 Testing with Playwright

1. **Create Test File**:
   ```typescript
   // tests/my-feature.spec.ts
   import { test, expect } from '@playwright/test';

   test.describe('My Feature', () => {
     test('should perform action', async ({ page }) => {
       // 1. Navigate
       await page.goto('/my-page');

       // 2. Login (if needed)
       await page.fill('input[name="email"]', 'admin@redbullracing.com');
       await page.fill('input[name="password"]', 'Admin123!');
       await page.click('button[type="submit"]');

       // 3. Wait for navigation
       await page.waitForURL('/dashboard');

       // 4. Interact
       await page.click('button:has-text("Add Item")');
       await page.fill('input[name="name"]', 'Test Item');
       await page.click('button:has-text("Save")');

       // 5. Assert
       await expect(page.locator('text=Test Item')).toBeVisible();
     });
   });
   ```

2. **Run Tests**:
   ```bash
   npm run test:e2e
   # Or specific test
   npx playwright test tests/my-feature.spec.ts
   # With UI
   npx playwright test --ui
   ```

3. **Debug Tests**:
   ```bash
   npx playwright test --debug
   # Or with VS Code extension
   ```

### 10.5 Debugging Authentication Issues

1. **Check Cookie**:
   ```typescript
   // In API route or page
   import { cookies } from 'next/headers';
   const sessionToken = cookies().get('authjs.session-token');
   console.log('Session Token:', sessionToken);
   ```

2. **Check Redis Session**:
   ```bash
   docker exec -it rbr-redis redis-cli
   KEYS session:*
   GET session:your-session-token-here
   ```

3. **Check Database Session**:
   ```bash
   docker exec -it rbr-postgres psql -U rbr_user -d rbr_meals
   SELECT * FROM sessions WHERE "sessionToken" = 'your-token';
   ```

4. **Enable Debug Logging**:
   ```bash
   # .env.local
   LOG_LEVEL=debug
   DEBUG_MODE=true
   ```

5. **Check NextAuth Logs**:
   ```typescript
   // src/lib/auth.ts
   export const authOptions = {
     debug: process.env.NODE_ENV === 'development',
     logger: {
       error(code, metadata) {
         console.error('NextAuth Error:', code, metadata);
       },
       warn(code) {
         console.warn('NextAuth Warning:', code);
       },
     },
     // ... rest of config
   };
   ```

### 10.6 Code Quality

1. **Linting**:
   ```bash
   npm run lint
   # Auto-fix
   npm run lint -- --fix
   ```

2. **Type Checking**:
   ```bash
   npm run type-check
   ```

3. **Formatting**:
   ```bash
   npm run format
   ```

4. **Pre-commit Hook** (recommended):
   ```bash
   npm install --save-dev husky lint-staged
   npx husky install
   npx husky add .husky/pre-commit "npx lint-staged"
   ```

   ```json
   // package.json
   {
     "lint-staged": {
       "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
       "*.{json,md}": ["prettier --write"]
     }
   }
   ```

---

## 11. Testing

### 11.1 E2E Testing (Playwright)

**Configuration**: `playwright.config.ts`

**Test Structure**:
```
tests/
├── auth.spec.ts            # Login/logout flows
├── booking-wizard.spec.ts  # Meal booking
├── kitchen-admin.spec.ts   # Recipe/menu management
└── customer-admin.spec.ts  # Employee management
```

**Running Tests**:
```bash
# All tests
npm run test:e2e

# Specific test
npx playwright test tests/auth.spec.ts

# With UI (interactive)
npx playwright test --ui

# Debug mode
npx playwright test --debug

# Headed (see browser)
npx playwright test --headed

# Generate report
npx playwright show-report
```

**Test Results** (October 22, 2025):
- ✅ Login Flow (4/4 passed)
- ✅ Booking Wizard (3/3 passed)
- ✅ Recipe Management (2/2 passed)
- ✅ Session Persistence (1/1 passed)

**Total**: 10/10 tests passing

### 11.2 Unit Testing (Jest)

**Configuration**: `jest.config.js`

**Test Structure**:
```
src/lib/__tests__/
├── auth-utils.test.ts
├── prisma.test.ts
└── utils.test.ts
```

**Running Tests**:
```bash
# All unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### 11.3 API Testing (Manual)

**PowerShell Scripts**:
```powershell
# Test login
.\test-login.ps1

# Test session
.\test-session.ps1

# Full API test suite
node test-api-complete.js
```

**Tools**:
- Postman collection (export from `/docs/api/`)
- Insomnia workspace
- cURL scripts

---

## 12. Deployment

### 12.1 Docker Deployment (Recommended)

**Prerequisites**:
- Docker Engine 20+
- Docker Compose v2+
- 4GB RAM minimum
- 20GB disk space

**Steps**:

1. **Clone Repository**:
   ```bash
   git clone https://github.com/RagazzoInGamba/RBR.git
   cd RBR
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with production values
   nano .env
   ```

   **Critical Variables**:
   ```bash
   NODE_ENV=production
   DATABASE_URL=postgresql://rbr_user:rbr_password@postgres:5432/rbr_meals
   AUTH_SECRET=$(openssl rand -base64 32)
   AUTH_URL=https://your-domain.com
   ```

3. **Build and Start**:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

4. **Run Migrations**:
   ```bash
   docker-compose exec app npx prisma migrate deploy
   docker-compose exec app npm run prisma:seed
   ```

5. **Verify Deployment**:
   ```bash
   # Check container health
   docker-compose ps

   # Check logs
   docker-compose logs app

   # Test health endpoint
   curl http://localhost:3001/api/health
   ```

6. **Access Services**:
   - App: http://localhost:3001
   - pgAdmin: http://localhost:8082
   - MinIO Console: http://localhost:9005
   - Portainer: http://localhost:9100
   - Nginx: http://localhost:8081

### 12.2 Production Checklist

- [ ] Change `AUTH_SECRET` (strong random value)
- [ ] Change all default passwords (PostgreSQL, Redis, MinIO, pgAdmin)
- [ ] Enable HTTPS (Nginx SSL config)
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS for production domain
- [ ] Enable rate limiting (`ENABLE_RATE_LIMITING=true`)
- [ ] Set up database backups (cron job)
- [ ] Configure log rotation
- [ ] Set up monitoring (Sentry, DataDog, etc.)
- [ ] Disable debug mode (`DEBUG_MODE=false`)
- [ ] Remove test users (keep only production admins)
- [ ] Configure firewall rules
- [ ] Set up CDN for static assets
- [ ] Enable Redis persistence (AOF or RDB)
- [ ] Configure database connection pooling
- [ ] Set up SSL certificates (Let's Encrypt)

### 12.3 Container Restart Procedures

**Restart Single Service**:
```bash
docker-compose restart app
```

**Restart All Services**:
```bash
docker-compose restart
```

**Rebuild and Restart**:
```bash
docker-compose up -d --build app
```

**View Logs**:
```bash
docker-compose logs -f app
docker-compose logs --tail=100 postgres
```

**Stop All Services**:
```bash
docker-compose down
```

**Stop and Remove Volumes** (DANGER: Data loss):
```bash
docker-compose down -v
```

### 12.4 Database Backup & Restore

**Backup**:
```bash
# Full database dump
docker exec rbr-postgres pg_dump -U rbr_user rbr_meals > backup_$(date +%Y%m%d).sql

# Compressed backup
docker exec rbr-postgres pg_dump -U rbr_user rbr_meals | gzip > backup_$(date +%Y%m%d).sql.gz
```

**Restore**:
```bash
# From SQL file
docker exec -i rbr-postgres psql -U rbr_user rbr_meals < backup_20251022.sql

# From compressed file
gunzip -c backup_20251022.sql.gz | docker exec -i rbr-postgres psql -U rbr_user rbr_meals
```

**Automated Backup Script** (cron):
```bash
#!/bin/bash
# /opt/rbr-backup.sh
BACKUP_DIR=/backups/rbr
DATE=$(date +%Y%m%d_%H%M%S)
docker exec rbr-postgres pg_dump -U rbr_user rbr_meals | gzip > $BACKUP_DIR/rbr_$DATE.sql.gz
# Retain last 30 days
find $BACKUP_DIR -name "rbr_*.sql.gz" -mtime +30 -delete
```

Add to crontab:
```bash
0 2 * * * /opt/rbr-backup.sh # Daily at 2 AM
```

### 12.5 Monitoring & Health Checks

**Health Endpoint**: `/api/health`

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-22T12:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "minio": "connected"
  },
  "version": "2.5.10"
}
```

**Container Health**:
```bash
docker inspect rbr-app --format='{{.State.Health.Status}}'
```

**Resource Usage**:
```bash
docker stats rbr-app rbr-postgres rbr-redis
```

**Logs Monitoring**:
```bash
tail -f logs/app.log
docker-compose logs -f --tail=100
```

---

## Appendix: Quick Reference

### Default Credentials

| Service | Username | Password |
|---------|----------|----------|
| Super Admin | admin@redbullracing.com | Admin123! |
| Kitchen Admin | chef@redbullracing.com | Chef123! |
| Customer Admin | manager@redbullracing.com | Manager123! |
| End User | driver@redbullracing.com | Driver123! |
| pgAdmin | admin@redbullracing.com | Admin123! |
| MinIO | rbr_admin | rbr_admin_2024 |

### Service Ports

| Service | Port | URL |
|---------|------|-----|
| Next.js App | 3001 | http://localhost:3001 |
| PostgreSQL | 5434 | localhost:5434 |
| Redis | 6381 | localhost:6381 |
| MinIO API | 9004 | http://localhost:9004 |
| MinIO Console | 9005 | http://localhost:9005 |
| pgAdmin | 8082 | http://localhost:8082 |
| Nginx | 8081 | http://localhost:8081 |
| Portainer | 9100 | http://localhost:9100 |

### Common Commands

```bash
# Development
npm run dev
npm run build
npm run start
npm run lint
npm run type-check

# Database
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
npm run prisma:seed

# Docker
docker-compose up -d
docker-compose down
docker-compose logs -f app
docker-compose restart app
docker-compose ps

# Testing
npm run test:e2e
npx playwright test --ui
npm run test:coverage
```

### File Paths

```
C:\REDBULL_APP\
├── src\app\                 # Next.js App Router
├── src\components\          # React components
├── src\lib\                 # Utilities & config
├── prisma\                  # Database schema & migrations
├── docker\                  # Docker config files
├── tests\                   # Playwright E2E tests
├── docs\                    # Documentation
├── public\                  # Static assets
├── .env                     # Environment variables (DO NOT COMMIT)
├── docker-compose.yml       # Production stack
├── Dockerfile               # Multi-stage build
├── package.json             # Dependencies
└── tsconfig.json            # TypeScript config
```

---

**Document Version**: 1.0.0
**Last Reviewed**: October 22, 2025
**Next Review**: January 2026

For questions or support, contact: [Your Team Contact]

**Built with ❤️ for Oracle Red Bull Racing**
