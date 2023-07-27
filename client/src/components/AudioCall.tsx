import { useEffect, useState } from 'react';
import * as SocketIOClient from 'socket.io-client';
import socketIOClient from 'socket.io-client';

const ENDPOINT = 'http://localhost:3001';

const AudioCall = () => {
  const [socket, setSocket] = useState<SocketIOClient.Socket | null>(null);
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);

  useEffect(() => {
    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    const successCallback = (pos: GeolocationPosition) => {
      setPosition(pos);
    };

    const errorCallback = (err: GeolocationPositionError) => {
      setError(err);
    };

    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
  }, []);

  useEffect(() => {
    if (position && !error) {
      const socket = socketIOClient(ENDPOINT);

      socket.on('connect', () => {
        console.log('Connected to server');

        socket.emit('userConnected', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      });

      setSocket(socket);
    }
  }, [position, error]);

  const handleCallClick = () => {
    if (socket) {
      socket.emit('initiateCall');
    }
  };

  return (
    <div>
      {error && <div>Failed to get user location: {error.message}</div>}
      {!position && !error && <div>Getting user location...</div>}
      {position && !error && <button onClick={handleCallClick}>Call</button>}
    </div>
  );
};

export default AudioCall;