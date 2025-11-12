import WebSocket from 'ws';
import { isSafeToken } from './utils.js';
import TokenMonitor from './tradeMonitor.js';
import TokenLogger from './tokenLogger.js';
import { sendMessageToClient } from './socketio.js';
import { onError, onClose, onOpen, lastMessageTimeSet, startTimeout } from "./websocket.js";
//import { initArbitrage , TOKENS } from "./arbitrage.js";
import { parseTrx } from './utility/anchor/solana-transaction-parser.js';
import { getTokenPriceJupiter, getTokenInfoJupiter } from './utility/apiJupiter.js';
import StatsMonitor from './utility/statsMonitor.js';
import {wait} from  './tools.js;

import { startHttpServer, logToken, updateToken, buyTokenLog, updateBuyPrice } from './httpServer.js';
import { MAX_TOKENS_SUBSCRIBED, SOLANA_USD, botOptions,LIGHT_WALLET_API } from './config.js';
import { wshelius, target_mint, getTopHolders } from './utility/test.js';
import { getHour } from './utility/time.js';
import { buyToken, sellToken } from './utility/lightTrx.js';
import { jobBotHealth } from './botHealth.js';
import { appendToFile } from './loggerWrite.js';

// Avvia HTTP server
startHttpServer(process.env.PORT);

let ws;
export function webSock() {
  return ws
}

export const subscribedTokens = new Set();
export const instances = new Map(); // Mappa per memorizzare le istanze di TokenMonitor
export const instancesToken = new Map(); // Mappa per memorizzare le istanze di TokenLogger

// Avvia il timeout di inattività
//checkAccount('elonmusk','How to vote');
//getTop10Tokens();
//getCMC20Historical()
/*
          COSE DA FARE
          -controllare la transazione di acquisto, e di vendità
          -aggiungere controllo wallet monete e quantita
if (volatility > 30%) trailing = 40%;
else if (volatility > 20%) trailing = 30%;
else trailing = 20%;

Dynamic Trailing Stop (consigliato in JS)

Questo snippet adatta il trailing in base alla volatilità live:

const priceChange = ((highPrice - lowPrice) / lowPrice) * 100;
let trailing;
if (priceChange > 35) trailing = 40;
else if (priceChange > 25) trailing = 30;
else trailing = 25;



Dynamic buy amount (scalare in base alla forza)
if (volumeNet > 50 && trades > 100) buyAmount = 0.1;
else if (volumeNet > 20) buyAmount = 0.05;
else buyAmount = 0.02;


🧩 1. Cosa significa davvero “intensità di una rugpull”

Una rugpull non è solo “il prezzo che crolla”:
è una combinazione di fattori di liquidità e attività di rete.

👉 Una rugpull “intensa” = grande quantità di SOL rimossi dal pool in pochi secondi + crollo drastico di nuovi acquirenti.
👉 Una “fake rug” (finto dump) = prezzo che cala ma liquidità resta quasi invariata + volumi ancora attivi.

⚙️ 2. Le 3 metriche da monitorare in tempo reale
a. Liquidity Change Rate

Controlla la differenza tra solInPool e tokensInPool ogni 3–5 secondi.

const liqDrop = (prevSolInPool - solInPool) / prevSolInPool * 100;


Se liqDrop > 40% in pochi secondi 👉 probabile rugpull

Se liqDrop < 15% ma il prezzo scende 👉 normale correzione

💡 Trucco: imposta un flag per “panic-sell” solo se liquidity drop > 50% e netVolume < 0.

b. Net Buy Pressure (volume netto)

Calcola il saldo tra acquisti e vendite.

netPressure = buyVolume - sellVolume;


Se rimane positivo o in lieve calo, il token ha ancora forza → secondo spike possibile

Se passa negativo per più di 2–3 blocchi consecutivi, i dev o i bot stanno uscendo → meglio vendere

👉 Quando un token fa il secondo spike, spesso il netPressure torna positivo per 10–20 secondi dopo il mini crash.

c. Trade Velocity (transazioni / minuto)

Conta le transazioni totali ogni finestra temporale (es. 10 secondi).

const tps = (newTrades - prevTrades) / elapsedSeconds;


>3 tx/sec e in aumento → la community sta ancora comprando

<1 tx/sec e in calo → il token sta morendo

💡 Un secondo spike sostenibile ha sempre trade velocity crescente prima del rimbalzo.

📊 3. Formula sintetica per “rug intensity score”

Puoi combinare le metriche in un indicatore unico:

const rugIntensity = (
  liqDrop * 0.5 +
  Math.max(0, -netPressure / totalVolume) * 0.3 +
  (tpsDeclineRate > 0 ? tpsDeclineRate : 0) * 0.2
);


rugIntensity < 30 → normale correzione

30 ≤ rugIntensity < 60 → dump medio, possibile secondo spike

> 60 → rugpull violenta, esci subito

🧠 4. Riconoscere un secondo spike “sano”

Un secondo spike è quasi sempre:

preceduto da una caduta del 20–40 % (mai >60 %);

con liquidità invariata (drop <15 %);

e un ritorno improvviso di trade velocity + netPressure positivo.

📈 Se lo vedi nel grafico:

volume “a V”,

ma la liquidità rimane costante,

allora è un mini-rug (una presa di profitto), non un rugpull vero.

🧮 5. Esempio di logica JS pratica
if (liqDrop > 50 && netPressure < 0) {
  // vero rugpull
  sellNow("rugpull detected");
} else if (liqDrop < 15 && netPressure > 0 && tps > 2) {
  // possibile secondo spike
  holdToken("potential second spike");
} else if (rugIntensity > 60) {
  sellNow("intense rugpull");
}

🧩 6. Extra: segnali di secondo spike manuali (osservabili nei log)

Quando leggi i log dei token che hai tradato, un secondo spike “buono” mostra:

“buys” che tornano sopra il 60–70 % dei trade totali;

“volume in aumento” ma “marketcap ancora sotto 80–100 SOL”;

“liquidity invariata”.



I 5 peggiori (le maggiori perdite)

Poly — −61.55% (MarketCap ≈ 28.77, Volume ≈ 50.28 SOL)

Poly mascot — −59.59% (MarketCap ≈ 29.29, Volume ≈ 31.49 SOL)

Poly mascot (entry diversa) — −59.38% (MarketCap ≈ 28.78, Volume ≈ 43.87 SOL)

Polymarket — −58.33% (MarketCap ≈ 29.01, Volume ≈ 27.42 SOL)

Unused coin — −46.49% (MarketCap ≈ 29.66, Volume ≈ 73.25 SOL)

Nota: vedi ripetute voci “Poly / Poly mascot” — il bot è entrato più volte su varianti dello stesso 
progetto con risultati molto negativi. Questo segnala la necessità di un cooldown o dedup per 
evitare multiple entrate su token correlati.
*/
// Avvia il timeout di inattività
// Funzione per inizializzare/riconnettere il WebSocket

