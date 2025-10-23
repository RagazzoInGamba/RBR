# 🏎️ Red Bull Racing Meal Booking Platform - Complete Blueprint for Lovable

## 📋 Project Overview

**Name:** Oracle Red Bull Racing - Meal Booking Platform
**Type:** Enterprise-grade meal booking and management system
**Target Users:** F1 Racing Team (Drivers, Engineers, Kitchen Staff, Management)
**Primary Goal:** Streamline meal ordering, kitchen operations, and nutritional tracking for a professional racing team

---

## 🎨 Brand Identity & Theme

### Color Palette (Red Bull Racing Official)
```css
--rbr-red: #0600EF (Primary - Red Bull Blue)
--rbr-navy: #1E1E3F (Dark Navy)
--rbr-dark: #0A0A1F (Background Dark)
--rbr-dark-card: #151530 (Card Background)
--rbr-dark-elevated: #1F1F3F (Elevated Elements)
--rbr-accent-blue: #00D4FF (Electric Blue Accent)
--rbr-text-primary: #FFFFFF (White)
--rbr-text-secondary: #B8B8D0 (Light Gray)
--rbr-text-muted: #7878A0 (Muted)
--rbr-border: #2A2A4A (Border Color)
--rbr-success: #10B981 (Green)
--rbr-warning: #F59E0B (Orange)
--rbr-error: #EF4444 (Red)
```

### Typography
- **Headings:** Inter, weight 700-900, tight tracking
- **Body:** Inter, weight 400-600
- **Monospace:** JetBrains Mono (for codes, IDs)

### Visual Style
- **Theme:** Dark mode by default, racing-inspired
- **Borders:** 1px solid with subtle glow effects
- **Border Radius:** 8px (cards), 6px (buttons), 4px (inputs)
- **Shadows:** Subtle, multi-layer with colored glow
- **Animations:** Fast (150-250ms), easing cubic-bezier(0.4, 0, 0.2, 1)
- **Icons:** Lucide React icons throughout

---

## 🛠️ Tech Stack (EXACT VERSIONS)

### Frontend
```json
{
  "next": "14.2.18",
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "typescript": "5.7.2",
  "tailwindcss": "3.4.18",
  "@tanstack/react-query": "5.62.11",
  "zustand": "5.0.2",
  "framer-motion": "12.23.24",
  "react-hook-form": "7.65.0",
  "@hookform/resolvers": "3.10.0",
  "zod": "3.25.76",
  "date-fns": "4.1.0",
  "lucide-react": "0.468.0",
  "sonner": "2.0.7"
}
```

### Backend & Database
```json
{
  "@prisma/client": "6.2.0",
  "next-auth": "5.0.0-beta.22",
  "bcryptjs": "2.4.3",
  "ioredis": "5.4.2",
  "winston": "3.17.0"
}
```

### UI Components (shadcn/ui)
- All components from shadcn/ui library
- Custom theme configured for Red Bull Racing colors

---

## 🗄️ Database Schema (PostgreSQL + Prisma)

### User Model
```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  password          String
  firstName         String
  lastName          String
  role              UserRole  @default(END_USER)
  position          String?
  monthlyBudget     Int       @default(0) // in cents
  spentThisMonth    Int       @default(0) // in cents
  isActive          Boolean   @default(true)
  lastLoginAt       DateTime?
  customerId        String?   // Link to Customer (company)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relations
  customer          Customer? @relation(fields: [customerId], references: [id])
  bookings          Booking[]
  auditLogs         AuditLog[]
  notifications     Notification[]
  groups            GroupMembership[]
}

enum UserRole {
  SUPER_ADMIN      // Full system access
  KITCHEN_ADMIN    // Manage menus, recipes, orders
  CUSTOMER_ADMIN   // Manage employees, budgets, groups
  END_USER         // Book meals only
}
```

### Customer Model (Companies/Teams)
```prisma
model Customer {
  id                String   @id @default(cuid())
  name              String   @unique
  contactEmail      String
  contactPhone      String?
  address           String?
  isActive          Boolean  @default(true)
  monthlyBudget     Int      @default(0) // Company-wide budget in cents
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  users             User[]
  groups            Group[]
}
```

### Group Model (Teams within Customer)
```prisma
model Group {
  id                String   @id @default(cuid())
  name              String
  description       String?
  customerId        String
  monthlyBudget     Int      @default(0) // Group budget in cents
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  customer          Customer @relation(fields: [customerId], references: [id])
  members           GroupMembership[]

  @@unique([customerId, name])
}

model GroupMembership {
  id                String   @id @default(cuid())
  userId            String
  groupId           String
  joinedAt          DateTime @default(now())

  // Relations
  user              User     @relation(fields: [userId], references: [id])
  group             Group    @relation(fields: [groupId], references: [id])

  @@unique([userId, groupId])
}
```

### Menu & Recipe Models
```prisma
model Recipe {
  id                String   @id @default(cuid())
  name              String
  description       String?
  category          RecipeCategory
  ingredients       Json     // Array of {name, quantity, unit}
  instructions      String?
  prepTime          Int?     // minutes
  cookTime          Int?     // minutes
  servings          Int      @default(1)
  imageUrl          String?

  // Nutritional Data (per serving)
  calories          Float?
  protein           Float?   // grams
  carbs             Float?   // grams
  fat               Float?   // grams
  fiber             Float?   // grams

  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  menuItems         MenuItem[]
}

enum RecipeCategory {
  APPETIZER
  MAIN_COURSE
  SIDE_DISH
  DESSERT
  BEVERAGE
  SNACK
}

model Menu {
  id                String   @id @default(cuid())
  name              String
  description       String?
  date              DateTime // Date this menu is valid for
  mealType          MealType
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  items             MenuItem[]
  bookings          Booking[]

  @@unique([date, mealType])
}

enum MealType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
}

model MenuItem {
  id                String   @id @default(cuid())
  menuId            String
  recipeId          String
  price             Int      // in cents
  availableQuantity Int
  displayOrder      Int      @default(0)

  // Relations
  menu              Menu     @relation(fields: [menuId], references: [id])
  recipe            Recipe   @relation(fields: [recipeId], references: [id])
  bookingItems      BookingItem[]

  @@unique([menuId, recipeId])
}
```

