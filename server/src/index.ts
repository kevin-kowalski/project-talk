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
} from "./matching";

const app = new Koa();
// const ORIGIN = 'https://cuddly-vaguely-lark.ngrok-free.app';

// Serve the React client build folder as static files
app.use(serve(path.join(__dirname, '../../client/build')));

const server = http.createServer(app.callback());
export const io = socketIO(server, {
  // cors: {
  //   origin: ORIGIN,
  //   methods: ['GET', 'POST'],
  //   credentials: true
  // }
});

// Set up socket connection to clients
io.on('connection', (socket: Socket) => {
  socket.on('userConnected', (data: GeolocationPosition) => {
    handleUserConnected(socket, data);
  })

  socket.on('disconnect', () => {
    handleUserDisconnected(socket);
  });

  socket.on('requestMatch', () => {
    handleRequestMatch(socket);
  })

  socket.on('tryCall', (data) => {
    handleTryCall(data);
  })

  socket.on('answerCall', (data) => {
    handleAnswerCall(data);
  })
});

server.listen(80, () => {
  console.log('listens…');
});