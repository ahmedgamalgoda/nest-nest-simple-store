# Backend API Documentation & Strict Rules

This document specifies the exact contracts, strict validation rules, authentication requirements, and response formats implemented by the NestJS backend (`simple-store`). Frontends interacting with this backend must adhere to these specifications.

---

## 1. Network & Server Configuration

| Setting | Value | Notes |
|---|---|---|
| **Base URL** | `http://localhost:3001` | Configured in `main.ts` (`process.env.PORT ?? 3001`) |
| **CORS** | Enabled (`origin: true, credentials: true`) | Allows cross-origin requests with cookies |
| **Credentials** | `credentials: 'include'` supported | Automatically receives and sends the `token` httpOnly cookie |
| **Cookie Name** | `token` | `httpOnly: true, sameSite: 'lax', path: '/'` |

---

## 2. Global Response Wrapping (`TransformInterceptor`)

> [!IMPORTANT]
> **Every single successful API response** (status codes `2xx`) is wrapped by the global interceptor in this exact envelope:

```json
{
  "success": true,
  "data": <PAYLOAD>,
  "timestamp": "2026-09-25T20:00:00.000Z"
}
```

**Frontend Rule:**
When making API calls, unwrap `.data` to get the actual model or array:
```typescript
const json = await response.json();
const products = json.data; // <--- The actual payload lives here!
```

---

## 3. Global Exception Filter (`GlobalExceptionFilter`)

> [!WARNING]
> Error responses are **NOT** wrapped in the success envelope. They return this structure:

```json
{
  "message": "Error description here",
  "timestamp": "2026-09-25T20:00:00.000Z"
}
```

- **Unhandled/Server Errors (`500`)**: Always return `{ "message": "An error occurred", "timestamp": "..." }`.
- **Client Errors (`400`, `401`, `403`, `404`, `409`)**: Return the specific error message.

---

## 4. Global Validation Rules (`ValidationPipe`)

The backend runs with strict validation enabled:
```typescript
new ValidationPipe({
  whitelist: true,              // Strips unexpected fields
  transform: true,              // Auto-converts primitives
  forbidNonWhitelisted: true,   // THROWS 400 IF UNRECOGNIZED FIELDS ARE SENT
})
```

> [!CAUTION]
> **Strict Whitelisting Rule:** Sending any unexpected property not defined in the DTO causes the server to immediately reject the request with `400 Bad Request`. Never send extra properties (e.g., do not send `userId`, `id`, `createdAt` in request bodies).

---

## 5. Authentication & Authorization

The backend supports **Dual-Mode Authentication**:
1. **HttpOnly Cookie**: Automatically stored under cookie `token` on `POST /auth/login`. When using `fetch`, pass `credentials: 'include'`.
2. **Bearer Token Header**: `Authorization: Bearer <access_token>`.

### Roles
- `user`: Regular customer (can browse products, place orders, view own orders).
- `admin`: Store manager (can create, update, delete products).

---

## 6. Endpoints Specification

### 🔑 Authentication (`/auth`)

#### `POST /auth/register`
- **Access**: Public
- **Status**: `201 Created`
- **Strict Request Body**:
  ```json
  {
    "email": "user@example.com",     // Valid email, required, case-insensitive
    "password": "password123",       // String, minimum 6 characters, required
    "name": "Alex",                  // Non-empty string, required
    "role": "user"                   // Optional: "user" | "admin" (default: "user")
  }
  ```
- **Errors**:
  - `400 Bad Request`: Invalid email, password < 6 chars, or unrecognized field.
  - `409 Conflict`: Email already exists.
- **Success Response (`data`)**:
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Alex",
      "role": "user",
      "createdAt": "2026-09-25T20:00:00.000Z"
    }
  }
  ```

#### `POST /auth/login`
- **Access**: Public
- **Status**: `200 OK`
- **Strict Request Body**:
  ```json
  {
    "email": "user@example.com",     // Valid email, required
    "password": "password123"        // Non-empty string, required
  }
  ```
- **Cookie Set**: `token=<jwt>; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`
- **Errors**:
  - `401 Unauthorized`: `"Invalid email or password."`
- **Success Response (`data`)**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Alex",
      "role": "user"
    }
  }
  ```

#### `POST /auth/logout`
- **Access**: Public
- **Status**: `200 OK`
- **Cookie Cleared**: Clears `token` cookie.
- **Success Response (`data`)**:
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

#### `GET /auth/me`
- **Access**: Protected (`JwtAuthGuard`)
- **Status**: `200 OK`
- **Success Response (`data`)**:
  ```json
  {
    "userId": "uuid",
    "email": "user@example.com",
    "name": "Alex",
    "role": "user"
  }
  ```

