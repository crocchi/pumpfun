import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";

/*
 const { Connection, PublicKey, clusterApiUrl } = await import("@solana/web3.js");
 const { getAccount, getAssociatedTokenAddress }= await import("@solana/spl-token");
*/
// Connessione al cluster mainnet
const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

const walletAddressmy="CsaevkbQLYnHeu3LnEMz1ZiL95sPU8ezEryJrr1AaniG";

export async function getTokenBalance(walletAddress, tokenMintAddress) {
  try {
    const walletPubkey = new PublicKey(walletAddressmy);
    const mintPubkey = new PublicKey(tokenMintAddress);

    console.log(`controllo wallet:${walletPubkey} - token:${mintPubkey} `)
    // Ottieni ATA (Associated Token Account) del wallet per quel mint
    const ata = await getAssociatedTokenAddress(mintPubkey, walletPubkey);

    console.log('ata:', ata)
    // Leggi i dati dell'account token
    const tokenAccount = await getAccount(connection, ata);

    console.log(tokenAccount);

    // Calcolo balance (con decimali corretti)
    const amount = Number(tokenAccount.amount);
    return {
      wallet: walletAddress,
      tokenMint: tokenMintAddress,
      rawAmount: amount,
      uiAmount: amount / Math.pow(10, tokenAccount.decimals),
    };
  } catch (err) {
    return { wallet: walletAddress, tokenMint: tokenMintAddress, error: err.message };
  }
}

async function getSolBalance(walletAddress) {
  try {
    const pubkey = new PublicKey(walletAddress);

    // balance in lamport (1 SOL = 1e9 lamports)
    const balanceLamports = await connection.getBalance(pubkey);

    // conversione in SOL
    const balanceSOL = balanceLamports / 1e9;

    return {
      wallet: walletAddress,
      lamports: balanceLamports,
      sol: balanceSOL,
    };
    /*{
  wallet: 'CsaevkbQLYnHeu3LnEMz1ZiL95sPU8ezEryJrr1AaniG',
  lamports: 120000000,
  sol: 0.12
} */
  } catch (err) {
    return { wallet: walletAddress, error: err.message };
  }
}


// --- Esempio ---
(async () => {
  const result = await getTokenBalance(wallet, mint);
  const solBalance = await getSolBalance(walletAddressmy);
  console.log(result);
  console.log(solBalance)
})();
