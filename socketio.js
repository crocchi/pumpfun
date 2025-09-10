import { Server } from 'socket.io';
import { botOptions } from './config.js';
import { instancesToken,instances } from './index.js';

const IO = {
  io: null,
};

    // Attacco socket.io al server http
export const initSocket=(server)=>{
    console.log("🔔 Inizializzo socket.io");
    IO.io = new Server(server, {
            cors: { origin: "*" }
        });

IO.io.on('connection', (socket) => {

  console.log('🔌 Nuovo client connesso:', socket.id);
//  socketVar=socket;
  socket.on('clientMessage', (data) => {
    console.log('📩 Messaggio dal client:', data);
  });

  socket.emit('message', 'Benvenuto al server con socket.io!');


});//fine io.on connection

}//fine initSocket

export const sendMessageToClient = (type='newToken',message) => {
    if (IO.io) {
        IO.io.emit('newToken', message);
       console.log('📤 Messaggio inviato al client:', message);
    } else {
        console.log('⚠️ Nessun client connesso.');
    }
};