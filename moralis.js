import Moralis from 'moralis';
import { MORALIS_API_KEY } from './config.js';

console.log("Inizializzazione Moralis con API Key:");
Moralis.start({
    apiKey: MORALIS_API_KEY
  });

export async function checkPrice(addressContract) {
    console.log("Controllo prezzo per:", addressContract);
 try {

    const response = await Moralis.SolApi.token.getTokenPrice({
        network: 'mainnet',
        address: addressContract,
      });

   console.log(response.raw);
 }  catch (error) {
    if (error.status === 404 || error.message.includes('Token price not found')) {
      console.warn(`⚠️ Prezzo non trovato per ${mint}. Token troppo nuovo o non indicizzato.`);
      return null;
      }
   }

}
/*{
  "tokenAddress": "BtKMyfjQqbSS8vxi85RknpuqqFH7coCUekW9baqPpump",
  "pairAddress": "4ZVCNNU9f73uUpQntYqE4v15ctAKXxUDh6Ys3RmMUcy6",
  "exchangeName": "Pump.Fun",
  "exchangeAddress": "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
  "nativePrice": {
    "value": "27.9589",
    "symbol": "WSOL",
    "name": "Wrapped Solana",
    "decimals": 9
  },
  "usdPrice": 0.0000053,
  "usdPrice24h": 0.000005674,
  "usdPrice24hrUsdChange": -3.7400000000000015e-7,
  "usdPrice24hrPercentChange": -6.591469862530845,
  "logo": "https://logo.moralis.io/solana-mainnet_BtKMyfjQqbSS8vxi85RknpuqqFH7coCUekW9baqPpump_cf45fec29fcf80ac603504c66817e932.webp",
  "name": "PUMPWICH",
  "symbol": "PUMPWICH",
  "isVerifiedContract": false
} */
 