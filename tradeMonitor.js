//import WebSocket from 'ws';
import { ws } from './index.js';
import { botOptions } from './config.js';


class TokenMonitor {
  constructor(token) {
    this.tradeMonitor = true;
    this.id = `${token.mint.slice(0, 6)}`
    this.token = token; // Informazioni sul token
    //this.name = token.name || 
    this.suspiciousSellDetected = false;
    this.solAmount = 0;
    this.solTrxNumMonitor = 0;
    this.timeoutId = null;
    this.volume = 0;
    this.trxArray = [];
    this.resolve = null;
    this.timee = new Date().toLocaleTimeString();
    this.time;
    //this.highPrice = 0;//sol
    this.quickBuy = 0;
    this.quick = false;
    this.quickSell = 0;
    this.rugpullSafe = true;
    this.prez;
    this.highPrez;

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
          console.log(`⛔[${this.token.name}] Volume nullo o Negativo...`);
        }
        if (this.solTrxNumMonitor > botOptions.maxTrxNumMonitor) {
          this.suspiciousSellDetected = true;
          console.log("⛔ Troppi trade sospetti...Possibile rugpull Botnet. trx Num:" + this.solTrxNumMonitor);
          if (this.solAmount < 1.20 && this.solTrxNumMonitor < botOptions.maxTrxNumMonitor * 2) {
            console.log("⛔ Volume troppo basso per considerare un rugpull.");
            this.suspiciousSellDetected = false;
          }
        }
        if (this.solTrxNumMonitor < botOptions.minTrxNumMonitor) {// minimo di trade
          console.log(`⛔ [${this.token.name}] Pochi Trade...trx Num:${this.solTrxNumMonitor}`);
          this.suspiciousSellDetected = true;
        }

        if (this.suspiciousSellDetected || this.solAmount < botOptions.volumeMin || this.volume < botOptions.minVolumeMonitor) {
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

  logTransaction(transaction) {

  }
  cancelMonitor() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      console.log(`⏹️ Timer interrotto per il token ${this.token.mint}.`);
      this.resetValues();
      console.log(`✅ Token (${this.token.name}) OK! ValoreTrade: (${this.solAmount} SOL) Volume: (${this.volume} SOL) NumTrx:${this.solTrxNumMonitor}... Procedo con snipe...`);

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
  orario() {

    const oraItaliana = new Date().toLocaleTimeString("it-IT", {
      timeZone: "Europe/Rome",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    this.time = oraItaliana;
  }

  lastPrice() {
    if (this.trxArray.length > 0) {
      return this.trxArray[this.trxArray.length - 1].price;
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
  livePrice(priceLive) {
    this.prez = priceLive

    if (priceLive > this.highPrez) {
      this.highPrez = priceLive;
    }
  }

  getSolAmount() {
    return this.solAmount;
  }

  getSolTrxNumMonitor() {
    return this.solTrxNumMonitor;
  }
}

export default TokenMonitor;