### Booking & Order Models
```prisma
model Booking {
  id                String        @id @default(cuid())
  userId            String
  menuId            String
  bookingDate       DateTime      // When the meal is for
  pickupTime        DateTime?     // Preferred pickup time
  status            BookingStatus @default(PENDING)
  totalPrice        Int           // in cents
  notes             String?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  // Relations
  user              User          @relation(fields: [userId], references: [id])
  menu              Menu          @relation(fields: [menuId], references: [id])
  items             BookingItem[]
  order             Order?
}

enum BookingStatus {
  PENDING          // Just created
  CONFIRMED        // Confirmed by system
  PREPARING        // Kitchen started
  READY            // Ready for pickup
  COMPLETED        // Picked up
  CANCELLED        // Cancelled by user or admin
}

model BookingItem {
  id                String   @id @default(cuid())
  bookingId         String
  menuItemId        String
  quantity          Int
  pricePerItem      Int      // in cents (snapshot)
  notes             String?

  // Relations
  booking           Booking  @relation(fields: [bookingId], references: [id])
  menuItem          MenuItem @relation(fields: [menuItemId], references: [id])
}

model Order {
  id                String        @id @default(cuid())
  bookingId         String        @unique
  orderNumber       String        @unique
  status            OrderStatus   @default(RECEIVED)
  estimatedTime     DateTime?
  completedAt       DateTime?
  kitchenNotes      String?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  // Relations
  booking           Booking       @relation(fields: [bookingId], references: [id])
}

enum OrderStatus {
  RECEIVED         // Order received
  IN_PROGRESS      // Kitchen working on it
  READY            // Ready for pickup
  COMPLETED        // Order picked up
  CANCELLED        // Order cancelled
}
```

### Notification & Audit Models
```prisma
model Notification {
  id                String   @id @default(cuid())
  userId            String
  type              NotificationType
  title             String
  message           String
  isRead            Boolean  @default(false)
  actionUrl         String?
  createdAt         DateTime @default(now())

  // Relations
  user              User     @relation(fields: [userId], references: [id])
}

enum NotificationType {
  BOOKING_CONFIRMED
  ORDER_READY
  BUDGET_WARNING
  SYSTEM_ANNOUNCEMENT
}

model AuditLog {
  id                String   @id @default(cuid())
  userId            String?
  action            String   // e.g., "user.login", "booking.create"
  entity            String   // e.g., "User", "Booking"
  entityId          String?
  changes           Json?    // Before/after values
  ipAddress         String?
  userAgent         String?
  createdAt         DateTime @default(now())

  // Relations
  user              User?    @relation(fields: [userId], references: [id])
}
```

---

## 🔐 Authentication & Authorization (NextAuth v5)

### Auth Configuration
```typescript
// Use NextAuth v5 (Auth.js) with Credentials provider
{
  providers: [CredentialsProvider],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  callbacks: {
    jwt: // Add user.id and user.role to token
    session: // Add token.id and token.role to session
    redirect: // Role-based redirect after login
  }
}
```

### Role-Based Routing
```typescript
// After successful login, redirect based on role:
{
  SUPER_ADMIN: "/super-admin",
  KITCHEN_ADMIN: "/kitchen",
  CUSTOMER_ADMIN: "/customer-admin",
  END_USER: "/booking"
}
```

### Protected Routes (Middleware)
```typescript
// Public routes: /login, /api/health
// All other routes require authentication
// API routes check role permissions
```

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*)
- Hashed with bcrypt (12 rounds)

---

## 👥 User Roles & Permissions

### SUPER_ADMIN
**Full System Access**
- ✅ Manage all users (create, edit, delete, activate/deactivate)
- ✅ Manage customers (companies)
- ✅ View all bookings and orders
- ✅ Access audit logs
- ✅ System settings
- ✅ View all reports and analytics
- ✅ Impersonate other users (for support)

**Dashboard:** `/super-admin`
- Total users, customers, bookings (today)
- Revenue statistics
- System health metrics
- Recent activity feed

### KITCHEN_ADMIN
**Kitchen Operations**
- ✅ Manage recipes (create, edit, delete)
- ✅ Manage menus (create, edit, delete)
- ✅ View all orders
- ✅ Update order status (RECEIVED → IN_PROGRESS → READY → COMPLETED)
- ✅ View kitchen reports (popular dishes, prep times)
- ❌ Cannot manage users or customers

**Dashboard:** `/kitchen`
- Active orders (by status)
- Today's menu
- Low stock alerts
- Kitchen performance metrics

### CUSTOMER_ADMIN
**Team Management**
- ✅ Manage employees within their customer/company
- ✅ Create/edit/delete groups
- ✅ Assign employees to groups
- ✅ Set and manage budgets (user-level, group-level)
- ✅ View team's bookings and orders
- ✅ View team reports (spending, popular items)
- ❌ Cannot see other customers' data
- ❌ Cannot manage recipes or menus

**Dashboard:** `/customer-admin`
- Team members count
- Budget utilization (current month)
- Top bookers
- Spending trends

### END_USER
**Meal Booking**
- ✅ View available menus
- ✅ Create bookings
- ✅ View own booking history
- ✅ Cancel bookings (if not yet preparing)
- ✅ View own notifications
- ✅ Update profile
- ❌ Cannot see other users' data
- ❌ Cannot manage anything

