FROM node:latest

WORKDIR /usr/src/app

COPY ./package.json ./
COPY ./package-lock.json ./
RUN npm install

COPY ./bot.js ./
COPY ./server.js ./

EXPOSE 8080

RUN npm install -g concurrently

CMD ["concurrently", "node server.js", "node bot.js"]