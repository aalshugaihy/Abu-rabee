FROM node:20-alpine
WORKDIR /app

# Install deps with cached layer.
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy source + Prisma schema.
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Generate Prisma client + push schema + start.
CMD ["sh", "-c", "npx prisma generate && npx prisma db push --skip-generate --accept-data-loss && node --enable-source-maps --import tsx src/index.ts"]
