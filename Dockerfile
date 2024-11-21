FROM node:20-alpine
WORKDIR /usr/src/app

COPY src/package*.json ./
RUN npm ci

COPY src .
ENTRYPOINT [ "node", "bin/www" ]
