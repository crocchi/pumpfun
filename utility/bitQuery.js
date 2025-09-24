import axios from 'axios';
import { botOptions,BITQUERY_API } from "./config.js";


const BITQUERY_URL = 'https://graphql.bitquery.io/';

async function getPoolLiquidity(poolAddress) {
  const query = `
    query GetPoolLiquidity($poolAddress: String!) {
      Solana {
        DEXPools(
          where: {
            Pool: {
              Market: {
                MarketAddress: {is: $poolAddress}
              }
            }
            Transaction: { Result: { Success: true } }
          }
          orderBy: { descending: Block_Slot }
          limit: { count: 1 }
        ) {
          Base {
            PostAmount
          }
          Quote {
            PostAmount
          }
        }
      }
    }
  `;

  const variables = {
    poolAddress: poolAddress
  };

  try {
    const resp = await axios.post(BITQUERY_URL, {
      query,
      variables
    }, {
      headers: {
        'X-API-KEY': BITQUERY_API,
        'Content-Type': 'application/json'
      }
    });

    const pools = resp.data.data.Solana.DEXPools;
    if (pools.length === 0) {
      return null;
    }

    const pool = pools[0];
    const base = parseFloat(pool.Base.PostAmount);
    const quote = parseFloat(pool.Quote.PostAmount);

    return { base, quote };
  } catch (err) {
    console.error('Errore Bitquery pool liquidity:', err);
    return null;
  }
}

// Esempio d’uso
/*
(async () => {
  const poolAddress = 'indirizzo_del_pool_che_vuoi';
  const liq = await getPoolLiquidity(poolAddress);
  if (liq) {
    const prezzo = liq.quote / liq.base;
    console.log(`Prezzo stimato per ${poolAddress}: ${prezzo} (quote/base)`);
  } else {
    console.log('Pool non trovato o liquidità non disponibile');
  }
})();*/


// Argomenti da riga di comando

const poolAddress= process.argv[2];
if (poolAddress) {
    console.error('Uso: node check-account.js @username');
      const liq = await getPoolLiquidity(poolAddress);
  if (liq) {
    const prezzo = liq.quote / liq.base;
    console.log(`Prezzo stimato per ${poolAddress}: ${prezzo} (quote/base)`);
  } else {
    console.log('Pool non trovato o liquidità non disponibile');
  }
    process.exit(1);
}