# Frontend Application & Component Guide

This guide covers the Next.js 16 frontend application architecture, state providers, routing guards, and UI components.

---

## 1. Tech Stack & Directory Structure

- **Framework**: Next.js 16.3.6 (App Router with Turbopack)
- **Library**: React 19.2.8
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Icons**: Lucide React

```
frontend/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── page.tsx               # Admin inventory dashboard
│   │   │   └── products/
│   │   │       ├── new/page.tsx       # Dedicated product creation form
│   │   │       └── [id]/edit/page.tsx # Dedicated product editing form
│   │   ├── cart/page.tsx              # Shopping cart & checkout flow
│   │   ├── login/page.tsx             # Email/Password login + quick demo autofill
│   │   ├── orders/page.tsx            # Authenticated order history
│   │   ├── products/page.tsx          # Storefront catalog with filters
│   │   ├── register/page.tsx          # Customer registration form
│   │   ├── globals.css                # Tailwind v4 theme & custom dark variant
│   │   ├── layout.tsx                 # Root layout with Providers
│   │   └── page.tsx                   # Redirects root / to /products
│   ├── components/
│   │   ├── AdminGuard.tsx             # Protects admin-only routes
│   │   ├── AuthGuard.tsx              # Protects customer-only routes
│   │   ├── Footer.tsx                 # Page footer
│   │   ├── Navbar.tsx                 # Responsive header with cart counter & auth
│   │   └── Providers.tsx              # Client provider tree
│   ├── context/
│   │   ├── AuthContext.tsx            # Session hydration, login, logout, register
│   │   ├── CartContext.tsx            # LocalStorage cart state, stock validation
│   │   └── ThemeContext.tsx           # Dual-mode (Light/Dark) toggle & persistence
│   ├── lib/
│   │   └── api.ts                     # apiFetch helper (credentials: 'include')
│   └── types/
│       └── index.ts                   # Domain & API TypeScript interfaces
```

---

## 2. API Communication Helper (`src/lib/api.ts`)

Per backend requirements, all frontend requests must send `credentials: 'include'` so cross-origin `httpOnly` authentication cookies are sent and received automatically.

### Key Features:
- **`credentials: 'include'`**: Always enabled.
- **Unwrapping Success Payloads**: The NestJS backend wraps responses in `{ success: true, data: ..., timestamp: ... }`. The `apiFetch` helper automatically returns `.data`.
- **Structured Error Handling**: Catches NestJS `GlobalExceptionFilter` payloads and extracts `json.message`.

```typescript
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T>
```

---

## 3. Context Providers & State Management

### A. `AuthContext` (`src/context/AuthContext.tsx`)
Manages authentication state across the application:
- `user`: Holds current user profile `{ id, email, name, role }` or `null`.
- `isLoading`: `true` while the application verifies session via `GET /auth/me` on startup.
- `isAuthenticated`: Boolean helper indicating signed-in status.
- `isAdmin`: Boolean helper checking `user?.role === 'admin'`.
- `login(email, password)`: Calls `POST /auth/login`, sets user state, receives cookie.
- `register(name, email, password)`: Calls `POST /auth/register` (strictly with `role: "user"`), then automatically calls login to establish cookie session.
- `logout()`: Calls `POST /auth/logout`, clears user state.

### B. `CartContext` (`src/context/CartContext.tsx`)
Manages client-side shopping cart:
- **Persistence**: Automatically saved to `localStorage` under `store_cart`.
- **Stock Guarding**: Prevents adding more units than available in product inventory (`product.stock`).
- **Methods**: `addToCart`, `updateQuantity`, `removeFromCart`, `clearCart`.
- **Calculations**: `totalItems` and `totalPrice`.

### C. `ThemeContext` (`src/context/ThemeContext.tsx`)
Manages dual-mode aesthetic:
- Toggles between `light` and `dark`.
- Appends/removes `.dark` class on `document.documentElement`.
- Persists user selection in `localStorage` under `store_theme`.

---

## 4. Route Protection (`Guards`)

### `AuthGuard` (`src/components/AuthGuard.tsx`)
Used on `/cart` and `/orders`:
- If authentication is loading: Displays a subtle spinner.
- If unauthenticated: Redirects visitor to `/login?redirect=<current_path>`.
- If authenticated: Renders child page content.

### `AdminGuard` (`src/components/AdminGuard.tsx`)
Used on `/admin`, `/admin/products/new`, and `/admin/products/[id]/edit`:
- If unauthenticated: Redirects to `/login`.
- If signed in as regular customer (`role === 'user'`): Renders an **Access Denied** notice with the user's role and a button to return to the store catalog.
- If signed in as admin (`role === 'admin'`): Renders the admin management interface.

---

## 5. Pages & User Flows

| Route | Purpose | Key Functionality |
|---|---|---|
| `/products` | Catalog | Live product cards, search query filter, in-stock toggle, instant "Add to Cart" feedback. |
| `/login` | Authentication | Email & password form, 1-click demo login buttons (`customer@store.com`, `admin@store.com`), error alerts. |
| `/register` | Signup | Customer signup with strict `role: 'user'` enforcement, input validation (min 6 char password). |
| `/cart` | Checkout | Adjust quantities, item subtotals, order total, strict `POST /orders` call without `userId`. |
| `/orders` | Order History | Displays user past orders, creation date, status, expandable order line-items. |
| `/admin` | Dashboard | Metrics summary (total products, low stock, out of stock), product table, search, delete modal. |
| `/admin/products/new` | Create Item | Dedicated form to add products with validation according to backend schema. |
| `/admin/products/[id]/edit` | Edit Item | Pre-populates existing product attributes, sends `PATCH /products/:id`. |

---

## 6. Running Frontend Locally

```bash
cd frontend

# Start Next.js development server on port 3000
npm run dev

# Run production build validation
npm run build
```
