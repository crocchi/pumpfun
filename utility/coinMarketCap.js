import axios from 'axios';
import { CMC_API_KEY } from '../config.js';

let response = null;
new Promise(async (resolve, reject) => {
  try {
    response = await axios.get('https://sandbox-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
      },
    });
  } catch(ex) {
    response = null;
    // error
    console.log(ex);
    reject(ex);
  }
  if (response) {
    // success
    const json = response.data;
    console.log(json);
    resolve(json);
  }
});


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
const getCMC20Historical = async () => {
    try {
        const response = await axios.get('https://pro-api.coinmarketcap.com/v3/index/cmc20-latest', {
            headers: {
                'X-CMC_PRO_API_KEY': CMC_API_KEY,
            },
        });

        if (response && response.data && response.data.data) {
            const cryptoList = response.data.data.flatMap(entry => 
                entry.constituents.map(crypto => ({
                    name: crypto.name,
                    symbol: crypto.symbol,
                    price: crypto.priceUsd,
                    change_24h: crypto.weight // Assuming weight represents 24h change
                }))
            );

            console.log(cryptoList);
            return cryptoList;
        } else {
            console.log('No data available');
            return [];
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
};

export { getCMC20Historical , getTop10Tokens};