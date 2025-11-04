import cron from 'node-cron';
import { botOptions } from './config';
import { webSock,connect } from './index.js';
import { onOpen } from './websocket.js';
import { sendMessageToClient } from './socketio.js';

// 1. Ogni minuto (test)
/*
cron.schedule('* * * * *', () => console.log('Ping!'));

// 2. Ogni giorno alle 8:00 (Italia)
cron.schedule('0 8 * * *', backupDB, {
  timezone: 'Europe/Rome'
});

// 3. Ogni lunedì alle 9:30
cron.schedule('30 9 * * 1', sendReport);

// 4. Ogni 10 secondi
cron.schedule('*\/10 * * * * *', heartbeat);

┌────────────────── second (opzionale, 0-59)
│ ┌──────────────── minute (0-59)
│ │ ┌────────────── hour (0-23)
│ │ │ ┌──────────── day of month (1-31)
│ │ │ │ ┌────────── month (1-12 o JAN-DEC)
│ │ │ │ │ ┌──────── day of week (0-7 o SUN-SAT)
│ │ │ │ │ │
* * * * * *
*/


export const jobBotHealth = cron.schedule('* 10 * * *', async () => {
  console.log('🛡️  Check Price Status 1h...');
  let btc=botOptions.btcInfo.price || 0;
  let btc_1h=botOptions.btcInfo.percent_change_1h || 0;
  console.log(`📈 Prezzo BTC aggiornato: $${btc} 1h($${btc_1h})`);
  let sol=botOptions.solanaInfo.price || 0;
  let sol_1h=botOptions.solanaInfo.percent_change_1h || 0;
  console.log(`📈 Prezzo SOL aggiornato: $${sol} 1h($${sol_1h})`);

  if(btc_1h < -1){
    botOptions.botSleep=true;
    let msg=('⚠️  Attenzione: BTC in calo oltre il 2% nell\'ultima ora. Considera di sospendere le operazioni di trading.');
    sendMessageToClient('event', msg);
    closeWebSocket();
 }else{
   botOptions.botSleep=false;
   console.log('✅ BTC stabile. Il bot continua le operazioni di trading.');
   connect();
}
  if(sol_1h < -1){
    botOptions.botSleep=true;
    let msg=('⚠️  Attenzione: SOL in calo oltre il 2% nell\'ultima ora. Considera di sospendere le operazioni di trading.');
    sendMessageToClient('event', msg);
    closeWebSocket();
  }else{
    botOptions.botSleep=false;
    console.log('✅ SOL stabile. Il bot continua le operazioni di trading.');
    connect();
  }

}, { 
    timezone: 'Europe/Rome',
    scheduled: false,     // non parte subito
});


/*
const job = cron.schedule('0 2 * * *', nightlyTask, {
  scheduled: false,     // non parte subito
  timezone: 'Europe/Rome',
  runOnInit: true,      // esegue subito al primo avvio
  context: { userId: 42 } // passa dati alla funzione
});

job.start();   // accendi
job.stop();    // spegni
job.destroy(); // rimuovi per sempre
*/
const closeWebSocket = async () => {
  let ws = webSock();
  if (ws) {
    ws.removeAllListeners(); // Rimuovi listener per evitare memory leak
    ws.close(1000, 'Riavvio manuale o inattività');
    botOptions.botSleep=true;
    console.log('🛑 Bot in modalità sleep. Connessione WebSocket chiusa.');
  }
}