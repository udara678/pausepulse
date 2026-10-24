# ========================================================
# Production Dockerfile for PausePulse Express Backend API
# ========================================================
FROM node:20-slim AS builder

WORKDIR /app

# Install openssl for Prisma query engine
RUN apt-get update -y && apt-get install -y openssl

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
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install openssl runtime for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy generated Prisma Client and built JS from builder stage
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000

CMD ["node", "dist/index.js"]
