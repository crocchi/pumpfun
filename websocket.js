import { webSock,connect } from './index.js';
import { botOptions } from './config.js';
import { sendMessageToClient } from './socketio.js';

let ws;

export const onError = (err) => {
  console.log('📡 Errore  WebSocket di Pump.fun');
  // Subscribing to token creation events
  console.log(err);
}

export const onClose = (err) => {
    console.log('📡 Chiusura  WebSocket di Pump.fun');
    // Subscribing to token creation events
    console.log(err);
}

export const onOpen = () => {
  console.log('📡 Connesso al WebSocket di Pump.fun');
  // Subscribing to token creation events
  let payload = {
    method: "subscribeNewToken",
  }
  ws=webSock();
  ws.send(JSON.stringify(payload));

    // Subscribing to trades made by accounts
  let payyload = {
      method: "subscribeAccountTrade",
      keys: [botOptions.botWallet] // array of accounts to watch
    }
  ws.send(JSON.stringify(payyload));

}

let lastMessageTime = Date.now();
let timeoutId;
export const lastMessageTimeSet = () => {lastMessageTime = Date.now()}
//export const lastMessageTimeReturn = () => {return lastMessageTime}

export function startTimeout() {
  timeoutId = setInterval(() => {
    if(botOptions.botSleep){
      console.log('🤖 Bot in modalità sleep. Timeout inattività non attivo.');
      return;
    }
    const lastMessageTimeNow = Date.now();
    let result = lastMessageTimeNow - lastMessageTime;
    if (result > 100000) {
      console.log('Inattività rilevata per 100 Secondi. Riavvio della connessione...');
      sendMessageToClient('eventLogger', '⏳ Inattività rilevata per 100 Secondi. Riavvio della connessione...');
      console.log(ws);
      if (ws) {
        ws.removeAllListeners(); // Rimuovi listener per evitare memory leak
        ws.close(1000, 'Riavvio manuale o inattività');
      }
      setTimeout(()=>{connect()},5000) //
      // La riconnessione è gestita dall'evento 'close'
    } else {
      console.log('Controllo attività rilevata ' + `${result / 1000} Sec Fà..`);

      // Se non è passato il timeout completo, ricontrolla tra 30 secondi
      //setTimeout(checkInactivity, 30000);
    }
  }, 300000);//300s
}