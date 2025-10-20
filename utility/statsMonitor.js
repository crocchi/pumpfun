// marketMonitor.js
// Monitora in tempo reale Liquidity Change Rate (LCR) + Trade Velocity (TV)
// Dati compatibili con Pump.fun (vSolInBondingCurve)

import fetch from "node-fetch";

export default class StatsMonitor {
    constructor(mint,strategy) {
        this.mint = mint;
        this.totNumber=0;
        this.strategy = strategy || "unknown";
        this.winner = false; //true o false
        this.gain =0;
        this.AllTokens = new Map();
    }
    initToken(tokenData) {
        this.AllTokens.set(tokenData.mint, tokenData);
    }
    updateToken(tokenData,winner,gain) {
         if (this.AllTokens.has(tokenData.mint)) {
            this.AllTokens.set(tokenData.mint, tokenData);
            this.winner = winner;
            this.gain = gain;
         }else{this.initToken(tokenData);}
       // this.AllTokens.set(tokenData.mint, tokenData);
    }
    returnAllTokens(){
        return this.AllTokens;
    }

}

/*
class StatsMonitorDuo {
  constructor(mint, updateIntervalMs = 3000) {
    this.mint = mint;
    this.updateIntervalMs = updateIntervalMs;
    this.prevVsol = null;
    this.lastUpdate = null;
    this.lcrRate = 0;
    this.lcrSpeed = 0;
    this.trend = 0;
    this.history = [];
    this.tradeTimestamps = [];
    this.lastTradeId = null;
  }

  // 🔹 Classifica lo stato della liquidità
  getLiquidityStatus() {
    const absRate = Math.abs(this.lcrRate);
    if (absRate < 10) return "🟢 Stable";
    if (absRate < 30) return this.lcrRate > 0 ? "🟢 Growing" : "🟡 Selling pressure";
    if (absRate < 60) return this.lcrRate > 0 ? "🟢 Accumulating" : "🟠 Strong selling";
    return this.lcrRate > 0 ? "🟢 Whale entering" : "🔴 Possible rug!";
  }

  // 🔹 Classifica il ritmo di mercato
  getVelocityStatus(tv) {
    if (tv > 200) return "🚀 Hyperactive (Hype)";
    if (tv > 100) return "🔥 Active";
    if (tv > 50) return "🟡 Cooling down";
    if (tv > 20) return "⚠️ Low volume";
    return "☠️ Dead token";
  }

  // 🔹 Loop principale
  
}
*/