**Dashboard:** `/booking`
- Today's menus
- Upcoming bookings
- Recent orders
- Budget remaining (if applicable)

---

## 🎯 Core Features (Detailed Specifications)

### 1. Authentication System

#### Login Page (`/login`)
**UI Components:**
- Full-screen layout with Red Bull Racing branding
- Login form card (centered, max-width 400px)
- Email input (type="email", autocomplete="email")
- Password input with show/hide toggle
- Submit button with loading state
- Demo credentials display (for testing)

**Validation:**
```typescript
{
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters")
}
```

**Flow:**
1. User enters email + password
2. Client validates with Zod
3. Submit to NextAuth signIn()
4. If success → redirect to `/auth/success` → role-based redirect
5. If fail → show error message below form

**Error Messages:**
- "Invalid email or password" (generic for security)
- "Account is disabled. Contact administrator."
- "Too many login attempts. Try again in 5 minutes." (rate limiting)

---

### 2. SUPER_ADMIN Features

#### User Management (`/super-admin/users`)

**Page Layout:**
- Page header with "Users" title + "Add User" button
- Search bar (search by name, email, role)
- Filters: Role dropdown, Status (Active/Inactive), Customer dropdown
- Data table with columns:
  - Avatar (first letter of name)
  - Name (firstName + lastName)
  - Email
  - Role (badge with color)
  - Customer (link)
  - Status (Active/Inactive toggle)
  - Monthly Budget (formatted currency)
  - Last Login (relative time)
  - Actions (Edit, Delete)

**Add/Edit User Dialog:**
```typescript
Form Fields:
- firstName: string (required, 2-50 chars)
- lastName: string (required, 2-50 chars)
- email: string (required, valid email, unique)
- password: string (required on create, optional on edit, min 8 chars)
- role: UserRole (required, dropdown)
- customerId: string (required if not SUPER_ADMIN, dropdown)
- position: string (optional, 2-100 chars)
- monthlyBudget: number (optional, min 0, in euros, converts to cents)
- isActive: boolean (default true, checkbox)

Buttons:
- Cancel (ghost variant)
- Save (primary variant, loading state)
```

**User Actions:**
- **Create User:** POST `/api/admin/users` with form data
- **Edit User:** PUT `/api/admin/users/[id]` with updated data
- **Delete User:** DELETE `/api/admin/users/[id]` (with confirmation dialog)
- **Toggle Active:** PATCH `/api/admin/users/[id]` with {isActive}

**Validation Rules:**
- Email must be unique
- Cannot delete user with active bookings
- Cannot deactivate SUPER_ADMIN if only one exists
- Password hash with bcryptjs before saving

---

### 3. KITCHEN_ADMIN Features

#### Recipe Management (`/kitchen/recipes`)

**Page Layout:**
- Grid view of recipe cards (3 columns on desktop, 1 on mobile)
- Each card shows:
  - Recipe image (placeholder if none)
  - Name
  - Category badge
  - Prep time + Cook time
  - Calories per serving
  - Quick actions (Edit, Delete)
- "Add Recipe" floating action button (bottom-right)

**Recipe Card Component:**
```typescript
<Card className="hover:shadow-lg transition">
  <CardHeader>
    <img src={recipe.imageUrl || '/placeholder-food.jpg'} alt={recipe.name} className="w-full h-48 object-cover rounded-t" />
  </CardHeader>
  <CardContent>
    <h3 className="font-bold text-lg">{recipe.name}</h3>
    <Badge>{recipe.category}</Badge>
    <div className="flex gap-2 text-sm text-muted">
      <span>⏱️ {recipe.prepTime + recipe.cookTime} min</span>
      <span>🔥 {recipe.calories} cal</span>
    </div>
    <p className="text-sm mt-2">{recipe.description}</p>
  </CardContent>
  <CardFooter>
    <Button variant="ghost" onClick={handleEdit}>Edit</Button>
    <Button variant="ghost" onClick={handleDelete}>Delete</Button>
  </CardFooter>
</Card>
```

**Add/Edit Recipe Dialog (Multi-step Form):**

**Step 1: Basic Info**
```typescript
{
  name: string (required, 3-100 chars),
  description: string (optional, max 500 chars),
  category: RecipeCategory (required, dropdown),
  imageUrl: string (optional, valid URL or upload)
}
```

**Step 2: Ingredients**
```typescript
Ingredients: Array<{
  name: string (required),
  quantity: number (required, min 0),
  unit: string (required, e.g., "g", "ml", "cups")
}>
// Dynamic form: Add/Remove ingredient rows
// Buttons: + Add Ingredient, Remove
```

**Step 3: Instructions & Times**
```typescript
{
  instructions: string (optional, textarea, max 2000 chars),
  prepTime: number (optional, in minutes),
  cookTime: number (optional, in minutes),
  servings: number (required, min 1, default 1)
}
```

**Step 4: Nutritional Data (Optional)**
```typescript
{
  calories: number (optional, per serving),
  protein: number (optional, grams),
  carbs: number (optional, grams),
  fat: number (optional, grams),
  fiber: number (optional, grams)
}
// Show visual chart preview
```

**Form Navigation:**
- Back / Next buttons
- Progress indicator (Step 1 of 4)
- Can skip optional steps
- Final step: Review + Submit

**API Calls:**
- **Create:** POST `/api/kitchen/recipes`
- **Update:** PUT `/api/kitchen/recipes/[id]`
- **Delete:** DELETE `/api/kitchen/recipes/[id]` (check if used in active menus)

---

#### Menu Management (`/kitchen/menus`)

