import { Connection, PublicKey } from '@solana/web3.js';
import { RPC_URL_SOLANA } from '../config.js';

const connection = new Connection(RPC_URL_SOLANA, 'confirmed');

// Indirizzi considerati "burn" (puoi estenderli)
const BURN_ADDRESSES = [
  '11111111111111111111111111111111',
  'BurnxxxxxxxxxxxxxxxxxxxxxxxxxxxxxW8s',
];

/**
 * Verifica la distribuzione della supply di un token.
 * @param {string} mintAddress - Indirizzo del mint del token.
 * @returns {Promise<object>} - Dati sulla distribuzione.
 */
export async function checkTokenDistribution(mintAddress) {
    console.log("Controllo distribuzione per:", mintAddress);
  const mintPubkey = new PublicKey(mintAddress);

  // Prendi informazioni sul token
  const mintInfo = await connection.getParsedAccountInfo(mintPubkey);
  const mintData = mintInfo.value?.data?.parsed?.info;
console.log("Mint Data:", mintData);
console.log("Mint Data:", mintInfo);
  if (!mintData) {
    throw new Error(`Impossibile leggere i metadati del mint ${mintAddress}`);
  }

  const decimals = mintData.decimals;
  const totalSupplyRaw = mintData.supply;
  const creatorAddress = mintData.mintAuthority;

  const totalSupply = Number(totalSupplyRaw) / 10 ** decimals;

  // Prendi i top account
  const tokenAccounts = await connection.getTokenLargestAccounts(mintPubkey);
  const holders = tokenAccounts.value.map(acc => ({
    pubkey: acc.address.toBase58(),
    amount: Number(acc.amount) / 10 ** decimals,
  }));

  let burned = 0;
  let ownerBalance = 0;

  for (const h of holders) {
    if (BURN_ADDRESSES.includes(h.pubkey)) {
      burned += h.amount;
    } else if (h.pubkey === creatorAddress) {
      ownerBalance += h.amount;
    }
  }

  const topHolders = holders
    .filter(h => !BURN_ADDRESSES.includes(h.pubkey))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const ownerPercent = ((ownerBalance / totalSupply) * 100).toFixed(2);

  return {
    totalSupply,
    burned,
    creatorAddress,
    ownerBalance,
    ownerPercent,
    topHolders,
  };
}
