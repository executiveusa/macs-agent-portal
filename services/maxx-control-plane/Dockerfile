FROM node:20-alpine AS build

WORKDIR /app/services/maxx-control-plane
COPY services/maxx-control-plane/package*.json ./
RUN npm ci --no-audit --no-fund
COPY services/maxx-control-plane/tsconfig.json ./
COPY services/maxx-control-plane/src ./src
RUN npm run build && npm prune --omit=dev

FROM node:20-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app/services/maxx-control-plane

# Playwright's own bundled Chromium download requires glibc and does not run
# on Alpine's musl libc. Use Alpine's native chromium package instead (Phase
# 10 browser worker) so MAXX_BROWSER_ENABLED=true works locally in this
# container without requiring a remote CDP endpoint (MAXX_BROWSER_WS_ENDPOINT
# remains available as the alternative for a dedicated browser farm).
# NOTE: this image has not been built or run in this environment (no Docker
# daemon available) - verify `docker build` and a live browser action before
# relying on MAXX_BROWSER_ENABLED=true in this container.
RUN apk add --no-cache chromium
ENV MAXX_BROWSER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY --from=build /app/services/maxx-control-plane/package*.json ./
COPY --from=build /app/services/maxx-control-plane/node_modules ./node_modules
COPY --from=build /app/services/maxx-control-plane/dist ./dist
COPY workspaces/maxx /data/maxx
COPY pi-packages/maxx /app/pi-packages/maxx

RUN addgroup -S maxx && adduser -S maxx -G maxx && chown -R maxx:maxx /app /data/maxx
USER maxx

EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:8787/health/live || exit 1

CMD ["node", "dist/server.js"]
