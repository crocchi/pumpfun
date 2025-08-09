//import WebSocket from 'ws';
import { ws } from './index.js';
const TIME_LIMIT = 2500; // 10 secondi

let suspiciousSellDetected = false;
let tradeMintMonitor= null;

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

      if (suspiciousSellDetected) {
        console.log("⛔ Vendita rilevata troppo presto. Token scartato.");
        
         ws.send(JSON.stringify({
              method: "unsubscribeTokenTrade",
              keys: [token.mint]
            }));
            resolve(false);
      } else {
        console.log("✅ Nessuna vendita sospetta. Procedo con snipe...");
       // await snipeCallback(token);
        resolve(true);
      }
    }, TIME_LIMIT);
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