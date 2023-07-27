import './App.css';

import io from 'socket.io-client';
import AudioCall from './components/AudioCall';

const socket = io('http://127.0.0.1:3001', {
  withCredentials: true
});

socket.on('connect', () => {
  console.log(`Socket ${socket.id} connected`);
})

socket.on('disconnect', () => {
  console.log(`Socket ${socket.id} disconnected`);
});

function App() {
  return (
    <div className='app'>
      <h4>Project Talk</h4>
      <AudioCall />
    </div>
  );
}

export default App;
