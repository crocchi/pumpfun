import TokenMonitor from "./tradeMonitor";
 
 class TokenLogger extends TokenMonitor{
 constructor(token) {
    super(token); // Chiama il costruttore di TokenMonitor
    //this.token = token; // Informazioni sul token
   // this.solAmount = 0;
   // this.solTrxNumMonitor = 0;
   // this.volume = 0;
    this.buyTransaction = null;
    this.LivePrice = 0;
    this.startPrice = 0;
    this.buyPrice = 0;
    this.sellPrice = 0;
    this.highPrice = 0; // sol
    this.lowPrice = 0; // sol
    this.volumeNet = 0;
   // this.trxArray = [];
    this.safeProblem = [];
  }

  logTransaction(transaction) {
    this.trxArray.push(transaction);
    this.solAmount += transaction.amount;
    this.volume += transaction.amount * transaction.price;
    this.volumeNet += transaction.amount * (transaction.price - this.buyPrice);
    this.price = transaction.price;

    if (transaction.price > this.highPrice) {
      this.highPrice = transaction.price;
    }

    if (this.lowPrice === 0 || transaction.price < this.lowPrice) {
      this.lowPrice = transaction.price;
    }
  }

  monitorTransaction() {
    this.solTrxNumMonitor++;
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