import Koa from 'koa';
import config from './config';
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

// Serve the React client build folder as static files
app.use(serve(path.join(__dirname, '../../client/build')));

const server = http.createServer(app.callback());
export const io = socketIO(server, {});

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

server.listen(config.port, () => {
  console.log(`>> Server listens on port :${config.port}`);
});