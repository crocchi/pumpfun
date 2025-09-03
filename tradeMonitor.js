//import WebSocket from 'ws';
import { ws } from './index.js';
import { botOptions } from './config.js';
let TIME_LIMIT = botOptions.time_monitor; // 3 secondi

// Mappa per gestire lo stato di ogni token
const tokenStates = new Map();



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
        if(solAmount < 1.20 && solTrxNumMonitor < botOptions.maxTrxNumMonitor*2) {
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


 class TokenMonitor {
  constructor(token) {
    this.tradeMonitor = true;
    this.token = token; // Informazioni sul token
    this.suspiciousSellDetected = false;
    this.solAmount = 0;
    this.solTrxNumMonitor = 0;
    this.timeoutId = null;
    this.volume = 0;
    this.trxArray = [];
    this.resolve = null
  }

  startMonitor(snipeCallback) {
return new Promise((resolve) => {
  this.resolve = resolve;
      const payload = {
        method: 'subscribeTokenTrade',
        keys: [this.token.mint],
      };
      ws.send(JSON.stringify(payload));
      console.log(`👁️  Monitoraggio trade per ${this.token.symbol} (${this.token.mint}) attivo per ${botOptions.time_monitor / 1000}s`);

      this.timeoutId = setTimeout(() => {
        if (this.solAmount > 3.0) {
          this.suspiciousSellDetected = false;
          console.log("⛔ Volume Alto - rimuovi tag false.");
        }
        if (this.solAmount < 0.01) {
          this.suspiciousSellDetected = true;
          console.log("⛔ Volume nullo.");
        }
        if (this.solTrxNumMonitor > botOptions.maxTrxNumMonitor) {
          this.suspiciousSellDetected = true;
          console.log("⛔ Troppi trade sospetti...Possibile rugpull Botnet. trx Num:" + this.solTrxNumMonitor);
          if (this.solAmount < 1.20 && this.solTrxNumMonitor < botOptions.maxTrxNumMonitor*2) {
            console.log("⛔ Volume troppo basso per considerare un rugpull.");
            this.suspiciousSellDetected = false;
          }
        }

        if (this.suspiciousSellDetected || this.solAmount < botOptions.volumeMin) {
          console.log(`⛔ Token (${this.token.name}) scartato. ValoreTrade: (${this.solAmount} SOL) Volume: (${this.volume} SOL) NumTrx:${this.solTrxNumMonitor}`);
          ws.send(JSON.stringify({
            method: "unsubscribeTokenTrade",
            keys: [this.token.mint],
          }));
          this.resetValues();
          resolve(false);
          return false
        } else {
          console.log(`✅ Token (${this.token.name}) OK! ValoreTrade: (${this.solAmount} SOL) Volume: (${this.volume} SOL) NumTrx:${this.solTrxNumMonitor}... Procedo con snipe...`);
          this.resetValues();
          resolve(true);
          return true
        }
      }, botOptions.time_monitor);
    });//fine promise
  }

  cancelMonitor() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      console.log(`⏹️ Timer interrotto per il token ${this.token.mint}.`);
      this.resetValues();
       if (this.resolve) {
      this.resolve(true);
     // this.resolve = null; // Resetta `resolve` per evitare chiamate multiple
    }
      return true
    }
  }

  resetValues() {
    this.suspiciousSellDetected = false;
    this.tradeMonitor = false;
    /*this.solAmount = 0;
    this.solTrxNumMonitor = 0;
    this.timeoutId = null;
    */
  }

  lastPrice(){
    if(this.trxArray.length>0){
        return this.trxArray[this.trxArray.length-1].price;
    }
    return 0;
  }

  addSolAmount(value) {
    this.solAmount += value;
    this.solTrxNumMonitor++;
  }
  addVolume(value) {
    this.volume += value;
  }

  getSolAmount() {
    return this.solAmount;
  }

  getSolTrxNumMonitor() {
    return this.solTrxNumMonitor;
  }
}

export default TokenMonitor;