**Page Layout:**
- Calendar view showing menus by date
- Filter by meal type (Breakfast, Lunch, Dinner)
- "Create Menu" button
- Upcoming menus list

**Create Menu Wizard:**

**Step 1: Menu Details**
```typescript
{
  name: string (required, e.g., "Monday Lunch"),
  description: string (optional),
  date: Date (required, date picker, cannot be in past),
  mealType: MealType (required, dropdown)
}
// Check uniqueness: No duplicate menu for same date+mealType
```

**Step 2: Add Menu Items (Drag & Drop)**
```typescript
// Left panel: Available recipes (searchable, filterable by category)
// Right panel: Selected items for this menu

MenuItem Structure:
{
  recipeId: string (from drag & drop),
  price: number (required, in euros, converts to cents),
  availableQuantity: number (required, min 1),
  displayOrder: number (auto-assigned by drag position)
}

// Each item shows:
// - Recipe name
// - Category badge
// - Price input
// - Quantity input
// - Remove button
// - Drag handle (reorder)
```

**Step 3: Review & Publish**
```typescript
// Show complete menu summary
// Total items
// Date range
// Estimated revenue
// Buttons: Save as Draft, Publish
```

**API Calls:**
- **Create Menu:** POST `/api/kitchen/menus`
- **Update Menu:** PUT `/api/kitchen/menus/[id]`
- **Delete Menu:** DELETE `/api/kitchen/menus/[id]` (only if no bookings)
- **Activate/Deactivate:** PATCH `/api/kitchen/menus/[id]`

---

#### Order Management (`/kitchen/orders`)

**Page Layout:**
- Kanban board with 4 columns:
  1. RECEIVED (new orders)
  2. IN_PROGRESS (being prepared)
  3. READY (ready for pickup)
  4. COMPLETED (picked up)

**Order Card (Draggable):**
```typescript
<Card className="draggable-card">
  <CardHeader>
    <div className="flex justify-between">
      <span className="font-bold">#{order.orderNumber}</span>
      <Badge>{order.booking.user.firstName}</Badge>
    </div>
    <span className="text-sm text-muted">{format(order.createdAt, 'HH:mm')}</span>
  </CardHeader>
  <CardContent>
    {order.booking.items.map(item => (
      <div key={item.id} className="flex justify-between text-sm">
        <span>{item.quantity}x {item.menuItem.recipe.name}</span>
        <span>{formatCurrency(item.pricePerItem * item.quantity)}</span>
      </div>
    ))}
    {order.booking.notes && (
      <Alert className="mt-2">
        <AlertDescription>{order.booking.notes}</AlertDescription>
      </Alert>
    )}
  </CardContent>
  <CardFooter>
    <Button onClick={handleStatusChange}>Move to Next Stage</Button>
  </CardFooter>
</Card>
```

**Order Status Flow:**
1. **RECEIVED** (auto-created when booking confirmed)
   - Action: Start Preparation → IN_PROGRESS
   - Kitchen gets notification

2. **IN_PROGRESS** (kitchen is working)
   - Action: Mark as Ready → READY
   - User gets notification "Your order is ready!"

3. **READY** (ready for pickup)
   - Action: Mark as Completed → COMPLETED
   - Triggers booking status = COMPLETED

4. **COMPLETED** (order fulfilled)
   - No further actions
   - Archived after 24h

**Drag & Drop Behavior:**
- Drag order card between columns
- On drop → Auto-update order status via API
- Show loading state on card during update
- If error → revert to original column + show error toast

**API Calls:**
- **Get Orders:** GET `/api/kitchen/orders?status=RECEIVED,IN_PROGRESS,READY`
- **Update Status:** PATCH `/api/kitchen/orders/[id]/status` with {status}

---

### 4. CUSTOMER_ADMIN Features

#### Employee Management (`/customer-admin/employees`)

**Page Layout:**
- Similar to Super Admin users, but filtered by customerId
- Data table with columns:
  - Name
  - Email
  - Position
  - Groups (badges, max 3 shown + "+N more")
  - Monthly Budget
  - Spent This Month (progress bar)
  - Status
  - Actions

**Add/Edit Employee Dialog:**
```typescript
Form Fields (subset of User):
- firstName: string (required)
- lastName: string (required)
- email: string (required, unique)
- password: string (required on create)
- position: string (optional)
- monthlyBudget: number (optional)
- groups: string[] (multi-select, from customer's groups)
- isActive: boolean (default true)

// Note: role is auto-set to END_USER
// Note: customerId is auto-set to current admin's customerId
```

**Bulk Actions:**
- Select multiple employees (checkbox)
- Bulk assign to group
- Bulk set budget
- Bulk activate/deactivate

**API Calls:**
- **Get Employees:** GET `/api/customer/employees` (auto-filtered by session.user.customerId)
- **Create:** POST `/api/customer/employees`
- **Update:** PUT `/api/customer/employees/[id]`
- **Delete:** DELETE `/api/customer/employees/[id]`

---

#### Group Management (`/customer-admin/groups`)

**Page Layout:**
- List of groups with cards
- Each card shows:
  - Group name
  - Description
  - Member count
  - Monthly budget
  - Budget utilization (progress bar)
  - Actions (Edit, Delete, View Members)

**Group Card:**
```typescript
<Card>
  <CardHeader>
    <div className="flex justify-between">
      <h3 className="font-bold">{group.name}</h3>
      <Badge>{group.members.length} members</Badge>
    </div>
    <p className="text-sm text-muted">{group.description}</p>
  </CardHeader>
  <CardContent>
    <div>
      <span className="text-sm">Budget: {formatCurrency(group.monthlyBudget)}</span>
      <Progress value={budgetUtilization} className="mt-2" />
    </div>
  </CardContent>
  <CardFooter>
    <Button variant="outline" onClick={handleViewMembers}>View Members</Button>
    <Button variant="ghost" onClick={handleEdit}>Edit</Button>
    <Button variant="ghost" onClick={handleDelete}>Delete</Button>
  </CardFooter>
</Card>
```

