import { Server } from 'socket.io';
import { server} from './httpServer.js';

    // Attacco socket.io al server http
const io = new Server(server, {
  cors: { origin: "*" }
});


io.on('connection', (socket) => {
  console.log('🔌 Nuovo client connesso:', socket.id);

  socket.on('clientMessage', (data) => {
    console.log('📩 Messaggio dal client:', data);
  });

  socket.emit('message', 'Benvenuto al server con socket.io!');
});

