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

let timerOn='29 4 * * *'; //ogni giorno alle 3:29
let timerOff='00 6 * * *'; //ogni giorno alle 6:30

cron.schedule(timerOn, async () => {
    console.log('🛡️  good night')
    let msg = '🛌 Buonanotte! Il bot si sta addormentando...';
    sendMessageToClient('event', msg);
    jobBotHealth.stop();
    botOptions.botSleep=true
    closeWebSocket();
    }, { 
    timezone: 'Europe/Rome'
});

cron.schedule(timerOff, async () => {
    console.log('🛡️  good day')
    let msg = '🌅 Buongiorno! Il bot si sta svegliando...';
    sendMessageToClient('event', msg);
    jobBotHealth.start();
    botOptions.botSleep=false;
    connect();

    }, { 
    timezone: 'Europe/Rome'
});


let btc_activity=false;
let sol_activity=false;
let btc_change_percent= -1.5; //percentuale di calo per attivare la sospensione
let sol_change_percent= -1.5; //percentuale di calo per attivare la sospensione

export const jobBotHealth = cron.schedule('*/15 * * * *', async () => {
  console.log('🛡️ JobBotHealth Check Price Status 15m...');
  let btc=botOptions.btcInfo.price || 0;
  let btc_1h=Number(botOptions.btcInfo.percent_change_1h) || 0;
  console.log(`📈 Prezzo BTC aggiornato: $${btc} 1h(${btc_1h}%)`);
  let sol=botOptions.solanaInfo.price || 0;
  let sol_1h=Number(botOptions.solanaInfo.percent_change_1h) || 0;
  console.log(`📈 Prezzo SOL aggiornato: $${sol} 1h(${sol_1h}%)`);

  //sol_1h= -1.57 btc_1h= -0.65
  if(btc_1h < btc_change_percent && botOptions.botSleep===false && !btc_activity){
    btc_activity=true;
    botOptions.botSleep=true;
    let msg=(`⚠️  Attenzione: BTC in calo oltre il 1% nell\'ultima ora. 
       prezzo: $${btc} 1h($${btc_1h}) Considera di sospendere le operazioni di trading.`);
    console.log(msg);
       sendMessageToClient('event', msg);
    closeWebSocket();
    return
 }
 if(btc_1h >= btc_change_percent && botOptions.botSleep===true && btc_activity){
   botOptions.botSleep=false;
   btc_activity=false;
   let msg=(`✅ BTC stabile. Prezzo: $${btc} 1h($${btc_1h}). Il bot continua le operazioni di trading.`);
   sendMessageToClient('event', msg);
   console.log(msg);
   connect();
   return
}
  if(sol_1h < sol_change_percent && botOptions.botSleep===false && !sol_activity){
    botOptions.botSleep=true;
    sol_activity=true;
    let msg=(`⚠️  Attenzione: SOL in calo oltre il 1% nell\'ultima ora. 
       prezzo: $${sol} 1h($${sol_1h}) Considera di sospendere le operazioni di trading.`);
    sendMessageToClient('event', msg);
    console.log(msg);
    closeWebSocket();
    return
  }
  if(sol_1h >= sol_change_percent && botOptions.botSleep===true && sol_activity){
    botOptions.botSleep=false;
    sol_activity=false;
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
