import { useEffect, useRef, useState } from 'react';
import * as SocketIOClient from 'socket.io-client';
import io from 'socket.io-client';
import Peer from 'simple-peer';

// const ENDPOINT = 'http://127.0.0.1:80';
const ENDPOINT = 'https://cuddly-vaguely-lark.ngrok-free.app';

const AudioCall = () => {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [socket, setSocket] = useState<SocketIOClient.Socket | null>(null);

  const [matchedCallee, setMatchedCallee] = useState<string | null>(null);
  const [matchedCaller, setMatchedCaller] = useState<string | null>(null);
  const [matchedCallerData, setMatchedCallerData] = useState<{from: string, signalData: any} | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | undefined>(undefined);
  const [remoteStream, setRemoteStream] = useState<MediaStream | undefined>(undefined);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Requesting user’s geolocation position
  useEffect(() => {
    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    const successCallback = (position: GeolocationPosition) => {
      setPosition(position);
    };

    const errorCallback = (geoError: GeolocationPositionError) => {
      setError({
        ...geoError,
        message: `Failed to get user location${geoError.message ? ': ' + geoError.message : ''}`
      });
    };

    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
  }, []);

  // Set up socket connection for user
  useEffect(() => {
    const newSocket = io(ENDPOINT);
    setSocket(newSocket);

    if (position) {
      newSocket.on('connect', () => {
        console.log(`Connected to server with:\nsocket.id: ${newSocket.id}\nposition:`, position);

        newSocket.emit('userConnected', {
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          timestamp: position.timestamp
        });
      });

      newSocket.on('callRequest', (data) => {
        console.log('callRequest data:', data)
        console.log(`Call request received from user (id: ${data.from})`);

        setMatchedCallerData(data);
      })
    }

    return () => {
      newSocket.disconnect();
    };
  }, [position]);

  // Request the user’s media stream
  useEffect(() => {
    if (position && !error) {
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: true })
        .then((stream) => {
          console.log('Got media stream from user\nStream id:', stream.id);
          setLocalStream(stream);
        })
        .catch((error) => {
          setError({
            ...error,
            message: `Failed to access media stream: ${error.message}`
          });
        });
    }
  }, [position]);

  // Request remote id
  const requestMatch = () => {
    console.log('Requesting callee…');

    if (socket) {
      socket.emit('requestMatch', { fromUser: socket.id });
      console.log('"requestMatch" emitted');

      socket.on('matchFound', ({ matchSocketId }: { matchSocketId: string }) => {
        console.log(`Match found: ${matchSocketId}`);
        setMatchedCallee(matchSocketId);
      });
    }
  };

  // Initiate call
  useEffect(() => {
    if (matchedCallee) {
      callMatchedCallee();
    }
  }, [matchedCallee])

  // Call user helper
  const callMatchedCallee = () => {
    console.log('Calling matched user…');

    if (socket && matchedCallee) {
      const peerCaller = new Peer({
        initiator: true,
        trickle: false,
        stream: localStream,
      });

      peerCaller.on('signal', (data) => {
        socket.emit('tryCall', {
          from: socket.id,
          to: matchedCallee,
          signalData: data,
        })
      });

      peerCaller.on('stream', (stream) => {
        console.log(`Received stream from callee\nStream id: ${stream.id}`);
        setRemoteStream(stream);
      });

      socket.on('callAnswer', ({ signalData, from }) => {
        // Ensure the connection is established to the correct user
        if (matchedCallee === from) {
          peerCaller.signal(signalData);
        }
        else {
          console.log('Call answer from different user than matched');
        }
      });
    }
  };

  // Set the matched caller after
  // receiving the caller data
  useEffect(() => {
    if (matchedCallerData) {
      setMatchedCaller(matchedCallerData.from)
    }
  }, [matchedCallerData]);

  // Answer call
  useEffect(() => {
    if (matchedCallerData) {
      answerCall(matchedCallerData);
    }
  }, [matchedCaller]);

  // Answer call helper
  const answerCall = ({ from, signalData }: {from: string, signalData: any}) => {
    console.log('Answering call…');

    if (socket && matchedCaller) {
      const peerCallee = new Peer({
        initiator: false,
        trickle: false,
        stream: localStream,
      });

      peerCallee.on('signal', (data) => {
        socket.emit('answerCall', {
          from: socket.id,
          to: matchedCaller,
          signalData: data,
        })
      });

      peerCallee.on('stream', (stream) => {
        console.log(`Received stream from caller\nStream id: ${stream.id}`);
        setRemoteStream(stream);
      });

      // Ensure the connection is established to the correct user
      console.log('matchedCaller === from:', matchedCaller === from);
      if (matchedCaller === from) {
        peerCallee.signal(signalData);
      }
      else {
        console.log('Call request from different user than matched');
      }
    }
  }

  // Show the user’s media stream in the page
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play();
    }
  }, [localStream]);

  // Show the user’s media stream in the page
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play();
    }
  }, [remoteStream]);

  // Handle the user initiating the call
  const handleCallClick = () => {
    requestMatch();
  };

  // Render component
  return (
    <div>
      {error && <div>Failed to get user location: {error.message}</div>}
      {!position && !error && <div>Getting user location...</div>}
      {position && !error && localStream && (!matchedCallee && !matchedCaller) && (
        <button onClick={handleCallClick}>Call</button>
      )}
      {position && !error && localStream && (
        <div>
          <p>Match found!</p>
          <p>Matched user’s socket ID: {matchedCaller || matchedCallee}</p>
          {/* Show the other user's video stream */}
          {localStream && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '600px', maxWidth: '95%', height: 'auto' }}
            />
          )}
          {remoteStream && (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ width: '600px', maxWidth: '95%', height: 'auto'}}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default AudioCall;
