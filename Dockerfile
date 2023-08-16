FROM node:14-alpine
WORKDIR /usr/src/app

COPY src/package*.json ./
RUN npm ci

COPY src .

# The following commands is handled in docker-compose.yml. Uncomment if you want to run them here.

# ENTRYPOINT ["npm", "run", "dev"]