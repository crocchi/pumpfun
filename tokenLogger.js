import TokenMonitor from "./tradeMonitor.js";
import { botOptions } from "./config.js";
 
 class TokenLogger extends TokenMonitor{
 constructor(token) {
    super(token); // Chiama il costruttore di TokenMonitor
    //this.token = token; // Informazioni sul token
   // this.solAmount = 0;
   // this.solTrxNumMonitor = 0;
   // this.volume = 0;
    this.monitor;
    this.name ;
    this.symbol;
    this.buyTransactionSign = null;
    this.LivePrice = 0;
    this.startPrice = 0; //prezzo iniziale in sol
    this.buyPrice = 0; //prezzo di acquisto in sol
    this.sellPrice = 0;
    //trailing info
    this.trailingPercent = botOptions.trailingPercent; // percentuale per trailing stop
    this.highPrice = 0; // sol
    this.stop = this.buyPrice * (1 - this.trailingPercent / 100);
    this.activeTrailing = botOptions.enableTrailing;

    ////////
    this.lowPrice = 0; // sol
    this.volumeNet = this.monitor.solAmount || 0;
    this.devWallet=token.traderPublicKey || "Unknown";
    this.holders=0;//numero holders
    this.holdersList=[];
    this.solInPool=token.solInPool || token.vSolInBondingCurve || 0;
    this.tokensInPool=token.tokensInPool || token.vTokensInBondingCurve || 0;
    this.marketCapSol=token.marketCapSol || 0;
    this.marketCapUsd=0;
    
    
    // this.trxArray = [];
    this.safeProblem = [];
  }

  linked(ob){
    this.monitor=ob;
    this.name = ob.token?.name || "Unknown";
    this.symbol = ob.token?.symbol || "Unknown";
    this.trxArray = ob.trxArray;
    this.quickBuy = ob.quickBuy;
   this.quickSell = ob.quickSell;
    this.solTrxNumMonitor = ob.solTrxNumMonitor;
    this.volume = ob.volume;
    this.volumeNet = ob.solAmount;
  }

  logTransaction(transaction) {

    this.liquidityCheck(transaction);
    this.trxArray.push({
            type:transaction.txType,
            amount:transaction.solAmount,
            tokenAmount:transaction.tokenAmount,
            trader:transaction.traderPublicKey,
            price: this.LivePrice,
            signature: transaction.signature,
            time: new Date().toLocaleTimeString()
          });
    //this.solAmount += transaction.amount;
    this.volume += transaction.solAmount;
    if (transaction.txType === 'buy') {
        this.volumeNet += transaction.solAmount;
    }
    if (transaction.txType === 'sell') {
        this.volumeNet += -(transaction.solAmount);
    }

    if (this.LivePrice > this.highPrice) {
      this.highPrice = this.LivePrice;
      this.stop = this.highPrice * (1 - this.trailingPercent / 100);
    }

    this.marketCapSol = transaction.marketCapSol || this.marketCapSol;
    this.solTrxNumMonitor++;
   /* if (this.lowPrice === 0 || transaction.price < this.lowPrice) {
      this.lowPrice = transaction.price;
    }*/
  }

  liquidityCheck(tok){
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

  trailingUp(){
    if(this.activeTrailing && this.highPrice>0){
      if(this.LivePrice <= this.stop) {
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
  
 }

 export default TokenLogger;
