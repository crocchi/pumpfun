//import WebSocket from 'ws';
import { ws } from './index.js';
import { botOptions } from './config.js';
const TIME_LIMIT = botOptions.time_monitor; // 1,5 secondi

let suspiciousSellDetected = false;
let tradeMintMonitor= null;
let solAmount = 0;

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
    setTimeout(async () => {
      //ws.close();
      if(solAmount > 3.0) {
        suspiciousSellDetected = false;
        console.log("⛔ Volume Alto - rimuovi tag false.");
      }

      if (suspiciousSellDetected && solAmount < botOptions.volumeMin) {
        console.log("⛔ Vendita rilevata troppo presto. Token scartato."+` Volume: (${solAmount} SOL)`);
        
         ws.send(JSON.stringify({
              method: "unsubscribeTokenTrade",
              keys: [token.mint]
            }));
            setMintMonitor(null);
            solAmount=0;
            suspiciousSellDetected = false
            resolve(false);
            
      } else {
        console.log("✅ Nessuna vendita sospetta. Procedo con snipe...");
       // await snipeCallback(token); potrei mettere qui l'acquisto
       setMintMonitor(null)
       solAmount=0;
       suspiciousSellDetected = false;
        resolve(true);
      }
    }, botOptions.time_monitor);
  });
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

export function setSolAmount(value,reset) {
  if(reset) {
    solAmount = 0;
    return;
  }
  solAmount = solAmount + value;
}

