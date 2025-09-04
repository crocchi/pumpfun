import 'dotenv/config';
import axios from 'axios';

export const MORALIS_API_KEY= process.env.MORALIS_API_KEY;
export const RPC_URL_SOLANA = process.env.RPC_URL_SOLANA;
export const RPC_URL_HELIUS = process.env.RPC_URL_HELIUS;
export const RPC_WS_HELIUS = process.env.RPC_WS_HELIUS;
export const DESEARCH_API = process.env.DESEARCH_API;
export const LIGHT_WALLET_API = process.env.LIGHT_WALLET_API;

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
    time_monitor: 3000, // 3 secondi
    volumeMin: 0.02, // volume minimo in SOL per considerare il token
    maxTrxNumMonitor:500, // numero massimo di transazioni sospette per considerare il token un rugpull
    minTrxNumMonitor:60,
    //acquisto token
    buyAmount: 0.025, // quantità di SOL da acquistare
    demoVersion:true, // (true)non compra/vende - false - on compra/vende

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
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: 'solana',
          vs_currencies: 'usd'
        }
      });
      SOLANA_USD = response.data.solana.usd;
      console.log(`📈 Prezzo SOL aggiornato: $${SOLANA_USD}`);
    } catch (error) {
      console.error('❌ Errore durante il fetch del prezzo di SOL:', error.message);
      //console.error('❌ riprovo tra 10s:');
    /*  return new Promise((resolve) => {
          setTimeout(async () => {
            //ws.close();
            fetchSolPrice()
            resolve(true);
            
          }, 10000);
        });nn va*/
    }
  }
  
  setInterval(fetchSolPrice, 3000000); // ogni 5 minuti
  fetchSolPrice(); // chiamata iniziale