---

### 📦 Products (`/products`)

#### `GET /products`
- **Access**: **Public** (No authentication required)
- **Status**: `200 OK`
- **Success Response (`data`)**: Array of products:
  ```json
  [
    {
      "id": "uuid",
      "name": "Wireless Mouse",
      "description": "Ergonomic optical mouse",
      "price": 29.99,
      "stock": 50,
      "createdAt": "2026-09-25T20:00:00.000Z",
      "updatedAt": "2026-09-25T20:00:00.000Z"
    }
  ]
  ```

#### `GET /products/:id`
- **Access**: **Public**
- **Status**: `200 OK`
- **Errors**: `404 Not Found` if product does not exist.
- **Success Response (`data`)**: Single product object.

#### `POST /products`
- **Access**: **Protected (Admin only)** — Requires `JwtAuthGuard` + `role === 'admin'`
- **Status**: `201 Created`
- **Errors**:
  - `401 Unauthorized`: Missing or invalid token.
  - `403 Forbidden`: Authenticated user is not an `admin`.
  - `400 Bad Request`: Validation failure.
- **Strict Request Body**:
  ```json
  {
    "name": "Mechanical Keyboard",   // Non-empty string, required
    "description": "RGB switches",   // String, optional
    "price": 89.99,                  // Positive number (> 0), required
    "stock": 25                      // Integer (>= 0), optional (defaults to 0)
  }
  ```
- **Success Response (`data`)**: Created product object.

#### `PATCH /products/:id`
- **Access**: **Protected (Admin only)** — Requires `JwtAuthGuard` + `role === 'admin'`
- **Status**: `200 OK`
- **Strict Request Body**: All fields optional, same rules:
  ```json
  {
    "price": 79.99,
    "stock": 30
  }
  ```
- **Success Response (`data`)**: Updated product object.

#### `DELETE /products/:id`
- **Access**: **Protected (Admin only)** — Requires `JwtAuthGuard` + `role === 'admin'`
- **Status**: `200 OK`
- **Success Response (`data`)**:
  ```json
  {
    "message": "Product with ID \"...\" was successfully deleted.",
    "product": { ... }
  }
  ```

---

### 🛒 Orders (`/orders`)

#### `POST /orders`
- **Access**: **Protected** (Any logged-in user)
- **Status**: `201 Created`

> [!CAUTION]
> **CRITICAL RULE ON USER ID:**
> - The `userId` is **strictly derived from the authenticated token/cookie**.
> - **NEVER** include `userId` in the request body! If `userId` is included in the body, validation immediately fails with `400 Bad Request` (`property userId should not exist`).

- **Stock & Inventory Rule:**
  - The server verifies that each product exists and has sufficient stock (`stock >= quantity`).
  - If any product has insufficient stock, the order is rejected with `400 Bad Request` and no stock is changed.
  - On successful order creation, the server automatically decrements product stock.
- **Strict Request Body**:
  ```json
  {
    "items": [
      {
        "productId": "valid-product-uuid",   // String, required
        "quantity": 2                        // Integer (>= 1), required
      }
    ]
  }
  ```
- **Success Response (`data`)**:
  ```json
  {
    "id": "order-uuid",
    "userId": "user-uuid",
    "totalPrice": 59.98,
    "status": "completed",
    "createdAt": "2026-09-25T20:00:00.000Z",
    "items": [
      {
        "id": "order-item-uuid",
        "productId": "valid-product-uuid",
        "productName": "Wireless Mouse",
        "quantity": 2,
        "unitPrice": 29.99,
        "subtotal": 59.98
      }
    ]
  }
  ```

#### `GET /orders`
- **Access**: **Protected** (Any logged-in user)
- **Status**: `200 OK`
- **Privacy Rule**: Returns **only** orders placed by the currently logged-in user.
- **Success Response (`data`)**: Array of order objects with `items`.

#### `GET /orders/:id`
- **Access**: **Protected** (Any logged-in user)
- **Status**: `200 OK`
- **Privacy Rule**: If the order belongs to another user, returns `404 Not Found`.
- **Success Response (`data`)**: Order object with `items`.

---

## 7. Frontend Integration Quick Reference

```typescript
const API_BASE = 'http://localhost:3001';

// Standard helper for all requests
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include', // Always send httpOnly cookie
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || 'An error occurred');
  }

  // Always extract .data from the TransformInterceptor envelope
  return json.data as T;
}
```