export function connect() {
  console.log('📡 Connessione al WebSocket di Pump.fun...');
  // avvia websocket
  ws = new WebSocket('wss://pumpportal.fun/api/data?api-key=' + LIGHT_WALLET_API);

  // Associa le callback
  ws.on('open', onOpen);
  ws.on('message', onMessage);
  ws.on('close', onClose);
  ws.on('error', onError);
}


const onMessage = async (data) => {
 lastMessageTimeSet()
  if (!data) return
  try {
    const parsed = JSON.parse(data);
    //console.log(parsed);
    const token = parsed;
    let prezzo;
// if (parsed.txType !== 'buy' && parsed.txType !== 'create') console.log('migration event:',parsed);
  
    const liquidityCheck = async (tok) => {
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
        console.log(`⛔ Token '${parsed.name}' scartato per sicurezza.`, JSON.stringify(safer));
        sendMessageToClient('logger', `⛔ Token '${parsed.name}' scartato per sicurezza. ` + JSON.stringify(safer)); // invio il token al client
        //console.log(`---Pool:${token.pool}-----MINT:${token.mint}-----`);
        if (!parsed.name) console.log(token)
        console.log('--------------------------------------------')
        return

      } 
      //appendToFile(`Monitoraggio per il token ${token.name}`, { safer });
        
      //      botOptions.demoVersion = true;
      const monitor = getInstanceForTokenMonitor(token)
      monitor.orario()
      if (safer.fastBuy) { // fast buy
        let msg = (`✅ Token '${parsed.name}' passato per sicurezza. Procedo con l\'acquisto rapido.`);
        console.log(msg)
        monitor.fastMonitor();
        monitor.tradeMonitor = false;// disabilito il monitoraggio
        monitor.infoSnipe = safer.fastReason;
        monitor.quickSell = safer.fastReason;
        monitor.infoSniper = safer.fastBuy;
        wait(3)
        getTokenInfoJupiter(token.mint).then(info => {
          monitor.tokenInfoJupiter = info;
        });
        sendMessageToClient('event', msg);
        //  botOptions.demoVersion = false;

        //monitor.
      } else {      //modalità monitoraggio   
        let devbott = await monitor.startMonitor();
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
      let buyTokenSignature = await buyToken(token);
      //liquidityCheck()
      console.log("Token:", token);

      console.log(`-----------------------------------------------`);
      console.log(`🚀 Nuovo token: ${token.name} (${token.symbol})`);
      //sendMessageToClient('logger', `🚀 Nuovo token: ${token.name} (${token.symbol})`)
      sendMessageToClient('notifyMe', `🚀 Nuovo token: ${token.name} (${token.symbol})`); // invio il token al client
      console.log(`🧠 Mint: ${token.mint}`);
      console.log(`📈 MarketCap (SOL): ${token.marketCapSol}`);
      //const solToUsdRate = SOLANA_USD; // Replace with the current SOL to USD conversion rate
      const marketCapUsd = (token.marketCapSol * SOLANA_USD).toFixed(2);
      const totTokens = token.tokensInPool + token.initialBuy;
      let priceBuy = monitor.lastPrice() || prezzo;
      monitor.initialPrice = prezzo;
      console.log(`📈 MarketCap (USD): ${marketCapUsd}`);
      console.log(`💰 Price SOL Start: ${prezzo} `);
      console.log(`💰 Price SOL Buy: ${priceBuy} `);
      console.log(`💧 Liquidity in pool: ${token.solInPool} SOL`);
      console.log(`💧 Tot Tokens:${totTokens}`);
      console.log(`👤 Creatore: ${token.traderPublicKey}`);
      console.log(`📦 URI: ${token.uri}`);
      console.log(`🌊 Pool: ${token.pool}`);
      //console.log(`⏱️ Controlla se qualcuno vende troppo presto`);

      const tokenLog = getInstanceForTokenLogger(token);// iniz istanza di TokenLogger

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

      if (buyTokenSignature) {
        console.log(`Transazione di acquisto inviata con signature: ${buyTokenSignature}`);
      }
      /*
      setTimeout(() => {
        parseTrx(buyTokenSignature).then(data => {
          if(data.valid!==true){
            
            return console.log("Errore nel parsing della transazione di acquisto:",data)
          
          }
          console.log('parse:', data);
          tokenLog.buyPrice = data.priceBuy;

          //salva nel db temp in httpServer.js
          updateBuyPrice(token.mint, {
            buyPrice: data.priceBuy,
          })
          tokenLog.tokenAmount = data.totBuyToken;
          tokenLog.jitoFee = data.feeJito6;
          /*{
valid: true,
totBuyToken: realAmount,
totBuySol: buyAmountQnt,
priceBuy: (buyAmountQnt / realAmount).toFixed(10),
feeJito6: jitoFee,
mint: quote_token_mint.pubkey.toBase58(),
} */ /*
                                  })
                                }, 700); // Avvia il timeout di inattività  
                              }
                      */
      if (safer.fastBuy && botOptions.demoVersion) {
        getTokenPriceJupiter(token.mint).then(price => {
          if (price !== null) {
            console.log(`The price of the token is $${price}`);
            let priceSol = price / SOLANA_USD;
            //tokenLog.buyPrice = price;
            tokenLog.buyPriceJupiter = priceSol;
          }
        });
        setTimeout(() => {
          let prz = tokenLog.LivePrice || prezzo;
          tokenLog.buyPrice = prz;
          tokenLog.tokenAmount = botOptions.buyAmount / prz //qnt token comprato
          updateBuyPrice(token.mint, {
            buyPrice: prz,
          })
          console.log(`❌ Acquisto demo - ${token.name} a ${tokenLog.LivePrice}.`);
        }, 400);
      }

      botOptions.botCash = (botOptions.botCash - botOptions.buyAmount) - 0.001;//dp fee + slippage+extra

      let strateg = safer?.fastReason || monitor?.quickSell || monitor.infoSnipe;
      let startStats = new StatsMonitor(token);
      startStats.initToken(token, strateg, priceBuy);

      // buyTokenLog
      /* X ADESSO NON ATTIVIAMO...
      getTopHolders(token.mint).then(holders => {
        console.log(`👥 Top 5 holders:`)

        if (holders) {
          console.log(`Holders: ${holders?.value.length}`);
          tokenLog.holders = holders?.value.length;
          tokenLog.holdersList = holders?.value;
        }

      });
      */

      // Logga il token nel database
      tokenLog.safeProblem = safer;
      tokenLog.buyPrice = tokenLog.buyPrice || priceBuy;
      tokenLog.startPrice = prezzo;
      tokenLog.highPrez = prezzo;
      tokenLog.buyTransactionSign = buyTokenSignature;
      tokenLog.marketCapUsd = marketCapUsd;
      tokenLog.tokenAmount = tokenLog.tokenAmount || botOptions.buyAmount / priceBuy //qnt token comprato
      tokenLog.startSellTimer();



      logToken({
        mint: token.mint,
        name: token.name,
        symbol: token.symbol,
        solInPool: token.solInPool || token.vSolInBondingCurve,
        tokensInPool: token.tokensInPool || token.vTokensInBondingCurve,
        marketCapSol: token.marketCapSol,
        price: prezzo,
        transactions: monitor.trxArray,
        buySign: [buyTokenSignature],// ci metto le trx
        buyPrice: priceBuy,
        trxNum: 0,
        startPrice: prezzo,
        marketCapUsd: marketCapUsd,
        oldMarketCapUsd: marketCapUsd,
        safe: true // o false in base ai filtri //aggiungi array con filtri
      });


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
      //  console.log(`🗑️ Rimossa l'ultima istanza per il token ${lastMint} (limite superato).`);
      }
      if (instancesToken.size > 30) { // Limite di istanze TokenLogger
        const lastMint = [...instancesToken.keys()].shift()
        instancesToken.delete(lastMint);
      //  console.log(`🗑️ Rimossa l'ultima istanza per il token ${lastMint} (limite superato).`);
      }


      console.log(`-----------------------------------------------`);
      // 👉 Qui puoi chiamare la tua funzione `snipeToken(token.mint)`
      return; // quando c'e evento di creazione,poi esci..nn ce
      // bisogno di continuare o no?, 
    }// fine if (parsed.txType === 'create')
    //fine funzione crezione token


    liquidityCheck()
    let tokenLog;
    if (instancesToken.has(parsed.mint)) { // controlla se esiste l'istanza dell'oggetto class
      //altrimenti la crea inutilmente prima di usarla
      // tokenMonitor= instances.get(parsed.mint);
      tokenLog = getInstanceForTokenLogger(token);
    }


    //controlla la tua transazione
    if (parsed.txType === 'buy' && parsed.traderPublicKey === botOptions.botWallet) {
      liquidityCheck();
      let msg = (`Acquisto rilevato wallet Bot:
          buy Token:[${tokenLog.token?.name || tokenLog?.name || tokenLog.monitor?.token?.symbol || tokenLog.monitor?.token?.name}] sol:(${parsed.solAmount.toFixed(8)}) Price:(${prezzo})  -> from ${parsed.traderPublicKey}`);
      tokenLog.buyPrice = prezzo;
      console.log(msg, parsed)
      sendMessageToClient('event', msg)
      updateBuyPrice(parsed.mint, { buyPrice: prezzo });
      buyTokenLog(parsed.mint, parsed.tokenAmount, parsed.solAmount, prezzo)
    }

    if (parsed.txType === 'sell' && parsed.traderPublicKey === botOptions.botWallet) {
      liquidityCheck();
      let msg = (`Vendita rilevato wallet Bot:
          sell Token:[${tokenLog.token?.name || tokenLog?.name || tokenLog.monitor?.token?.symbol || tokenLog.monitor?.token?.name}] sol:(${parsed.solAmount.toFixed(8)}) Price:(${prezzo})  -> from ${parsed.traderPublicKey}`);
      sendMessageToClient('event', msg)
      console.log(msg)
      tokenLog.sellPrice = prezzo;
      buyTokenLog(parsed.mint, parsed.tokenAmount, parsed.solAmount, prezzo)
    }

    // (parsed.txType === 'BUY')
    /////////////////////////////
    /////// zona monitoraggio 
    //////////////////////


    let tradeMintMonitor;
    let tokenMonitor;//getMintMonitor();
    if (instances.has(parsed.mint)) { // controlla se esiste l'istanza dell'oggetto class
      tokenMonitor = instances.get(parsed.mint);
      if (tokenMonitor.tradeMonitor) {
        tradeMintMonitor = tokenMonitor.token.mint;
      } else {
        tradeMintMonitor = null
      }

    }



    if (tradeMintMonitor === parsed.mint && parsed.txType === 'buy') {

      liquidityCheck() //(parsed.solInPool / parsed.tokensInPool).toFixed(10) || (parsed.vSolInBondingCurve / parsed.vTokensInBondingCurve).toFixed(10);
      console.log(`👁️ Buy Token:[${tokenMonitor.token.name}] sol:(${parsed.solAmount.toFixed(5)}) Price:(${prezzo})  -> from ${parsed.traderPublicKey}`);
      sendMessageToClient('logger', `👁️ Buy Token:[${tokenMonitor.token.name}] sol:(${parsed.solAmount.toFixed(5)}) Price:(${prezzo})  -> from ${parsed.traderPublicKey}`)

      const { tradesPerMin, tradesPerSec, tradesPerTenSec } = tokenMonitor.updateTradeVelocity(Date.now());

      const { rate, speed, trend } = tokenMonitor.calcLiquidityChange(parsed?.solInPool || parsed?.vSolInBondingCurve);
      // console.log('SOL:',priceInSol);
      //setSolAmount(parsed.solAmount);
      tokenMonitor.addSolAmount(parsed.solAmount);
      tokenMonitor.marketCapSol = parsed.marketCapSol;
      tokenMonitor.addVolume(parsed.solAmount);
      tokenMonitor.livePrice(prezzo);
      //tokenMonitor.prez=prezzo;
      let solValueTrx = tokenMonitor.getSolAmount()
      let trxNumm = tokenMonitor.getSolTrxNumMonitor();
      let volume = tokenMonitor.volume;
      let highPrice = tokenMonitor.getHighPrice();
      let volatility = 0;
      //setta la pool strategy
      let bonk = tokenMonitor.token.pool === 'bonk';
      let pump = tokenMonitor.token.pool === 'pump';
      let lifeTokenSec = tokenMonitor.lifeTokenSec;
      //calcola volatilità
      // --- aggiorna lo storico prezzi ---
      tokenMonitor.priceHistory.push(prezzo);

      if (tokenMonitor.priceHistory.length > tokenMonitor.maxHistory) {
        tokenMonitor.priceHistory.shift(); // elimina il più vecchio
      }
      // --- calcola la volatilità ---
      if (tokenMonitor.priceHistory.length >= 3) {
        const min = Math.min(...tokenMonitor.priceHistory);
        const max = Math.max(...tokenMonitor.priceHistory);
        const start = tokenMonitor.priceHistory[0];
        volatility = ((max - min) / start) * 100;

        tokenMonitor.volatility = volatility; // salva per uso futuro o visualizzazione
      }
      //let volatility =tokenMonitor.volatility;
      //   volatility=(startPrice|highPrice-lowPrice|)×100;
      //Entra solo se volumeNet > 0 e volumeNet / volume ≥ 0.15
      let volumeRulesNet = solValueTrx > 0 && (solValueTrx / volume) >= 0.15;
      tokenMonitor.trxArray.push({
        type: parsed.txType,
        amount: parsed.solAmount,
        trader: parsed.traderPublicKey,
        price: prezzo,
        time: getHour()
      });

      //

      let infoTrade = (` highPrice:[${tokenMonitor?.highPrez || 'n/a'}] Volume:[${tokenMonitor.volume.toFixed(4)} SOL] TrxNumb:[${trxNumm}]  volumeNet:[${solValueTrx.toFixed(4)}] buy at [${prezzo}] LiqRate{[${rate?.toFixed(2) || ''}],Speed[${speed.toFixed(1)}],Trend[${trend.toFixed(1)}]} Trade Velocity{1s[${tokenMonitor.tradesPerSec.toFixed(1)}] 10s[${tokenMonitor.tradesPerTenSec.toFixed(1)}] 60s[${tokenMonitor.tradesPerMin.toFixed(1)}] TokenLifeSec[${tokenMonitor.lifeTokenSec}]Sec} Vol:[${(volatility)?.toFixed(1) || 'n/a'}%] Moment:[_${tokenMonitor.momentumScore?.toFixed(1) || 'n/a'}_]`);


      if (parsed.marketCapSol > botOptions.marketCapSolUpQuickBuy && botOptions.marketCapSolUpMode && trxNumm > 10) {
        let msg = (`📈 🚀 [${tokenMonitor.token.name}] Market Cap Up Quick Buy! MarketCap:(${parsed.marketCapSol} SOL) TrxNumb:${trxNumm}  volume: ${volume}per ${parsed.mint}. buy at ${prezzo} LiqRate: ${rate}, ${speed}`);
        console.log(msg);
        sendMessageToClient('event', msg)
        tokenMonitor.quickBuy = prezzo;
        tokenMonitor.quickSell = msg;
        tokenMonitor.cancelMonitor();
        return
      }

      if (bonk && volatility > 110 && prezzo > botOptions.bonkMinPrice && prezzo < botOptions.bonkMaxPrice && trend < -15 && lifeTokenSec >15 && trxNumm > 15) {
        let msg = (`🎁🎁 Bonk Strategy! 🎁🎁 [${tokenMonitor.token.name}] ` + infoTrade);
        //] LiqRate{[-0.64],Speed[-0.7]} Trade Velocity{1s[2.6] 10s[7.7] 30s[77.0]}
        //rate, speed, tokenMonitor.tradesPerSec
        console.log(msg);
        sendMessageToClient('event', msg)
        tokenMonitor.quickBuy = prezzo;
        tokenMonitor.quickSell = msg;
        getTokenInfoJupiter(tokenMonitor.token.mint).then(info => {
          //sendMessageToClient('logger', info)
          tokenMonitor.infoJupiter = info;
        })
        tokenMonitor.cancelMonitor();
        return
      }
      //let spikeRate=Math.abs(rate);
      /*
      if (botOptions.priceSolUpMode && prezzo > botOptions.priceSolUpQuickBuy_ && prezzo < botOptions.priceSolUpQuickBuyMax_ && trxNumm > 20 && trxNumm < 60 && highPrice > (botOptions.priceSolUpQuickBuyMax_ * 1.5)) {
        let msg = (`💧SecondSpike!💧 [${tokenMonitor.token.name}]  ` + infoTrade);
        //] LiqRate{[-0.64],Speed[-0.7]} Trade Velocity{1s[2.6] 10s[7.7] 30s[77.0]}
        //rate, speed, tokenMonitor.tradesPerSec
        console.log(msg);
        sendMessageToClient('event', msg)
        tokenMonitor.quickBuy = prezzo;
        tokenMonitor.quickSell = msg;
        //tokenMonitor.sellPercent = 10;
        getTokenInfoJupiter(tokenMonitor.token.mint).then(info => {
          //sendMessageToClient('logger', info)
          tokenMonitor.infoJupiter = info;
        })
        tokenMonitor.cancelMonitor();
        return
      }
        */
      /*
            if (pump && botOptions.priceSolUpMode && tokenMonitor.volume > botOptions.priceSolUpModeQuickBuyVolumeMin && prezzo > botOptions.priceSolUpQuickBuy && prezzo < botOptions.priceSolUpQuickBuyMax && solValueTrx > botOptions.priceSolUpModeQuickBuyVolumeNetMin && volumeRulesNet && tokenMonitor.lifeTokenSec > 25 && volatility > 45) {
              let msg = (`📈 Price Quick Buy! 🚀 [${tokenMonitor.token.name}] ` + infoTrade);
              //] LiqRate{[-0.64],Speed[-0.7]} Trade Velocity{1s[2.6] 10s[7.7] 30s[77.0]}
              //rate, speed, tokenMonitor.tradesPerSec
              console.log(msg);
              sendMessageToClient('event', msg)
              tokenMonitor.quickBuy = prezzo;
              tokenMonitor.sellPercentTrailing = 20;
              // tokenMonitor.sellPercent = 50;
              tokenMonitor.quickSell = msg;
              getTokenInfoJupiter(tokenMonitor.token.mint).then(info => {
                //sendMessageToClient('logger', info)
                tokenMonitor.infoJupiter = info;
              })
              tokenMonitor.cancelMonitor();
              return
            }
              */

      let spikeRate = Math.abs(rate);
      if (pump && trend < -5 && solValueTrx > 0 && rate < -1.3 && rate > -2.0 && tradesPerMin > 25 && tradesPerMin < 65 && trxNumm < 100) {
        let msg = (`🤖🤖ChatGpt Token!🤖🤖 [${tokenMonitor.token.name}] ` + infoTrade);
        //] LiqRate{[-0.64],Speed[-0.7]} Trade Velocity{1s[2.6] 10s[7.7] 30s[77.0]}
        //rate, speed, tokenMonitor.tradesPerSec
        /*
        Basato su analisi di centinaia di trade Pump.fun (inclusi log simili ai tuoi):

VolumeNet > 0 e in rapido aumento

Significa che ci sono più buy reali che sell.

Se sale in modo costante (non esplosivo), è segnale di momentum sostenibile.

LiqRate compreso tra 1.3 e 2.0

Sotto 1 → stagnazione

Sopra 2.5 → rischio pump già in corso (arrivi tardi)

Speed in crescita ma non esplosiva (30–60 tx/min)

Troppa velocità indica hype già esaurito.

Trend tra +6 e +10

Segnale ideale di buy-entry anticipato prima del picco.

Età < 3 minuti + crescita di holders

Molti pump iniziano in questa finestra temporale.

Prezzo stabile nei primi secondi poi volume improvviso

Segnale tipico di buy coordinati o bot sniffers in azione.

⚙️ Come applicarlo al tuo bot

Puoi far filtrare automaticamente i token così:

if (
  token.trend >= 6 &&
  token.liqRate > 1.3 && token.liqRate < 2.0 &&
  token.volumeNet > 0 &&
  token.speed > 25 && token.speed < 60 &&
  token.age < 180
) {

token.score = 
  (token.trend * 1.5) + 
  (token.liqRate * 10) + 
  (token.volumeNet / 100) + 
  (token.speed / 3);
        */
        console.log(msg);
        sendMessageToClient('event', msg)
        tokenMonitor.quickBuy = prezzo;
        tokenMonitor.quickSell = msg;
        tokenMonitor.sellPercentTrailing = 40;
        getTokenInfoJupiter(tokenMonitor.token.mint).then(info => {
          //sendMessageToClient('logger', info)
          tokenMonitor.infoJupiter = info;
        })
        tokenMonitor.cancelMonitor();
        return
      }

      if (trend < -30 && tradesPerMin > 40 && volatility > 30) {
        let msg = (`🔥🔥Trend Token!🔥🔥 [${tokenMonitor.token.name}] ` + infoTrade);
        //] LiqRate{[-0.64],Speed[-0.7]} Trade Velocity{1s[2.6] 10s[7.7] 30s[77.0]}
        //rate, speed, tokenMonitor.tradesPerSec
        console.log(msg);
        sendMessageToClient('event', msg)
        tokenMonitor.quickBuy = prezzo;
        tokenMonitor.quickSell = msg;
        getTokenInfoJupiter(tokenMonitor.token.mint).then(info => {
          //sendMessageToClient('logger', info)
          tokenMonitor.infoJupiter = info;
        })
        tokenMonitor.cancelMonitor();
        return
      }



      if (pump && trend < -10 && tradesPerSec < 1 && prezzo > botOptions.priceBuyHighMinPrice && prezzo < botOptions.priceBuyHighMaxPrice && volatility > 20 && lifeTokenSec > 8) {
        let msg = (`🔥🔥BuyHigh Token!🔥🔥 [${tokenMonitor.token.name}] ` + infoTrade);
        //] LiqRate{[-0.64],Speed[-0.7]} Trade Velocity{1s[2.6] 10s[7.7] 30s[77.0]}
        //rate, speed, tokenMonitor.tradesPerSec
        console.log(msg);
        sendMessageToClient('event', msg)
        tokenMonitor.quickBuy = prezzo;
        tokenMonitor.quickSell = msg;
        //tokenMonitor.sellPercent = 70;
        getTokenInfoJupiter(tokenMonitor.token.mint).then(info => {
          //sendMessageToClient('logger', info)
          tokenMonitor.infoJupiter = info;
        })
        tokenMonitor.cancelMonitor();
        return
      }



      //nuova regola da testare...
      //volume netto superiore al volume impostato
      if (solValueTrx > botOptions.quickBuyVolumeUp && !tokenMonitor.quick && botOptions.netVolumeUpBuy && trxNumm > botOptions.quickBuyTrxNumb && tokenMonitor.volume > botOptions.quickBuyVolumeMin) {//se il volume tra buy e sell e maggiore di 1.0 SOL e rugpull
        let msg = (`📈 🚀 volume netto superiore al volume impostato! Netvolume:(${solValueTrx} SOL) TrxNumb:${trxNumm}  volume: ${volume} buy at ${prezzo}`);
        console.log(msg);
        sendMessageToClient('event', msg)

        tokenMonitor.quickBuy = prezzo;
        tokenMonitor.quickSell = msg;
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

      if (trxNumm >= 2 && solValueTrx > 1.50 && trxNumm < 4) {//se il volume tra buy e sell e maggiore di 1.0 SOL e rugpull
        console.log(`❌ RugPull Detect: volume:(${solValueTrx} SOL) per ${parsed.mint}.`);
        console.log("buy at sol: ", prezzo);
        //cancelMonitor();
        //tokenMonitor.cancelMonitor();
        //monitorEarlyTrades.cancelMonitor();
        //return
      }
      if (solValueTrx > 1.50) {//se il volume tra buy e sell e maggiore di 1.50 SOL
        // console.log(`❌ volume alto: (${solValueTrx} SOL) per ${parsed.mint}.`);
        //setSuspiciousSellDetected(false);
        tokenMonitor.suspiciousSellDetected = false;
        return
      }
      if (parsed.solAmount < 0.008) {
        //console.log(`❌ Acquisto troppo piccolo (${parsed.solAmount} SOL) per ${parsed.mint}. Ignorato.`);
        //setSuspiciousSellDetected(true);
        tokenMonitor.suspiciousSellDetected = true;
        return; // Esci se l'acquisto è troppo piccolo
      }
      //setSuspiciousSellDetected(false); // resetta il flag di vendita sospetta
      tokenMonitor.suspiciousSellDetected = false;
      console.log('solValueTrx:', tokenMonitor.getSolAmount());
      return; // Esci se è un acquisto
    }

    if (tradeMintMonitor === parsed.mint && parsed.txType === 'sell') {

      tokenMonitor.updateTradeVelocity(Date.now());
      const { rate, speed } = tokenMonitor.calcLiquidityChange(parsed?.solInPool || parsed?.vSolInBondingCurve);

      liquidityCheck();
      let msg = (`⚠️ Sell Token:[${tokenMonitor.token.name}] sol:(${parsed.solAmount.toFixed(8)}) Price:(${prezzo}) - Vendita precoce da ${parsed.traderPublicKey} – `);

      console.log(msg);
      sendMessageToClient('logger', msg)

      //console.log('SOL:',priceInSol);
      tokenMonitor.addSolAmount(-(parsed.solAmount));
      tokenMonitor.addVolume(parsed.solAmount);
      tokenMonitor.livePrice(prezzo);
      tokenMonitor.marketCapSol = parsed.marketCapSol;
      // tokenMonitor.prez=prezzo;

      tokenMonitor.trxArray.push({
        type: parsed.txType,
        amount: parsed.solAmount,
        trader: parsed.traderPublicKey,
        price: prezzo,
        time: getHour()
      });

      //setSolAmount(-(parsed.solAmount));
      if (parsed.solAmount < 0.007) {
        //console.log(`❌ Vendita troppo piccola (${parsed.solAmount} SOL) per ${parsed.mint}. Ignorato.`);
        //setSuspiciousSellDetected(false);
        tokenMonitor.suspiciousSellDetected = false;
        return; // Esci se la vendita è troppo piccola

      }
      if (parsed.solAmount > 0.5) {
        console.log(`❌ Vendita troppo alta (${parsed.solAmount} SOL) per ${parsed.mint}.`);
        // setSuspiciousSellDetected(true);
        tokenMonitor.suspiciousSellDetected = true;
        console.log('solValueTrx:', tokenMonitor.getSolAmount());
        return; // Esci se l'acquisto è troppo piccolo
      }
      //setSuspiciousSellDetected(true);
      tokenMonitor.suspiciousSellDetected = true;
      console.log('solValueTrx:', tokenMonitor.getSolAmount());
      return; // Esci dall'area monitor
    }

    //FINE ZONA MONITORAGGIO
    /////////////////////////
    ////////////////////////

    // Verifica se è un evento di trade // trade dp monitor
    if (parsed.txType === 'buy' || parsed.txType === 'sell') {


      if (tokenMonitor.tradeMonitorOff) {
        sendMessageToClient('event', `⚠️ esci dal bug... `);
        return
      }
      const trade = parsed;
      tokenLog = await getInstanceForTokenLogger(trade);
      //tokenMonitor= instances.get(parsed.mint);
      //mi sa che questa parte nn serve...
      /*
      if (instances.has(parsed.mint)) { // controlla se esiste l'istanza dell'oggetto class
       //console.log("Token monitor trovato per il merging...");
        tokenMonitor= instances.get(parsed.mint);
       tokenLog.linked(tokenMonitor)
      }
       */

      //  console.log('trade:',trade);


      const { tradesPerMin, tradesPerSec } = tokenLog.updateTradeVelocity(Date.now());
      const { rate, speed, trend } = tokenLog.calcLiquidityChange(parsed?.solInPool || parsed?.vSolInBondingCurve);

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
        tokenLog.marketCapUsd = marketCapUsd;
        tokenLog.marketCapSol = trade.marketCapSol;
        //tokenLog.solTrxNum++;
        tokenLog.logTransaction(trade);
        //tokenLog.addSolAmount(-(trade.solAmount));
        // tokenLog.addVolume(trade.solAmount);

        updateToken(trade.mint, {
          marketCapSol: trade.marketCapSol,
          price: prezzo,
          marketCapUsd: marketCapUsd,
          // trxNum: trxNumm ,
        }, parsed.txType).then(tradeInfo => {

          //if (parsed.txType === 'buy') { }


          // LOGICA DI VENDITA AUTOMATICA
          if (tradeInfo && tradeInfo.price && tradeInfo.startPrice && tradeInfo.trxNum) {//fix tradeinfo undefined

            if (tokenLog.soldOut) { return }
            //percentuale cambiamento 
            const change = ((tradeInfo.price - tradeInfo.buyPrice) / tradeInfo.buyPrice) * 100;
            liquidityCheck()
            console.log(`(${tradeInfo.name})📊 Trade su ${trade.mint}: ${trade.txType} - ${trade.tokenAmount}- SOL:${trade.solAmount} price:${prezzo}`);
            //  console.log(`% cambio prezzo: ${change}%`)

            if (change < botOptions.sellOffPanic) {// se vai meno del -15%
              console.log(`% Sell Off ${botOptions.sellOffPanic}%: ${change}%`)
              sendMessageToClient('event', `% Sell Off Panic:${tradeInfo.name}  ${botOptions.sellOffPanic}%: ${change}%`)


              tokenLog.sellToken(trade);

              StatsMonitor.updateToken(trade, tradeInfo.price, '💀 Sell Off Panic triggered');

              return

            }

            //INSERIAMO IL TRAILING UP QUI..X IL MOMENTO

            if (tokenLog.activeTrailing) {
              let stopEloss = tokenLog.stop;
              if (botOptions.adaptiveTrailingLcrRate) {

                if (trend > 1) { // se la liquidità scende lentamente
                  //trailing dinamico 
                  // trend = Math.abs(trend) > 10 ? 10 : Math.abs(trend);
                  stopEloss = tokenLog.stop * (1 + (Math.abs(trend) / 100));
                  let msg = (`🔻 Trailing Stop adattato per ${tradeInfo.name} a prezzo ${tradeInfo.price}, stop era a ${tokenLog.stop.toFixed(10)} ora a ${stopEloss.toFixed(10)}, HighPrice:${tokenLog.highPrice}, Trend:${trend.toFixed(2)}`);
                  // stopEloss = tokenLog.stop * (1 - (trend / 100));
                  sendMessageToClient('event', msg)
                }


                if (tokenLog?.monitor?.sellPercentTrailing) {
                  stopEloss = tokenLog.highPrice * (1 - (tokenLog.monitor.sellPercentTrailing / 100));// 10%
                  let msg = (`🔻 Trailing personalizzato per ${tradeInfo.name} a prezzo ${tradeInfo.price}, stop era a ${tokenLog.stop.toFixed(10)} ora a ${stopEloss.toFixed(10)}, HighPrice:${tokenLog.highPrice}, Trend:${trend.toFixed(2)}`);
                  // stopEloss = tokenLog.stop * (1 - (trend / 100));
                  sendMessageToClient('event', msg)
                }

              }
              if (tradeInfo.price <= stopEloss) {
                tokenLog.activeTrailing = false;
                let msg = (`🔻 Trailing Stop attivato per ${tradeInfo.name} a prezzo ${tradeInfo.price}, stop era a ${stopEloss?.toFixed(10)} , HighPrice:${tokenLog.highPrice}`);

                console.log(msg);
                sendMessageToClient('event', msg)

                //sellToken(trade);
                tokenLog.sellToken(trade)
                StatsMonitor.updateToken(trade, tradeInfo.price, msg);
                // tokenLog.soldOut = true;
                //tokenLog.tokenAmount=(tokenLog.tokenAmount * prezzo);
                //botOptions.botCash = (botOptions.botCash + (tokenLog.tokenAmount * prezzo));
                // sendMessageToClient('event', `BotCash [${botOptions.botCash}]SOL`)
                console.log(`📊 vendi ${tradeInfo.name}: gain  buy at ${tradeInfo.buyPrice} -- sold at  ${tradeInfo.price}`);
                //  subscribedTokens.delete(trade.mint);

                //  console.log(`🚫 Unsubscribed da ${trade.mint} venduto!!)`);
                /*  ws.send(JSON.stringify({
                    method: "unsubscribeTokenTrade",
                    keys: [trade.mint]
                  }));
                  */
                return
                //return { action: "SELL", sellPrice: tradeInfo.price, stop: tokenLog.stop };
              }
              // console.log(`🔺 Trailing attivo per ${tradeInfo.name}: currentPrice: ${tradeInfo.price}, highest: ${tokenLog.highPrice}, stop: ${tokenLog.stop.toFixed(10)}`);
              //return { action: "HOLD", currentPrice, highest: tokenLog.highPrice, stop: tokenLog.stop };
            }

            let prezzoVendita = botOptions.quickSellMultiplier;
            if (tokenLog?.monitor?.sellPercent) {
              prezzoVendita = 1 + (tokenLog.monitor.sellPercent / 100);

            }

            //vendi se supera 70 secondi dal primo acquisto e > 20% di guadagno

/*
            if (tradeInfo.price > tradeInfo.buyPrice * 1.5 && tokenLog.monitor.lifeTokenSec > 120) {
              //sellToken(trade);
              tokenLog.sellToken(trade)
              StatsMonitor.updateToken(trade, tradeInfo.price, '🚀 100sec away triggered');
              console.log(`🚀 100sec away triggered 📊 vendi ${tradeInfo.name}: gain  buy at ${tradeInfo.buyPrice} -- sold at  ${tradeInfo.price}`);
              sendMessageToClient('event', `📊 vendi ${tradeInfo.name}: gain  buy at ${tradeInfo.buyPrice} -- sold at  ${tradeInfo.price} 🚀 100sec away triggered`)
              return
            }
              */
             //vendi se supera la soglia di volatilità alta o bassa
             let sellVolatityThreshold = tokenLog.volatility < 600 || tokenLog.volatility > 2500;
           

            if (tradeInfo.price > /*tradeInfo.startPrice*/tradeInfo.buyPrice * prezzoVendita && tradeInfo.trxNum > botOptions.quickSellMinTrades && sellVolatityThreshold || tradeInfo.price > tradeInfo.buyPrice * 7) {
              //sellToken(trade);
              tokenLog.sellToken(trade)
              StatsMonitor.updateToken(trade, tradeInfo.price, '🚀 Quick Sell triggered');
              console.log(`📊 vendi ${tradeInfo.name}: gain  buy at ${tradeInfo.buyPrice} -- sold at  ${tradeInfo.price}`);
              sendMessageToClient('event', `📊 vendi ${tradeInfo.name}: gain  buy at ${tradeInfo.buyPrice} -- sold at  ${tradeInfo.price}`)

              return

            }
            // Se il numero di transazioni supera 20 e il prezzo è superiore al 20% del prezzo iniziale, vendi
            // oppure se scende sotto la soglia di 10 transazioni al minuto vende..
            let sellSlowMarket= tokenLog.lifeTokenSec > 60 && tradesPerMin < 15;
            if (sellSlowMarket ||tradeInfo.trxNum > botOptions.rugpullMaxTrades && tradeInfo.price > tradeInfo.buyPrice * botOptions.rugpullMinGainMultiplier) {
              //sellToken(trade);
              tokenLog.sellToken(trade);
              let msg = (`📊 RUgPool - vendi ${tradeInfo.name}: gain  buy at ${tradeInfo.buyPrice} -- sold at  ${tradeInfo.price}`);
             if(sellSlowMarket){
              msg=`📉 Slow Market - vendi ${tradeInfo.name}: buy at ${tradeInfo.buyPrice} -- sold at  ${tradeInfo.price}`;
             }
              StatsMonitor.updateToken(trade, tradeInfo.price, msg);
              
              console.log(msg);
              sendMessageToClient('event', msg)

            }
          } else return console.error('❌ Errore nel tradeInfo:', tradeInfo);
          //
          // console.log(`(${tradeInfo.name})📊 Trade su ${trade.mint}: ${trade.txType} - ${trade.tokenAmount}- SOL:${trade.solAmount} price:${prezzo}`);

        });

      }

    }
    // Aggiungi altri tipi di eventi se vuoi
  } catch (e) {
    console.error('❌ Errore nel parsing:', e);
  }

}



