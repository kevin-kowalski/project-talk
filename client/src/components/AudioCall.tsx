import { useEffect, useRef, useState } from 'react';
import * as SocketIOClient from 'socket.io-client';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import CablesPatch from './CablesPatch';
import SimplePeer from 'simple-peer';

// const ENDPOINT = 'http://127.0.0.1:80';
const ENDPOINT = 'https://cuddly-vaguely-lark.ngrok-free.app';

const AudioCall = () => {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<{error: Boolean, message: String} | null>(null);
  const [socket, setSocket] = useState<SocketIOClient.Socket | null>(null);

  const [matchedCallee, setMatchedCallee] = useState<string | null>(null);
  const [matchedCalleeDistance, setMatchedCalleeDistance] = useState<number | null>(null);
  const [matchedCaller, setMatchedCaller] = useState<string | null>(null);
  const [matchedCallerData, setMatchedCallerData] = useState<{from: string, signalData: any} | null>(null);

  const [peerConnection, setPeerConnection] = useState<SimplePeer.Instance | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | undefined>(undefined);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const [remoteStream, setRemoteStream] = useState<MediaStream | undefined>(undefined);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const [analyzerRemote, setAnalyzerRemote] = useState<AnalyserNode | null>(null);
  const [bufferLengthRemote, setBufferLengthRemote] = useState<number>(0);
  const [dataArrayRemote, setDataArrayRemote] = useState<Uint8Array | null>(null);

  const [inCall, setInCall] = useState(false);

  // Requesting user’s geolocation position
  useEffect(() => {
    const options = {
      enableHighAccuracy: true,
      // timeout: 5000,
      maximumAge: 0
    };

    const successCallback = (position: GeolocationPosition) => {
      setPosition(position);
    };

    const errorCallback = (geoError: GeolocationPositionError) => {
      setError({
        error: true,
        message: `Failed to get user location${geoError.message ? ': ' + geoError.message : ''}`
      });
    };

    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
  }, []);

  // Set up socket connection for user
  useEffect(() => {
    const newSocket = io(ENDPOINT);
    setSocket(newSocket);

    newSocket.on('error', (error) => {
      setError(error);
    })

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
        .getUserMedia({ audio: true, video: false })
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
  }, [position, error]);

  // Request remote id
  const requestMatch = () => {
    console.log('Requesting callee…');

    if (socket) {
      socket.emit('requestMatch', { fromUser: socket.id });
      console.log('"requestMatch" emitted');

      socket.on('matchFound', ({ matchSocketId, matchDistance }: { matchSocketId: string, matchDistance: number }) => {
        console.log(`Match found: ${matchSocketId} (distance: ${matchDistance})`);
        setMatchedCallee(matchSocketId);
        // setMatchedCalleeDistance(matchDistance);
        setMatchedCalleeDistance(11781.36);
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

      setPeerConnection(peerCaller);

      peerCaller.on('connect', () => {
        setInCall(true);
      })

      peerCaller.on('close', () => {
        setInCall(false);
        setMatchedCaller(null);
        setMatchedCallee(null);
        setRemoteStream(undefined);
        peerCaller.destroy();
      })

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

  useEffect(() => {
    if (remoteStream) {
      processRemoteStream(remoteStream)
    }
  }, [remoteStream])

  const processRemoteStream = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    // setSourceNode(source);

    // Create and play audio element
    const mediaElement = new Audio();
    const mediaElementSource = audioContext.createMediaElementSource(mediaElement);
    mediaElementSource.connect(audioContext.destination);
    mediaElement.srcObject = source.mediaStream;
    mediaElement.play();


    const analyzer = audioContext.createAnalyser();
    source.connect(analyzer);
    analyzer.fftSize = 128;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    setAnalyzerRemote(analyzer);
    setBufferLengthRemote(bufferLength);
    setDataArrayRemote(dataArray);
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

      setPeerConnection(peerCallee);

      peerCallee.on('connect', () => {
        setInCall(true);
      })

      peerCallee.on('close', () => {
        setInCall(false);
        setMatchedCaller(null);
        setMatchedCallee(null);
        setRemoteStream(undefined);
        peerCallee.destroy();
      })

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
      if (matchedCaller === from) {
        peerCallee.signal(signalData);
      }
      else {
        console.log('Call request from different user than matched');
      }
    }
  }

  // Leave the call
  const leaveCall = () => {
    // To do
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
    }

    // Send signal to close peer connection
    if (socket && (matchedCaller || matchedCallee)) {
      socket.emit('callDisconnect', {
        from: socket.id,
        to: matchedCaller || matchedCallee
      });
    }

    // Close peer connection
    if (peerConnection) {
      peerConnection.destroy();
    }

    // Update state variables
    setInCall(false);
    setMatchedCaller(null);
    setMatchedCallee(null);
    setRemoteStream(undefined);
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

  // Clean up when before component is unmounted
  useEffect(() => {
    return () => {
      leaveCall();
    }
  }, [])

  // Render component
  return (
    <div>
      {error && (
        <p className='system-message'>Error: {error.message}</p>
      )}

      {!error && !position && (
        <p>Requesting user location...</p>
      )}

      {!error && position && !localStream && (
        <p>Requesting user media...</p>
      )}

      {!error && socket && position && localStream && !remoteStream && (
        <p className='system-message'>Connected as: {socket.id}</p>
      )}

      {!error && position && localStream && remoteStream && (
        <p className='system-message'>Connected to: {matchedCaller || matchedCallee}</p>
      )}

      {!error && position && localStream && remoteStream && (
        <p>{matchedCalleeDistance ? (`Distance: ${matchedCalleeDistance === 0.00 ? '<' : ''}${matchedCalleeDistance} km`) : ''}</p>
      )}

      {/* {localStream && (
        <div className={`symbol-recording${remoteStream ? ' live' : ''}`}></div>
      )} */}

      <CablesPatch
        requestMatch={requestMatch}
        leaveCall={leaveCall}
        analyzerRemote={analyzerRemote}
        bufferLengthRemote={bufferLengthRemote}
        dataArrayRemote={dataArrayRemote}
        inCall={inCall}
        error={error}
        setError={setError}
      />
    </div>
  );
};

export default AudioCall;
