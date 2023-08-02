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

// STEP 1: Set your port here.
//
// const PORT = 80;

// STEP 2: This is the URL, that is used by the front-end
// to connect via socket.io to the back-end server.
//
// Change it to the URL provided by ngrok, or your
// localhost:port that your server is set to.
//
// const ORIGIN = 'http://127.0.0.1:80';

// Serve the React client build folder as static files
app.use(serve(path.join(__dirname, '../../client/build')));

const server = http.createServer(app.callback());
export const io = socketIO(server, {
  cors: {
    origin: ORIGIN, // See above ^
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

server.listen(PORT, () => { // See above ^
  console.log('listens…');
});