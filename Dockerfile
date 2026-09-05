FROM node:22-alpine AS build
WORKDIR /bot
COPY package.json package-lock.json tsconfig.json prisma.config.ts ./
RUN npm ci
COPY src/ ./src/
COPY prisma/ ./prisma/
RUN npm run build

FROM node:22-alpine AS packages
WORKDIR /bot
COPY package.json package-lock.json ./
# --omit=optional drops @prisma/client's optional peers (the prisma CLI and typescript),
# which npm otherwise keeps in the runtime tree along with Prisma Studio.
RUN npm ci --omit=dev --omit=optional

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /bot
COPY --from=packages /bot/node_modules ./node_modules
COPY --from=build /bot/build ./build
COPY --from=build /bot/prisma ./prisma
COPY package.json fetch.sh ./
CMD ["npm", "start"]
