FROM node:20.4.0-alpine3.18 AS build
WORKDIR /bot
COPY package.json package-lock.json tsconfig.json ./
RUN npm install
COPY src/ ./src/
COPY prisma/ ./prisma/
COPY fetch.sh ./fetch.sh
RUN npx prisma generate
RUN npm run build

FROM node:20.4.0-alpine3.18 AS packages
WORKDIR /bot
COPY --from=build /bot/package.json /bot/package-lock.json ./
RUN npm ci --omit=dev

FROM node:20.4.0-alpine3.18
WORKDIR /bot
COPY --from=packages /bot/node_modules /bot/node_modules
COPY --from=build /bot/node_modules/.prisma /bot/node_modules/.prisma
COPY --from=build /bot/build /bot/build
COPY --from=build /bot/prisma /bot/prisma
COPY --from=build /bot/package.json /bot/package.json
COPY --from=build /bot/fetch.sh /bot/fetch.sh

CMD ["npm", "start"]
