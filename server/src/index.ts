import { Socket } from "socket.io";

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

  socket.on('disconnect', () => {
    console.log(`Socket ${socket.id} disconnected`);
  });

  socket.on('userConnected', (data: GeolocationPosition) => {
    console.log(data);
  })

  socket.on('initiateCall', (data: any) => {
    console.log(data);
  })
});

server.listen(3001, () => {
  console.log('listens…');
});