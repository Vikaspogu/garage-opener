# FROM arm32v7/node:alpine as builder
FROM node:15.5.1-alpine3.10 as builder
RUN mkdir /app
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json /app/package.json
RUN apk add --no-cache make gcc g++ python && \
    npm install --production --silent && \
    apk del make gcc g++ python
RUN npm install

# Add the files to arm image
# FROM arm32v7/node:alpine
FROM node:15.5.1-slim
RUN mkdir /app
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

ADD package.json /app/package.json
ADD package-lock.json /app/package-lock.json
ADD . /app

COPY --from=builder /app/node_modules /app/node_modules

ENV PORT=8080
EXPOSE 8080
CMD [ "npm", "start" ]
