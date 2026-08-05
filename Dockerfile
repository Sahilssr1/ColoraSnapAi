FROM node:20-alpine AS builder

WORKDIR /app/backend

RUN apk add --no-cache openssl python3 make g++

COPY backend/package*.json ./
COPY backend/tsconfig.json ./
COPY backend/prisma ./prisma/

RUN npm install

COPY backend/src ./src

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app/backend

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=5000

COPY backend/package*.json ./
COPY backend/prisma ./prisma/

RUN npm install --omit=dev
RUN npx prisma generate

COPY --from=builder /app/backend/dist ./dist

RUN mkdir -p /app/backend/uploads && chown -R node:node /app

USER node

EXPOSE 5000

CMD ["node", "dist/server.js"]
