# 🛒 NestStore — Fullstack E-Commerce Application

A modern, production-ready fullstack e-commerce system built with **NestJS 12**, **Next.js 16 (App Router)**, **PostgreSQL 16**, **Prisma 8**, and **Docker**.

---

## 📚 Documentation Hub

Comprehensive documentation for all subsystems is available in the `docs/` folder:

| Document | Description |
|---|---|
| 📐 [**System Architecture**](file:///c:/dev/personal/lab/nest-nest-store/docs/ARCHITECTURE.md) | High-level system design, data flow diagrams, dual-mode auth sequence, and database ERD. |
| 🔌 [**Backend API Reference**](file:///c:/dev/personal/lab/nest-nest-store/docs/BACKEND_API.md) | Endpoints reference (`/auth`, `/products`, `/orders`), response envelopes, and strict DTO whitelist rules. |
| 💻 [**Frontend Guide**](file:///c:/dev/personal/lab/nest-nest-store/docs/FRONTEND_GUIDE.md) | Next.js 16 architecture, `apiFetch` helper, AuthContext, CartContext, Route Guards, and dual-mode theme. |
| 🐳 [**Docker & Deployment Guide**](file:///c:/dev/personal/lab/nest-nest-store/docs/DOCKER_GUIDE.md) | Multi-stage Dockerfile breakdown, Docker Compose orchestration, healthchecks, and networking. |
| 📜 [**Backend Rules**](file:///c:/dev/personal/lab/nest-nest-store/BACKEND_RULES.md) | Original backend contract documentation and validation constraints. |

---

## ⚡ Quick Start

### Option 1: Run with Docker Compose (Recommended)
Starts the NestJS backend and PostgreSQL database with one command:

```bash
# Clone the repository and run:
docker compose up --build
```

In a separate terminal, launch the Next.js frontend:
```bash
cd frontend
npm install
npm run dev
```

- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

---

### Option 2: Run Locally (Without Docker)

#### 1. Start PostgreSQL
Ensure PostgreSQL is running locally on port `5432` with a database named `simple_store`.

#### 2. Start NestJS Backend
```bash
cd simple-store
npm install
npm run seed       # Seeds sample products and admin/customer accounts
npm run start:dev  # Runs backend on http://localhost:3001
```

#### 3. Start Next.js Frontend
```bash
cd frontend
npm install
npm run dev        # Runs frontend on http://localhost:3000
```

---

## 🔑 Default Test Accounts

Use the 1-click autofill buttons on the [Login Page](http://localhost:3000/login) or enter manually:

| Account Type | Email | Password | Role | Permissions |
|---|---|---|---|---|
| **Administrator** | `admin@store.com` | `admin123` | `admin` | Full store access + Admin inventory dashboard (`/admin`), create, update, delete |
| **Customer** | `customer@store.com` | `customer123` | `user` | Browse products, manage cart, place orders, view order history (`/orders`) |

---

## 📁 Repository Directory Structure

```
nest-nest-store/
├── docs/                                # Detailed technical documentation
│   ├── ARCHITECTURE.md                  # System architecture & sequence diagrams
│   ├── BACKEND_API.md                   # API specification & endpoints
│   ├── FRONTEND_GUIDE.md                # Next.js 16 components & context state
│   └── DOCKER_GUIDE.md                  # Dockerfile & Compose orchestration
├── docker-compose.yml                   # Root Docker Compose orchestrator
├── simple-store/                        # NestJS Backend API
│   ├── src/
│   │   ├── auth/                        # JWT authentication & RBAC guards
│   │   ├── common/                      # TransformInterceptor & GlobalExceptionFilter
│   │   ├── orders/                      # Orders & inventory transactions
│   │   ├── prisma/                      # Prisma ORM contract models & client
│   │   ├── products/                    # Products CRUD & stock management
│   │   └── seed.ts                      # Database seed script
│   ├── Dockerfile                       # Multi-stage Alpine container build
│   ├── .dockerignore                    # Build context exclusions
│   └── docker-compose.yml               # Service compose definition
└── frontend/                            # Next.js 16 Frontend Web Application
    ├── src/
    │   ├── app/                         # Next.js App Router pages
    │   │   ├── admin/                   # Protected admin management routes
    │   │   ├── cart/                    # Cart & checkout page
    │   │   ├── login/                   # Login page
    │   │   ├── orders/                  # Past orders page
    │   │   ├── products/                # Storefront product catalog
    │   │   └── register/                # Customer registration page
    │   ├── components/                  # Navbar, Footer, AdminGuard, AuthGuard
    │   ├── context/                     # AuthContext, CartContext, ThemeContext
    │   ├── lib/api.ts                   # Centralized API fetch helper
    │   └── types/                       # TypeScript interfaces
    └── package.json                     # Frontend dependencies
```

---

## 🛠️ Verification & Quality Assurance

All 9 end-to-end user journeys are verified:
- Customer registration & login
- Session restoration via `GET /auth/me` with `httpOnly` cookie
- Product catalog browsing with stock indicators
- Client-side cart persistence with stock ceilings
- Order placement via `POST /orders` (strictly enforcing token-derived `userId`)
- Past orders history retrieval
- Admin role authorization and route guard enforcement
- Admin product creation (`POST /products`), updating (`PATCH /products/:id`), and deletion (`DELETE /products/:id`)
