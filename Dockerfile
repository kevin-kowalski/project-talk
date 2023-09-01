
FROM node:latest

WORKDIR /app

COPY package*.json .

COPY server/package*.json ./server/
RUN cd server && npm install
COPY server ./server
RUN cd server && npm run build

COPY client/package*.json ./client/
RUN cd client && npm install
COPY client ./client
RUN cd client && npm run build

ENV PORT=3000
EXPOSE 3000
CMD [ "npm", "start" ]