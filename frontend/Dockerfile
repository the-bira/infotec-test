# Stage 1: Build the Angular application
FROM node:20-alpine AS builder

# Install pnpm package manager
RUN npm install -g pnpm

WORKDIR /usr/src/app

# Copy root monorepo configuration and lockfile
COPY pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package descriptors for monorepo filters
COPY shared/package.json ./shared/
COPY frontend/package.json ./frontend/

# Install dependencies for the monorepo workspace (focusing on frontend and shared)
RUN pnpm install --filter frontend... --filter shared --no-frozen-lockfile

# Copy codebase
COPY shared ./shared
COPY frontend ./frontend

# Build the shared workspace library first
WORKDIR /usr/src/app/shared
RUN pnpm run build

# Build the Angular frontend application
WORKDIR /usr/src/app/frontend
RUN pnpm run build

# Stage 2: Serve the frontend application with Nginx
FROM nginx:alpine

# Copy built browser assets to Nginx html directory
COPY --from=builder /usr/src/app/frontend/dist/frontend/browser /usr/share/nginx/html

# Copy custom Nginx configuration for routing fallbacks
COPY --from=builder /usr/src/app/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose Nginx server port 80
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
