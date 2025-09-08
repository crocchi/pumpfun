import 'dotenv/config';
import axios from 'axios';
import { getQuote } from './utility/coinMarketCap.js';

export const MORALIS_API_KEY= process.env.MORALIS_API_KEY;
export const RPC_URL_SOLANA = process.env.RPC_URL_SOLANA;
export const RPC_URL_HELIUS = process.env.RPC_URL_HELIUS;
export const RPC_WS_HELIUS = process.env.RPC_WS_HELIUS;
export const DESEARCH_API = process.env.DESEARCH_API;
export const LIGHT_WALLET_API = process.env.LIGHT_WALLET_API;
export const CMC_API_KEY = process.env.CMC_API_KEY;

export const MAX_TOKENS_SUBSCRIBED = 40;

export let SOLANA_USD = 200;


//RPC_URL: process.env.RPC_URL,
  //BUY_AMOUNT_SOL: parseFloat(process.env.BUY_AMOUNT_SOL),
  //TAKE_PROFIT: parseFloat(process.env.TAKE_PROFIT),
  //SLIPPAGE: parseFloat(process.env.SLIPPAGE),
  export const botOptions = {
    //filtri token
    liquidityMin: 1.7,
    liquidityMax: 20,
    devShare:0.30,
    marketcapMin: 5,
    marketcapMax: 100,
    rugpullxyz:true,

    //monitor token
    time_monitor: 60000, // 3 secondi
    volumeMin: 5, // volume minimo in SOL per considerare il token
    maxTrxNumMonitor:500, // numero massimo di transazioni sospette per considerare il token un rugpull
    minTrxNumMonitor:60,
    netVolumeUpBuy:false, // se il volume netto tra buy e sell supera volumeMin allora compra

    //acquisto token
    buyAmount: 0.025, // quantità di SOL da acquistare
    demoVersion:true, // (true)non compra/vende - false - on compra/vende
    sellOffPanic: -30, // % vendi se vao oltre -25% dal prezzo di acquisto

    // vendita rapida
    quickSellMultiplier: 3.5,     // vendi se price >= startPrice * 3.5 ...
    quickSellMinTrades: 3,        // ...e almeno 3 trade
  
    // protezione "rugpull" basata su activity
    rugpullMaxTrades: 35,
    rugpullMinGainMultiplier: 1.5,
  
    // trailing sell
    enableTrailing: true,
    trailingPercent: 0.15,        // 15% sotto il massimo raggiunto
  
    // refresh client
    clientRefreshMs: 4000,

    //filtri extra token
    hasWeb_filter: true,
    hasWebCheck_filter: true,
    hasDescription_filter: true,
    hasTwitterOrTelegram_filter: true,
    hasTwitterCheck_filter: true,

  };



  async function fetchSolPrice() {
  
   let priceSol=await getQuote(["SOL"], "USD");

      SOLANA_USD = Number(priceSol[0].price) || SOLANA_USD;
      console.log(`📈 Prezzo SOL aggiornato: $${SOLANA_USD}`);
      return SOLANA_USD
  }
  
  setInterval(fetchSolPrice, 3000000); // ogni 5 minuti
  fetchSolPrice(); // chiamata iniziale
