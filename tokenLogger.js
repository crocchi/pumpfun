import TokenMonitor from "./tradeMonitor.js";
import { botOptions } from "./config.js";
import { buyToken, sellToken } from './utility/lightTrx.js';
import { webSock, subscribedTokens } from "./index.js";
import { getHour } from './utility/time.js';
import { sendMessageToClient } from './socketio.js';


class TokenLogger extends TokenMonitor {
  constructor(token) {
    super(token); // Chiama il costruttore di TokenMonitor
    //this.token = token; // Informazioni sul token
    // this.solAmount = 0;
    this.solTrxNumMonitor = 0;
    this.solTrxNum = 0;
    // this.volume = 0;
    this.monitor;
    this.pool = token.pool //|| token.mint.toLowerCase().includes('pump')
    this.name;
    this.time;
    this.symbol;
    this.buyTransactionSign = null;
    this.LivePrice = 0;
    this.startPrice = 0; //prezzo iniziale in sol
    this.buyPrice = 0; //prezzo di acquisto in sol
    this.tokenAmount = 0; //qnt token comprato
    this.sellPrice = 0;
    //trailing info
    this.trailingPercent = botOptions.trailingPercent; // percentuale per trailing stop
    this.highPrice = 0; // sol
    this.stop = this.buyPrice * (1 - this.trailingPercent / 100);
    this.activeTrailing = botOptions.enableTrailing;
    this.traderWallet = []; //ci mettiamo tutti i wallet dei trade
    ////////
    this.lowPrice = 1; // sol
    this.volumeNet = 0;
    this.devWallet = token.traderPublicKey || "Unknown";
    this.holders = 0;//numero holders
    this.holdersList = [];
    this.solInPool = token.solInPool || token.vSolInBondingCurve || 0;
    this.tokensInPool = token.tokensInPool || token.vTokensInBondingCurve || 0;
    this.marketCapSol = token.marketCapSol || 0;
    this.marketCapUsd = 0;
    //venduto
    this.soldOut = false;
    this.sellOutTimer = new Date();
    this.infoSniper;// informazioni di quando viene accettato
    this.jitoFee = 0;
    this.buyPriceJupiter = 0;

    // this.trxArray = [];
    this.safeProblem = [];
    this.sellPercent = 0;
    this.totTrx = 0;

    //volatility
    this.volatility = 0;
    this.priceHistory = [];   // storico prezzi recenti
    this.maxHistory = 10;     // numero di tick da usare per la volatilità

  }

  linked(ob) {
    this.monitor = ob;
    this.name = ob.token?.name || "Unknown";
    this.symbol = ob.token?.symbol || "Unknown";
    this.trxArray = ob.trxArray;
    this.quickBuy = ob.quickBuy;
    this.quickSell = ob.quickSell;
    this.solTrxNumMonitor = Number(ob.solTrxNumMonitor);
    if (!this.solTrxNum === 0) this.solTrxNum = ob.solTrxNumMonitor;
    this.volume = ob.volume;
    this.volumeNet = ob.solAmount;
    this.time = ob.time;
    this.id = ob.id;
    this.totTrx = this.solTrxNum + ob.solTrxNumMonitor;
    this.infoSniper = ob.infoSnipe;
    /*if ( ob.highPrez > this.highPrice ) {
      this.highPrice = ob.highPrez;
    }*/

  }

  logTransaction(transaction) {


    this.liquidityCheck(transaction);

    if (!this.traderWallet.includes(transaction.traderPublicKey)) {
      this.traderWallet.push(
        transaction.traderPublicKey,
      );
    }

    this.trxArray.push({
      type: transaction.txType,
      amount: transaction.solAmount,
      tokenAmount: transaction.tokenAmount,
      trader: transaction.traderPublicKey,
      price: this.LivePrice,
      signature: transaction.signature,
      time: getHour()
    });
    this.priceHistory.push(this.LivePrice);
    
    if (this.priceHistory.length > this.maxHistory) {//calcola volatilità
      this.priceHistory.shift(); // elimina il più vecchio
    }
    //this.solAmount += transaction.amount;
    this.volume += transaction.solAmount;
    if (transaction.txType === 'buy') {
      this.volumeNet += transaction.solAmount;
      this.buyVolume += transaction.solAmount;//x calcolare net buy pressure
    }
    if (transaction.txType === 'sell') {
      this.volumeNet += -(transaction.solAmount);
      this.sellVolume += transaction.solAmount;//x calcolare net sell pressure
    }

    if (this.LivePrice > this.highPrice) {
      this.highPrice = this.LivePrice;
      this.stop = this.highPrice * (1 - this.trailingPercent / 100);
    }
    if (this.LivePrice < this.lowPrice) {
      this.lowPrice = this.LivePrice;
    }

    this.marketCapSol = transaction.marketCapSol || this.marketCapSol;
    this.solTrxNumMonitor++;
    this.solTrxNum++;
    this.volatility = (this.highPrice - this.lowPrice) / this.startPrice * 100;
    /* if (this.lowPrice === 0 || transaction.price < this.lowPrice) {
       this.lowPrice = transaction.price;
     }*/
  }

