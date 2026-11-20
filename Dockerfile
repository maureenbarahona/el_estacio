# syntax=docker/dockerfile:1

# ==============================================================================
# Stage 1: Build static bundle (Node.js 22 Alpine)
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests first to maximize Docker layer caching
COPY package.json package-lock.json* bun.lock* ./

# Install dependencies cleanly
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund; \
    else \
      npm install --no-audit --no-fund; \
    fi

# Copy application source and compile production bundle
COPY . .
RUN npm run build

# ==============================================================================
# Stage 2: Lightweight, non-root production runtime (Nginx Unprivileged)
# ==============================================================================
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runner

# Cloud Run injects PORT dynamically; fallback to 8080
ENV PORT=8080 \
    NGINX_ENVSUBST_FILTER=PORT

# Copy custom Nginx template (processed by entrypoint envsubst)
COPY --chown=101:101 nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Copy compiled static assets from builder stage
COPY --from=builder --chown=101:101 /app/dist /usr/share/nginx/html

# Enforce non-root execution (nginx unprivileged UID 101)
USER 101

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
