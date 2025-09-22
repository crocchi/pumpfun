import WebSocket from 'ws';
import { isSafeToken } from './utils.js';
import TokenMonitor from './tradeMonitor.js';
import TokenLogger from './tokenLogger.js';
import { sendMessageToClient } from './socketio.js';
import { checkAccount } from "./utility/twitter.js";


import { startHttpServer, logToken ,updateToken, buyTokenLog } from './httpServer.js';
import { MAX_TOKENS_SUBSCRIBED, SOLANA_USD, botOptions } from './config.js';
import { wshelius, target_mint, getTopHolders } from './utility/test.js';
import { getHour} from './utility/time.js';
import { buyToken , sellToken } from './utility/lightTrx.js';

// Avvia HTTP server
startHttpServer(process.env.PORT);

/*

            COSE DA FARE:
 🧩 Schema logico Sniper Bot
1. Rilevamento token

✅ Bot intercetta un nuovo token appena lanciato (es. Pump.fun o pool su Raydium).

⏱ Timestamp del lancio = t0.

2. Controlli iniziali (0–5s)

Verifica parametri critici:

Contratto valido e non blacklistato.

Trading abilitato.

Tasse < soglia (es. < 10%).

No funzioni sospette (es. blacklist, limit sell, hidden mint).

❌ Se fallisce → ignora token.
✅ Se passa → vai a fase 3.

3. Monitoraggio veloce (5–30s)

Osserva il token per un periodo breve, raccogliendo metriche:

Transazioni totali (es. > 20 in 20s).

Numero di holder unici (es. > 10).

Volume (es. > 5 SOL).

Liquidità (stabile o crescente).

Prezzo non collassato (> 70% del prezzo iniziale).

❌ Se i dati non superano le soglie → scarta token.
✅ Se i dati sono buoni → vai a fase 4.

4. Decisione di acquisto

Condizioni tipiche:

Holders >= 10

Volume >= 5 SOL

Liquidity > 2 SOL e non ritirata

Prezzo ≥ soglia minima (anti-dump)

Se tutte vere → Compra (size predefinita, es. 0.1–0.5 SOL).

5. Gestione della posizione (post-buy)

Attiva subito l’auto-sell:

Take profit dinamico (es. vendi il 50% a x2, il resto a x3 o trailing stop).

Stop loss (es. vendi se prezzo scende sotto -30%).
            -TRAILING SELL
            -HIGHPRICE TOKEN


            il creatore del token compra il token...rugpull,,,e se lo scambia con i bot
*/

export const ws = new WebSocket('wss://pumpportal.fun/api/data');
const subscribedTokens = new Set();
export const instances = new Map(); // Mappa per memorizzare le istanze di TokenMonitor
export const instancesToken  = new Map(); // Mappa per memorizzare le istanze di TokenLogger

checkAccount('elonmusk');
//getTop10Tokens();
//getCMC20Historical()


