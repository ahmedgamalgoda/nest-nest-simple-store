# System Architecture & Technical Specifications

This document outlines the architecture, component interaction, data flow, and database schema for the **NestStore** fullstack application.

---

## 1. High-Level Architecture Overview

NestStore is structured as a decoupled fullstack system composed of:
1. **Frontend**: Next.js 16 (React 19, TypeScript, Tailwind CSS v4, App Router) running on `http://localhost:3000`.
2. **Backend**: NestJS 12 (Express, TypeScript, Prisma 8, Passport JWT, bcrypt) running on `http://localhost:3001`.
3. **Database**: PostgreSQL 16 managed via Prisma ORM contract models.
4. **Containerization**: Multi-stage Dockerfile and Docker Compose orchestration.

```mermaid
graph TD
    User["Client Browser (Desktop / Mobile)"]

    subgraph Frontend ["Frontend (Next.js 16 App Router - Port 3000)"]
        UI["Tailwind CSS v4 Dual-Mode UI"]
        AuthCtx["AuthContext (Session State)"]
        CartCtx["CartContext (LocalStorage)"]
        ApiHelper["apiFetch Helper (credentials: include)"]
    end

    subgraph Backend ["Backend (NestJS 12 - Port 3001)"]
        CORS["CORS (origin: true, credentials: true)"]
        Logger["LoggingMiddleware"]
        Pipes["ValidationPipe (whitelist, forbidNonWhitelisted)"]
        Guards["JwtAuthGuard & RolesGuard"]
        Controllers["Controllers (Auth, Products, Orders)"]
        Services["Services (Business Logic & Inventory Checks)"]
        Interceptor["TransformInterceptor (Envelope wrapping)"]
        Filter["GlobalExceptionFilter (Uniform error handling)"]
    end

    subgraph Persistence ["Persistence Layer (Port 5432)"]
        Prisma["Prisma ORM Client (Contract Runtime)"]
        Postgres[("PostgreSQL 16 Database")]
    end

    User -->|HTTP / React UI| UI
    UI --> AuthCtx
    UI --> CartCtx
    AuthCtx --> ApiHelper
    CartCtx --> ApiHelper
    ApiHelper -->|Fetch with httpOnly cookie| CORS
    CORS --> Logger
    Logger --> Pipes
    Pipes --> Interceptor
    Interceptor --> Guards
    Guards --> Controllers
    Controllers --> Services
    Services --> Prisma
    Prisma --> Postgres
    Filter -.->|Catches Exceptions| User
```

---

## 2. Authentication & Session Architecture

NestStore implements **Dual-Mode Authentication**:

```mermaid
sequenceDiagram
    autonumber
    actor Client as User / Browser
    participant FE as Next.js (AuthContext)
    participant BE as NestJS (/auth)
    participant DB as PostgreSQL

    Note over Client,BE: 1. Login / Authentication Flow
    Client->>FE: Enters email & password
    FE->>BE: POST /auth/login { email, password }
    BE->>DB: Query User by email
    DB-->>BE: User record + hashed password
    BE->>BE: bcrypt.compare(password, hash)
    BE->>BE: Sign JWT token
    BE-->>Client: Set-Cookie: token=<jwt>; HttpOnly; SameSite=Lax; Path=/
    BE-->>FE: 200 OK { success: true, data: { access_token, user } }
    FE->>FE: Update React state & redirect to /products

    Note over Client,BE: 2. Session Hydration on Page Load / Refresh
    Client->>FE: Opens / Refreshes any page
    FE->>BE: GET /auth/me (Browser auto-sends 'token' cookie)
    BE->>BE: JwtAuthGuard validates token
    BE-->>FE: 200 OK { success: true, data: { userId, email, name, role } }
    FE->>FE: Set authenticated user & role permissions

    Note over Client,BE: 3. Logout Flow
    Client->>FE: Clicks Sign Out
    FE->>BE: POST /auth/logout
    BE-->>Client: Clear-Cookie: token=; Max-Age=0
    BE-->>FE: 200 OK { success: true, data: { message: "Logged out" } }
    FE->>FE: Clear user state & redirect to /login
```