**Add/Edit Group Dialog:**
```typescript
{
  name: string (required, unique within customer),
  description: string (optional, max 300 chars),
  monthlyBudget: number (optional, in euros),
  members: string[] (multi-select users from customer)
}
```

**View Members Dialog:**
- Searchable list of members
- Add/Remove members
- Each member shows:
  - Name
  - Email
  - Position
  - Remove button

**API Calls:**
- **Get Groups:** GET `/api/customer/groups`
- **Create:** POST `/api/customer/groups`
- **Update:** PUT `/api/customer/groups/[id]`
- **Delete:** DELETE `/api/customer/groups/[id]`
- **Add Member:** POST `/api/customer/groups/[id]/members` with {userId}
- **Remove Member:** DELETE `/api/customer/groups/[id]/members/[userId]`

---

### 5. END_USER Features

#### Meal Booking (`/booking`)

**Dashboard View:**
- Today's date prominently displayed
- Available menus for today (tabs: Breakfast, Lunch, Dinner)
- "My Bookings" section showing upcoming bookings
- Budget widget (if user has budget limit)

**Available Menus Section:**
```typescript
<Tabs defaultValue="lunch">
  <TabsList>
    <TabsTrigger value="breakfast">Breakfast</TabsTrigger>
    <TabsTrigger value="lunch">Lunch</TabsTrigger>
    <TabsTrigger value="dinner">Dinner</TabsTrigger>
  </TabsList>

  <TabsContent value="lunch">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {menuItems.map(item => (
        <MenuItemCard key={item.id} item={item} onAddToCart={handleAddToCart} />
      ))}
    </div>
  </TabsContent>
</Tabs>
```

**Menu Item Card (Selectable):**
```typescript
<Card className="hover:shadow-lg transition cursor-pointer" onClick={handleAddToCart}>
  <CardHeader>
    <img src={item.recipe.imageUrl} alt={item.recipe.name} className="w-full h-40 object-cover rounded" />
    {item.availableQuantity < 5 && (
      <Badge variant="destructive" className="absolute top-2 right-2">
        Only {item.availableQuantity} left!
      </Badge>
    )}
  </CardHeader>
  <CardContent>
    <h4 className="font-bold">{item.recipe.name}</h4>
    <p className="text-sm text-muted">{item.recipe.description}</p>
    <div className="flex justify-between items-center mt-2">
      <span className="text-lg font-bold">{formatCurrency(item.price)}</span>
      <Badge>{item.recipe.category}</Badge>
    </div>
    <div className="flex gap-2 text-xs text-muted mt-1">
      <span>🔥 {item.recipe.calories} cal</span>
      <span>⏱️ {item.recipe.prepTime + item.recipe.cookTime} min</span>
    </div>
  </CardContent>
  <CardFooter>
    <Button className="w-full" disabled={item.availableQuantity === 0}>
      {item.availableQuantity === 0 ? 'Sold Out' : 'Add to Cart'}
    </Button>
  </CardFooter>
</Card>
```

**Shopping Cart (Side Panel):**
```typescript
<Sheet>
  <SheetTrigger asChild>
    <Button className="fixed bottom-4 right-4 rounded-full h-16 w-16">
      🛒 <Badge className="absolute -top-2 -right-2">{cartItemCount}</Badge>
    </Button>
  </SheetTrigger>
  <SheetContent side="right" className="w-96">
    <SheetHeader>
      <SheetTitle>Your Cart</SheetTitle>
    </SheetHeader>
    <div className="flex flex-col gap-4 mt-4">
      {cartItems.map(item => (
        <div key={item.menuItemId} className="flex justify-between items-center">
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted">{formatCurrency(item.pricePerItem)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" onClick={() => decreaseQuantity(item.menuItemId)}>-</Button>
            <span className="w-8 text-center">{item.quantity}</span>
            <Button size="icon" variant="outline" onClick={() => increaseQuantity(item.menuItemId)}>+</Button>
            <Button size="icon" variant="ghost" onClick={() => removeItem(item.menuItemId)}>🗑️</Button>
          </div>
        </div>
      ))}
    </div>
    <Separator className="my-4" />
    <div className="flex justify-between font-bold text-lg">
      <span>Total:</span>
      <span>{formatCurrency(totalPrice)}</span>
    </div>
    {userBudgetExceeded && (
      <Alert variant="destructive" className="mt-2">
        <AlertDescription>
          This order exceeds your monthly budget limit.
        </AlertDescription>
      </Alert>
    )}
    <Button className="w-full mt-4" onClick={handleCheckout} disabled={userBudgetExceeded || cartItems.length === 0}>
      Checkout
    </Button>
  </SheetContent>
</Sheet>
```