ws.on('open', function open() {
    console.log('📡 Connesso al WebSocket di Pump.fun');
  // Subscribing to token creation events
  let payload = {
      method: "subscribeNewToken", 
    }
  ws.send(JSON.stringify(payload));

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

    const liquidityCheck =async (tok)=>{
     // if(!tok) {tok=token}else {token=tok}
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


    liquidityCheck()
   // sendMessageToClient('newToken', token); // invio il token al client

        const safer = await isSafeToken(token);
        if (safer.valid !== true) {
          console.log(`⛔ Token '${parsed.name}' scartato per sicurezza.` , JSON.stringify(safer) );
          sendMessageToClient('logger', `⛔ Token '${parsed.name}' scartato per sicurezza. ` + JSON.stringify(safer) ); // invio il token al client
          //console.log(`---Pool:${token.pool}-----MINT:${token.mint}-----`);
         if(!parsed.name) console.log(token)
          console.log('--------------------------------------------')
          return

        }

        const monitor=getInstanceForTokenMonitor(token)
        monitor.orario()
        if(safer.fastBuy){ // fast buy
          let msg=(`✅ Token '${parsed.name}' passato per sicurezza. Procedo con l\'acquisto rapido.`);
         console.log(msg)
          monitor.tradeMonitor=false;// disabilito il monitoraggio
          sendMessageToClient('event',msg)
          //monitor.
        }else{      //modalità monitoraggio   
        let devbott=await monitor.startMonitor();
         if (!devbott) {
         console.log(`✅ Token '${parsed.name}' non sicuro e monitorato per vendite sospette.`);
         return;
           }
        }
         /*
         setMintMonitor(token.mint); // Imposta il mint del token da monitorare x controllare le vendite sospette
         let devBot=await monitorEarlyTrades(token);
         if (!devBot) {
         console.log(`✅ Token '${parsed.name}' non sicuro e monitorato per vendite sospette.`);
         return;
         }
*/

         liquidityCheck()
        console.log("Token:", token);

        console.log(`-----------------------------------------------`);
        console.log(`🚀 Nuovo token: ${token.name} (${token.symbol})`);
        sendMessageToClient('logger',`🚀 Nuovo token: ${token.name} (${token.symbol})`)
        console.log(`🧠 Mint: ${token.mint}`);
        console.log(`📈 MarketCap (SOL): ${token.marketCapSol}`);
        //const solToUsdRate = SOLANA_USD; // Replace with the current SOL to USD conversion rate
        const marketCapUsd = (token.marketCapSol * SOLANA_USD).toFixed(2);
        const totTokens= token.tokensInPool + token.initialBuy;
        let priceBuy=monitor.lastPrice() || prezzo;
        console.log(`📈 MarketCap (USD): ${marketCapUsd}`);
        console.log(`💰 Price SOL Start: ${prezzo} `);
        console.log(`💰 Price SOL Buy: ${priceBuy} `);   
        console.log(`💧 Liquidity in pool: ${token.solInPool} SOL`);
        console.log(`💧 Tot Tokens:${totTokens}`);
        console.log(`👤 Creatore: ${token.traderPublicKey}`);
        console.log(`📦 URI: ${token.uri}`);
        console.log(`🌊 Pool: ${token.pool}`);
        console.log(`⏱️ Controlla se qualcuno vende troppo presto`);
        let buyTokenSignature=await buyToken(token.mint);

        const tokenLog=getInstanceForTokenLogger(token)// iniz istanza di TokenLogger
        // buyTokenLog
        getTopHolders(token.mint).then(holders=>{
          console.log(`👥 Top 5 holders:`)

          if(holders){ 
              console.log(`Holders: ${holders?.value.length}`);
              tokenLog.holders=holders?.value.length;
              tokenLog.holdersList=holders?.value;
          }
          
        });

          // Logga il token nel database
          tokenLog.safeProblem=safer;
          tokenLog.buyPrice=priceBuy;
          tokenLog.startPrice=prezzo;
          tokenLog.highPrez=prezzo;
          tokenLog.buyTransactionSign=buyTokenSignature;
          tokenLog.marketCapUsd=marketCapUsd;



        logToken({
            mint: token.mint,
            name: token.name,
            symbol: token.symbol,
            solInPool: token.solInPool || token.vSolInBondingCurve,
            tokensInPool: token.tokensInPool || token.vTokensInBondingCurve,
            marketCapSol: token.marketCapSol,
            price: prezzo,
            transactions:monitor.trxArray,
            buySign:[buyTokenSignature],// ci metto le trx
            buyPrice:priceBuy,
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

  if (instances.size > 10) { // Limite di istanze TokenMonitor
    const lastMint = [...instances.keys()].shift()
    instances.delete(lastMint);
    console.log(`🗑️ Rimossa l'ultima istanza per il token ${lastMint} (limite superato).`);
     }


        console.log(`-----------------------------------------------`);
      // 👉 Qui puoi chiamare la tua funzione `snipeToken(token.mint)`
    return; // quando c'e evento di creazione,poi esci..nn ce
    // bisogno di continuare o no?, 
    }// fine if (parsed.txType === 'create')



    liquidityCheck()
    let tokenLog;
    if (instancesToken.has(parsed.mint)) { // controlla se esiste l'istanza dell'oggetto class
    //altrimenti la crea inutilmente prima di usarla
      // tokenMonitor= instances.get(parsed.mint);
      tokenLog=getInstanceForTokenLogger(token);
   }


    //controlla la tua transazione
    if(parsed.txType === 'buy' && parsed.traderPublicKey === botOptions.botWallet){
     priceInSol = liquidityCheck(parsed);
     console.log(`Acquisto rilevato wallet Bot:`);
     tokenLog.buyPrice=prezzo;
      buyTokenLog(parsed.mint, parsed.tokenAmount , parsed.solAmount, priceInSol)
    }

    if(parsed.txType === 'sell' && parsed.traderPublicKey === botOptions.botWallet){
      priceInSol = liquidityCheck(parsed);
       console.log(`vendita rilevata wallet Bot:`)
      tokenLog.sellPrice=prezzo;
      buyTokenLog(parsed.mint, parsed.tokenAmount , parsed.solAmount , priceInSol)
    }

    // (parsed.txType === 'BUY')
    /////////////////////////////
    /////// zona monitoraggio 
    //////////////////////

    
   let tradeMintMonitor;
   let tokenMonitor;//getMintMonitor();
   if (instances.has(parsed.mint)) { // controlla se esiste l'istanza dell'oggetto class
       tokenMonitor= instances.get(parsed.mint);
       if(tokenMonitor.tradeMonitor) {
        tradeMintMonitor=tokenMonitor.token.mint;
       }else{
        tradeMintMonitor=null
       }

   }

   // let tradeMintMonitor=getMintMonitor();
   if (tradeMintMonitor === parsed.mint && parsed.txType === 'buy') {
      liquidityCheck() //(parsed.solInPool / parsed.tokensInPool).toFixed(10) || (parsed.vSolInBondingCurve / parsed.vTokensInBondingCurve).toFixed(10);
      console.log(`👁️ Buy Token:[${tokenMonitor.token.name}] sol:(${parsed.solAmount.toFixed(5)}) Price:(${prezzo})  -> from ${parsed.traderPublicKey}`);
    sendMessageToClient('logger',`👁️ Buy Token:[${tokenMonitor.token.name}] sol:(${parsed.solAmount.toFixed(5)}) Price:(${prezzo})  -> from ${parsed.traderPublicKey}`)
        
      // console.log('SOL:',priceInSol);
      //setSolAmount(parsed.solAmount);
      tokenMonitor.addSolAmount(parsed.solAmount);
      tokenMonitor.addVolume(parsed.solAmount);
      tokenMonitor.livePrice(prezzo);
      //tokenMonitor.prez=prezzo;
      let solValueTrx = tokenMonitor.getSolAmount() 
      let trxNumm = tokenMonitor.getSolTrxNumMonitor();
      let volume = tokenMonitor.volume;
      tokenMonitor.trxArray.push({
            type:parsed.txType,
            amount:parsed.solAmount,
            trader:parsed.traderPublicKey,
            price: prezzo,
            time: getHour()
          });

          //
          
          if(parsed.marketCapSol > botOptions.marketCapSolUpQuickBuy && botOptions.marketCapSolUpMode && trxNumm > 10) {
          let msg=(`📈 🚀 [${tokenMonitor.token.name}] Market Cap Up Quick Buy! MarketCap:(${parsed.marketCapSol} SOL) TrxNumb:${trxNumm}  volume: ${volume}per ${parsed.mint}. buy at ${prezzo}`);
          console.log(msg);
          sendMessageToClient('event',msg)
         tokenMonitor.quickBuy=prezzo;
         tokenMonitor.quickSell=msg;
         tokenMonitor.cancelMonitor();
         return
      }
          


            //nuova regola da testare...
            //volume netto superiore al volume impostato
       if(solValueTrx > botOptions.quickBuyVolumeUp && !tokenMonitor.quick && botOptions.netVolumeUpBuy && trxNumm > botOptions.quickBuyTrxNumb && tokenMonitor.volume > botOptions.quickBuyVolumeMin) {//se il volume tra buy e sell e maggiore di 1.0 SOL e rugpull
        let msg=(`📈 🚀 volume netto superiore al volume impostato! Netvolume:(${solValueTrx} SOL) TrxNumb:${trxNumm}  volume: ${volume}per ${parsed.mint}. buy at ${prezzo}`);
        console.log(msg);
      sendMessageToClient('event',msg)

        tokenMonitor.quickBuy=prezzo;
        tokenMonitor.quickSell=msg;
        tokenMonitor.cancelMonitor();
       return
      }
      //nuova regola da testare...
      /*
       if(trxNumm >= 4 && solValueTrx > botOptions.volumeMin && trxNumm < 10 && !tokenMonitor.quick) {//se il volume tra buy e sell e maggiore di 1.0 SOL e rugpull
        console.log(`📈 Super Pump... Detect: volume:(${solValueTrx} SOL) per ${parsed.mint}.`);
        console.log("buy at sol: ",prezzo);
        tokenMonitor.quickBuy=prezzo;
        tokenMonitor.quickSell=`📈 Super Pump... Detect: volume:(${solValueTrx} SOL) per ${parsed.mint}.`
        tokenMonitor.quick=true;
       }
      */

      if(trxNumm >= 2 && solValueTrx > 1.50 && trxNumm < 4) {//se il volume tra buy e sell e maggiore di 1.0 SOL e rugpull
        console.log(`❌ RugPull Detect: volume:(${solValueTrx} SOL) per ${parsed.mint}.`);
        console.log("buy at sol: ",priceInSol);
        //cancelMonitor();
        //tokenMonitor.cancelMonitor();
        //monitorEarlyTrades.cancelMonitor();
        //return
      }
        if(solValueTrx > 1.50) {//se il volume tra buy e sell e maggiore di 1.50 SOL
         // console.log(`❌ volume alto: (${solValueTrx} SOL) per ${parsed.mint}.`);
          //setSuspiciousSellDetected(false);
          tokenMonitor.suspiciousSellDetected=false;
          return
      }
      if(parsed.solAmount < 0.008) {
        //console.log(`❌ Acquisto troppo piccolo (${parsed.solAmount} SOL) per ${parsed.mint}. Ignorato.`);
        //setSuspiciousSellDetected(true);
        tokenMonitor.suspiciousSellDetected=true;
        return; // Esci se l'acquisto è troppo piccolo
      }
      //setSuspiciousSellDetected(false); // resetta il flag di vendita sospetta
      tokenMonitor.suspiciousSellDetected=false;
      console.log('solValueTrx:', tokenMonitor.getSolAmount());
      return; // Esci se è un acquisto
    }
   
    if (tradeMintMonitor === parsed.mint && parsed.txType === 'sell') {
      priceInSol = liquidityCheck()
      console.log(`⚠️ Sell Token:[${tokenMonitor.token.name}] sol:(${parsed.solAmount.toFixed(5)}) Price:(${prezzo}) - Vendita precoce da ${parsed.traderPublicKey} – `);
         sendMessageToClient('logger',`⚠️ Sell Token:[${tokenMonitor.token.name}] sol:(${parsed.solAmount.toFixed(5)}) Price:(${prezzo}) - Vendita precoce da ${parsed.traderPublicKey} – `)
  
      //console.log('SOL:',priceInSol);
      tokenMonitor.addSolAmount(-(parsed.solAmount));
      tokenMonitor.addVolume(parsed.solAmount);
      tokenMonitor.livePrice(prezzo);
     // tokenMonitor.prez=prezzo;

         tokenMonitor.trxArray.push({
            type:parsed.txType,
            amount:parsed.solAmount,
            trader:parsed.traderPublicKey,
            price: prezzo,
            time: getHour()
          });

      //setSolAmount(-(parsed.solAmount));
      if(parsed.solAmount < 0.007) {
        //console.log(`❌ Vendita troppo piccola (${parsed.solAmount} SOL) per ${parsed.mint}. Ignorato.`);
        //setSuspiciousSellDetected(false);
        tokenMonitor.suspiciousSellDetected=false;
        return; // Esci se la vendita è troppo piccola

      }
      if(parsed.solAmount > 0.5) {
        console.log(`❌ Vendita troppo alta (${parsed.solAmount} SOL) per ${parsed.mint}.`);
       // setSuspiciousSellDetected(true);
        tokenMonitor.suspiciousSellDetected=true;
        console.log('solValueTrx:',tokenMonitor.getSolAmount());
        return; // Esci se l'acquisto è troppo piccolo
      }
      //setSuspiciousSellDetected(true);
      tokenMonitor.suspiciousSellDetected=true;
      console.log('solValueTrx:', tokenMonitor.getSolAmount());
      return; // Esci dall'area monitor
    }

    //FINE ZONA MONITORAGGIO
    /////////////////////////
    ////////////////////////

    // Verifica se è un evento di trade // trade dp monitor
     if(parsed.txType === 'buy' || parsed.txType === 'sell') {
    

      if(tokenMonitor.tradeMonitorOff){
        sendMessageToClient('event',`⚠️ esci dal bug... `);
        return
      }
        const trade = parsed;
      tokenLog=await getInstanceForTokenLogger(trade);
      //tokenMonitor= instances.get(parsed.mint);
      if (instances.has(parsed.mint)) { // controlla se esiste l'istanza dell'oggetto class
       //console.log("Token monitor trovato per il merging...");
        tokenMonitor= instances.get(parsed.mint);
       tokenLog.linked(tokenMonitor)
      }
      
      //  console.log('trade:',trade);

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
          
          // Aggiorna il token nel database
         // tokenLog.price=prezzo;
          tokenLog.marketCapUsd=marketCapUsd;
          tokenLog.logTransaction(trade);
          //tokenLog.addSolAmount(-(trade.solAmount));
         // tokenLog.addVolume(trade.solAmount);

         updateToken(trade.mint, {
            marketCapSol: trade.marketCapSol,
            price: prezzo,
            marketCapUsd: marketCapUsd,
           // trxNum: trxNumm ,
          },parsed.txType).then(tradeInfo => {
            
            if(parsed.txType === 'buy'){  }

          // LOGICA DI VENDITA AUTOMATICA
if(tradeInfo && tradeInfo.price && tradeInfo.startPrice && tradeInfo.trxNum) {//fix tradeinfo undefined

  //percentuale cambiamento 
  const change = ((tradeInfo.price - tradeInfo.buyPrice) / tradeInfo.buyPrice) * 100;
  priceInSol = liquidityCheck(trade) 
//  console.log(`% cambio prezzo: ${change}%`)
 if (change < botOptions.sellOffPanic ){// se vai meno del -15%
  console.log(`% Sell Off ${botOptions.sellOffPanic}%: ${change}%`)
  sendMessageToClient('event',`% Sell Off Panic:${tradeInfo.name}  ${botOptions.sellOffPanic}%: ${change}%`)
  
   subscribedTokens.delete(trade.mint);
    sellToken(trade.mint);            
                console.log(`🚫 Unsubscribed da ${trade.mint} venduto!!)`);
                ws.send(JSON.stringify({
                    method: "unsubscribeTokenTrade",
                    keys: [trade.mint]
                  }));
                  return
    
      }

      //INSERIAMO IL TRAILING UP QUI..X IL MOMENTO
      
      if(tokenLog.activeTrailing){
          if (tradeInfo.price <= tokenLog.stop) {
            tokenLog.activeTrailing= false;
            let msg=(`🔻 Trailing Stop attivato per ${tradeInfo.name} a prezzo ${tradeInfo.price}, stop era a ${tokenLog.stop.toFixed(10)} , HighPrice:${tokenLog.highPrice}`);
            
            console.log(msg);
            sendMessageToClient('event',msg)
  
            sellToken(trade.mint)
            console.log(`📊 vendi ${tradeInfo.name}: gain  buy at ${tradeInfo.buyPrice} -- sold at  ${tradeInfo.price}`);
                subscribedTokens.delete(trade.mint);
                
                console.log(`🚫 Unsubscribed da ${trade.mint} venduto!!)`);
                ws.send(JSON.stringify({
                    method: "unsubscribeTokenTrade",
                    keys: [trade.mint]
                  }));
           //return { action: "SELL", sellPrice: tradeInfo.price, stop: tokenLog.stop };
          }
         // console.log(`🔺 Trailing attivo per ${tradeInfo.name}: currentPrice: ${tradeInfo.price}, highest: ${tokenLog.highPrice}, stop: ${tokenLog.stop.toFixed(10)}`);
          //return { action: "HOLD", currentPrice, highest: tokenLog.highPrice, stop: tokenLog.stop };
      }

            if (tradeInfo.price > /*tradeInfo.startPrice*/tradeInfo.buyPrice * botOptions.quickSellMultiplier && tradeInfo.trxNum > botOptions.quickSellMinTrades) { 
                sellToken(trade.mint)
              console.log(`📊 vendi ${tradeInfo.name}: gain  buy at ${tradeInfo.buyPrice} -- sold at  ${tradeInfo.price}`);
               sendMessageToClient('event',`📊 vendi ${tradeInfo.name}: gain  buy at ${tradeInfo.buyPrice} -- sold at  ${tradeInfo.price}`)
  
                subscribedTokens.delete(trade.mint);
                
                console.log(`🚫 Unsubscribed da ${trade.mint} venduto!!)`);
                ws.send(JSON.stringify({
                    method: "unsubscribeTokenTrade",
                    keys: [trade.mint]
                  }));
                  
            }
          // Se il numero di transazioni supera 20 e il prezzo è superiore al 20% del prezzo iniziale, vendi
            if (tradeInfo.trxNum >botOptions.rugpullMaxTrades && tradeInfo.price > tradeInfo.buyPrice * botOptions.rugpullMinGainMultiplier) { 
                 sellToken(trade.mint)
                console.log(`📊 RUgPool - vendi ${tradeInfo.name}: gain  buy at ${tradeInfo.buyPrice} -- sold at  ${tradeInfo.price}`);
                sendMessageToClient('event',`📊 RUgPool - vendi ${tradeInfo.name}: gain  buy at ${tradeInfo.buyPrice} -- sold at  ${tradeInfo.price}`)
  
                ws.send(JSON.stringify({
                    method: "unsubscribeTokenTrade",
                    keys: [trade.mint]
                  }));
                 
                  subscribedTokens.delete(trade.mint);
                  console.log(`🚫 Unsubscribed da ${trade.mint} venduto!!)`);
            }
          }else return console.error('❌ Errore nel tradeInfo:', tradeInfo);
            //
            console.log(`(${tradeInfo.name})📊 Trade su ${trade.mint}: ${trade.txType} - ${trade.tokenAmount}- SOL:${trade.solAmount} price:${prezzo}`);
         
          });

        }        
        
      }
    // Aggiungi altri tipi di eventi se vuoi
  } catch (e) {
    console.error('❌ Errore nel parsing:', e);
  }

});

