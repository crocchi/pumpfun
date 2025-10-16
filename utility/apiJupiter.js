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


export async function getTokenInfoJupiter(tokenMint) {

const url = `https://lite-api.jup.ag/tokens/v2/search?query=${tokenMint}`;
const options = {method: 'GET', body: undefined};

try {
  const response = await fetch(url, options);
  const data = await response.json();
  console.log(data);
  return data
} catch (error) {
  console.error(error);
}

/*[
  {
    "id": "<string>",
    "name": "<string>",
    "symbol": "<string>",
    "icon": "<string>",
    "decimals": 123,
    "twitter": "<string>",
    "telegram": "<string>",
    "website": "<string>",
    "dev": "<string>",
    "circSupply": 123,
    "totalSupply": 123,
    "tokenProgram": "<string>",
    "launchpad": "<string>",
    "partnerConfig": "<string>",
    "graduatedPool": "<string>",
    "graduatedAt": "<string>",
    "holderCount": 123,
    "fdv": 123,
    "mcap": 123,
    "usdPrice": 123,
    "priceBlockId": 123,
    "liquidity": 123,
    "stats5m": {
      "priceChange": 123,
      "holderChange": 123,
      "liquidityChange": 123,
      "volumeChange": 123,
      "buyVolume": 123,
      "sellVolume": 123,
      "buyOrganicVolume": 123,
      "sellOrganicVolume": 123,
      "numBuys": 123,
      "numSells": 123,
      "numTraders": 123,
      "numOrganicBuyers": 123,
      "numNetBuyers": 123
    },
    "stats1h": {
      "priceChange": 123,
      "holderChange": 123,
      "liquidityChange": 123,
      "volumeChange": 123,
      "buyVolume": 123,
      "sellVolume": 123,
      "buyOrganicVolume": 123,
      "sellOrganicVolume": 123,
      "numBuys": 123,
      "numSells": 123,
      "numTraders": 123,
      "numOrganicBuyers": 123,
      "numNetBuyers": 123
    },
    "stats6h": {
      "priceChange": 123,
      "holderChange": 123,
      "liquidityChange": 123,
      "volumeChange": 123,
      "buyVolume": 123,
      "sellVolume": 123,
      "buyOrganicVolume": 123,
      "sellOrganicVolume": 123,
      "numBuys": 123,
      "numSells": 123,
      "numTraders": 123,
      "numOrganicBuyers": 123,
      "numNetBuyers": 123
    },
    "stats24h": {
      "priceChange": 123,
      "holderChange": 123,
      "liquidityChange": 123,
      "volumeChange": 123,
      "buyVolume": 123,
      "sellVolume": 123,
      "buyOrganicVolume": 123,
      "sellOrganicVolume": 123,
      "numBuys": 123,
      "numSells": 123,
      "numTraders": 123,
      "numOrganicBuyers": 123,
      "numNetBuyers": 123
    },
    "firstPool": {
      "id": "<string>",
      "createdAt": "<string>"
    },
    "audit": {
      "isSus": true,
      "mintAuthorityDisabled": true,
      "freezeAuthorityDisabled": true,
      "topHoldersPercentage": 123,
      "devBalancePercentage": 123,
      "devMigrations": 123
    },
    "organicScore": 123,
    "organicScoreLabel": "high",
    "isVerified": true,
    "cexes": [
      "<string>"
    ],
    "tags": [
      "<string>"
    ],
    "updatedAt": "2023-11-07T05:31:56Z"
  }
] */
}