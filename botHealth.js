import cron from 'node-cron';
import { botOptions } from './config.js';
import { webSock,connect } from './index.js';
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
cron.schedule('30 3 * * *', async () => {
    console.log('🛡️  good night')
    let msg = '🛌 Buonanotte! Il bot si sta addormentando...';
    sendMessageToClient('event', msg);
    jobBotHealth.stop();
    botOptions.botSleep=true
    closeWebSocket();
    }, { 
    timezone: 'Europe/Rome'
});

cron.schedule('30 6 * * *', async () => {
    console.log('🛡️  good day')
    let msg = '🌅 Buongiorno! Il bot si sta svegliando...';
    sendMessageToClient('event', msg);
    jobBotHealth.start();
    botOptions.botSleep=false;
    connect();

    }, { 
    timezone: 'Europe/Rome'
});


export const jobBotHealth = cron.schedule('*/15 * * * *', async () => {
  console.log('🛡️ JobBotHealth Check Price Status 15m...');
  let btc=botOptions.btcInfo.price || 0;
  let btc_1h=Number(botOptions.btcInfo.percent_change_1h) || 0;
  console.log(`📈 Prezzo BTC aggiornato: $${btc} 1h(${btc_1h}%)`);
  let sol=botOptions.solanaInfo.price || 0;
  let sol_1h=Number(botOptions.solanaInfo.percent_change_1h) || 0;
  console.log(`📈 Prezzo SOL aggiornato: $${sol} 1h(${sol_1h}%)`);

  //sol_1h= -1.57 btc_1h= -0.65
  if(btc_1h < -1.1 && botOptions.botSleep===false){
    botOptions.botSleep=true;
    let msg=(`⚠️  Attenzione: BTC in calo oltre il 1% nell\'ultima ora. 
       prezzo: $${btc} 1h($${btc_1h}) Considera di sospendere le operazioni di trading.`);
    console.log(msg);
       sendMessageToClient('event', msg);
    closeWebSocket();
    return
 }
 if(btc_1h >= -1 && botOptions.botSleep===true){
   botOptions.botSleep=false;
   let msg=(`✅ BTC stabile. Prezzo: $${btc} 1h($${btc_1h}). Il bot continua le operazioni di trading.`);
   sendMessageToClient('event', msg);
   console.log(msg);
   connect();
   return
}
  if(sol_1h < -1 && botOptions.botSleep===false){
    botOptions.botSleep=true;
    let msg=(`⚠️  Attenzione: SOL in calo oltre il 1% nell\'ultima ora. 
       prezzo: $${sol} 1h($${sol_1h}) Considera di sospendere le operazioni di trading.`);
    sendMessageToClient('event', msg);
    console.log(msg);
    closeWebSocket();
    return
  }
  if(sol_1h >= -1 && botOptions.botSleep===true){
    botOptions.botSleep=false;
    let msg=(`✅ SOL stabile. Prezzo: $${sol} 1h($${sol_1h}). Il bot continua le operazioni di trading.`);
    sendMessageToClient('event', msg);
    console.log(msg);
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
    //botOptions.botSleep=true;
    console.log('🛑 Bot in modalità sleep. Connessione WebSocket chiusa.');
  }
}