**Checkout Dialog:**
```typescript
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Your Booking</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <div>
        <Label>Pickup Time (Optional)</Label>
        <Input type="time" value={pickupTime} onChange={setPickupTime} />
      </div>
      <div>
        <Label>Special Notes (Optional)</Label>
        <Textarea placeholder="Allergies, preferences, etc." value={notes} onChange={setNotes} maxLength={500} />
      </div>
      <div className="bg-muted p-4 rounded">
        <h4 className="font-bold mb-2">Order Summary</h4>
        {cartItems.map(item => (
          <div key={item.menuItemId} className="flex justify-between text-sm">
            <span>{item.quantity}x {item.name}</span>
            <span>{formatCurrency(item.pricePerItem * item.quantity)}</span>
          </div>
        ))}
        <Separator className="my-2" />
        <div className="flex justify-between font-bold">
          <span>Total:</span>
          <span>{formatCurrency(totalPrice)}</span>
        </div>
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={handleCancel}>Cancel</Button>
      <Button onClick={handleConfirmBooking} disabled={isSubmitting}>
        {isSubmitting ? 'Processing...' : 'Confirm Booking'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Booking Confirmation Flow:**
1. User clicks "Confirm Booking"
2. Validate:
   - Cart not empty
   - Items still available
   - Budget not exceeded (if applicable)
3. Create booking + booking items via API
4. Clear cart
5. Show success toast with order number
6. Navigate to booking details page
7. Send notification to kitchen

**API Calls:**
- **Get Available Menus:** GET `/api/menu/available?date=2024-01-20&mealType=LUNCH`
- **Create Booking:** POST `/api/booking` with {menuId, items: [{menuItemId, quantity, notes}], pickupTime?, notes?}
- **Get My Bookings:** GET `/api/booking?userId=current`

---

#### Booking History (`/booking/orders`)

**Page Layout:**
- List of bookings, grouped by status
- Tabs: All, Upcoming, Past, Cancelled
- Each booking card shows:
  - Booking date
  - Meal type badge
  - Status badge (color-coded)
  - Items list
  - Total price
  - Actions (View Details, Cancel)

**Booking Card:**
```typescript
<Card>
  <CardHeader>
    <div className="flex justify-between">
      <div>
        <p className="font-bold">{format(booking.bookingDate, 'EEEE, MMMM d')}</p>
        <Badge>{booking.menu.mealType}</Badge>
      </div>
      <Badge variant={statusVariant[booking.status]}>{booking.status}</Badge>
    </div>
  </CardHeader>
  <CardContent>
    {booking.items.map(item => (
      <div key={item.id} className="flex justify-between text-sm">
        <span>{item.quantity}x {item.menuItem.recipe.name}</span>
        <span>{formatCurrency(item.pricePerItem * item.quantity)}</span>
      </div>
    ))}
    <Separator className="my-2" />
    <div className="flex justify-between font-bold">
      <span>Total:</span>
      <span>{formatCurrency(booking.totalPrice)}</span>
    </div>
    {booking.notes && (
      <Alert className="mt-2">
        <AlertDescription>{booking.notes}</AlertDescription>
      </Alert>
    )}
  </CardContent>
  <CardFooter>
    <Button variant="outline" onClick={handleViewDetails}>Details</Button>
    {booking.status === 'PENDING' && (
      <Button variant="destructive" onClick={handleCancel}>Cancel</Button>
    )}
  </CardFooter>
</Card>
```

**Cancel Booking Flow:**
1. Show confirmation dialog
2. If confirmed → PATCH `/api/booking/[id]` with {status: 'CANCELLED'}
3. Update UI optimistically
4. Show success toast
5. Send notification to kitchen

---

#### Notifications (`/booking/notifications`)

**Page Layout:**
- List of notifications, newest first
- Mark as read on click
- Clear all button
- Grouped by date (Today, Yesterday, This Week, Older)

**Notification Item:**
```typescript
<div className={`p-4 rounded border ${notification.isRead ? 'bg-background' : 'bg-accent/10'} cursor-pointer`} onClick={handleMarkRead}>
  <div className="flex justify-between items-start">
    <div className="flex gap-3">
      {notificationIcon[notification.type]}
      <div>
        <p className="font-bold">{notification.title}</p>
        <p className="text-sm text-muted">{notification.message}</p>
        <p className="text-xs text-muted mt-1">{formatRelativeTime(notification.createdAt)}</p>
      </div>
    </div>
    {!notification.isRead && <div className="w-2 h-2 bg-primary rounded-full" />}
  </div>
  {notification.actionUrl && (
    <Button variant="link" className="mt-2" onClick={() => navigate(notification.actionUrl)}>
      View Details →
    </Button>
  )}
</div>
```

**Notification Types & Icons:**
- BOOKING_CONFIRMED: ✅ "Your booking has been confirmed"
- ORDER_READY: 🍽️ "Your order is ready for pickup!"
- BUDGET_WARNING: ⚠️ "You've used 80% of your monthly budget"
- SYSTEM_ANNOUNCEMENT: 📢 "New menu available for next week"

**Real-time Updates:**
- Use React Query with refetch interval (30s)
- Or implement WebSocket for instant notifications

---

### 6. Profile Management (All Roles)

#### Profile Page (`/profile`)

**Layout:**
- User avatar (letter circle)
- Personal information section
- Security section (change password)
- Preferences section

**Personal Information Form:**
```typescript
{
  firstName: string (required),
  lastName: string (required),
  email: string (disabled, cannot change),
  position: string (optional, only if not SUPER_ADMIN)
}
// Save button at bottom
```

**Change Password Section:**
```typescript
<Form>
  <FormField name="currentPassword">
    <Input type="password" placeholder="Current password" />
  </FormField>
  <FormField name="newPassword">
    <Input type="password" placeholder="New password (min 8 chars)" />
  </FormField>
  <FormField name="confirmPassword">
    <Input type="password" placeholder="Confirm new password" />
  </FormField>
  <Button type="submit">Change Password</Button>
</Form>

// Validation:
// - currentPassword must match DB
// - newPassword must meet requirements
// - newPassword === confirmPassword
// - newPassword !== currentPassword
```

**API Calls:**
- **Get Profile:** GET `/api/profile`
- **Update Profile:** PUT `/api/profile` with {firstName, lastName, position?}
- **Change Password:** POST `/api/profile/password` with {currentPassword, newPassword}

---

## 🎨 UI/UX Guidelines

### Component Library (shadcn/ui)
Install ALL these components:
```bash
npx shadcn-ui@latest add button card input label form select textarea dialog sheet alert badge progress tabs accordion separator avatar dropdown-menu command popover calendar table toast
```

### Custom Components to Create

#### 1. EmptyState
```typescript
// Show when no data available
<EmptyState
  icon={<PackageOpen className="h-16 w-16" />}
  title="No bookings yet"
  description="Start by browsing today's menu and placing your first order."
  action={<Button onClick={goToBooking}>Browse Menu</Button>}
