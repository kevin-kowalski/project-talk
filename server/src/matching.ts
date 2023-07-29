import { Socket } from 'socket.io';
import { io } from './index';

// Store users’ positions in dictionaries using socket.id as the key
// Available users
let users: { [id: string]: GeolocationPosition } = {};
// Blocked users
let blockedUsers: { [id: string]: GeolocationPosition } = {};

// Handle user connection event
export const handleUserConnected = (socket: Socket, position: GeolocationPosition) => {
  console.log(`\n> Connected: ${socket.id}\n  Position:`, position);
  // Store the user’s position based on their socket.id
  users[socket.id] = position;
};

// Handle user disconnection event
export const handleUserDisconnected = (socket: Socket) => {
  console.log(`\n> Disconnected: ${socket.id}`);
  // Delete the user from both dictionaries
  // (only happens if they were present)
  delete users[socket.id];
  delete blockedUsers[socket.id];
};

// Handle user’s request for a match
export const handleRequestMatch = (socket: Socket) => {
  console.log(`\n> Match requested from: ${socket.id}`);

  // Find a match for the user
  const matchSocketId = selectMatch(socket);

  // Ensure a match was found
  if (matchSocketId) {
    // Emit the match details to the user
    socket.emit('matchFound', { matchSocketId: matchSocketId });
    console.log(`\n> Match found: ${matchSocketId}`);
  }
};

// Forward WebRTC signal data from caller to callee
export const handleTryCall = ({ from, to, signalData }: { from: any, to: any, signalData: any }) => {
  io.to(to).emit('callRequest', { from, signalData });
  console.log(`\n> Forwarded WebRTC signal data:\n  from: ${from} (caller)\n  to:   ${to} (callee)`);
};

// Forward WebRTC signal answer data from callee back to caller
export const handleAnswerCall = ({ from, to, signalData }: { from: any, to: any, signalData: any }) => {
  io.to(to).emit('callAnswer', { from, signalData });
  console.log(`\n> Forwarded WebRTC signal answer data:\n  from: ${from} (callee)\n  to:   ${to} (caller)`);

  // Copy caller and callee’s data to dictionary of blocked users
  blockedUsers[from] = users[from];
  blockedUsers[to] = users[to];

  // Remove caller and callee from dictionary of available users
  delete users[from];
  delete users[to];
};


// Helpers

// Select the user with the most distant position
// from the current user’s position
const selectMatch = (socket: Socket) => {
  const userIds = Object.keys(users);
  const user = {
    id: socket.id,
    position: users[socket.id]
  };

  // Ensure there are enough users looking for a match
  if (userIds.length < 2) {
    console.log(`\n>> Error: Not enough users connected (${userIds.length})`);
    // Emit an error event to the user
    socket.emit('error', {
      error: true,
      message: `Not enough users connected (${userIds.length})`
    })
    return null;
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
      u.position.coords.longitude,
    )
  }));

  const userMostDistant = userIdsWithDistance.reduce((acc, user) => {
    return user.distance > acc.distance ? user : acc;
  });

  return userMostDistant.id;
}

// Calculate the distance in km between two pairs of
// geolocation position coordinates
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
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

// Convert degrees to radians
const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180)
}