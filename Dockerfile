# ============================================================================
# Dockerfile — Club Crumbs Test Environment
# Allows testing the application as club-admin / club-leader without real API keys
# ============================================================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . ./

# Build-time environment variables for Next.js test-only bundle
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_ENABLE_TEST_AUTH=true
ENV ENABLE_TEST_DOCKER=true
ENV ENABLE_TEST_AUTH=true
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y2xlcmsuY2x1Yi1jcnVtYnMudGVzdCQ=
ENV CLERK_SECRET_KEY=sk_test_mocksecretkey1234567890abcdefghijklmnopqrstuvwxyz
ENV PORT=3000

RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Mock credentials and test environment flag defaults for test mode
ENV NEXT_PUBLIC_ENABLE_TEST_AUTH=true
ENV ENABLE_TEST_DOCKER=true
ENV ENABLE_TEST_AUTH=true
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y2xlcmsuY2x1Yi1jcnVtYnMudGVzdCQ=
ENV CLERK_SECRET_KEY=sk_test_mocksecretkey1234567890abcdefghijklmnopqrstuvwxyz

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