  liquidityCheck(tok) {
    if (tok.solInPool && tok.tokensInPool) {
      this.LivePrice = (tok.solInPool / tok.tokensInPool).toFixed(10);
      this.solInPool = tok.solInPool;
      this.tokensInPool = tok.tokensInPool;
    }
    if (tok.vSolInBondingCurve && tok.vTokensInBondingCurve) {
      this.LivePrice = (tok.vSolInBondingCurve / tok.vTokensInBondingCurve).toFixed(10);
      this.solInPool = tok.vSolInBondingCurve;
      this.tokensInPool = tok.vTokensInBondingCurve;
    }
    return this.LivePrice;

  }
  getVolatility() {

    if (this.priceHistory.length >= 3) {
  const min = Math.min(...this.priceHistory);
  const max = Math.max(...this.priceHistory);
  const start = this.priceHistory[0];
  const volatility = ((max - min) / start) * 100;

  this.volatility = volatility; // salva per uso futuro o visualizzazione
  return volatility;
}
   return 0;
  }

  trailingUp() {
    if (this.activeTrailing && this.highPrice > 0) {
      if (this.LivePrice <= this.stop) {
        console.log(`🔻 Trailing Stop attivato per ${this.name} a $${this.LivePrice}. Vendita automatica.`);
        this.activeTrailing = false;
      }
    }
  }
  resetLogger() {
    this.solAmount = 0;
    this.solTrxNumMonitor = 0;
    this.volume = 0;
    this.volumeNet = 0;
    this.trxArray = [];
    this.highPrice = 0;
    this.lowPrice = 0;
    this.safeProblem = [];
  }

  getSummary() {
    return {
      token: this.token,
      solAmount: this.solAmount,
      solTrxNumMonitor: this.solTrxNumMonitor,
      volume: this.volume,
      price: this.price,
      buyPrice: this.buyPrice,
      volumeNet: this.volumeNet,
      highPrice: this.highPrice,
      lowPrice: this.lowPrice,
      transactions: this.trxArray.length,
    };
  }
  sellToken(trade, qnt = 100) {

    sellToken(trade);
    let ws = webSock();
    subscribedTokens.delete(trade.mint);
    // StatsMonitor.updateToken(trade, tradeInfo.price, '💀 Sell Off Panic triggered');
    this.soldOut = true;
    this.sellPrice = this.LivePrice;
    //tokenLog.tokenAmount=(tokenLog.tokenAmount * prezzo);
    botOptions.botCash = (botOptions.botCash + (this.tokenAmount * this.LivePrice));


    ws.send(JSON.stringify({
      method: "unsubscribeTokenTrade",
      keys: [trade.mint]
    }));
    sendMessageToClient('event', `BotCash [${botOptions.botCash}]SOL`)
    console.log(`🚫 Unsubscribed da ${trade.mint} venduto!!)`);
    //chiudi timer tokenlife
    clearInterval(this.monitor.checkTimeToken)
  }

  startSellTimer() {
    //console.log(`⏳ Timer di 30 minuti avviato per ${this.name}.`);
/*
⏰ Timer scaduto per KittoFi. Il token non è stato venduto. Vendita automatica in corso...
❌ Errore durante la vendita automatica di KittoFi: TypeError: Cannot read properties of undefined (reading 'slice')
    at new TokenMonitor (file:///Pumpfun/tradeMonitor.js:10:29)
    at new TokenLogger (file:///Pumpfun/tokenLogger.js:11:5)
    at getInstanceForTokenLogger (file:///Pumpfun/index.js:1010:22)
    at sellToken (file:///Pumpfun/utility/lightTrx.js:139:29)
    at Timeout._onTimeout (file:///Pumpfun/tokenLogger.js:229:9)
    at listOnTimeout (node:internal/timers:588:17)
    at process.processTimers (node:internal/timers:523:7) */
    // Imposta un timer di 30 minuti (30 * 60 * 1000 millisecondi)
    setTimeout(() => {
      if (!this.soldOut) {
        console.log(`⏰ Timer scaduto per ${this.name}. Il token non è stato venduto. Vendita automatica in corso...`);
        clearInterval(this.monitor.checkTimeToken);
        // Esegui la vendita automatica
        sellToken(this.token.mint)
          .then((result) => {
            let ws = webSock();
            console.log(`✅ Vendita automatica completata per ${this.name}. Dettagli:`, result);
            this.soldOut = true; // Imposta lo stato a venduto
            this.tokenAmount = (this.tokenAmount * this.LivePrice);
            this.sellPrice = this.LivePrice;
            this.infoSniper = `Venduto automaticamente dopo 30 minuti a ${new Date().toLocaleTimeString()}`;
            botOptions.botCash = (botOptions.botCash + this.tokenAmount);
            ws.send(JSON.stringify({
              method: "unsubscribeTokenTrade",
              keys: [this.token.mint]
            }));
          })
          .catch((error) => {
            console.error(`❌ Errore durante la vendita automatica di ${this.name}:`, error);
          });
      }
    }, 8 * 60 * 1000);
  }
}

export default TokenLogger;