/>
```

#### 2. LoadingSpinner
```typescript
// Full-page or inline loading
<LoadingSpinner size="lg" text="Loading bookings..." />
```

#### 3. PageHeader
```typescript
// Consistent page headers
<PageHeader
  title="Recipes"
  description="Manage your kitchen recipes"
  action={<Button onClick={handleAdd}>Add Recipe</Button>}
/>
```

#### 4. StatsCard
```typescript
// Dashboard stat cards
<StatsCard
  title="Total Bookings"
  value="127"
  change="+12%"
  trend="up"
  icon={<Calendar />}
/>
```

#### 5. DataTable
```typescript
// Reusable data table with sorting, filtering, pagination
<DataTable
  columns={userColumns}
  data={users}
  searchKey="name"
  searchPlaceholder="Search users..."
/>
```

### Animation Patterns

**Page Transitions:**
```typescript
// Use framer-motion for page entry
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {children}
</motion.div>
```

**Card Hover:**
```typescript
// Subtle scale on hover
<motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
  <Card>...</Card>
</motion.div>
```

**Button Loading:**
```typescript
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? 'Saving...' : 'Save'}
</Button>
```

### Responsive Design

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile Considerations:**
- Navigation: Hamburger menu (Sheet component)
- Data tables: Horizontal scroll or card view
- Forms: Full-width inputs
- Floating action buttons for primary actions

---

## 🔄 State Management

### React Query (TanStack Query)
```typescript
// Use for all server state
const { data, isLoading, error } = useQuery({
  queryKey: ['bookings', userId],
  queryFn: () => fetchBookings(userId),
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: true
})

// Mutations with optimistic updates
const mutation = useMutation({
  mutationFn: createBooking,
  onMutate: async (newBooking) => {
    // Optimistically update cache
    await queryClient.cancelQueries(['bookings'])
    const previous = queryClient.getQueryData(['bookings'])
    queryClient.setQueryData(['bookings'], old => [...old, newBooking])
    return { previous }
  },
  onError: (err, newBooking, context) => {
    // Rollback on error
    queryClient.setQueryData(['bookings'], context.previous)
  },
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries(['bookings'])
  }
})
```

### Zustand (Client State)
```typescript
// Cart store
const useCartStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
  clearCart: () => set({ items: [] }),
  totalPrice: () => state.items.reduce((sum, item) => sum + item.pricePerItem * item.quantity, 0)
}))

// Theme store
const useThemeStore = create((set) => ({
  theme: 'dark',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' }))
}))
```

---

## 📡 API Routes (Complete Specification)

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth handlers

### Admin (SUPER_ADMIN only)
- `GET /api/admin/users` - List all users (with filters)
- `POST /api/admin/users` - Create user
- `GET /api/admin/users/[id]` - Get user details
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user
- `GET /api/admin/users/[id]/groups` - Get user's groups
- `POST /api/admin/users/[id]/groups` - Add user to group

### Kitchen (KITCHEN_ADMIN only)
- `GET /api/kitchen/recipes` - List recipes
- `POST /api/kitchen/recipes` - Create recipe
- `GET /api/kitchen/recipes/[id]` - Get recipe
- `PUT /api/kitchen/recipes/[id]` - Update recipe
- `DELETE /api/kitchen/recipes/[id]` - Delete recipe
- `GET /api/kitchen/menus` - List menus (with filters)
- `POST /api/kitchen/menus` - Create menu
- `GET /api/kitchen/menus/[id]` - Get menu
- `PUT /api/kitchen/menus/[id]` - Update menu
- `DELETE /api/kitchen/menus/[id]` - Delete menu
- `GET /api/kitchen/orders` - List orders (with status filter)
- `PATCH /api/kitchen/orders/[id]/status` - Update order status

### Customer Admin (CUSTOMER_ADMIN only)
- `GET /api/customer/employees` - List employees (filtered by customerId)
- `POST /api/customer/employees` - Create employee
- `GET /api/customer/employees/[id]` - Get employee
- `PUT /api/customer/employees/[id]` - Update employee
- `DELETE /api/customer/employees/[id]` - Delete employee
- `GET /api/customer/groups` - List groups
- `POST /api/customer/groups` - Create group
- `GET /api/customer/groups/[id]` - Get group
- `PUT /api/customer/groups/[id]` - Update group
- `DELETE /api/customer/groups/[id]` - Delete group
- `POST /api/customer/groups/[id]/members` - Add member to group
- `DELETE /api/customer/groups/[id]/members/[userId]` - Remove member

### End User (END_USER + all roles)
- `GET /api/menu/available` - Get available menus (public)
- `GET /api/booking` - List user's bookings
- `POST /api/booking` - Create booking
- `GET /api/booking/[id]` - Get booking details
- `PATCH /api/booking/[id]` - Update booking (cancel)
- `GET /api/notifications` - List user's notifications
- `PATCH /api/notifications/[id]` - Mark notification as read
- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update profile
- `POST /api/profile/password` - Change password

### Statistics (Role-specific)
- `GET /api/stats/super-admin` - System-wide stats
- `GET /api/stats/kitchen` - Kitchen stats
- `GET /api/stats/customer-admin` - Customer/team stats
- `GET /api/stats/user` - User personal stats

### Health Check
- `GET /api/health` - Health check (public)

---

## ✅ Validation Rules (Comprehensive)

### User Validation
```typescript
const userSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  role: z.enum(['SUPER_ADMIN', 'KITCHEN_ADMIN', 'CUSTOMER_ADMIN', 'END_USER']),
  customerId: z.string().cuid().optional(),
  position: z.string().min(2).max(100).optional(),
  monthlyBudget: z.number().min(0).optional(),
  isActive: z.boolean().default(true)
})
```

### Recipe Validation
```typescript
const recipeSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  category: z.enum(['APPETIZER', 'MAIN_COURSE', 'SIDE_DISH', 'DESSERT', 'BEVERAGE', 'SNACK']),
  ingredients: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number().min(0),
    unit: z.string().min(1)
  })),
  instructions: z.string().max(2000).optional(),
  prepTime: z.number().min(0).optional(),
  cookTime: z.number().min(0).optional(),
  servings: z.number().min(1).default(1),
  calories: z.number().min(0).optional(),
  protein: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  fiber: z.number().min(0).optional(),
  imageUrl: z.string().url().optional()
})
```

### Booking Validation
```typescript
const bookingSchema = z.object({
  menuId: z.string().cuid(),
  items: z.array(z.object({
    menuItemId: z.string().cuid(),
    quantity: z.number().min(1).max(10),
    notes: z.string().max(200).optional()
  })).min(1),
  pickupTime: z.date().optional(),
  notes: z.string().max(500).optional()
}).refine(data => {
  // Validate booking date is not in the past
  // Validate items are available
  // Validate user budget
})
```

---

## 🚨 Error Handling

### API Error Responses
```typescript
// Standard error format
{
  error: {
    code: string, // e.g., 'VALIDATION_ERROR', 'UNAUTHORIZED', 'NOT_FOUND'
    message: string, // User-friendly message
    details?: any // Additional context (dev only)
  }
}

