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

export const sendMessageToClient = (type='newToken',message,data) => {
    if (io) {
       io.emit(type, message);
       //console.log('📤 Messaggio inviato al client:', message);
    } else {
       // console.log('⚠️ Nessun client connesso.');
    }
};

setInterval(() => {
 let contToken=[];
 let cont=[];
 let setInvio=false;
     if (instancesToken && instancesToken.size > 0) {
       
        instancesToken.forEach((instance, key) => {
            let tmpToken={
                name:instance.token?.name || "Unknown",
                symbol:instance.token?.symbol || "Unknown",
                
                marketCapSol:instance.marketCapSol,
                solInPool:instance.solInPool,
                
                LivePrice:instance.LivePrice,
                startPrice:instance.startPrice,
                buyPrice:instance.buyPrice,
                solTrxNumMonitor:instance.solTrxNumMonitor,
                
            
                volumeNet:instance.volumeNet,
                time:instance.time,
                volume:instance.volume,
            }
           // contToken.push(tmpToken)
           // setInvio=true;
           sendMessageToClient('tokenLogger', tmpToken)//`NumTrx:${instance.solTrxNumMonitor} Volume:${instance.volume} SOL VolumeNet:${instance.volumeNet} SOL Price:${instance.LivePrice} `);
       

        })//fine ciclo foreach

     }

    if (instances && instances.size > 0) {
        
        instances.forEach((instance, key) => {
            //console.log(`🔄 Inviando aggiornamento per il token ${key} al client.`);
            if(!instance.tradeMonitor){
                setInvio=false;
                return
            }
            let tmp={
                name:instance.token?.name || "Unknown",
                symbol:instance.token?.symbol || "Unknown",
                
                marketCapSol:instance.token.marketCapSol,
                
                LivePrice:instance.prez,
                solTrxNumMonitor:instance.solTrxNumMonitor,
                
            
                volumeNet:instance.solAmount,
                volume:instance.volume,
                time:instance.timee,
                
                trxArrayLength:instance.trxArray.length,
            }
            //cont.push(tmp)
           // setInvio=true;
            sendMessageToClient('tokenMonitor', tmp)//`NumTrx:${instance.solTrxNumMonitor} Volume:${instance.volume} SOL VolumeNet:${instance.volumeNet} SOL Price:${instance.LivePrice} `);
        });
    }


}, 3000);