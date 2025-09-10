import { Server } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Server con socket.io');
});


io.on('connection', (socket) => {
  console.log('🔌 Nuovo client connesso:', socket.id);

  socket.on('clientMessage', (data) => {
    console.log('📩 Messaggio dal client:', data);
  });

  socket.emit('message', 'Benvenuto al server con socket.io!');
});

export const io = new Server(httpServer, {
  cors: {
    origin: "*", // permette a tutti i client di connettersi
  },
});

httpServer.listen(4000, () => {
  console.log('🚀 Server in ascolto su http://localhost:4000');
});