export function getInstanceForTokenMonitor(token) {
  // Controlla se esiste già un'istanza per questo token
  if (!instances.has(token.mint)) {
    const instance = new TokenMonitor(token);
    instances.set(token.mint, instance);

    console.log(`Nuova istanza creata per il token ${token.mint}`);
  } else {
    console.log(`Riutilizzo dell'istanza esistente per il token ${token.mint}:`, instances.get(token.mint));
  }
  return instances.get(token.mint);
}


export function getInstanceForTokenLogger(token) {
  if (!token || !token.mint) {
    console.error("Token non valido passato a getInstanceForTokenLogger:", token);
    return null;
  }

  if (!instancesToken.has(token.mint)) {
    const instance = new TokenLogger(token);
    //  const instanceMonitor=instances.get(token.mint);
    //  instance.linked(instanceMonitor)
    if (instances.has(token.mint)) {
      const instanceMonitor = instances.get(token.mint);
      instance.linked(instanceMonitor)
    }
    //tmp
    instancesToken.set(token.mint, instance);

    //instance.monitor = tmp; // Collega l'istanza di TokenLogger con l'istanza di TokenMonitor
    console.log(`Nuova istanzaToken creata per ${token.mint}`);
  } else {
    //console.log(`Riutilizzo dell'istanzaToken esistente per il ${token.mint}:`, instancesToken.get(token.mint));
  }

  return instancesToken.get(token.mint);

}

