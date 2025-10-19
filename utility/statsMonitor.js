// marketMonitor.js
// Monitora in tempo reale Liquidity Change Rate (LCR) + Trade Velocity (TV)
// Dati compatibili con Pump.fun (vSolInBondingCurve)

import fetch from "node-fetch";

export default class StatsMonitor {
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

  // 🔹 Aggiorna il valore di LCR
  updateLCR(vSolInBondingCurve) {
    const now = Date.now();
    if (this.prevVsol === null) {
      this.prevVsol = vSolInBondingCurve;
      this.lastUpdate = now;
      return { rate: 0, speed: 0, trend: 0 };
    }

    const elapsed = (now - this.lastUpdate) / 1000;
    if (elapsed < this.updateIntervalMs / 1000) 
      return { rate: this.lcrRate, speed: this.lcrSpeed, trend: this.trend };

    const delta = vSolInBondingCurve - this.prevVsol;
    const rate = (delta / this.prevVsol) * 100;
    const speed = rate / elapsed;

    this.history.push(rate);
    if (this.history.length > 10) this.history.shift();
    const trend = this.history.reduce((a, b) => a + b, 0) / this.history.length;

    this.prevVsol = vSolInBondingCurve;
    this.lastUpdate = now;
    this.lcrRate = rate;
    this.lcrSpeed = speed;
    this.trend = trend;

    return { rate, speed, trend };
  }

  // 🔹 Calcola la Trade Velocity (transazioni/min)
  updateTradeVelocity(newTradeTimestamp) {
    const now = Date.now();
    this.tradeTimestamps.push(newTradeTimestamp);
    // Mantieni solo trade dell’ultimo minuto
    this.tradeTimestamps = this.tradeTimestamps.filter(t => now - t < 60000);

    const tradesPerMin = this.tradeTimestamps.length;
    const tradesPerSec = tradesPerMin / 60;
    return { tradesPerMin, tradesPerSec };
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
  async monitor() {
    try {
      // Dati da Pump.fun
      const dataRes = await fetch(`https://pumpportal.fun/api/data/${this.mint}`);
      const data = await dataRes.json();
      const vSol = parseFloat(data.vSolInBondingCurve || 0);

      // Dati delle ultime transazioni
      const tradesRes = await fetch(`https://pump.fun/api/trades?mint=${this.mint}&limit=50`);
      const trades = await tradesRes.json();

      const { rate, speed, trend } = this.updateLCR(vSol);
      const { tradesPerMin } = this.updateTradeVelocity(trades);
      const liqStatus = this.getLiquidityStatus();
      const velStatus = this.getVelocityStatus(tradesPerMin);

      console.log(
        `[${new Date().toLocaleTimeString()}] vSol=${vSol.toFixed(3)} | Δ=${rate.toFixed(2)}% | speed=${speed.toFixed(2)}%/s | TV=${tradesPerMin}/min | ${liqStatus} | ${velStatus}`
      );

      // Esempio di trigger automatico
      if (rate < -40 && speed < -10 && tradesPerMin < 30) {
        console.log("🚨 Rug likelihood high! Consider auto-sell");
      }

    } catch (err) {
      console.error("Errore monitor:", err.message);
    }

    setTimeout(() => this.monitor(), this.updateIntervalMs);
  }
}
