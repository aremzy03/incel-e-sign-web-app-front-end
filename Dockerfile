# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
# Only NEXT_PUBLIC_API_URL is needed at build time (embedded in client bundle)
# Server-only variables (NEXTAUTH_SECRET, NEXTAUTH_URL) must be provided at build-time
# for validation, but should be overridden at runtime via environment variables
ARG NEXT_PUBLIC_API_URL=http://localhost:8000/api
ARG NEXTAUTH_URL=http://localhost:3000
ARG NEXTAUTH_SECRET=build-placeholder-must-override-at-runtime
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# Build the application
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json* ./package-lock.json

# Install only production dependencies and clean npm cache
RUN npm ci --omit=dev && \
    npm cache clean --force && \
    rm -rf /tmp/*

# Copy built application and static files
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy next.config.js (required at runtime)
COPY --from=builder /app/next.config.js ./next.config.js

# Switch to non-root user
USER nextjs

# Expose port 3000
EXPOSE 3000

# Set the port as an environment variable
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["npm", "start"]
