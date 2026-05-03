# Target linux/amd64 explicitly — Azure App Service runs AMD64 containers.
# When building on ARM (e.g. Raspberry Pi), use:
#   docker buildx build --platform linux/amd64 -t <image> .

FROM --platform=linux/amd64 node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Prune devDependencies; prisma is now in dependencies so it stays
RUN npm prune --omit=dev

FROM --platform=linux/amd64 node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone Next.js server (self-contained, includes traced node_modules)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma schema + migrations so migrate deploy can run at startup
COPY --from=builder /app/prisma ./prisma

# Copy Prisma CLI and engines — needed for `migrate deploy` at startup.
# The standalone output includes @prisma/client (query engine) but not the
# prisma CLI or @prisma/engines (migration engine), so we add them here.
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma/engines ./node_modules/@prisma/engines
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

COPY startup.sh ./
RUN chmod +x startup.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "startup.sh"]
