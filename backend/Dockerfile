# Stage 1: Build the NestJS application
FROM node:20-alpine AS builder

# Install pnpm package manager
RUN npm install -g pnpm

WORKDIR /usr/src/app

# Copy dependency manifests
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for building)
RUN pnpm install --frozen-lockfile

# Copy application source code
COPY . .

# Build the production bundle
RUN pnpm run build

# Stage 2: Production execution
FROM node:20-alpine AS runner

RUN npm install -g pnpm

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy build artifacts and seed file from builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/seed_vehicles.json ./seed_vehicles.json

# Expose port
EXPOSE 3000

# Run the app
CMD ["node", "dist/main"]
