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
    liquidityMax: 30,
    devShare:0.30,
    marketcapMin: 5,
    marketcapMax: 100,
    rugpullxyz:true,

    //monitor token
    time_monitor: 60000, // 3 secondi
    volumeMin: 5, // volume netto minimo in SOL per considerare il token
    minVolumeMonitor:15, //volume generale
    maxTrxNumMonitor:500, // numero massimo di transazioni sospette per considerare il token un rugpull
    minTrxNumMonitor:65,

    netVolumeUpBuy:false, // se il volume netto tra buy e sell supera volumeMin allora compra
    quickBuyTrxNumb:30, // num trx prima di quickbuy
    quickBuyVolumeUp:8,
    quickBuyVolumeMin:15,//minimo volume x accettare il token

    marketCapSolUpQuickBuy:40,
    marketCapSolUpMode:true,
    //acquisto token
    buyAmount: 0.02, // quantità di SOL da acquistare
    demoVersion:true, // (true)non compra/vende - false - on compra/vende
    sellOffPanic: -35, // % vendi se vao oltre -25% dal prezzo di acquisto

    // vendita rapida
    quickSellMultiplier: 2.5,     // vendi se price >= startPrice * 3.5 ...
    quickSellMinTrades: 3,        // ...e almeno 3 trade
  
    // protezione "rugpull" basata su activity
    rugpullMaxTrades: 250,
    rugpullMinGainMultiplier: 1.2,
  
    // trailing sell
    enableTrailing: true,
    trailingPercent: 25,        // 15% sotto il massimo raggiunto
  
    // refresh client
    clientRefreshMs: 4000,

    //filtri extra token
    hasWeb_filter: false,
    hasWebCheck_filter: true,
    hasDescription_filter: false,
    hasTwitterOrTelegram_filter: true,
    hasTwitterCheck_filter: false,


    //
    SOLANA_USD:200,
    solanaInfo:{},
    botWallet:'CsaevkbQLYnHeu3LnEMz1ZiL95sPU8ezEryJrr1AaniG'
  };



  async function fetchSolPrice() {
  
   let priceSol=await getQuote(["SOL"], "USD");

      SOLANA_USD = Number(priceSol[0].price) || SOLANA_USD;
      botOptions.SOLANA_USD=SOLANA_USD;
      botOptions.solanaInfo=priceSol[0];
      console.log(`📈 Prezzo SOL aggiornato: $${SOLANA_USD}`);
      return SOLANA_USD
  }
  
  setInterval(fetchSolPrice, 3000000); // ogni 5 minuti
  fetchSolPrice(); // chiamata iniziale
