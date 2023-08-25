import dotenv from 'dotenv';
import Koa from 'koa';
import serve from 'koa-static';
import path from 'path';
import http from 'http';
const socketIO = require('socket.io');
import { Socket } from 'socket.io';

import {
  handleRequestMatch,
  handleUserConnected,
  handleUserDisconnected,
  handleTryCall,
  handleAnswerCall,
  handleCallDisconnect
} from "./matching";

const app = new Koa();

dotenv.config();
const PORT = process.env.PORT || 80;
const ORIGIN = process.env.ORIGIN || 'http://127.0.0.1:80';

// Serve the React client build folder as static files
app.use(serve(path.join(__dirname, '../../client/build')));

const server = http.createServer(app.callback());
export const io = socketIO(server, {
  cors: {
    origin: ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Set up socket connection to clients
io.on('connection', (socket: Socket) => {
  socket.on('userConnected', (data: GeolocationPosition) => {
    handleUserConnected(socket, data);
  });

  socket.on('disconnect', () => {
    handleUserDisconnected(socket);
  });

  socket.on('requestMatch', () => {
    handleRequestMatch(socket);
  });

  socket.on('tryCall', (data) => {
    handleTryCall(data);
  });

  socket.on('answerCall', (data) => {
    handleAnswerCall(data);
  });

  socket.on('callDisconnect', (data) => {
    handleCallDisconnect(data);
  });
});

server.listen(PORT, () => {
  console.log(`>> Server listens on port :${PORT}`);
});