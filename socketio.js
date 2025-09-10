import { Server } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Server con socket.io');
});

export const io = new Server(httpServer);


httpServer.listen(4000, () => {
  console.log('🚀 Server in ascolto su http://localhost:3000');
});