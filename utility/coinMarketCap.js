import axios from 'axios';
import { CMC_API_KEY } from '../config.js';



const getTop10Tokens = async () => {
    try {
        const response = await axios.get('https://pro-api.coinmarketcap.com/v3/index/cmc100-latest', {
            headers: {
                'X-CMC_PRO_API_KEY': CMC_API_KEY,
            },
        });

        if (response && response.data && response.data.data && response.data.data.constituents) {
            console.log(response.data)
            const tokens = response.data.data.constituents
                .map(token => ({
                    name: token.name,
                    symbol: token.symbol,
                    price: token.weight, // Assuming weight is the price
                    change_24h: token.value_24h_percentage_change || 0,
                    prezzo:token.value // Assuming change_1h exists
                }))
               // .sort((a, b) => b.price - a.price) // Sort by price descending
                .slice(0, 10); // Get top 10

            console.log(tokens);
            return tokens;
        } else {
            console.log('No data available');
            return [];
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
};




const BASE_URL = "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest";

const idCmc=[
    { symbol: "BTC", id: 1 },
    { symbol: "ETH", id: 1027 },
    { symbol: "USDT", id: 825 },
    { symbol: "BNB", id: 1839 },
    { symbol: "USDC", id: 3408 },
    { symbol: "XRP", id: 52 },
    { symbol: "SOL", id: 5426 },
]
function convertSymbolsToIds(symbols) {
    return symbols.map(symbol => {
        const match = idCmc.find(item => item.symbol === symbol);
        return match ? match.id : null;
    }).filter(id => id !== null); // Remove nulls for unmatched symbols
}

async function getQuote(symbols = ["BTC", "ETH","SOL"], convert = "USD") {

  try {
    const response = await axios.get(BASE_URL, {
      headers: {
        "X-CMC_PRO_API_KEY": CMC_API_KEY,
      },
      params: {
        //symbol: symbols.join(","), // es. "BTC,ETH"
         id: convertSymbolsToIds(symbols).join(","), // es. "1,1027"
        convert: convert,          // es. "USD"
      },
    });

    const data = response.data.data;
    //console.log(data);

    // Estraggo solo i campi più importanti
    const results = Object.values(data).map((crypto) => {
      const quote = crypto.quote[convert];
      return {
        id: crypto.id,
        name: crypto.name,
        symbol: crypto.symbol,
        price: quote.price.toFixed(2),
        market_cap: quote.market_cap,
        volume_24h: quote.volume_24h,
        percent_change_1h: quote.percent_change_1h.toFixed(2),
        percent_change_24h: quote.percent_change_24h,
        last_updated: quote.last_updated,
      };
    });

    console.log(results)
    return results;
  } catch (err) {
    console.error("Errore API CoinMarketCap:", err.response?.data || err.message);
    return null;
  }
}

// --- ESEMPIO ---
/*
(async () => {
  const result = await getQuote(["BTC", "SOL", "ETH"], "USD");
  console.log(result);
})();
*/

export { getTop10Tokens , getQuote};




/*
CoinMarketCap 100 Index Latest
https://pro-api.coinmarketcap.com/v3/index/cmc100-latest
{
"data": {
"constituents": [
{
"id": 0,
"name": "string",
"symbol": "string",
"url": "string",
"weight": 0
}
],
"last_update": "2025-09-08",
"next_update": "2025-09-08",
"value": 0,
"value_24h_percentage_change": 0
},
"status": {
"credit_count": 0,
"elapsed": 0,
"error_code": "string",
"error_message": "string",
"notice": "string",
"timestamp": "2025-09-08T10:38:09Z",
"total_count": 0
}
}



CMC Crypto Fear and Greed Historical
https://pro-api.coinmarketcap.com/v3/fear-and-greed/historical
{
"data": [
{
"timestamp": "1726617600",
"value": 38,
"value_classification": "Fear"
},
{
"timestamp": "1726531200",
"value": 34,
"value_classification": "Fear"
},
{
"timestamp": "1726444800",
"value": 36,
"value_classification": "Fear"
},
{
"timestamp": "1726358400",
"value": 38,
"value_classification": "Fear"
},
{
"timestamp": "1726272000",
"value": 38,
"value_classification": "Fear"
}
],
"status": {
"timestamp": "2025-09-01T00:01:20.362Z",
"error_code": 0,
"error_message": "",
"elapsed": 10,
"credit_count": 1,
"notice": ""
}
}


CoinMarketCap 20 Index Historical
Returns an interval of historic CoinMarketCap 20 Index values based on the interval parameter.
https://pro-api.coinmarketcap.com/v3/index/cmc20-historical
{
"data": [
{
"constituents": [
{
"id": 0,
"name": "string",
"symbol": "string",
"url": "string",
"weight": 0,
"priceUsd": 0,
"units": 0
}
],
"update_time": "2025-09-08",
"value": 0
}
],
"status": {
"credit_count": 0,
"elapsed": 0,
"error_code": "string",
"error_message": "string",
"notice": "string",
"timestamp": "2025-09-08T10:38:09Z",
"total_count": 0
}
}
*/