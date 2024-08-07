FROM node:20-alpine as builder
RUN mkdir /app
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package*.json /app/
RUN apk add --no-cache make gcc g++ python3 && \
    npm install --production --silent && \
    apk del make gcc g++ python3
RUN npm install

FROM node:20-alpine
RUN mkdir /app
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

COPY package*.json /app/
COPY . /app

COPY --from=builder /app/node_modules /app/node_modules

ENV PORT=8080
EXPOSE 8080
CMD [ "node", "server.js" ]
