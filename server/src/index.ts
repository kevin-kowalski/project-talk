import { Socket } from "socket.io";
import { handleInitialCall, handleUserConnected, handleUserDisconnected } from "./matching";

const Koa = require('koa');
const http = require('http');
const socketIO = require('socket.io');

const app = new Koa();

const server = http.createServer(app.callback());
const io = socketIO(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket: Socket) => {
  console.log(`Socket ${socket.id} connected`);

  socket.on('userConnected', (data: GeolocationPosition) => {
    console.log('userConnected, data:', data);
    handleUserConnected(socket, data);
  })

  socket.on('disconnect', () => {
    console.log(`Socket ${socket.id} disconnected`);
    handleUserDisconnected(socket);
  });

  socket.on('initiateCall', () => {
    console.log('initiateCall');
    handleInitialCall(socket);
  })
});

server.listen(3001, () => {
  console.log('listens…');
});