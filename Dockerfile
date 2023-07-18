FROM node:20.4.0-alpine3.18
WORKDIR /bot
COPY . .
RUN npm install
CMD ["npm", "start"]