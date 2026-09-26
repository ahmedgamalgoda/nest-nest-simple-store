# 📦 Simple Store — NestJS Backend Service

REST API backend service for the **NestStore** platform built with **NestJS 12**, **Prisma 8**, and **PostgreSQL 16**.

---

## 📚 Documentation Links

- [System Architecture](file:///c:/dev/personal/lab/nest-nest-store/docs/ARCHITECTURE.md)
- [API Reference & Contracts](file:///c:/dev/personal/lab/nest-nest-store/docs/BACKEND_API.md)
- [Docker Setup & Deployment](file:///c:/dev/personal/lab/nest-nest-store/docs/DOCKER_GUIDE.md)
- [Strict Backend Rules](file:///c:/dev/personal/lab/nest-nest-store/BACKEND_RULES.md)

---

## 🚀 Getting Started

### 1. Environment Setup
Copy the environment template:
```bash
cp .env.example .env
```

Ensure `DATABASE_URL` matches your PostgreSQL connection:
```env
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/simple_store?schema=public"
PORT=3001
JWT_SECRET="super-secret-jwt-key-for-simple-store"
JWT_EXPIRES_IN="1d"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize Database & Seed
```bash
# Apply Prisma schema to database:
npx prisma db update --yes

# Seed initial admin, customer, and products:
npm run seed
```

### 4. Run Server
```bash
# Development (with hot reload):
npm run start:dev

# Production:
npm run build
npm run start:prod
```

Server listens on `http://localhost:3001`.
