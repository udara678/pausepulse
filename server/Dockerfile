FROM node:20

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./
COPY tsconfig*.json ./

# Install exact dependencies
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy application source code and compile TypeScript
COPY src ./src
RUN npm run build

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "dist/index.js"]