startTimeout();
connect();
try {
  await jobBotHealth.start();
  console.log(' 🛡️ JobBotHealth started 🛡️');
} catch (err) {
  console.error('Errore nell\'avvio del Job Bot Health:', err);
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

debug Bonk: {

  signature: '5sRHyQ6RFGvMjSdnMjzfSdktJeCjGnVHF3nnHDGZhvXa8R9aEvzainYQBxN5iPJtaRckyPnT3cekKrHXXUtsTVFN',
  traderPublicKey: '6U8LE8YPBLhPXx1CGwb6HDB2K6Xz4gxPh6BtVMC45W1M',
  txType: 'create',
  mint: 'A6h38mkmdEX6g5tP6hAmCnZLtwPhTQsrguoY7ayNbonk',
  tokensInPool: 862305461.067954,
  initialBuy: 137694538.93204606,
  solAmount: 0,
  newTokenBalance: 137694538.932046,
  marketCapSol: 36.79512288357042,
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
  {
  signature: '2AJ9SqDc3fATrK7pe7KLxWnokTW3jpUW1SLnGLMa1KvcEvRWheF8vmntUiDeW5ohRW7F4vZB4nqH85uFckgy6EUi',
  traderPublicKey: '9NZRot7RNy5TxCmfasHkJ16hRfdcepvTryEmTvSMAbzM',
  txType: 'create',
  mint: 'BEhyfhKZ5MEuQ9tsHT43fZYYNmBNSBpkWoHCzhqgbonk',
  tokensInPool: 995746154.372378,
  initialBuy: 4253845.627622008,
  solAmount: 0,
  newTokenBalance: 4253845.627622,
  marketCapSol: 28.18065198869252,
  pool: 'bonk'
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
      address:
      
      
      
      
      Swap
425.78
$425.87
image
USD1
for
93,319,722.129702
placeholder
USA
United States of Autism
(FTiLV7wstPGoXpqSwdjwqroFrXN53XNbaeairUcTbonk)
United States of Autism
(FTiLV7wstPGoXpqSwdjwqroFrXN53XNbaeairUcTbonk)
4,55 -6
0,000005 usd
debug Bonk: {
  signature: '5kPvpUG3xgmen22vZLmAbRnf7xcb8wRHUzk1L3fAupMWpDL1MgVarTxFxXgWVsrtqRfseBbgRpL7GjPTZkyp96Fu',
  traderPublicKey: 'DgcM43WarKVYTLe4tAqu1mTP9SkuV8VmvQ67RTVZhu2F',
  txType: 'create',
  mint: 'FTiLV7wstPGoXpqSwdjwqroFrXN53XNbaeairUcTbonk',
  tokensInPool: 906680277.870298,
  initialBuy: 93319722.12970197,
  solAmount: 0,
  newTokenBalance: 93319722.129702,
  marketCapSol: 33.5374118671376,
  pool: 'bonk'
}


Swap
17.791162
$17.77
image
USD1
for
4,253,845.627622
placeholder
Popolo
on
image
Raydium LaunchLab
Raydium LaunchLab
(LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj)
Raydium LaunchLab
(LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj)


      */
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
