//import WebSocket from 'ws';
import { webSock } from './index.js';
import { botOptions } from './config.js';


class TokenMonitor {
  constructor(token) {
    this.tradeMonitor = true;
    this.tradeMonitorOff=false;
    this.id = `${token.mint.slice(0, 6)}`
    this.token = token; // Informazioni sul token
    //this.name = token.name || 
    this.suspiciousSellDetected = false;
    this.solAmount = 0;
    this.solTrxNumMonitor = 0;
    this.marketCapSol=0;
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
    this.infoSnipe;
    //infoToken By jupiter
    this.infoJupiter;

    //liquidityChange
    this.prevSolInPool=null;
    this.liqDrop=0;
    this.lastTimeLiq;
    this.speedLiq=0;

    //TradeVelocity
    this.tradeHistory = [];
    this.tradesPerSec=0;
    this.tradesPerMin=0;
  }

  startMonitor(snipeCallback) {
    const ws=webSock();
    return new Promise((resolve) => {
      this.resolve = resolve;
      const payload = {
        method: 'subscribeTokenTrade',
        keys: [this.token.mint],
      };
      
      ws.send(JSON.stringify(payload));
      console.log(`👁️  Monitoraggio trade per ${this.token.symbol} (${this.token.mint}) attivo per ${botOptions.time_monitor / 1000}s`);

      this.timeoutId = setTimeout(async () => {
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
         if (this.solAmount > botOptions.volumeMax) {// volumeNet Superato
          console.log(`⛔ [${this.token.name}] Volume Max Superato.:${this.solAmount}`);
          this.suspiciousSellDetected = true;
        }

        if (this.suspiciousSellDetected || this.solAmount < botOptions.volumeMin || this.volume < botOptions.minVolumeMonitor) {
          ws.send(JSON.stringify({
            method: "unsubscribeTokenTrade",
            keys: [this.token.mint],
          }));
          this.tradeMonitorOff=true;
          console.log(`⛔ Token (${this.token.name}) scartato. ValoreTrade: (${this.solAmount} SOL) Volume: (${this.volume} SOL) NumTrx:${this.solTrxNumMonitor}`);
          this.resetValues();
          resolve(false);
          return false
        } else {
          let msg=`✅ Token (${this.token.name}) OK! ValoreTrade: (${this.solAmount} SOL) Volume: (${this.volume} SOL) NumTrx:${this.solTrxNumMonitor}...highPrez:${this.highPrez} Procedo con snipe...`
          console.log(msg);
          this.infoSnipe=msg;
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
     let msg=`✅ Token (${this.token.name}) OK! ValoreTrade: (${this.solAmount} SOL) Volume: (${this.volume} SOL) NumTrx:${this.solTrxNumMonitor}...highPrez:${this.highPrez} Procedo con snipe...`
          console.log(msg);
          this.infoSnipe=msg;
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
  calcLiquidityChange(solInPool){
    let now=new Date();
    if (this.prevSolInPool === null) {
    this.prevSolInPool = solInPool;
    this.lastTimeLiq=now;
    return { rate: 0, speed: 0 };
  }
  const elapsedSec = (now - this.lastTimeLiq) / 1000;
  this.liqDrop = Math.abs(((this.prevSolInPool - solInPool) / this.prevSolInPool) * 100);
  
  this.speedLiq = Math.abs(this.liqDrop / elapsedSec); // % per secondo
  this.prevSolInPool = solInPool;
  this.lastTimeLiq=now;

  return { rate: this.liqDrop, speed: this.speedLiq };
/*LCR %	Significato	Azione consigliata
< 10 %	Normale oscillazione	Nessuna azione
10–30 %	Vendite moderate	Tieni d’occhio volume e netPressure
30–50 %	Dump serio	Prepara sell o trailing più stretto
> 50 %	Rugpull violento	Vendi subito */
  }

  netBuyPressure(){
    //this.netPressure = this.buyVolume - this.sellVolume;
  }

updateTradeVelocity(newTradeTimestamp) {
  const now = Date.now();
  this.tradeHistory.push(newTradeTimestamp);

  // Mantieni solo le transazioni dell’ultimo minuto - 30 secondi
  this.tradeHistory = this.tradeHistory.filter(t => now - t < 30000);

  this.tradesPerMin = this.tradeHistory.length;
  this.tradesPerSec = this.tradesPerMin / 30;
  this.tradesPerTenSec = this.tradesPerMin / 10;

  return { tradesPerMin: this.tradesPerMin, tradesPerSec: this.tradesPerSec , tradesPerTenSec: this.tradesPerTenSec}; 
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