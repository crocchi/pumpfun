import { Server } from 'socket.io';
import { botOptions } from './config.js';
import { instancesToken,instances } from './index.js';

let socketVar=null;
    // Attacco socket.io al server http
export const initSocket=(server)=>{
    console.log("🔔 Inizializzo socket.io");
    const io = new Server(server, {
            cors: { origin: "*" }
        });


  io.on('connection', (socket) => {
  console.log('🔌 Nuovo client connesso:', socket.id);
  socketVar=socket;
  socket.on('clientMessage', (data) => {
    console.log('📩 Messaggio dal client:', data);
  });

  socket.emit('message', 'Benvenuto al server con socket.io!');
});

    }


export default socketVar



