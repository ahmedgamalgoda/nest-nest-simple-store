# ==========================================
# Stage 1: Build stage
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install native dependencies required by native packages like bcrypt
RUN apk add --no-cache python3 make g++

# Copy package manifests for dependency layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies required for building)
RUN npm ci

# Copy application source code and configuration files
COPY nest-cli.json tsconfig*.json prisma.config.ts ./
COPY src/ ./src/

# Compile TypeScript into production JavaScript in dist/
RUN npm run build

# Remove development dependencies to keep production footprint minimal
RUN npm prune --omit=dev

# ==========================================
# Stage 2: Production runtime stage
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Install dumb-init for graceful signal handling (SIGTERM / SIGINT)
RUN apk add --no-cache dumb-init

# Copy production node_modules from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy compiled JavaScript distribution files
COPY --from=builder /app/dist ./dist

# Run container as non-root user 'node' for security
USER node

# Expose backend application port
EXPOSE 3001

# Start the NestJS application with dumb-init
CMD ["dumb-init", "node", "dist/main.js"]