### Authentication Characteristics:
1. **`httpOnly` Cookie**: The JWT is stored in an `httpOnly` cookie named `token`. Client-side JavaScript cannot read `document.cookie`, preventing Cross-Site Scripting (XSS) token theft.
2. **Bearer Token Support**: The backend `JwtStrategy` extracts tokens from both `req.cookies.token` and the `Authorization: Bearer <token>` header.
3. **Role-Based Access Control (RBAC)**:
   - `user`: Standard customer role. Can browse catalog, manage cart, place orders, and view past orders.
   - `admin`: Elevated managerial role. Can create, edit, and delete products in the catalog.

---

## 3. Database Schema & Data Models

The Prisma data contract is defined at `simple-store/src/prisma/contract.prisma`:

```mermaid
erDiagram
    User ||--o{ Order : "places"
    Order ||--|{ OrderItem : "contains"
    Product ||--o{ OrderItem : "referenced in"

    User {
        string id PK "uuid()"
        string email UK "case-insensitive unique"
        string password "bcrypt hashed"
        string name "User display name"
        string role "'user' | 'admin' (default: 'user')"
        datetime createdAt "default(now())"
        datetime updatedAt "temporal.updatedAt()"
    }

    Product {
        string id PK "uuid()"
        string name "Product title"
        string description "Optional details"
        float price "Positive number > 0"
        int stock "Non-negative integer >= 0"
        datetime createdAt "default(now())"
        datetime updatedAt "temporal.updatedAt()"
    }

    Order {
        string id PK "uuid()"
        string userId FK "Strictly derived from token"
        float totalPrice "Sum of line item subtotals"
        string status "Default: 'completed'"
        datetime createdAt "default(now())"
        datetime updatedAt "temporal.updatedAt()"
    }

    OrderItem {
        string id PK "uuid()"
        string orderId FK "references Order(id)"
        string productId FK "references Product(id)"
        int quantity "Integer >= 1"
        float price "Snapshot price at time of order"
    }
```

---

## 4. Order & Inventory Transaction Lifecycle

When placing an order (`POST /orders`), the backend executes strict stock validation:

```mermaid
flowchart TD
    Start([POST /orders Request]) --> CheckAuth{Is User Authenticated?}
    CheckAuth -- No --> Err401[Return 401 Unauthorized]
    CheckAuth -- Yes --> ExtractUser[Extract userId from JWT cookie]

    ExtractUser --> CheckBody{Contains userId in body?}
    CheckBody -- Yes --> Err400A[Return 400 Bad Request: userId should not exist]
    CheckBody -- No --> ValidateDTO{Valid items array and quantities >= 1?}

    ValidateDTO -- No --> Err400B[Return 400 Bad Request: Validation Error]
    ValidateDTO -- Yes --> CheckStock[Query DB for each Product & check stock]

    CheckStock --> StockSufficient{All products have stock >= quantity?}
    StockSufficient -- No --> Err400C[Return 400 Bad Request: Insufficient stock]
    StockSufficient -- Yes --> CreateOrder[Create Order & OrderItem records]

    CreateOrder --> DecrementStock[Decrement Product stock in DB]
    DecrementStock --> WrapResponse[Wrap in TransformInterceptor]
    WrapResponse --> Success([Return 201 Created with Order Payload])
```

---

## 5. Security & Request Pipeline

### 1. Request Logging Middleware
Applied globally to all routes in `main.ts`:
- Logs HTTP Method, Request Path, and Response Status Code.
- Computes execution duration for every request.

### 2. Validation Pipe
Configured with strict flags:
```typescript
new ValidationPipe({
  whitelist: true,              // Strips unexpected fields
  transform: true,              // Automatically coerces types
  forbidNonWhitelisted: true,   // THROWS 400 IF UNRECOGNIZED FIELDS ARE SENT
  transformOptions: {
    enableImplicitConversion: true,
  },
})
```

### 3. Global Response Envelope (`TransformInterceptor`)
Transforms all successful `2xx` responses into a standardized structure:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-09-26T12:00:00.000Z"
}
```

### 4. Global Exception Filter (`GlobalExceptionFilter`)
Standardizes all client (`4xx`) and server (`500`) errors without leaking internal stack traces:
```json
{
  "message": "Error description here",
  "timestamp": "2026-09-26T12:00:00.000Z"
}
```
