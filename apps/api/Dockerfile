# RelayBoard API Dockerfile
# Multi-stage build for production optimization

FROM node:20-alpine AS base
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.11.0 --activate

# Copy workspace files
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ./
COPY ../../turbo.json ./

# Copy API package.json
COPY apps/api/package.json apps/api/

# Install dependencies
RUN pnpm i --frozen-lockfile --filter @relayboard/api...

# Copy source code
COPY apps/api ./apps/api

# Build stage
FROM base AS builder
WORKDIR /app/apps/api
RUN pnpm build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.11.0 --activate

# Copy workspace files
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ./
COPY ../../turbo.json ./

# Copy API package.json
COPY apps/api/package.json apps/api/

# Install production dependencies only
RUN pnpm i --frozen-lockfile --filter @relayboard/api... --prod

# Copy built application
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Set environment
ENV NODE_ENV=production
ENV API_PORT=4000

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]
