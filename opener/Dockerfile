# Fetch node_modules for backend, nothing here except 
# the node_modules dir ends up in the final image
FROM arm32v7/node:alpine as builder
RUN mkdir /app
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json /app/package.json
RUN apk add --no-cache make gcc g++ python && \
    npm install --production --silent && \
    apk del make gcc g++ python
RUN npm install

# Add the files to arm image
FROM arm32v7/node:alpine
RUN mkdir /app
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

# Same as earlier, be specific or copy everything
ADD package.json /app/package.json
ADD package-lock.json /app/package-lock.json
ADD . /app

COPY --from=builder /app/node_modules /app/node_modules

ENV PORT=8080
EXPOSE 8080
CMD [ "npm", "start" ]
