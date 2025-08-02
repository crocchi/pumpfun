import 'dotenv/config';

export const MORALIS_API_KEY= process.env.MORALIS_API_KEY;

export const MAX_TOKENS_SUBSCRIBED = 40;

export let SOLANA_USD = 180;


//RPC_URL: process.env.RPC_URL,
  //BUY_AMOUNT_SOL: parseFloat(process.env.BUY_AMOUNT_SOL),
  //TAKE_PROFIT: parseFloat(process.env.TAKE_PROFIT),
  //SLIPPAGE: parseFloat(process.env.SLIPPAGE),


async function fetchSolPrice() {
  const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
  const data = await r.json();
  SOLANA_USD = data.solana.usd;
}
setInterval(fetchSolPrice, 300000);
fetchSolPrice(); // chiamata iniziale
