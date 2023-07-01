FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn install --frozen-lockfile

COPY tsconfig.json .
COPY src/ .

RUN yarn build

FROM node:18-alpine

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn install --frozen-lockfile --production

COPY --from=builder /app/lib/ lib

ENTRYPOINT [ "yarn", "start" ]
