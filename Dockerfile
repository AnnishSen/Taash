# ==========================================
# STAGE 1: Build the React + Vite Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==========================================
# STAGE 2: Build the Node.js + TypeScript Backend
# ==========================================
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
COPY backend/prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY backend/ ./
RUN npm run build

# ==========================================
# STAGE 3: Production Runner Image
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install OpenSSL for Prisma engine compatibility
RUN apk add --no-cache openssl

# Copy backend package and install production dependencies
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

RUN npm ci --omit=dev
RUN npx prisma generate

# Copy compiled backend dist and generated lib
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/lib ./lib

# Copy built frontend into public directory for unified single-server serving
COPY --from=frontend-builder /app/frontend/dist ./public

EXPOSE 8080

CMD ["npm", "run", "start:prod"]
