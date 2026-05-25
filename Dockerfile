FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:22-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm ci
COPY server/ ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache curl speedtest-cli

COPY server/package.json server/package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=server-build /app/server/dist ./dist
COPY --from=client-build /app/client/dist ./public

RUN mkdir -p /app/data/uploads && \
    addgroup -g 1001 -S dockerdash && \
    adduser -S dockerdash -u 1001 -G dockerdash && \
    chown -R dockerdash:dockerdash /app

USER dockerdash

ARG BUILD_DATE
ARG VERSION=1.0.0

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data
ENV DOCKERDASH_VERSION=${VERSION}
ENV DOCKERDASH_BUILD_DATE=${BUILD_DATE}
EXPOSE 3000

LABEL org.opencontainers.image.title="DockerDash"
LABEL org.opencontainers.image.description="A self-hosted Docker dashboard with auto-detection and customizable widgets"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "dist/index.js"]
