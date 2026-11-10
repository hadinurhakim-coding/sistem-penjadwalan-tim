# Multi-stage Dockerfile for Next.js 16 Standalone
FROM node:22-alpine AS base
RUN npm install --global pnpm@11.11.0

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js telemetry disable during build
ENV NEXT_TELEMETRY_DISABLED=1

# Better Auth initializes during compilation. This throwaway build-only value is
# never stored in ENV; the running container must receive its own real secret.
RUN BETTER_AUTH_SECRET=$(node -p "require('node:crypto').randomBytes(32).toString('hex')") pnpm build

# Production runner image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create data directory for JSON persistence and assign permissions
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

COPY --from=builder /app/public ./public

# Set correct permissions for prerender cache & standalone output
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Runtime data is supplied by the volume, never baked into the image.

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
