//import { ws } from './index.js';
import WebSocket from "ws";
import { LIGHT_WALLET_API , botOptions } from './config.js';


// Token contract addresses
export const TOKENS = {
    PUMP: "pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn",
    SOL: "So11111111111111111111111111111111111111112",
    USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
};

// Fee per swap (0.25%)
const FEE = 0.0025;
const wsArb = new WebSocket(`wss://pumpportal.fun/api/data?api-key=${LIGHT_WALLET_API}`);

wsArb.on("open", () => {
  console.log("✅ Connesso a PumpSwap WebSocket");

  // Mi iscrivo ai trade dei token che ci servono
  Object.values(TOKENS).forEach((ca) => {
    wsArb.send(JSON.stringify({ method: "subscribeTokenTrade", keys: [ca] }));
  });
});



wsArb.on("message", (data) => { // txType: 'sell',
    console.log('Websocket:Pumpswap');
    
    try {
        const trade = JSON.parse(data);
        
        if (trade.txType === "sell" || trade.txType === "buy" && trade.mint === TOKENS.PUMP || trade.mint === TOKENS.SOL || trade.mint === TOKENS.USDC ) {
           if(trade.pool ==="pump"){
            console.log('operazione arbitraggio');
            updatePrice(trade);
            checkArbitrage();
           
            
           }
             console.log(trade);
           
           
        }
    } catch (err) {
        console.error("Errore parsing messaggio:", err);
    }
});



let lastPrices = {};

// Aggiorna i prezzi ricevuti dai trade
function updatePrice(trade) {
  const { mint, tokensInPool , tokenAmount, vTokensInBondingCurve, vSolInBondingCurve } = trade;

  if (vTokensInBondingCurve && vSolInBondingCurve) {
    const priceInSOL = vSolInBondingCurve / vTokensInBondingCurve;
    lastPrices[mint] = priceInSOL;
     console.log(`📊 Prezzo aggiornato ${mint}: ${priceInSOL.toFixed(8)} SOL`);
  }
}

// Applica la fee al valore passato
function applyFee(amount) {
    return amount * (1 - FEE);
}

// Controlla più percorsi di arbitraggio
function checkArbitrage() {
    const sol = lastPrices[TOKENS.SOL];
    const usdc = lastPrices[TOKENS.USDC];
    const pump = lastPrices[TOKENS.PUMP];

    if (!sol || !usdc || !pump) return;

    const startSOL = 1;

    // -------------------------
    // Percorso 1: SOL → USDC → PUMP → SOL
    // -------------------------
    let step1 = applyFee(startSOL * sol);       // SOL → USDC
    let step2 = applyFee(step1 / pump);         // USDC → PUMP
    let final1 = applyFee(step2 * (1 / sol));   // PUMP → SOL

    if (final1 > startSOL * 1.01) {
        console.log("💰 Opportunità arbitraggio (SOL→USDC→PUMP→SOL)", {
            start: startSOL,
            result: final1,
            gain: ((final1 - startSOL) / startSOL * 100).toFixed(2) + "%"
        });
    }

    // -------------------------
    // Percorso 2: SOL → PUMP → USDC → SOL
    // -------------------------
    step1 = applyFee(startSOL / pump);          // SOL → PUMP
    step2 = applyFee(step1 * usdc);             // PUMP → USDC
    let final2 = applyFee(step2 * (1 / sol));   // USDC → SOL

    if (final2 > startSOL * 1.01) {
        console.log("💰 Opportunità arbitraggio (SOL→PUMP→USDC→SOL)", {
            start: startSOL,
            result: final2,
            gain: ((final2 - startSOL) / startSOL * 100).toFixed(2) + "%"
        });
    }
}



