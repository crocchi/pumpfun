import WebSocket from 'ws';
import { isSafeToken, formatPrezzoTokenNoSci } from './utils.js';
import { monitorEarlyTrades } from './tradeMonitor.js';
import { snipeToken } from './snipeToken.js';
import { startHttpServer, logToken ,updateToken } from './httpServer.js';
import { MAX_TOKENS_SUBSCRIBED } from './config.js';

// Avvia HTTP server
startHttpServer(process.env.PORT);


const ws = new WebSocket('wss://pumpportal.fun/api/data');
const subscribedTokens = new Set();

ws.on('open', function open() {
    console.log('📡 Connesso al WebSocket di Pump.fun');
  // Subscribing to token creation events
  let payload = {
      method: "subscribeNewToken", 
    }
  ws.send(JSON.stringify(payload));
/*
  // Subscribing to migration events
  let payload = {
      method: "subscribeMigration", 
    }
  ws.send(JSON.stringify(payload));

  // Subscribing to trades made by accounts
  payload = {
      method: "subscribeAccountTrade",
      keys: ["AArPXm8JatJiuyEffuC1un2Sc835SULa4uQqDcaGpAjV"] // array of accounts to watch
    }
  ws.send(JSON.stringify(payload));

    //"@solana/spl-token": "^0.3.8",
    //"@solana/web3.js": "^1.91.0",
    //"axios": "^1.6.8",
    //"bs58": "^5.0.1",


  // Subscribing to trades on tokens
  payload = {
      method: "subscribeTokenTrade",
      keys: ["91WNez8D22NwBssQbkzjy4s2ipFrzpmn5hfvWVe2aY5p"] // array of token CAs to watch
    }
  ws.send(JSON.stringify(payload));

  */
});

ws.on('message', async function message(data) {
  //console.log(JSON.parse(data));
  if(!data) return
  try {
    const parsed = JSON.parse(data);
    //console.log(parsed);

    // Verifica se è un evento di creazione token
    if (parsed.txType === 'create') {

        const safer = await isSafeToken(parsed);
        // console.log(safer);
       const safe = safer.length === 0;  
       if (!safe) {

           console.log(`⛔ Token '${parsed.name}' scartato per sicurezza.`);
           console.log(safer);
           return
         }

        const token = parsed;

        const prezzo = (token.solInPool / token.tokensInPool).toFixed(10);
        let price=formatPrezzoTokenNoSci(prezzo);


        console.log(`-----------------------------------------------`);
        console.log(`🚀 Nuovo token: ${token.name} (${token.symbol})`);
        console.log(`🧠 Mint: ${token.mint}`);
        console.log(`📈 MarketCap (SOL): ${token.marketCapSol}`);
        const solToUsdRate = 180; // Replace with the current SOL to USD conversion rate
        const marketCapUsd = (token.marketCapSol * solToUsdRate).toFixed(2);
        console.log(`📈 MarketCap (USD): ${marketCapUsd}`);
        console.log(`💰 Price: ${price} - ${prezzo}`);
        console.log(`💧 Liquidity in pool: ${token.solInPool} SOL`);
        console.log(`👤 Creatore: ${token.traderPublicKey}`);
        console.log(`📦 URI: ${token.uri}`);
        console.log(`🌊 Pool: ${token.pool}`);
        console.log(`⏱️ Controlla se qualcuno vende troppo presto`);
        // 
        //await monitorEarlyTrades(token, snipeToken);

        logToken({
            mint: token.mint,
            name: token.name,
            symbol: token.symbol,
            solInPool: token.solInPool,
            tokensInPool: token.tokensInPool,
            marketCapSol: token.marketCapSol,
            price: prezzo,
            marketCapUsd: marketCapUsd,
            oldMarketCapUsd:marketCapUsd,
            safe: true // o false in base ai filtri //aggiungi array con filtri
          });
  
           // 👉 Sottoscrizione ai trade del token appena creato
      if (!subscribedTokens.has(token.mint)) {
        console.log(`🔔 Sottoscrizione ai trade del token ${token.mint}`);
        ws.send(JSON.stringify({
          method: "subscribeTokenTrade",
          keys: [token.mint]
        }));
        subscribedTokens.add(token.mint);
      }

// Se superiamo i 40 token, rimuoviamo i più vecchi
if (subscribedTokens.size > MAX_TOKENS_SUBSCRIBED) {
    const mintToRemove = [...subscribedTokens][0];
    ws.send(JSON.stringify({
      method: "unsubscribeTokenTrade",
      keys: [mintToRemove]
    }));
    subscribedTokens.delete(mintToRemove);
    console.log(`🚫 Unsubscribed da ${mintToRemove} (limite ${MAX_TOKENS_SUBSCRIBED})`);
  }


        console.log(`-----------------------------------------------`);
      // 👉 Qui puoi chiamare la tua funzione `snipeToken(token.mint)`

    }// fine if (parsed.txType === 'create')

    // Verifica se è un evento di trade
     if(parsed.txType === 'buy' || parsed.txType === 'sell') {


//yooooo controllloooooooo qui

        const trade = parsed;
        if (trade && trade.mint && trade.solInPool && trade.tokensInPool) {
          const prezzo = (trade.solInPool / trade.tokensInPool).toFixed(10);
         // const price = formatPrezzoTokenNoSci(prezzo);
          const marketCapUsd = (trade.marketCapSol * 180).toFixed(2);
          //updateToken(trade.mint, price, trade.marketCapSol, marketCapUsd);
          updateToken(trade.mint, {
            marketCapSol: trade.marketCapSol,
            price: prezzo,
            marketCapUsd: marketCapUsd,
          });
        }
  
        console.log(`📊 Trade su ${trade.mint}: ${trade.txType} - ${trade.tokenAmount}`);
      }
    // Aggiungi altri tipi di eventi se vuoi
  } catch (e) {
    console.error('❌ Errore nel parsing:', e);
  }

});


/*{
  signature: '5i4GzuYha8LiJwB8VQHEQcH5d1pUV3TMsctcZa3hvLDJCWU3tBwddyi8z8V26R1GU4jrcvzLfNGVtoLUeCWEYRRj',
  mint: '2bTEEruUggcJh119Q6ygSmgkHbJdyPoE9kd6HWA9pump',
  traderPublicKey: 'cS623iywjgTbVFB9bBQHbm1GLcWZK2BeH4QgWv6jTPM',
  txType: 'create',
  initialBuy: 29584634.770795,
  solAmount: 0.85060952,
  bondingCurveKey: 'DA8knqotzcouguCZZJAY9HojgpEHthCHU22MCDrt7uoa',
  vTokensInBondingCurve: 1043415365.229205,
  vSolInBondingCurve: 30.850609520139553,
  marketCapSol: 29.566949604353066,
  name: 'TRUMPFART - PolitiFi fartstorm!',
  symbol: 'TRUMPFART',
  uri: 'https://ipfs.io/ipfs/Qman32r9Sc3dZjw4ibXcFXqCcPvAi5BzrojyusxAFEQdtM',
  pool: 'pump'
} */
