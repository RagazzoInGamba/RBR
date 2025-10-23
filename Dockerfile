# Red Bull Racing Meal Booking Platform - Optimized Multi-Stage Build
# Based on TurniShift Pro patterns (<100MB final image)

# Stage 1: Dependencies (Production only)
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Stage 2: Builder (Includes all dependencies for building)
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install ALL dependencies (including devDependencies needed for build)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Stage 3: Runner (Production - Optimized)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install runtime dependencies
RUN apk add --no-cache curl wget

# Create system user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build (includes all necessary node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public directory if it exists
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma schema (needed for migrations, not for runtime)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Create logs directory with proper permissions for Winston logger
RUN mkdir -p logs && chown -R nextjs:nodejs logs

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
