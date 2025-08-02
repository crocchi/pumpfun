import 'dotenv/config';
import axios from 'axios';

export const MORALIS_API_KEY= process.env.MORALIS_API_KEY;

export const MAX_TOKENS_SUBSCRIBED = 40;

export let SOLANA_USD = 180;


//RPC_URL: process.env.RPC_URL,
  //BUY_AMOUNT_SOL: parseFloat(process.env.BUY_AMOUNT_SOL),
  //TAKE_PROFIT: parseFloat(process.env.TAKE_PROFIT),
  //SLIPPAGE: parseFloat(process.env.SLIPPAGE),


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
    }
  }
  
  setInterval(fetchSolPrice, 300_000); // ogni 5 minuti
  fetchSolPrice(); // chiamata iniziale
