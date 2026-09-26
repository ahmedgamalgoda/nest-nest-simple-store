# Docker & Containerization Guide

This guide explains the containerization setup for running the NestJS backend and PostgreSQL database using Docker and Docker Compose.

---

## 1. Quick Start

Run both the backend API and PostgreSQL with one command:

```bash
# From the repository root (or inside simple-store/):
docker compose up --build
```

To run in the background (detached mode):
```bash
docker compose up -d --build
```

To view backend server logs:
```bash
docker compose logs -f backend
```

To stop containers:
```bash
docker compose down
```

---

## 2. Dockerfile Deep Dive (`simple-store/Dockerfile`)

The backend uses a **multi-stage build** pattern to produce a secure, minimal container image.

```dockerfile
# ==========================================
# Stage 1: Build stage
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# 1. Install build tools for native modules (bcrypt / node-gyp)
RUN apk add --no-cache python3 make g++

# 2. Cache dependency installation layer
COPY package*.json ./
RUN npm ci

# 3. Copy source files and configuration
COPY nest-cli.json tsconfig*.json prisma.config.ts ./
COPY src/ ./src/

# 4. Compile TypeScript to JavaScript
RUN npm run build

# 5. Remove development dependencies to reduce image size
RUN npm prune --omit=dev


# ==========================================
# Stage 2: Production runtime stage
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# 1. Install dumb-init for proper PID 1 signal forwarding
RUN apk add --no-cache dumb-init

# 2. Copy production-ready artifacts from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist

# 3. Security: Drop root privileges
USER node

# 4. Expose port & boot application
EXPOSE 3001
CMD ["dumb-init", "node", "dist/main.js"]
```

### Key Architectural Benefits:
1. **Alpine Base (`node:22-alpine`)**: Keeps the image base at ~50MB instead of ~300MB Debian images.
2. **Native Module Compilation**: Installs `python3`, `make`, and `g++` in the builder stage to compile `bcrypt` C++ bindings, but discards them completely in the final image.
3. **Layer Caching**: `package*.json` is copied and installed before copying source code. Edits to TypeScript files will not trigger re-installation of dependencies.
4. **`dumb-init` (PID 1 Process Supervisor)**: Node.js is not designed to run as PID 1 in Linux containers. Without a supervisor, signals like `SIGTERM` and `SIGINT` (e.g. from `docker stop`) are ignored, causing abrupt termination. `dumb-init` properly forwards signals so NestJS can invoke `onModuleDestroy()` and close database connections cleanly.
5. **Non-Root Execution (`USER node`)**: Mitigates container breakout vulnerabilities by running under the low-privilege `node` user.

---

## 3. `.dockerignore` Configuration

The `.dockerignore` file prevents host files from polluting the Docker build context:
- `node_modules`: Prevents copying host-platform compiled binaries (e.g. Windows/macOS binaries) into the Alpine Linux container.
- `dist`: Ensures a clean, reproducible build from source.
- `.env`: Prevents baking local environment credentials into the container image.
- `.git`, `coverage`, `*.log`: Reduces build context upload size and speed up image building.

---

## 4. Docker Compose Orchestration (`docker-compose.yml`)

The compose file coordinates the multi-container environment:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: simple_store_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgrespassword
      POSTGRES_DB: simple_store
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d simple_store"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - store-network

  backend:
    build:
      context: ./simple-store
      dockerfile: Dockerfile
    container_name: simple_store_backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: postgresql://postgres:postgrespassword@postgres:5432/simple_store?schema=public
      JWT_SECRET: super-secret-jwt-key-for-simple-store
      JWT_EXPIRES_IN: 1d
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - store-network

volumes:
  postgres_data:
    name: simple_store_postgres_data

networks:
  store-network:
    name: simple_store_network
    driver: bridge
```

### Orchestration Highlights:
- **Internal DNS**: In `DATABASE_URL`, the host is `postgres` (`postgres:5432`), which Docker automatically resolves to the database container's internal IP.
- **Healthcheck Dependency**: `depends_on` with `condition: service_healthy` ensures NestJS does not attempt database connection until PostgreSQL passes `pg_isready`.
- **Volume Persistence**: Data persists in the `simple_store_postgres_data` volume even if the container is destroyed.

---

## 5. Operations & Database Seeding

### Seed Default Admin & Catalog inside Docker:
```bash
docker compose exec backend npm run seed
```

### Connect to PostgreSQL directly:
```bash
docker compose exec postgres psql -U postgres -d simple_store
```

### Reset Database Volume (Clean Slate):
```bash
docker compose down -v
docker compose up --build
```
