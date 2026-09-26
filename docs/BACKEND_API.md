# Backend API Reference & Contracts

This document is the authoritative specification for the NestJS REST API (`backend`).

---

## 1. Server Configuration & Networking

| Setting | Default Value | Notes |
|---|---|---|
| **Base URL** | `http://localhost:3001` | Configurable via `PORT` environment variable |
| **CORS** | `origin: true, credentials: true` | Allows browser cross-origin requests with cookies |
| **Cookie Name** | `token` | `httpOnly: true, sameSite: 'lax', path: '/', maxAge: 86400000` |
| **Auth Header** | `Authorization: Bearer <jwt>` | Supported as alternative to cookie |

---

## 2. Response Formats

### Successful Response Envelope (`2xx`)
Every successful endpoint response is wrapped by `TransformInterceptor`:
```json
{
  "success": true,
  "data": <PAYLOAD>,
  "timestamp": "2026-09-26T12:00:00.000Z"
}
```

### Error Response (`4xx`, `5xx`)
Errors are captured by `GlobalExceptionFilter` and formatted consistently:
```json
{
  "message": "Detailed error message or validation summary",
  "timestamp": "2026-09-26T12:00:00.000Z"
}
```

> [!CAUTION]
> **Strict Whitelisting (`forbidNonWhitelisted: true`)**:
> Any unrecognized property in a request body triggers `400 Bad Request`. Never include undeclared properties (e.g. `userId`, `id`, `createdAt`).

---

## 3. Endpoints

### 🔑 Authentication (`/auth`)

#### `POST /auth/register`
Creates a new customer or administrator account.
- **Access**: Public
- **Status**: `201 Created`
- **Request Body**:
  ```json
  {
    "name": "Alex Morgan",         // Required string
    "email": "alex@example.com",   // Required valid email, case-insensitive
    "password": "password123",     // Required string, min 6 chars
    "role": "user"                 // Optional: "user" | "admin" (default: "user")
  }
  ```
- **Responses**:
  - `201 Created`: `{ "message": "User registered successfully", "user": { "id": "...", "email": "...", "name": "...", "role": "user" } }`
  - `400 Bad Request`: Validation failure (short password, invalid email, unrecognized field).
  - `409 Conflict`: Email already registered.

#### `POST /auth/login`
Authenticates user, signs JWT, and sets `token` httpOnly cookie.
- **Access**: Public
- **Status**: `200 OK`
- **Request Body**:
  ```json
  {
    "email": "alex@example.com",
    "password": "password123"
  }
  ```
- **Headers Set**: `Set-Cookie: token=<jwt>; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`
- **Responses**:
  - `200 OK`:
    ```json
    {
      "access_token": "eyJhbGciOi...",
      "user": {
        "id": "uuid",
        "email": "alex@example.com",
        "name": "Alex Morgan",
        "role": "user"
      }
    }
    ```
  - `401 Unauthorized`: `"Invalid email or password."`

#### `POST /auth/logout`
Clears authentication cookie session.
- **Access**: Public
- **Status**: `200 OK`
- **Headers Set**: `Set-Cookie: token=; Path=/; Max-Age=0`
- **Response**: `{ "message": "Logged out successfully" }`

#### `GET /auth/me`
Retrieves currently authenticated user's session profile.
- **Access**: Protected (`JwtAuthGuard`)
- **Status**: `200 OK`
- **Response**:
  ```json
  {
    "userId": "uuid",
    "email": "alex@example.com",
    "name": "Alex Morgan",
    "role": "user"
  }
  ```

---

### 📦 Products (`/products`)

#### `GET /products`
List all products in catalog.
- **Access**: Public
- **Status**: `200 OK`
- **Response Payload**:
  ```json
  [
    {
      "id": "uuid",
      "name": "Ergonomic Mechanical Keyboard",
      "description": "Custom switches with RGB backlighting.",
      "price": 129.99,
      "stock": 35,
      "createdAt": "2026-09-26T12:00:00.000Z",
      "updatedAt": "2026-09-26T12:00:00.000Z"
    }
  ]
  ```

#### `GET /products/:id`
Retrieve single product by ID.
- **Access**: Public
- **Status**: `200 OK`
- **Errors**: `404 Not Found` if product does not exist.

#### `POST /products`
Create a new product.
- **Access**: **Admin Only** (`JwtAuthGuard` + `role === 'admin'`)
- **Status**: `201 Created`
- **Request Body**:
  ```json
  {
    "name": "Precision Mouse",     // Required non-empty string
    "description": "58g wireless", // Optional string
    "price": 79.99,                // Required positive number (> 0)
    "stock": 45                    // Optional integer (>= 0, default 0)
  }
  ```
- **Errors**: `401 Unauthorized`, `403 Forbidden` (if not admin), `400 Bad Request`.

#### `PATCH /products/:id`
Update an existing product.
- **Access**: **Admin Only**
- **Status**: `200 OK`
- **Request Body**: (All fields optional, strict whitelist)
  ```json
  {
    "price": 69.99,
    "stock": 50
  }
  ```

#### `DELETE /products/:id`
Delete a product from the database.
- **Access**: **Admin Only**
- **Status**: `200 OK`
- **Response**:
  ```json
  {
    "message": "Product with ID \"...\" was successfully deleted.",
    "product": { ... }
  }
  ```

---

### 🛒 Orders (`/orders`)

#### `POST /orders`
Places an order for one or more items.
- **Access**: **Protected** (Logged-in user)
- **Status**: `201 Created`
- **Strict User ID Rule**:
  > [!IMPORTANT]
  > The `userId` is strictly obtained from the token. If `userId` is present in the request body, the server immediately returns `400 Bad Request` (`property userId should not exist`).
- **Stock Enforcement**:
  - The server checks `product.stock >= item.quantity` for every item.
  - If any product has insufficient stock, the request fails with `400 Bad Request` and no stock is changed.
  - Upon success, product stock is decremented.
- **Request Body**:
  ```json
  {
    "items": [
      {
        "productId": "valid-product-uuid",
        "quantity": 2
      }
    ]
  }
  ```
- **Response Payload**:
  ```json
  {
    "id": "order-uuid",
    "userId": "user-uuid",
    "totalPrice": 159.98,
    "status": "completed",
    "createdAt": "2026-09-26T12:00:00.000Z",
    "items": [
      {
        "id": "order-item-uuid",
        "productId": "product-uuid",
        "productName": "Precision Mouse",
        "quantity": 2,
        "unitPrice": 79.99,
        "subtotal": 159.98
      }
    ]
  }
  ```

#### `GET /orders`
Retrieve past orders placed by the authenticated user.
- **Access**: **Protected** (Logged-in user)
- **Status**: `200 OK`
- **Privacy Enforcement**: Returns only orders belonging to the authenticated `userId`.
