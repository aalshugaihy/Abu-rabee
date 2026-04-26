# --- Build stage: compile the API to JS ---------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate
RUN npm run build

# Drop dev dependencies from node_modules for a lean runtime image.
RUN npm prune --omit=dev

# --- Runtime stage ------------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Persist SQLite data outside the image's read-only layers.
VOLUME /app/prisma

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

# wget ships with alpine; use it for healthchecks.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:4000/health || exit 1

EXPOSE 4000

# `prisma db push` is idempotent and fast — applies the schema on first boot.
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && node --enable-source-maps dist/index.js"]
