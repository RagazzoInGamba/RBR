# 🧪 API Testing Guide

## Oracle Red Bull Racing - Meal Booking Platform

Comprehensive guide for testing all API endpoints manually or programmatically.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Authentication](#authentication)
- [Test Users](#test-users)
- [API Endpoints](#api-endpoints)
  - [Health Check](#health-check)
  - [Authentication APIs](#authentication-apis)
  - [Admin User APIs](#admin-user-apis)
  - [Kitchen Recipe APIs](#kitchen-recipe-apis)
  - [Kitchen Menu APIs](#kitchen-menu-apis)
  - [Kitchen Orders APIs](#kitchen-orders-apis)
  - [Booking APIs](#booking-apis-critical)
  - [Customer Admin APIs](#customer-admin-apis)
  - [Stats APIs](#stats-apis)
  - [Menu APIs](#menu-apis)
- [Common Errors](#common-errors)
- [Automated Testing](#automated-testing)

---

## Prerequisites

- Application running on `http://localhost:3001`
- Docker containers healthy (postgres, redis, app)
- Database seeded with test data
- API testing tool: `curl`, Postman, Insomnia, or Thunder Client

---

## Authentication

All API endpoints (except `/health` and `/auth/*`) require authentication via NextAuth v5 session cookies.

### Login Flow

1. **POST** `/api/auth/signin/credentials` with JSON body
2. Extract `next-auth.session-token` cookie from response
3. Include cookie in subsequent requests

### Example with curl:

```bash
# Login and save cookies
curl -c cookies.txt -X POST http://localhost:3001/api/auth/signin/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@redbullracing.com","password":"Admin123!"}'

# Use cookies for authenticated requests
curl -b cookies.txt http://localhost:3001/api/admin/users
```

---

## Test Users

### Default Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Super Admin** | `admin@redbullracing.com` | `Admin123!` | Full access to all features |
| **Kitchen Admin** | `chef@redbullracing.com` | `Chef123!` | Kitchen management, recipes, menus, orders |
| **Customer Admin** | `manager@redbullracing.com` | `Manager123!` | Employee management, booking oversight |
| **End User** | `driver@redbullracing.com` | `Driver123!` | Meal booking, personal stats |

---

## API Endpoints

### Base URL

```
http://localhost:3001/api
```

---

## Health Check

### GET `/health`

Check if the API is running.

**Authentication:** None required

**Example:**

```bash
curl http://localhost:3001/api/health
```

**Response (200 OK):**

```json
{
  "status": "healthy",
  "timestamp": "2025-10-21T12:00:00.000Z",
  "service": "Red Bull Racing Meal Booking",
  "version": "0.1.0"
}
```

---

## Authentication APIs

### POST `/auth/callback/credentials`

Login with email and password.

**Body:**

```json
{
  "email": "admin@redbullracing.com",
  "password": "Admin123!"
}
```

**Response:** Sets `next-auth.session-token` cookie

---

## Admin User APIs

**Required Role:** `SUPER_ADMIN`

### 1. GET `/admin/users`

List all users with pagination.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `role` (SUPER_ADMIN | KITCHEN_ADMIN | CUSTOMER_ADMIN | END_USER)
- `search` (string)

**Example:**

```bash
curl -b cookies.txt "http://localhost:3001/api/admin/users?page=1&limit=10"
```

**Response (200 OK):**

```json
{
  "users": [
    {
      "id": "...",
      "email": "admin@redbullracing.com",
      "firstName": "System",
      "lastName": "Administrator",
      "role": "SUPER_ADMIN",
      "createdAt": "2025-10-21T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 4,
    "totalPages": 1
  }
}
```

### 2. POST `/admin/users`

Create a new user.

**Body:**

```json
{
  "email": "newuser@redbullracing.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "END_USER",
  "department": "Engineering",
  "employeeId": "RBR-ENG-001"
}
```

**Validation Rules:**
- Email must be unique
- Password minimum 8 characters
- Role must be valid enum value

**Response (201 Created):**

```json
{
  "message": "Utente creato con successo",
  "user": { "id": "...", "email": "...", ... }
}
```

**Errors:**
- `400 Bad Request` - Validation failed (duplicate email, weak password)
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions

### 3. GET `/admin/users/[id]`

Get user details by ID.

### 4. PATCH `/admin/users/[id]`

Update user information.

### 5. DELETE `/admin/users/[id]`

Soft delete a user (sets deletedAt timestamp).

---

## Kitchen Recipe APIs

**Required Role:** `SUPER_ADMIN` or `KITCHEN_ADMIN`

### 1. GET `/kitchen/recipes`

List all recipes with filters.

**Query Parameters:**
- `page`, `limit`
- `category` (APPETIZER | FIRST_COURSE | SECOND_COURSE | SIDE_DISH | DESSERT | BEVERAGE)
- `mealType` (BREAKFAST | LUNCH | DINNER | SNACK)
- `search` (string)
- `available` (boolean)

### 2. POST `/kitchen/recipes`

Create a new recipe.

**Body:**

```json
{
  "name": "Pasta Carbonara",
  "description": "Classic Italian pasta",
  "category": "FIRST_COURSE",
  "mealType": "LUNCH",
  "ingredients": [
    { "name": "Spaghetti", "quantity": 200, "unit": "g" },
    { "name": "Guanciale", "quantity": 100, "unit": "g" },
    { "name": "Eggs", "quantity": 2, "unit": "pcs" }
  ],
  "allergens": ["EGGS", "GLUTEN"],
  "preparationTime": 20,
  "basePrice": 1250,
  "isAvailable": true
}
```

**Validation:**
- `name` required, unique
- `category` and `mealType` must be valid enums
- `basePrice` in cents (e.g., 1250 = €12.50)
- `allergens` must be valid array of allergen types

### 3. GET `/kitchen/recipes/[id]`

Get recipe details.

### 4. PATCH `/kitchen/recipes/[id]`

Update recipe.

### 5. DELETE `/kitchen/recipes/[id]`

Delete recipe (checks for dependencies).

---

## Kitchen Menu APIs

**Required Role:** `SUPER_ADMIN` or `KITCHEN_ADMIN`

### 1. GET `/kitchen/menus`

List all menus.

### 2. POST `/kitchen/menus`

Create a new menu.

**Body:**

```json
{
  "name": "Menu del Giorno - Pranzo",
  "description": "Menu completo per il pranzo",
  "mealType": "LUNCH",
  "date": "2025-10-25",
  "recipes": ["recipe_id_1", "recipe_id_2", "recipe_id_3"],
  "maxBookings": 50,
  "isActive": true
}
```

### 3. GET `/kitchen/menus/[id]`

### 4. PATCH `/kitchen/menus/[id]`

### 5. DELETE `/kitchen/menus/[id]`

---

## Kitchen Orders APIs

**Required Role:** `SUPER_ADMIN` or `KITCHEN_ADMIN`

### 1. GET `/kitchen/orders`

List all orders for kitchen preparation.

**Query Parameters:**
- `status` (PENDING | CONFIRMED | PREPARING | READY | COMPLETED | CANCELLED)
- `date` (YYYY-MM-DD)
- `mealType`

### 2. PATCH `/kitchen/orders/[id]/status`

Update order status.

**Body:**

```json
{
  "status": "PREPARING"
}
```

---

## Booking APIs (CRITICAL)

**Required Role:** Any authenticated user

### ⚠️ GRANULAR VALIDATION

Booking creation validates against `BookingRule` table:

#### LUNCH Rules:
- ✅ **FIRST_COURSE**: Required, min 1, max 1
- ✅ **BEVERAGE**: Required, min 1, max 2
- ✅ **APPETIZER**: Optional, min 0, max 1
- ✅ **SECOND_COURSE**: Optional, min 0, max 1
- ✅ **SIDE_DISH**: Optional, min 0, max 2
- ✅ **DESSERT**: Optional, min 0, max 1

#### DINNER Rules:
- ✅ **SECOND_COURSE**: Required, min 1, max 1
- ✅ **SIDE_DISH**: Required, min 1, max 2
- ✅ **BEVERAGE**: Required, min 1, max 2
- ✅ **APPETIZER**: Optional, min 0, max 1
- ✅ **DESSERT**: Optional, min 0, max 1

### 1. GET `/booking`

List user's bookings.

### 2. GET `/booking/rules?mealType=LUNCH`

Get booking rules for a specific meal type.

**Response:**

```json
{
  "rules": [
    {
      "category": "FIRST_COURSE",
      "minQuantity": 1,
      "maxQuantity": 1,
      "isRequired": true,
      "categoryName": "Primo"
    },
    ...
  ]
}
```

### 3. POST `/booking`

Create a new booking.

**Body (Valid LUNCH booking):**

```json
{
  "menuId": "clxxx...",
  "date": "2025-10-25",
  "mealType": "LUNCH",
  "items": [
    {
      "recipeId": "clxxx...",
      "recipeName": "Pasta Carbonara",
      "recipeCategory": "FIRST_COURSE",
      "quantity": 1,
      "unitPrice": 1250
    },
    {
      "recipeId": "clyyy...",
      "recipeName": "Acqua Naturale",
      "recipeCategory": "BEVERAGE",
      "quantity": 1,
      "unitPrice": 150
    }
  ],
  "totalPrice": 1400,
  "paymentMethod": "BADGE",
  "notes": "No salt"
}
```

**Validation Errors (400 Bad Request):**

```json
// Missing FIRST_COURSE
{
  "error": "Selezione non valida",
  "details": [
    {
      "category": "FIRST_COURSE",
      "message": "Primo: minimo 1 richiesto, selezionato 0",
      "min": 1,
      "current": 0
    }
  ]
}

// Too many APPETIZERS (max 1)
{
  "error": "Selezione non valida",
  "details": [
    {
      "category": "APPETIZER",
      "message": "Antipasto: massimo 1 consentito, selezionato 2",
      "max": 1,
      "current": 2
    }
  ]
}
```

**Other Validations:**
- ❌ Total price must match sum of items
- ❌ Menu must be active and available
- ❌ No duplicate booking for same user/date/mealType
- ❌ Booking capacity not exceeded

### 4. GET `/booking/[id]`

Get booking details.

### 5. PATCH `/booking/[id]`

Update booking (limited fields).

### 6. DELETE `/booking/[id]`

Cancel booking (soft delete).

---

## Customer Admin APIs

**Required Role:** `SUPER_ADMIN` or `CUSTOMER_ADMIN`

### 1. GET `/customer/employees`

List employees.

### 2. POST `/customer/employees`

Create employee.

### 3. GET `/customer/employees/[id]`

### 4. PATCH `/customer/employees/[id]`

### 5. DELETE `/customer/employees/[id]`

---

## Stats APIs

### 1. GET `/stats/super-admin`

**Role:** SUPER_ADMIN

Global statistics.

### 2. GET `/stats/kitchen`

**Role:** KITCHEN_ADMIN

Kitchen-specific stats.

### 3. GET `/stats/customer-admin`

**Role:** CUSTOMER_ADMIN

Customer admin stats.

### 4. GET `/stats/user`

**Role:** END_USER

User personal stats.

### 5. GET `/stats/dashboard`

**Role:** Any authenticated

Dashboard overview.

---

## Menu APIs

### 1. GET `/menu/available`

Get available menus for booking.

**Query Parameters:**
- `date` (YYYY-MM-DD)
- `mealType`

---

## Common Errors

### 401 Unauthorized

```json
{
  "error": "Non autenticato"
}
```

**Solution:** Login and include session cookie.

### 403 Forbidden

```json
{
  "error": "Accesso negato"
}
```

**Solution:** Use account with appropriate role.

### 400 Bad Request

```json
{
  "error": "Dati non validi",
  "details": [...]
}
```

**Solution:** Check validation errors in `details` field.

### 404 Not Found

```json
{
  "error": "Risorsa non trovata"
}
```

### 500 Internal Server Error

```json
{
  "error": "Errore interno del server"
}
```

**Action:** Check server logs, report to development team.

---

## Automated Testing

### Using the provided test script:

```bash
node test-api-complete.js
```

### Using Jest (if tests are implemented):

```bash
npm test
```

### Using Postman:

1. Import collection: `postman/RBR_API_Collection.json`
2. Set environment variables
3. Run collection tests

---

## 📊 Expected Test Coverage

| Category | Endpoints | Critical Tests |
|----------|-----------|----------------|
| Health | 1 | Basic connectivity |
| Auth | 2 | Valid/invalid login |
| Admin Users | 6 | CRUD + validation |
| Kitchen Recipes | 5 | CRUD + availability |
| Kitchen Menus | 5 | CRUD + date conflicts |
| Kitchen Orders | 2 | List + status update |
| **Booking** | **5** | **Granular validation, rules, conflicts** |
| Customer Admin | 5 | Employee management |
| Stats | 5 | Role-based data access |
| Menu | 1 | Availability filtering |

**Total:** 37 endpoints

---

## 🔧 Troubleshooting

### Container not running:

```bash
docker ps
docker-compose up -d
```

### Database not seeded:

```bash
docker exec rbr-app npm run prisma:seed
```

### Authentication fails:

1. Check NEXTAUTH_SECRET is set
2. Verify user exists in database
3. Check password hash matches

### CORS errors:

- Ensure request from same origin or configure CORS in `next.config.js`

---

## 📝 Notes

- All prices are stored in **cents** (e.g., 1250 = €12.50)
- Dates use **ISO 8601** format (YYYY-MM-DD)
- Timestamps in UTC
- Soft deletes used (deletedAt field)
- Audit logs created for critical operations

---

**Last Updated:** 2025-10-21
**Version:** 1.0.0
**Author:** Universal Full-Stack Architect
