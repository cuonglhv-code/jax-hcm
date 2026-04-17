# ── Stage 1: shared builder ───────────────────
FROM node:20-alpine AS shared-builder
WORKDIR /app/shared
COPY shared/package*.json ./
RUN npm ci
COPY shared/ ./
RUN npm run build

# ── Stage 2: server builder ───────────────────
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
COPY --from=shared-builder /app/shared /app/shared
RUN npm run build

# ── Stage 3: client builder ───────────────────
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
COPY --from=shared-builder /app/shared /app/shared
RUN npm run build

# ── Stage 4: production runtime ──────────────
FROM node:20-alpine AS production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Server production deps only
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Built artifacts
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=client-builder /app/client/dist ./client/dist
COPY --from=shared-builder /app/shared/dist ./shared/dist

# uploads directory
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app
USER appuser

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "server/dist/server/src/app.js"]
