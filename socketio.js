import { Server } from 'socket.io';
import { botOptions } from './config.js';
import { instancesToken,instances } from './index.js';
// instances Mappa per memorizzare le istanze di TokenMonitor

let io = null;

    // Attacco socket.io al server http
export const initSocket=(server)=>{
    console.log("🔔 Inizializzo socket.io");
    io = new Server(server, {
            cors: { origin: "*" }
        });

io.on('connection', (socket) => {

  console.log('🔌 Nuovo client connesso:', socket.id);
//  socketVar=socket;
  socket.on('clientMessage', (data) => {
    console.log('📩 Messaggio dal client:', data);
  });

  socket.emit('message', 'Benvenuto al server con socket.io!');


});//fine io.on connection

}//fine initSocket

export const sendMessageToClient = (type='newToken',message) => {
    if (io) {
       io.emit(type, message);
       //console.log('📤 Messaggio inviato al client:', message);
    } else {
       // console.log('⚠️ Nessun client connesso.');
    }
};

setInterval(() => {
    if (instances && instances.size > 0) {
        instances.forEach((instance, key) => {
            console.log(`🔄 Inviando aggiornamento per il token ${key} al client.`);
            sendMessageToClient('tokenMonitor', `NumTrx:${instance.solTrxNumMonitor} Volume:${instance.volume} SOL VolumeNet:${instance.volumeNet} SOL Price:${instance.LivePrice} `);
        });
    }
}, 5000);