function getInstanceForTokenMonitor(token) {
  // Controlla se esiste già un'istanza per questo token
  if (!instances.has(token.mint)) {
    const instance = new TokenMonitor(token);
    instances.set(token.mint, instance);

    console.log(`Nuova istanza creata per il token ${token.mint}`);
  }else{
    console.log(`Riutilizzo dell'istanza esistente per il token ${token.mint}:`, instances.get(token.mint));
  }
 return instances.get(token.mint);
  }
  

function getInstanceForTokenLogger(token) {
  if(!token) {return null}

  if (!instancesToken.has(token.mint)) {
    const instance = new TokenLogger(token);
  //  const instanceMonitor=instances.get(token.mint);
  //  instance.linked(instanceMonitor)
  if (instances.has(token.mint)) {
      const instanceMonitor=instances.get(token.mint);
      instance.linked(instanceMonitor)
  }
    //tmp
    instancesToken.set(token.mint, instance);

    //instance.monitor = tmp; // Collega l'istanza di TokenLogger con l'istanza di TokenMonitor
    console.log(`Nuova istanzaToken creata per ${token.mint}`);
  }else {
    //console.log(`Riutilizzo dell'istanzaToken esistente per il ${token.mint}:`, instancesToken.get(token.mint));
  }

  return instancesToken.get(token.mint);
  
}
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
}



{
  context: { slot: 364492949, apiVersion: '2.2.7' },
  value: [
    {
      address: '3qCPB14jNgBPfTc1YgAbM4jzkcdXzcUsVMrQamDX62ku',
      uiAmount: 703615951.233887,
      decimals: 6,
      amount: '703615951233887',
      uiAmountString: '703615951.233887'
    },
    {
      address: 'CibGqHsrkmfDSJC1b1iWdQbW63oe3FFCBWeNJVTW7Zdd',
      uiAmount: 57158783.912416,
      decimals: 6,
      amount: '57158783912416',
      uiAmountString: '57158783.912416'
    },
    {
      address: */
