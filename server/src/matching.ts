import { Socket } from "socket.io";

let users: { [id: string]: GeolocationPosition } = {};

export const handleUserConnected = (socket: Socket, position: GeolocationPosition) => {
  console.log('handleUserConnected: position:', position);

  users[socket.id] = position;
  console.log(`User ${socket.id} connected:`, position);
}

export const handleUserDisconnected = (socket: Socket) => {
  delete users[socket.id];
  console.log(`User ${socket.id} disconnected`);
}

export const handleInitialCall = (socket: Socket) => {
  const userIds = Object.keys(users);
  const user = {
    id: socket.id,
    position: users[socket.id]
  };

  // Ensure there are enough users looking for a match
  if (userIds.length < 2) {
    console.log(`Not enough users connected (${userIds.length})`);
    return;
  }

  // Find most distant user
  const userIdsWithPositions = userIds.filter((uid) => uid !== user.id).map(id => ({
    id,
    position: users[id]
  }));

  const userIdsWithDistance = userIdsWithPositions.map(u => ({
    ...u,
    distance: getDistance(
      user.position.coords.latitude,
      user.position.coords.longitude,
      u.position.coords.latitude,
      u.position.coords.longitude
    )
  }));

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