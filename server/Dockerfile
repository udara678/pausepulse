# ========================================================
# Production Dockerfile for PausePulse Express Backend API
# ========================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
COPY tsconfig*.json ./
RUN npm ci

# Copy Prisma schema and generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code and build TypeScript
COPY src ./src
RUN npm run build

# ========================================================
# Runner Stage
# ========================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy generated Prisma Client and built JS from builder stage
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000

HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/api/health || exit 0

CMD ["node", "dist/index.js"]
