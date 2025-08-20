//import WebSocket from 'ws';
import { ws } from './index.js';
import { botOptions } from './config.js';
let TIME_LIMIT = botOptions.time_monitor; // 3 secondi

let suspiciousSellDetected = false;
let tradeMintMonitor= null;
let solAmount = 0;
let solTrxNumMonitor = 0; // per monitorare il volume delle vendite sospette
let timeoutId; // Variabile per memorizzare l'identificatore del timer

export async function monitorEarlyTrades(token, snipeCallback) {

  if(snipeCallback){ 
     ws.send(JSON.stringify({
    method: "unsubscribeTokenTrade",
    keys: [token.mint]
  }));
   return;
  }
 

    const payload = {
      method: 'subscribeTokenTrade',
      keys: [token.mint],
    };
    ws.send(JSON.stringify(payload));
    tradeMintMonitor= token.mint;
    console.log(`👁️  Monitoraggio trade per ${token.symbol} (${token.mint}) attivo per ${TIME_LIMIT / 1000}s`);

/* if (trade.mint === token.mint && trade.txType === 'sell') {
  console.log(`⚠️  Vendita precoce da ${trade.traderPublicKey} – possibile dev bot.`);
  suspiciousSellDetected = true;
}*/

  return new Promise((resolve) => {
    timeoutId = setTimeout(async () => {
      //ws.close();
      if(solAmount > 3.0) {
        suspiciousSellDetected = false;
        console.log("⛔ Volume Alto - rimuovi tag false.");
      }
      if(solAmount < 0.01) {
        suspiciousSellDetected = true;
        console.log("⛔ Volume nullo.");
      }
      if(solTrxNumMonitor > botOptions.maxTrxNumMonitor) {//se sono più di 4-5 trx ..alloa sn bot--rugpull detc
        suspiciousSellDetected = true;
        console.log("⛔ Troppi trade sospetti...Possibiile rugpull Botnet. trx Num:"+solTrxNumMonitor);
        if(solAmount < 1.20) {
          console.log("⛔ Volume troppo basso per considerare un rugpull.");
          suspiciousSellDetected = false;
        }
      }

      

      if (suspiciousSellDetected ||/*&&*/ solAmount < botOptions.volumeMin) {
        console.log("⛔ Vendita rilevata troppo presto. Token scartato."+` Volume: (${solAmount} SOL)`);
        
         ws.send(JSON.stringify({
              method: "unsubscribeTokenTrade",
              keys: [token.mint]
            }));
            resetValue()
            resolve(false);
            
      } else {
        console.log("✅ Nessuna vendita sospetta. Procedo con snipe...");
       // await snipeCallback(token); potrei mettere qui l'acquisto
       resetValue()
        resolve(true);
      }
    }, botOptions.time_monitor);

 /*   monitorEarlyTrades.cancel = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        console.log("⏹️ Timer interrotto prima della scadenza.");
        resetValue()
        resolve(true); // Risolvi la Promise 
        
      }
    };*/
  });//fine promise
  
}

//getters and setters for tradeMintMonitor and suspiciousSellDetected

export function getSuspiciousSellDetected() {
  return suspiciousSellDetected;
}

export function setSuspiciousSellDetected(value) {
  suspiciousSellDetected = value;
}

export function getMintMonitor() {
  return tradeMintMonitor;
}

export function setMintMonitor(value) {
  tradeMintMonitor = value;
}


export function getSolAmount() {
  return solAmount;
}

export function getSolTrx() {
  return solTrxNumMonitor;
}

export function setSolAmount(value,reset) {
  if(reset) {
    solAmount = 0;
    return;
  }
  solAmount = solAmount + value;
  solTrxNumMonitor++;
}

// Funzione per interrompere il timer
export function cancelMonitor() {
  if (timeoutId) {
    clearTimeout(timeoutId);
    console.log("⏹️ Timer interrotto prima della scadenza.");
    resetValue()
  }
}

export function resetValue() {
  setMintMonitor(null)
  solAmount=0;solTrxNumMonitor=0;
  suspiciousSellDetected = false;
  timeoutId = null;
}