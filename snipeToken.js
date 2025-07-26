import { logToken } from './httpServer.js';

export async function snipeToken(token) {

    logToken({
        mint: token.mint,
        name: token.name,
        symbol: token.symbol,
        solInPool: token.solInPool,
        tokensInPool: token.tokensInPool,
        marketCapSol: token.marketCapSol,
        safe: true // o false in base ai filtri
      });

    console.log(`⚠️  Sniper Bot Buy ${token.name}.`);
    return true
}