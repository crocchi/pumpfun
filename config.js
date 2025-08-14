import 'dotenv/config';
import axios from 'axios';

export const MORALIS_API_KEY= process.env.MORALIS_API_KEY;
export const RPC_URL_SOLANA = process.env.RPC_URL_SOLANA;
export const RPC_URL_HELIUS = process.env.RPC_URL_HELIUS;
export const RPC_WS_HELIUS = process.env.RPC_WS_HELIUS;

export const MAX_TOKENS_SUBSCRIBED = 40;

export let SOLANA_USD = 170;


//RPC_URL: process.env.RPC_URL,
  //BUY_AMOUNT_SOL: parseFloat(process.env.BUY_AMOUNT_SOL),
  //TAKE_PROFIT: parseFloat(process.env.TAKE_PROFIT),
  //SLIPPAGE: parseFloat(process.env.SLIPPAGE),
  export const botOptions = {
    //filtri token
    liquidityMin: 2,
    liquidityMax: 20,

    // vendita rapida
    quickSellMultiplier: 3.5,     // vendi se price >= startPrice * 3.5 ...
    quickSellMinTrades: 3,        // ...e almeno 3 trade
  
    // protezione "rugpull" basata su activity
    rugpullMaxTrades: 25,
    rugpullMinGainMultiplier: 1.2,
  
    // trailing sell
    enableTrailing: true,
    trailingPercent: 0.15,        // 15% sotto il massimo raggiunto
  
    // refresh client
    clientRefreshMs: 4000
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
  
  setInterval(fetchSolPrice, 300_000); // ogni 5 minuti
  fetchSolPrice(); // chiamata iniziale
