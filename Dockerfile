# Multi-stage build for MeetGold Backend with Embedded MariaDB (MySQL)
FROM node:20-bookworm-slim AS builder

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

# Production image with MariaDB
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV DB_HOST=127.0.0.1
ENV DB_PORT=3306
ENV DB_USER=root
ENV DB_PASSWORD=admin
ENV DB_NAME=meetdraw_db
ENV DB_SSL=false

# Install MariaDB server and client
RUN apt-get update && \
    apt-get install -y --no-install-recommends mariadb-server mariadb-client && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/

# Install production dependencies only
RUN npm install --omit=dev

# Copy compiled code from builder
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist
COPY server/src/db ./server/src/db

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 5000

CMD ["./docker-entrypoint.sh"]
