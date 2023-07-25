FROM node:20.5.0-bullseye-slim AS build

WORKDIR /bot
COPY package.json package-lock.json tsconfig.json ./
RUN npm install
COPY src/ ./src/
COPY prisma/ ./prisma/
RUN npx prisma generate
RUN npm run build
COPY archive/ ./archive/

FROM node:20.5.0-bullseye-slim
WORKDIR /bot
COPY --from=build /bot/node_modules /bot/node_modules
COPY --from=build /bot/build /bot/build
COPY --from=build /bot/prisma /bot/prisma
COPY --from=build /bot/archive /bot/archive
COPY --from=build /bot/package.json /bot/package.json
COPY --from=build /bot/tsconfig.json /bot/tsconfig.json
RUN apt-get update && apt-get install -y wget git unzip

CMD ["npm", "start"]