// HTTP Status Codes:
// 400 - Bad Request (validation errors)
// 401 - Unauthorized (not logged in)
// 403 - Forbidden (insufficient permissions)
// 404 - Not Found
// 409 - Conflict (e.g., duplicate email)
// 500 - Internal Server Error
```

### Frontend Error Handling
```typescript
// Use react-query error handling + toast notifications
const { data, error } = useQuery(...)

useEffect(() => {
  if (error) {
    toast.error(error.message || 'Something went wrong')
  }
}, [error])

// Global error boundary for unexpected errors
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

---

## 📊 Testing Requirements

### E2E Tests (Playwright)
```typescript
// Priority test scenarios:
1. Login flow (all roles)
2. Create booking (end user)
3. Update order status (kitchen)
4. Manage users (super admin)
5. Budget enforcement (customer admin)
```

### Unit Tests (Jest)
```typescript
// Test utilities and business logic
- Validation schemas
- Date formatting
- Currency formatting
- Budget calculations
- Permission checks
```

---

## 🚀 Deployment Configuration

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Authentication
AUTH_SECRET="random-64-char-hex-string"
AUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="random-64-char-hex-string" # Backward compatibility
NEXTAUTH_URL="https://your-domain.com"

# Redis
REDIS_URL="redis://host:6379"

# MinIO/S3
MINIO_ENDPOINT="minio:9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="meal-images"

# General
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### Docker Compose
```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL
      - AUTH_SECRET
      - REDIS_URL
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: rbr_user
      POSTGRES_PASSWORD: rbr_password
      POSTGRES_DB: rbr_meals
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
```

---

## 📝 Implementation Checklist

### Phase 1: Setup & Authentication ✅
- [x] Next.js 14 project setup
- [x] Prisma schema
- [x] NextAuth v5 configuration
- [x] Login page
- [x] Role-based middleware
- [x] Session management

### Phase 2: Super Admin Features
- [ ] User management CRUD
- [ ] Customer management CRUD
- [ ] Audit log viewer
- [ ] System settings
- [ ] Dashboard with stats

### Phase 3: Kitchen Admin Features
- [ ] Recipe management (with multi-step form)
- [ ] Menu builder (drag & drop)
- [ ] Order kanban board
- [ ] Kitchen dashboard
- [ ] Kitchen reports

### Phase 4: Customer Admin Features
- [ ] Employee management
- [ ] Group management
- [ ] Budget management
- [ ] Team reports
- [ ] Customer dashboard

### Phase 5: End User Features
- [ ] Browse menus
- [ ] Shopping cart
- [ ] Checkout flow
- [ ] Booking history
- [ ] Notifications
- [ ] Profile management

### Phase 6: Polish & Deploy
- [ ] E2E tests
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Documentation
- [ ] Docker deployment

---

## 🎯 Success Criteria

**The app is complete when:**
1. ✅ All 4 user roles can login and access their respective dashboards
2. ✅ Super Admin can manage all users and customers
3. ✅ Kitchen Admin can create menus and manage orders
4. ✅ Customer Admin can manage their team and budgets
5. ✅ End Users can browse menus and place bookings
6. ✅ Order flow works end-to-end (booking → order → ready → completed)
7. ✅ Budget enforcement works correctly
8. ✅ Notifications are sent for key events
9. ✅ All pages are responsive and accessible
10. ✅ E2E tests pass for critical flows

---

## 🚀 Ready for Lovable!

This blueprint contains **everything** needed to generate the Red Bull Racing Meal Booking Platform:
- ✅ Complete database schema with all relations
- ✅ All user roles and permissions
- ✅ Every feature described in detail
- ✅ UI/UX guidelines with component specs
- ✅ Complete API endpoint list
- ✅ Validation rules
- ✅ Error handling patterns
- ✅ Testing requirements
- ✅ Deployment configuration

**Feed this entire document to Lovable and it will generate a production-ready app! 🏁**
