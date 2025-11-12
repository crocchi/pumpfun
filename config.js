import 'dotenv/config';
import axios from 'axios';
import { getQuote, getFearAndGreed } from './utility/coinMarketCap.js';

export const MORALIS_API_KEY= process.env.MORALIS_API_KEY;
export const RPC_URL_SOLANA = process.env.RPC_URL_SOLANA;
export const RPC_URL_HELIUS = process.env.RPC_URL_HELIUS;
export const RPC_WS_HELIUS = process.env.RPC_WS_HELIUS;
export const DESEARCH_API = process.env.DESEARCH_API;
export const LIGHT_WALLET_API = process.env.LIGHT_WALLET_API;
export const CMC_API_KEY = process.env.CMC_API_KEY;
export const BITQUERY_API= process.env.BITQUERY;
export const JUPITER_API_KEY= process.env.JUPITER_API_KEY;

export const MAX_TOKENS_SUBSCRIBED = 40;

export let SOLANA_USD = 200;


//RPC_URL: process.env.RPC_URL,
  //BUY_AMOUNT_SOL: parseFloat(process.env.BUY_AMOUNT_SOL),
  //TAKE_PROFIT: parseFloat(process.env.TAKE_PROFIT),
  //SLIPPAGE: parseFloat(process.env.SLIPPAGE),
  export const botOptions = {
    //filtri token
    liquidityMin: 1.5,
    liquidityMax: 35,
    devShare:0.36,
    marketcapMin: 5,
    marketcapMax: 100,
    rugpullxyz:false,

    //monitor token
    time_monitor: 60000, // 60 secondi
    volumeMin: 5, // volume netto minimo in SOL per considerare il token
    volumeMax: 12,
    minVolumeMonitor:15, //volume generale
    maxTrxNumMonitor:100, // numero massimo di transazioni sospette per considerare il token un rugpull
    minTrxNumMonitor:65,

    netVolumeUpBuy:false, // se il volume netto tra buy e sell supera volumeMin allora compra
    quickBuyTrxNumb:30, // num trx prima di quickbuy
    quickBuyVolumeUp:8,
    quickBuyVolumeMin:15,//minimo volume x accettare il token

    marketCapSolUpQuickBuy:40,
    marketCapSolUpMode:false,
    //acquisto token
    buyAmount: 0.04, // quantità di SOL da acquistare
    demoVersion:true, // (true)non compra/vende - false - on compra/vende
    sellOffPanic: -40, // % vendi se vao oltre -25% dal prezzo di acquisto

    // vendita rapida
    quickSellMultiplier: 3,     // vendi se price >= startPrice * 3.5 ...
    quickSellMinTrades: 3,        // ...e almeno 3 trade
  
    // protezione "rugpull" basata su activity
    rugpullMaxTrades: 150,
    rugpullMinGainMultiplier: 1.2,
  
    // trailing sell
    enableTrailing: true,
    adaptiveTrailingLcrRate: true, //adatta il trailing in base al tasso di cambio di liquidità
    trailingPercent: 25,        // 15% sotto il massimo raggiunto
  
    // refresh client
    clientRefreshMs: 4000,

    //filtri extra token
    hasWeb_filter: false,
    hasWebCheck_filter: true,
    hasDescription_filter: false,
    hasTwitterOrTelegram_filter: true,
    hasTwitterCheck_filter: false,

    //POOL FILTER
    
    poolPumpfun:true,
    poolBonkfun:false,
    poolBonkfunUsdt:false,
    poolRaydium:false,
    pool:{bonk:true,pump:true},

    //parametri compra quick by price
    priceSolUpMode:false,
    priceSolUpQuickBuy:   0.000000035,
    priceSolUpQuickBuyMax:0.000000042,

    //parametri buyHigh
    priceBuyHighMinPrice:0.000000095,
    priceBuyHighMaxPrice:0.00000026,

    priceSolUpQuickBuy_:   0.000000035,
    priceSolUpQuickBuyMax_:0.000000042,

    priceSolUpModeQuickBuyVolumeMin:20,
    priceSolUpModeQuickBuyVolumeNetMin:5,

    //parametri bonk.fun strategy
    bonkMinPrice:0.000000015,
    bonkMaxPrice:0.000000030,
    //stats semplici
    pumpToken:0,
    bonkToken:0,
    otherToken:0,

    //
    SOLANA_USD:200,
    solanaInfo:{},
    fearAndGreed:0,
    btcInfo:{},
    botWallet:'CsaevkbQLYnHeu3LnEMz1ZiL95sPU8ezEryJrr1AaniG',
    botCash:2,
    botSleep:false
  
  };



  async function fetchSolPrice() {

   let priceSol=await getQuote(["BTC","SOL"], "USD");

      SOLANA_USD = Number(priceSol[1].price) || SOLANA_USD;
      botOptions.SOLANA_USD=SOLANA_USD;
      botOptions.solanaInfo=priceSol[1];
      botOptions.btcInfo=priceSol[0];
      console.log(`📈 Prezzo SOL aggiornato: $${SOLANA_USD} 1h(${priceSol[0].percent_change_1h}%)`);

      getFearAndGreed().then(fngData => {
        if (fngData) {
          console.log(`📊 Indice Fear and Greed: ${fngData.value} (${fngData.value_classification}) - Ultimo aggiornamento: ${fngData.last_updated}`);
          botOptions.fearAndGreed=fngData.value;
        }
      }).catch(err => {
        console.error("Errore nel recupero dell'indice Fear and Greed:", err);
      });

      return SOLANA_USD
  }

  setInterval(fetchSolPrice, 5 * 60 * 1000); // ogni 5 minuti
  fetchSolPrice(); // chiamata iniziale