/*
operazione arbitraggio
{
  signature: '2h8D2spktY5QiRAb9jUhneyYzumFKAMSFCc3tcpypE6oDqq5SAtKaxMHUwAHpfEKHJxZATvRcRPBVohiGt1YE4Bf',
  traderPublicKey: '2sp6rCc4VaXJ5qCbrPukpQVjZVZey42pj7QkynYNDdw3',
  txType: 'sell',
  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  tokensInPool: 361346838.207477,
  tokenAmount: 18561397.352072954,
  solAmount: 0,
  newTokenBalance: 171827.495903,
  marketCapSol: 170.6068420758105,
  pool: 'bonk'
}
Websocket:Pumpswap
operazione arbitraggio
{
  signature: '5iUsWZcThjKW62A3METBJ4ZuQg6ME2XZiGMFAXg6ACbGJCo2M3sKN6oxxdrjxvQaFBkaHgxjqvbxTn8mJwVTCqVU',
  traderPublicKey: 'fEe1SXYGDYGY7c7ttEY2Jyffzotx12heiw8xdrctvi1',
  txType: 'sell',
  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  tokensInPool: 614671988.619701,
  tokenAmount: 14379695.576521039,
  solAmount: 0,
  newTokenBalance: 270757.403997,
  marketCapSol: 68.06533190480448,
  pool: 'bonk'
}
Websocket:Pumpswap
operazione arbitraggio
{
  signature: 'mD1z2vJRR8QMqt15Q8UvtGjezQMkQjwPoDJeu3KqqpibChwzHdcPVHvF5R6zUEquCwNKTWxv18zNSFxxpLwXqYE',
  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  traderPublicKey: '8ekCy2jHHUbW2yeNGFWYJT9Hm9FW7SvZcZK66dSZCDiF',
  txType: 'sell',
  tokenAmount: 0.40022100042551756,
  solAmount: 1.1e-8,
  newTokenBalance: 5108257.63892,
  bondingCurveKey: '9TfWepdMDkcJwMzncKcP7eoJnQhhvKv7t9nvJB1Af4BF',
  vTokensInBondingCurve: 1067517965.190479,
  vSolInBondingCurve: 30.154059275486087,
  marketCapSol: 28.2468869459313,
  pool: 'pump'
}
  Websocket:Pumpswap
operazione arbitraggio
{
  signature: '21sC5npLgVcWMyer3WL1CcvcmLMvqa6uQ4HYSkjmWUwqPNN5Vwc2s2ojcWRvcdNCcJ4wotNt1RTJKuLfxKHVTQgZ',
  traderPublicKey: 'GDRn58EeJziWcxjyice7vLtvgcvaVMnnHHKdKPzMbSM5',
  txType: 'sell',
  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  tokensInPool: 536261386.564384,
  tokenAmount: 2504082.779823065,
  solAmount: 0,
  newTokenBalance: 772296.030714,
  marketCapSol: 86.71159283252955,
  pool: 'bonk'
}
Websocket:Pumpswap
operazione arbitraggio
{
  signature: '2AUZb3UoUcVv9VKvSfpNwupG3pCF7P4xeB7rjkJS1RVz9oW5BXWQvidVtrtxCPNySyyJsoyg4RyrrBxfRcTtNLbu',
  traderPublicKey: '2sp6rCc4VaXJ5qCbrPukpQVjZVZey42pj7QkynYNDdw3',
  txType: 'sell',
  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  tokensInPool: 498320032.970717,
  tokenAmount: 21085832.375319004,
  solAmount: 0,
  newTokenBalance: 178184.903608,
  marketCapSol: 98.61049610006806,
  pool: 'bonk'
}
Websocket:Pumpswap
operazione arbitraggio
{
  signature: '28TDeQJow3qf2thaX9r2bqpLoifAf5h92BsiCPWR3EhnCCzEYbHyj9CMX59RCrfZXm59zcBFDWGzUnNMi8oWCUHQ',
  traderPublicKey: 'DB3sUCP2H4icbeKmK6yb6nUxU5ogbcRHtGuq7W2RoRwW',
  txType: 'sell',
  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  tokensInPool: 484666228.814609,
  tokenAmount: 20071940.58822,
  solAmount: 0,
  newTokenBalance: 413548.675969,
  marketCapSol: 103.49810670016349,
  pool: 'bonk'
}
Websocket:Pumpswap
operazione arbitraggio
{
  signature: '65TwJfyuxCdLXL32E5jEtYiQ4L3w7cgdiwN5mJPGpebTvXfMHvMkEjMvxaQYxK69dGw6FkoJKMEgaHEsGYNZvJ5U',
  traderPublicKey: 'CAPhoEse9xEH95XmdnJjYrZdNCA8xfUWdy3aWymHa1Vj',
  txType: 'sell',
  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  tokensInPool: 552031104.099742,
  tokenAmount: 2443310.2573999166,
  solAmount: 0,
  newTokenBalance: 1572852.297618,
  marketCapSol: 82.39144766100443,
  pool: 'bonk'
}
Websocket:Pumpswap
operazione arbitraggio
{
  signature: '4Hi8Jm3DtTSEiARoAaCUzKwxfwoyvsND2BEAKCnrFw7qSs49KuaXxCvk9nWHDV1F98V9K6DM9MrjkPNu5gLpZBmY',
  traderPublicKey: 'CAPhoEse9xEH95XmdnJjYrZdNCA8xfUWdy3aWymHa1Vj',
  txType: 'sell',
  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  tokensInPool: 474176439.718139,
  tokenAmount: 3754932.917244017,
  solAmount: 0,
  newTokenBalance: 1530356.032521,
  marketCapSol: 107.5042299437462,
  pool: 'bonk'
}
Websocket:Pumpswap
operazione arbitraggio
{
  signature: '3YZyu5R3cfPzdQ1FNxSq45W1dihRJ8KywGNR6YzAc5jhDiTsVH5t4xWEzSCSo86qEKH8f2mu5PgLkcnJ8vL8HJAB',
  traderPublicKey: '6n9VhCwQ7EwK6NqFDjnHPzEk6wZdRBTfh43RFgHQWHuQ',
  txType: 'sell',
  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  tokensInPool: 479162953.329363,
  tokenAmount: 13608467.570482016,
  solAmount: 0,
  newTokenBalance: 445210.933072,
  marketCapSol: 105.57137272131217,
  pool: 'bonk'
}
Websocket:Pumpswap
operazione arbitraggio
{
  signature: '4PKtke22gery9GW7YKd2WeSdC9X39UvG2h2xHXzt2dfkRB2mnN7RZsM1HL85AuVZnNU1Uc41k2Dw2xGdTmde5XBS',
  traderPublicKey: '4ynTYgJK5ruYx3AZMRjCHrJk1qkm61fePF7dkbvRQD46',
  txType: 'sell',
  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  tokensInPool: 977360472.021452,
  tokenAmount: 5326151.800780058,
  solAmount: 0,
  newTokenBalance: 348788.59593,
  marketCapSol: 29.175819479652393,
  pool: 'bonk'
}
Websocket:Pumpswap
operazione arbitraggio
{
  signature: '5yZrBVCZK6BTZCGtgiyFAh5MuVniET1xpVPtGBNCv1iJ8FgzbHvfsTtz6rZMcEetbZKMQkmCGne47F3TJAQ8tUCy',
  traderPublicKey: '2sp6rCc4VaXJ5qCbrPukpQVjZVZey42pj7QkynYNDdw3',
  txType: 'sell',
  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  tokensInPool: 440761012.596937,
  tokenAmount: 4137435.2451660037,
  solAmount: 0,
  newTokenBalance: 178332.981881,
  marketCapSol: 121.94258560379794,
  pool: 'bonk'
}
Websocket:Pumpswap
operazione arbitraggio
{
  signature: '5wMZA5n7SeewrVhQWSYZ2ACZFgPduSAs8KosqEYzT6tgVVE2d1g8jBj4RJGxiTqsGeqQz4hJLQ3GgRD3GJEeMqTU',
  traderPublicKey: '8ekCy2jHHUbW2yeNGFWYJT9Hm9FW7SvZcZK66dSZCDiF',
  txType: 'sell',
  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  tokensInPool: 717399788.392662,
  tokenAmount: 5722253.8872869015,
  solAmount: 0,
  newTokenBalance: 5044148.300783,
  marketCapSol: 51.52277049028946,
  pool: 'bonk'
}
Websocket:Pumpswap
operazione arbitraggio
{
  signature: '5k3GqTNKZv5AoZD7H3ssQ3S74YCf5E244VanLz2zARAs8NacNPEHP23ze3gxWWWx7VZjPNWtr6rDBYadGvq9eNcQ',
  traderPublicKey: '7imnGYfCovXjMWKdbQvETFVMe72MQDX4S5zW4GFxMJME',
  txType: 'sell',
  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  tokensInPool: 448339158.647985,
  tokenAmount: 4259383.101345003,
  solAmount: 0,
  newTokenBalance: 1811647.109556,
  marketCapSol: 118.4234266494125,
  pool: 'bonk'
}

*/