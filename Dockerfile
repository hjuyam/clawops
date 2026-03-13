FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/frontend/package*.json ./packages/frontend/
COPY packages/shared/package*.json ./packages/shared/

RUN npm ci

COPY . .

RUN npm run build:backend
RUN npm run build:frontend

FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=builder /app/node_modules ./node_modules

RUN mkdir -p /app/data /app/config /app/backups

ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_PATH=/app/data/clawops.db
ENV CONFIG_DIR=/app/config
ENV BACKUP_DIR=/app/backups

EXPOSE 3001

CMD ["node", "packages/backend/dist/index.js"]
