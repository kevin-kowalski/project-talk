import { Socket } from "socket.io";

let users: { [id: string]: GeolocationPosition } = {};

export const handleUserConnected = (socket: Socket, position: GeolocationPosition) => {
  users[socket.id] = position;
  console.log(`User ${socket.id} connected:`, position);
}

export const handleUserDisconnected = (socket: Socket) => {
  delete users[socket.id];
  console.log(`User ${socket.id} disconnected`);
}

export const handleInitialCall = (socket: Socket, position: GeolocationPosition) => {
  const userIds = Object.keys(users);

  // Ensure there are enough users looking for a match
  if (userIds.length < 2) {
    console.log(`Not enough users connected (${userIds.length})`);
    return;
  }

  // Find most distant user
  const userIdsWithPositions = userIds.map(id => ({
    id,
    position: users[id]
  }));

  const userIdsWithDistance = userIdsWithPositions.map(user => ({
    ...user,
    distance: getDistance(position.coords.latitude, position.coords.longitude, user.position.coords.latitude, user.position.coords.longitude)
  }))

  const userMostDistant = userIdsWithDistance.reduce((acc, user) => {
    return user.distance > acc.distance ? user : acc;
  });

  const selectedUserId = userMostDistant.id;

  console.log(`Selected user id: ${selectedUserId}`);

  socket.emit('callMatched', {
    userId: selectedUserId
  });
}

// Helper functions for location distance calculation

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1); // deg2rad below
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180)
}