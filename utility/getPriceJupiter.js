//const fetch = require('node-fetch');
import fetch from 'node-fetch';

/*
https://lite-api.jup.ag/price/v3
?ids=AcNen13P3iwrsMyuzUgRhFdk2LRqn55LW27RGbCUpump';

ids =token mint
{"AcNen13P3iwrsMyuzUgRhFdk2LRqn55LW27RGbCUpump":
{"usdPrice":0.000010617465189048672,
"blockId":373622934,
"decimals":6,
"priceChange24h":8.140599792206645}}
*/
export async function getTokenPriceJupiter(tokenMint) {
    const url = `https://lite-api.jup.ag/price/v3?ids=${tokenMint}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data[tokenMint]) {
            return data[tokenMint].usdPrice;
        } else {
            throw new Error('Token not found in response');
        }
    } catch (error) {
        console.error('Error fetching token price:', error);
        return null;
    }
}

