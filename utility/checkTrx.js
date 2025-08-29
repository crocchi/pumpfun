import { Connection, clusterApiUrl } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

/**
 * Controlla una transazione su Solana e restituisce i dettagli
 */
async function checkTransaction(txSignature) {
  try {
    const tx = await connection.getTransaction(txSignature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return { signature: txSignature, status: "NOT FOUND" };
    }

    // Stato della transazione
    const status = tx.meta?.err ? "FAILED" : "SUCCESS";

    // Elenco delle istruzioni
    const instructions = tx.transaction.message.instructions.map((ix, i) => {
      return {
        index: i,
        programId: tx.transaction.message.accountKeys[ix.programIdIndex].toBase58(),
        accounts: ix.accounts.map((a) =>
          tx.transaction.message.accountKeys[a].toBase58()
        ),
        data: ix.data, // base58-encoded
      };
    });

    return {
      signature: txSignature,
      status,
      slot: tx.slot,
      blockTime: new Date((tx.blockTime || 0) * 1000).toISOString(),
      fee: (tx.meta?.fee || 0) / 1e9 + " SOL",
      instructions,
    };
  } catch (err) {
    return { signature: txSignature, error: err.message };
  }
}

// --- Esempio ---
(async () => {
  const txId = "5QKdaSgkEw6yY8p9RLVq7Uqk9ksBy7dSpZ6j3yY29hKySPJYJcGd8wbQz9J5LWgThjgnRscsZ3kXhU1FbQvU4z7U"; // <-- sostituisci con un tx valido
  const result = await checkTransaction(txId);
  console.log(JSON.stringify(result, null, 2));
})();
