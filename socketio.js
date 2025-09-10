import { Server } from 'socket.io';
import { botOptions } from './config.js';
import { instancesToken,instances } from './index.js';

let sendMessageToClient;
    // Attacco socket.io al server http
export const initSocket=(server)=>{
    console.log("🔔 Inizializzo socket.io");
    const io = new Server(server, {
            cors: { origin: "*" }
        });


io.on('connection', (socket) => {

  console.log('🔌 Nuovo client connesso:', socket.id);
//  socketVar=socket;
  socket.on('clientMessage', (data) => {
    console.log('📩 Messaggio dal client:', data);
  });

  socket.emit('message', 'Benvenuto al server con socket.io!');

  sendMessageToClient = (type='newToken',message) => {
    if (io) {
        io.emit(type, message);
       // console.log('📤 Messaggio inviato al client:', message);
    } else {
        console.log('⚠️ Nessun client connesso.');
    }
};
});//fine io.on connection

}//fine initSocket

export default sendMessageToClient;