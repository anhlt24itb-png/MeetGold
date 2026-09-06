# Multi-stage build for MeetGold Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy configuration and manifests
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY tsconfig.base.json ./

# Copy source code
COPY shared ./shared
COPY server ./server

# Install dependencies and build shared + server
RUN npm install
RUN npm run build:shared
RUN npm run build:server

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/

# Install only production dependencies
RUN npm install --omit=dev

# Copy built code from builder stage
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist
COPY server/src/db ./server/src/db

EXPOSE 5000

CMD ["node", "server/dist/server.js"]
