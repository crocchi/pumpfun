import WebSocket from 'ws';
import { isSafeToken } from './utils.js';
import { monitorEarlyTrades ,setSuspiciousSellDetected , setMintMonitor , getMintMonitor,getSolAmount, setSolAmount } from './tradeMonitor.js';
import { snipeToken } from './snipeToken.js';
import { startHttpServer, logToken ,updateToken } from './httpServer.js';
import { MAX_TOKENS_SUBSCRIBED, SOLANA_USD } from './config.js';
import { wshelius, target_mint } from './utility/test.js';

// Avvia HTTP server
startHttpServer(process.env.PORT);


export const ws = new WebSocket('wss://pumpportal.fun/api/data');
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
let priceInSol;
ws.on('message', async function message(data) {
  //console.log(JSON.parse(data));
  if(!data) return
  try {
    const parsed = JSON.parse(data);
    //console.log(parsed);
    const token = parsed;
    let prezzo;

    const liquidityCheck =async (tk)=>{
      
      //CONTROLLO PREZZO QUANDO NN CE LIQUIDITà 
      if (token.solInPool > 0 && token.tokensInPool > 0) {
          prezzo = (token.solInPool / token.tokensInPool).toFixed(10);
        } else if (token.vSolInBondingCurve > 0 && token.vTokensInBondingCurve > 0) {
          prezzo = (token.vSolInBondingCurve / token.vTokensInBondingCurve).toFixed(10);
          token.solInPool = token.vSolInBondingCurve;
          token.tokensInPool = token.vTokensInBondingCurve;
        } else {
          prezzo = null; // o "0.0000000000", o un valore di fallback
        }
        return prezzo
  }
    
    // Verifica se è un evento di creazione token
    if (parsed.txType === 'create') {

      //QUI INIZIA A CONTROLLARE LE TRX DEL TOKEN...SE VIENE VENDUTO TROPPO PRESTO, LO SCARTA
      //await monitorEarlyTrades(token, snipeToken);


    liquidityCheck()

        const safer = await isSafeToken(token);

        // console.log(safer);
       const safe = safer.length === 0;  
       if (!safe) {

           console.log(`⛔ Token '${parsed.name}' scartato per sicurezza.` , JSON.stringify(safer) );
           console.log(`--------------------------------------`);
           return
         }

         /*
         setMintMonitor(token.mint); // Imposta il mint del token da monitorare x controllare le vendite sospette
         let devBot=await monitorEarlyTrades(token);
         if (!devBot) {
         console.log(`✅ Token '${parsed.name}' non sicuro e monitorato per vendite sospette.`);
         return;
         }*/
         
        console.log("Token:", token);

        console.log(`-----------------------------------------------`);
        console.log(`🚀 Nuovo token: ${token.name} (${token.symbol})`);
        console.log(`🧠 Mint: ${token.mint}`);
        console.log(`📈 MarketCap (SOL): ${token.marketCapSol}`);
        const solToUsdRate = SOLANA_USD; // Replace with the current SOL to USD conversion rate
        const marketCapUsd = (token.marketCapSol * SOLANA_USD).toFixed(2);
        const totTokens= token.tokensInPool + token.initialBuy;
        console.log(`📈 MarketCap (USD): ${marketCapUsd}`);
        console.log(`💰 Price SOL: ${prezzo} -(${priceInSol})`);
        console.log(`💧 Liquidity in pool: ${token.solInPool} SOL`);
        console.log(`💧 Tot Tokens:${totTokens}`);
        console.log(`👤 Creatore: ${token.traderPublicKey}`);
        console.log(`📦 URI: ${token.uri}`);
        console.log(`🌊 Pool: ${token.pool}`);
        console.log(`⏱️ Controlla se qualcuno vende troppo presto`);
        // 
        

        logToken({
            mint: token.mint,
            name: token.name,
            symbol: token.symbol,
            solInPool: token.solInPool || token.vSolInBondingCurve,
            tokensInPool: token.tokensInPool || token.vTokensInBondingCurve,
            marketCapSol: token.marketCapSol,
            price: prezzo,
            transactions:[],
            trxNum: 0,
            startPrice: prezzo,
            marketCapUsd: marketCapUsd,
            oldMarketCapUsd:marketCapUsd,
            safe: true // o false in base ai filtri //aggiungi array con filtri
          });
  
           // 👉 Sottoscrizione ai trade del token appena creato
      if (!subscribedTokens.has(token.mint)) {
        console.log(`🔔 Sottoscrizione ai trade del token ${token.mint}`);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            method: "subscribeTokenTrade",
            keys: [token.mint]
          }));
        } else {
          console.error(`❌ WebSocket non è aperto. Impossibile sottoscrivere il token ${token.mint}`);
        }
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


    // (parsed.txType === 'BUY')
    /////// zona monitoraggio 
    
   let tradeMintMonitor= getMintMonitor();
   if (tradeMintMonitor === parsed.mint && parsed.txType === 'buy') {
      console.log(`👁️  Nuovo trade sol:(${parsed.solAmount}) di acquisto per ${parsed.mint} da ${parsed.traderPublicKey}`);
      priceInSol = liquidityCheck(parsed) //(parsed.solInPool / parsed.tokensInPool).toFixed(10) || (parsed.vSolInBondingCurve / parsed.vTokensInBondingCurve).toFixed(10);
      console.log('SOL:',priceInSol);
      setSolAmount(parsed.solAmount);
      if(parsed.solAmount < 0.008) {
        console.log(`❌ Acquisto troppo piccolo (${parsed.solAmount} SOL) per ${parsed.mint}. Ignorato.`);
        setSuspiciousSellDetected(true);
        return; // Esci se l'acquisto è troppo piccolo
      }
      setSuspiciousSellDetected(false); // resetta il flag di vendita sospetta
      console.log('solValueTrx:',getSolAmount());
      return; // Esci se è un acquisto
    }
   
    if (tradeMintMonitor === parsed.mint && parsed.txType === 'sell') {
      console.log(`⚠️ Token:[${parsed.mint}] - Vendita precoce da ${parsed.traderPublicKey} – possibile dev bot. sol:(${parsed.solAmount})`);
      priceInSol = liquidityCheck()//(parsed.solInPool / parsed.tokensInPool).toFixed(10) || (parsed.vSolInBondingCurve / parsed.vTokensInBondingCurve).toFixed(10);
      console.log('SOL:',priceInSol);
      setSolAmount(-(parsed.solAmount));
      if(parsed.solAmount > 0.48) {
        console.log(`❌ Vendita troppo alta (${parsed.solAmount} SOL) per ${parsed.mint}.`);
        setSuspiciousSellDetected(true);
           console.log('solValueTrx:',getSolAmount());
        return; // Esci se l'acquisto è troppo piccolo
      }
      setSuspiciousSellDetected(true);
         console.log('solValueTrx:',getSolAmount());
      return; // Esci se è una vendita sospetta
    }


    // Verifica se è un evento di trade
     if(parsed.txType === 'buy' || parsed.txType === 'sell') {

        const trade = parsed;

        console.log('trade:',trade);

         //CONTROLLO PREZZO QUANDO NN CE LIQUIDITà 
         if (trade.solInPool > 0 && trade.tokensInPool > 0) {
          prezzo = (trade.solInPool / trade.tokensInPool).toFixed(10);
        } else if (trade.vSolInBondingCurve > 0 && trade.vTokensInBondingCurve > 0) {
         // prezzo = (token.vSolInBondingCurve / token.vTokensInBondingCurve).toFixed(10);
          trade.solInPool = trade.vSolInBondingCurve;
          trade.tokensInPool = trade.vTokensInBondingCurve;
        } else {
          prezzo = null; // o "0.0000000000", o un valore di fallback
        }
        /*trade: {
  signature: '5gps1pMHNVzKXrVZpDUL82BemLXLmaUDC2vE7hruHipdLV1gaJ12dXA7VLkrfxWN3Xk8TPafiAVkEhDyKm94GCNk',
  mint: '71wWAbjJXJdktxckA9Ux7PuDsVuBzFa68xeWU3aBpump',
  traderPublicKey: '2UBpKQXowuLNbdjFzQmKMExmA4tDduQoTw8ayVvjngPu',
  txType: 'buy',
  tokenAmount: 361368.237917,
  solAmount: 0.011140727,
  newTokenBalance: 361368.237917,
  bondingCurveKey: '2fFiwBDXbJfnuyrbqoHMdsBGJLsjVmzKEXewaTYcxw63',
  vTokensInBondingCurve: 1021649496.746058,
  vSolInBondingCurve: 31.507870460979802,
  marketCapSol: 30.840195743581347,
  pool: 'pump'
} */
        if (trade && trade.mint && trade.solInPool && trade.tokensInPool) {
          const prezzo = (trade.solInPool / trade.tokensInPool).toFixed(10);
         // const price = formatPrezzoTokenNoSci(prezzo);
          const marketCapUsd = (trade.marketCapSol * SOLANA_USD).toFixed(2);
          //updateToken(trade.mint, price, trade.marketCapSol, marketCapUsd);
         
         updateToken(trade.mint, {
            marketCapSol: trade.marketCapSol,
            price: prezzo,
            marketCapUsd: marketCapUsd,
           // trxNum: trxNumm ,
          },parsed.txType).then(tradeInfo => {
            let typesellbuy=0
            if(parsed.txType === 'buy'){  }
            if (tradeInfo.price > tradeInfo.startPrice * 3.5 && tradeInfo.trxNum > 2) { 
                console.log(`📊 vendi ${tradeInfo.name}: gain  buy at ${tradeInfo.startPrice} -- sold at  ${tradeInfo.price}`);
                subscribedTokens.delete(trade.mint);
                console.log(`🚫 Unsubscribed da ${trade.mint} venduto!!)`);
                ws.send(JSON.stringify({
                    method: "unsubscribeTokenTrade",
                    keys: [trade.mint]
                  }));
                  
            }
          // Se il numero di transazioni supera 20 e il prezzo è superiore al 20% del prezzo iniziale, vendi
            if (tradeInfo.trxNum >20 && tradeInfo.price > tradeInfo.startPrice * 1.2) { 

                console.log(`📊 RUgPool - vendi ${tradeInfo.name}: gain  buy at ${tradeInfo.startPrice} -- sold at  ${tradeInfo.price}`);
                ws.send(JSON.stringify({
                    method: "unsubscribeTokenTrade",
                    keys: [trade.mint]
                  }));
                  subscribedTokens.delete(trade.mint);
                  console.log(`🚫 Unsubscribed da ${trade.mint} venduto!!)`);
            }

            console.log(`(${tradeInfo.name})📊 Trade su ${trade.mint}: ${trade.txType} - ${trade.tokenAmount}- SOL:${trade.solAmount}`);
          });
        }        
        
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


  Token: {
  signature: '2oX7kmxH1ZbsZC6cWAi32bPKGUx8gRbg1Gj3pdApYhMAnhRKGdWyrANcFf3uds9LX1msX8g68LfnqRBz8ZEphUVF',
  traderPublicKey: '9ucgA2kLtPHMiDyrpHFpo3dM8ARnjZH8LsTzZLRRYDkp',
  txType: 'create',
  mint: 'EZj5APqbQRq3zTBgx69YMxcocNGuoaajEwRkreDabonk',
  solInPool: 1,
  tokensInPool: 965806095.367446,
  initialBuy: 34193904.632554054,
  solAmount: 1,
  newTokenBalance: 34193904.632554,
  marketCapSol: 29.828443281136384,
  name: 'Bonko Robotics',
  symbol: 'BONKO',
  uri: 'https://ipfs.io/ipfs/bafkreiarm4uhc6puyp53mpb7tplwcdznbpwby6nxd7x6ajb3yuqjbnwutu',
  pool: 'bonk'
}

trade: {
  signature: '2FJN336cE5j1FmSztVcw8SfUgJvo6MiiQAjwjknHgotawARa8mML9aabxuHWm81QbhVMe7njCGiZ7NMKQ8L6egiD',
  mint: '2QUBk6zYvTXESAsZCpzFqDRc6RSih48c2ZP8fzanpump',
  traderPublicKey: '84fyE6x3cD8wTVbriXTCMRcuEkJjEcBrzqkBWnwxPdg2',
  txType: 'sell',
  tokenAmount: 72625,
  solAmount: 0.0020545,
  newTokenBalance: 0,
  bondingCurveKey: 'AQbcTZxAL48NqGnT1TVksMLGXj4ETPqHxVrDKebGg7Zm',
  vTokensInBondingCurve: 1066756445.497429,
  vSolInBondingCurve: 30.175585191791168,
  marketCapSol: 28.287230247500666,
  pool: 'pump'
}
} */
