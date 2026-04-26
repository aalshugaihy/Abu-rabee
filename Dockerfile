# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

# `VITE_API_URL` and `VITE_BASE` need to be present at *build* time
# because Vite inlines them into the bundle. Default to "" so the app
# works in localStorage-only mode if no backend is wired up.
ARG VITE_API_URL=""
ARG VITE_BASE="/"
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BASE=$VITE_BASE

COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# --- Runtime stage ---
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Make the SPA fallback always available even if the built bundle didn't ship it.
RUN [ -f /usr/share/nginx/html/404.html ] || cp /usr/share/nginx/html/index.html /usr/share/nginx/html/404.html

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
