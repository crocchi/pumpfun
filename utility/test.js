//import { Connection } from '@solana/web3.js';
import fetch from "node-fetch";
import { RPC_URL_HELIUS, RPC_WS_HELIUS } from '../config.js';
import { decodeProgramData , readString } from './decodeSolana.js';
import WebSocket from 'ws';

export let target_mint; // Mint del token da monitorare (da impostare se necessario)
//config debug
const attivo = false; // Abilita/disabilita la connessione a Helius
const mint_token_helius =false; // abilita/disabilita il monitoraggio dei token su Pump.fun e raydius

// Initialize connection to Helius RPC
/*
const connection = new Connection(RPC_URL_HELIUS);

// Test the connection
const testConnection = async () => {
  try {
    const version = await connection.getVersion();
    const slot = await connection.getSlot();
    
    console.log('Connection successful!');
    console.log(`Solana version: ${version['solana-core']}`);
    console.log(`Current slot: ${slot}`);
  } catch (error) {
    console.error('Connection failed:', error);
  }
};

testConnection();
*/


const PUMP_FUN_PROGRAM_ID = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
const LETSBONK_PROGRAM_ID = 'FfYek5vEz23cMkWsdJwG2oa6EphsvXSHrGpdALN4g6W1'
// Lista dei Program ID da monitorare
const PROGRAM_IDS = [
  '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P', // pump.fun
  'LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj',   // Raydium Launchpad (letsbonk.fun)
  //'11111111111111111111111111111111'              // System Program (esempio)
];

export const wshelius = new WebSocket(RPC_WS_HELIUS);
if(attivo){

wshelius.on('open', () => {
  console.log('✅ Connesso a Helius WebSocket');

  // Invia una subscription per ogni programma
  PROGRAM_IDS.forEach((programId, i) => {
    const msg = {
      jsonrpc: '2.0',
      id: i + 1,
      method: 'logsSubscribe',
      params: [
        { mentions: [programId] },
        { commitment: 'finalized',encoding : 'jsonParsed',maxSupportedTransactionVersion: '0' }
      ]
    };
    wshelius.send(JSON.stringify(msg));
  });


});
let i=0;

wshelius.on('message', async (data) => {
  const message = JSON.parse(data);


  if (message.method === "logsNotification") {

    const { logs, signature } = message.params.result.value;
    let decoded;
//// Token creation detection
/*
if log_messages.contains("Program log: Create") &&
log_messages.contains("LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj") {
      console.log("🆕 Token creato su Raydium LaunchLab - letsbonk.fun");
      console.log("🔗 TX:", `https://solscan.io/tx/${signature}`);
    }*/

    if (mint_token_helius && logs.some(line => line.includes("Instruction: InitializeMint2")) && logs.some(line => line.includes("Instruction: Create"))){
      const programData = logs.find(line => line.includes("Program data: "));
      const dataP = programData?.split("Program data: ")[1];
      console.log("------------------------------");
      console.log("🆕 Token creato su Pump.fun!");
      //console.log("🔗 Mint:", mint);
      console.log("🔗 TX:", `https://solscan.io/tx/${signature}`);
      try {
        decoded = decodeProgramData(dataP);
        console.log("📦 Dati del token:", decoded);
      } catch (err) {
        console.error('❌ Failed to decode:', err.message);
      }
      console.log("------------------------------");
    } 
     
      if (mint_token_helius && logs.some(line => line.includes(PROGRAM_IDS[1])) && logs.some(line => line.includes("Instruction: InitializeMint2"))){

        console.log("🆕 Token creato su Raydium LaunchLab - letsbonk.fun ");
        console.log("🔗 TX:", `https://solscan.io/tx/${signature}`);
    
      }

      // Qui puoi aggiungere logica per filtri, subscribeTrade, buy/sell, ecc.
      if (logs.some(log => log.includes('Instruction: Buy')) && i<5) {
        console.log(`🟢 BUY rilevato: https://solscan.io/tx/${signature}`);
        const start = performance.now();
        try {
          // Recupera i dettagli della transazione
          const tx = await getTransaction(signature);
          console.log("Dettagli transazione:", tx);

          // Estraggo la mint
          const mint = extractMint(tx);
          console.log("Mint:", mint);
          let mintAddress = target_mint;
          if (mint === mintAddress) {
              console.log(`🎯 Trovata transazione del token target! Mint: ${mint}`);
              console.log(`📄 TX: https://solscan.io/tx/${signature}`);
              const end = performance.now();
              console.log(`⏱️ Tempo di esecuzione: ${(end - start).toFixed(2)} ms`);
          } else {
              console.log(`⏭️ Mint ${mint} ignorata`);
          }
      } catch (err) {
          console.error("❌ Errore getTransaction:", err.message);
      }


       // console.log(logs)
        console.log(`📄 TX: https://solscan.io/tx/${signature}`);
        console.log('🟢 BUY rilevato!');
        i++
      }

      if (logs.some(line => line.includes("Instruction: Sell")) && i<5 ) {
        console.log(`🔴 SELL rilevato: https://solscan.io/tx/${signature}`);
      }
    }

    
   /*
    if (isCreate) {
      console.log(`--------------------------`);
      console.log(`🆕 Nuovo token creato su Pump.fun`);
      console.log(`🔗 TX: https://solscan.io/tx/${signature}`);
    console.log('Messaggio ricevuto value:', message.params.result.value);
    console.log('Messaggio ricevuto context:', message.params.result.context);
    console.log(`--------------------------`);
      // (opzionale) Puoi ora chiamare l'RPC Helius per recuperare i dettagli della transazione
      // e determinare l'indirizzo del mint e del creatore.
    }*/
});

wshelius.on('error', (err) => {
  console.error('❌ Errore WebSocket:', err.message);
});

wshelius.on('close', () => {
  console.log('🔌 Connessione WebSocket chiusa');
});

}

async function getTransaction(signature) {
  const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "getTransaction",
      params: [
          signature,
          { commitment: "finalized"}
      ]
  };

  const res = await fetch(RPC_URL_HELIUS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
  });

  const data = await res.json();
  console.log("Dati transazione:", data);
  return data.result;
}

function extractMint(tx) {
  if (!tx) return null;

  console.log("Istruzioni: ",tx.transaction.message.instructions)
  console.log("PayerWallet: ", tx.transaction.message.accountKeys);
  // 1️⃣ Controllo se c'è tokenTransfers
  if (tx.meta && tx.meta.tokenTransfers && tx.meta.tokenTransfers.length > 0) {
      return tx.meta.tokenTransfers[0].mint;
  }

  // 2️⃣ Controllo negli innerInstructions
  if (tx.transaction?.message?.instructions) {
      for (const ix of tx.transaction.message.instructions) {
          if (ix.program === "spl-token" && ix.parsed?.info?.mint) {
              return ix.parsed.info.mint;
          }
      }
  }

  return null;
}


export async function getTopHolders(mintAddress) {
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "getTokenLargestAccounts",
    params: [
      mintAddress,
      { commitment: "finalized" }
    ]
  };

  const res = await fetch(RPC_URL_HELIUS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  return data.result.value; // lista dei top 20 holder
}

/*

FRxd4Q8HXV2tSca5hbnUDVkh9BeYGZxaGMYD23mEpump
 logs: [
    'Program ComputeBudget111111111111111111111111111111 invoke [1]',
    'Program ComputeBudget111111111111111111111111111111 success',
    'Program ComputeBudget111111111111111111111111111111 invoke [1]',
    'Program ComputeBudget111111111111111111111111111111 success',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke [1]',

    'Program log: Instruction: Create',

    'Program 11111111111111111111111111111111 invoke [2]',
    'Program 11111111111111111111111111111111 success',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',

    'Program log: Instruction: InitializeMint2',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2780 of 208056 compute units',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    'Program 11111111111111111111111111111111 invoke [2]',
    'Program 11111111111111111111111111111111 success',
    'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [2]',
    'Program log: Create',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',

    'Program log: Instruction: GetAccountDataSize',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1595 of 182984 compute units',
    'Program return: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA pQAAAAAAAAA=',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    'Program 11111111111111111111111111111111 invoke [3]',
    'Program 11111111111111111111111111111111 success',

    'Program log: Initialize the associated token account',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',

    'Program log: Instruction: InitializeImmutableOwner',
    'Program log: Please upgrade to SPL Token 2022 for immutable owner support',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1405 of 176371 compute units',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',

    'Program log: Instruction: InitializeAccount3',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4214 of 172487 compute units',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 21990 of 189959 compute units',
    'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success',
    'Program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s invoke [2]',

    'Program log: IX: Create Metadata Accounts v3',
    'Program 11111111111111111111111111111111 invoke [3]',
    'Program 11111111111111111111111111111111 success',

    'Program log: Allocate space for the account',
    'Program 11111111111111111111111111111111 invoke [3]',
    'Program 11111111111111111111111111111111 success',

    'Program log: Assign the account to the owning program',
    'Program 11111111111111111111111111111111 invoke [3]',
    'Program 11111111111111111111111111111111 success',
    'Program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s consumed 36557 of 154843 compute units',
    'Program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s success',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',

    'Program log: Instruction: MintTo',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4492 of 115668 compute units',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',

    'Program log: Instruction: SetAuthority',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2911 of 108945 compute units',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    'Program data: G3KpTd7rY3YWAAAAUGlua3kgcHJvbWlzZSBpdCBzZW5kcwUAAABQaW5reVAAAABodHRwczovL2lwZnMuaW8vaXBmcy9iYWZrcmVpZGRiZ3lpdmVyZ29vb200Ym41bWh3NDZieWVuNWpmN3FoM3p4NHhta3VlaWR4bmZ6cTRzedZocrL43v5V1zwkw/jWcjgn/q744/ge2h9rRj170QUfN87HA6TNtnSr6bCx+7fKV8LfU+ASawS4rjvJkAD0IJyolR6tVisW+AxPKuA7CoTanDY9XlTth5djcLuyB9k8lqiVHq1WKxb4DE8q4DsKhNqcNj1eVO2Hl2Nwu7IH2TyWQ06TaAAAAAAAENhH488DAACsI/wGAAAAAHjF+1HRAgAAgMakfo0DAA==',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke [2]',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P consumed 2027 of 99766 compute units',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P success',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P consumed 122557 of 219433 compute units',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P success',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke [1]',

    'Program log: Instruction: ExtendAccount',
    'Program 11111111111111111111111111111111 invoke [2]',
    'Program 11111111111111111111111111111111 success',
    'Program data: YWHXkF2SFnw3zscDpM22dKvpsLH7t8pXwt9T4BJrBLiuO8mQAPQgnKiVHq1WKxb4DE8q4DsKhNqcNj1eVO2Hl2Nwu7IH2TyWUQAAAAAAAACWAAAAAAAAAENOk2gAAAAA',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke [2]',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P consumed 2027 of 87066 compute units',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P success',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P consumed 12029 of 96876 compute units',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P success',
    'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]',

    'Program log: CreateIdempotent',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
    'Program log: Instruction: GetAccountDataSize',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1569 of 76446 compute units',
    'Program return: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA pQAAAAAAAAA=',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    'Program 11111111111111111111111111111111 invoke [2]',
    'Program 11111111111111111111111111111111 success',
    'Program log: Initialize the associated token account',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
    'Program log: Instruction: InitializeImmutableOwner',

    'Program log: Please upgrade to SPL Token 2022 for immutable owner support',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1405 of 69859 compute units',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
    'Program log: Instruction: InitializeAccount3',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4188 of 65979 compute units',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 23339 of 84847 compute units',
    'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke [1]',
    'Program log: Instruction: Buy',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
    'Program log: Instruction: Transfer',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 23511 compute units',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    'Program 11111111111111111111111111111111 invoke [2]',
    'Program 11111111111111111111111111111111 success',
    ... 10 more items
  ]
}
Messaggio ricevuto context: { slot: 358251629 }
--------------------------


--------------------------
🆕 Nuovo token creato su Pump.fun
🔗 TX: https://solscan.io/tx/4fXbZ8G9yxiiHJkUSxqyQbGgEqb2YA7aPsPnPLDF8eZ5XCbnDwA3Asts9qSVnUM3bBVNx4XKHNzEUkgMnyJ4nP3Z
Messaggio ricevuto value: {
  signature: '4fXbZ8G9yxiiHJkUSxqyQbGgEqb2YA7aPsPnPLDF8eZ5XCbnDwA3Asts9qSVnUM3bBVNx4XKHNzEUkgMnyJ4nP3Z',
  err: null,
  logs: [
    'Program ComputeBudget111111111111111111111111111111 invoke [1]',
    'Program ComputeBudget111111111111111111111111111111 success',
    'Program ComputeBudget111111111111111111111111111111 invoke [1]',
    'Program ComputeBudget111111111111111111111111111111 success',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke [1]',
    'Program log: Instruction: Create',
    'Program 11111111111111111111111111111111 invoke [2]',
    'Program 11111111111111111111111111111111 success',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
    'Program log: Instruction: InitializeMint2',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2780 of 202224 compute units',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    'Program 11111111111111111111111111111111 invoke [2]',
    'Program 11111111111111111111111111111111 success',
    'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [2]',
    'Program log: Create',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
    'Program log: Instruction: GetAccountDataSize',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1595 of 175652 compute units',
    'Program return: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA pQAAAAAAAAA=',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    'Program 11111111111111111111111111111111 invoke [3]',
    'Program 11111111111111111111111111111111 success',
    'Program log: Initialize the associated token account',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
    'Program log: Instruction: InitializeImmutableOwner',
    'Program log: Please upgrade to SPL Token 2022 for immutable owner support',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1405 of 169039 compute units',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
    'Program log: Instruction: InitializeAccount3',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4214 of 165155 compute units',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 23490 of 184127 compute units',
    'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success',
    'Program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s invoke [2]',
    'Program log: IX: Create Metadata Accounts v3',
    'Program 11111111111111111111111111111111 invoke [3]',
    'Program 11111111111111111111111111111111 success',
    'Program log: Allocate space for the account',
    'Program 11111111111111111111111111111111 invoke [3]',
    'Program 11111111111111111111111111111111 success',
    'Program log: Assign the account to the owning program',
    'Program 11111111111111111111111111111111 invoke [3]',
    'Program 11111111111111111111111111111111 success',
    'Program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s consumed 38383 of 147545 compute units',
    'Program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s success',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
    'Program log: Instruction: MintTo',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4492 of 106544 compute units',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
    'Program log: Instruction: SetAuthority',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2911 of 99821 compute units',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    'Program data: G3KpTd7rY3YOAAAAVGhlIFdyb25nIEZhcnQEAAAAU0hJVFAAAABodHRwczovL2lwZnMuaW8vaXBmcy9iYWZrcmVpZ3gzYnN5eXB5ZzdqNjZ1Y3B0ZWF6MnJvdmIycWVrZGxmYjdyZ29jZXJmcWF4cWJ6NXllbStClO/Gi5P4FoTHp9OOtzl6vmzPKy3zfyvlZ5wh5JffaDSEqWkF5p9vs2WxsjWuskspbTG5phh/rBR1PjB6AQkNGiJsL8VhzIdB3anmWNFjLwFqPBA8DkDAvn7L3o5vgA0aImwvxWHMh0HdqeZY0WMvAWo8EDwOQMC+fsvejm+AWEqTaAAAAAAAENhH488DAACsI/wGAAAAAHjF+1HRAgAAgMakfo0DAA==',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke [2]',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P consumed 2027 of 90766 compute units',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P success',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P consumed 125730 of 213606 compute units',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P success',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke [1]',
    'Program log: Instruction: ExtendAccount',
    'Program 11111111111111111111111111111111 invoke [2]',
    'Program 11111111111111111111111111111111 success',
    'Program data: YWHXkF2SFnxoNISpaQXmn2+zZbGyNa6ySyltMbmmGH+sFHU+MHoBCQ0aImwvxWHMh0HdqeZY0WMvAWo8EDwOQMC+fsvejm+AUQAAAAAAAACWAAAAAAAAAFhKk2gAAAAA',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke [2]',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P consumed 2027 of 78066 compute units',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P success',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P consumed 12029 of 87876 compute units',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P success',
    'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]',
    'Program log: CreateIdempotent',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
    'Program log: Instruction: GetAccountDataSize',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1569 of 70446 compute units',
    'Program return: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA pQAAAAAAAAA=',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    'Program 11111111111111111111111111111111 invoke [2]',
    'Program 11111111111111111111111111111111 success',
    'Program log: Initialize the associated token account',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
    'Program log: Instruction: InitializeImmutableOwner',
    'Program log: Please upgrade to SPL Token 2022 for immutable owner support',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1405 of 63859 compute units',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
    'Program log: Instruction: InitializeAccount3',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4188 of 59979 compute units',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 20339 of 75847 compute units',
    'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success',
    'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke [1]',
    'Program log: Instruction: Buy',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
    'Program log: Instruction: Transfer',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 23511 compute units',
    'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
    'Program 11111111111111111111111111111111 invoke [2]',
    'Program 11111111111111111111111111111111 success',
    ... 10 more items
  ]
}
Messaggio ricevuto context: { slot: 358249085 }
--------------------------
New Token: {
  name: 'The Wrong Fart',
  symbol: 'SHIT',
  description: '',
  image: 'https://ipfs.io/ipfs/bafkreieabxmu3c2zwnmp55tcm4g4z64jtb5rxfzepeo5egtvnm4kuq57k4',
  showName: true,
  createdOn: 'https://pump.fun',
  twitter: 'https://x.com/i/communities/1934284386926469561',
  website: 'https://www.myinstants.com/en/instant/whats-wrong-fart-29099/'
}
⛔ Token 'The Wrong Fart' scartato per sicurezza. ["❌ Liquidità fuori range.","❌ Descrizione breve o assente"]




transaction
[
  'Program ComputeBudget111111111111111111111111111111 invoke [1]',
  'Program ComputeBudget111111111111111111111111111111 success',
  'Program ComputeBudget111111111111111111111111111111 invoke [1]',
  'Program ComputeBudget111111111111111111111111111111 success',
  'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]',

  'Program log: Create',
  'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',

  'Program log: Instruction: GetAccountDataSize',
  'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1569 of 100225 compute units',
  'Program return: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA pQAAAAAAAAA=',
  'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
  'Program 11111111111111111111111111111111 invoke [2]',
  'Program 11111111111111111111111111111111 success',

  'Program log: Initialize the associated token account',
  'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',

  'Program log: Instruction: InitializeImmutableOwner',

  'Program log: Please upgrade to SPL Token 2022 for immutable owner support',
  'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1405 of 93638 compute units',
  'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
  'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',

  'Program log: Instruction: InitializeAccount3',
  'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4188 of 89756 compute units',
  'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
  'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 20307 of 105592 compute units',
  'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success',
  'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke [1]',

  'Program log: Instruction: Buy',
  'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',

  'Program log: Instruction: Transfer',
  'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 54880 compute units',
  'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
  'Program 11111111111111111111111111111111 invoke [2]',
  'Program 11111111111111111111111111111111 success',
  'Program 11111111111111111111111111111111 invoke [2]',
  'Program 11111111111111111111111111111111 success',
  'Program 11111111111111111111111111111111 invoke [2]',
  'Program 11111111111111111111111111111111 success',
  'Program data: vdt/007mYe6MdmWGTS8wbcsGqDhq6n043QoOb3tnX0HE/J0Gqp/BzwHC6wsAAAAAmgKmBfABAAABqPM128RB0S7Z9gI8xeI9mx4D/cOH9FX95ImdZb+kivpEaZZoAAAAAPU3lNIMAAAAo76+8ZkTAgD1i3DWBQAAAKMmrKUIFQEASsL40N1cvJfjKJwZfLUGKlTz2Va5zm5RFfllZ6pcs+ZfAAAAAAAAAOH9HAAAAAAAYk4rsFmDOYB7GGOKabMBDVOmC5Tm9UopoS9xVOykl4QFAAAAAAAAAKGGAQAAAAAA',
  'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke [2]',
  'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P consumed 2027 of 38395 compute units',
  'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P success',
  'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P consumed 53916 of 85285 compute units',
  'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P success',
  'Program troY36YiPGqMyAYCNbEqYCdN2tb91Zf7bHcQt7KUi61 invoke [1]',
  'Program log: Instruction: FeeTransfer',
  'Program 11111111111111111111111111111111 invoke [2]',
  'Program 11111111111111111111111111111111 success',
  'Program troY36YiPGqMyAYCNbEqYCdN2tb91Zf7bHcQt7KUi61 consumed 3560 of 31369 compute units',
  'Program troY36YiPGqMyAYCNbEqYCdN2tb91Zf7bHcQt7KUi61 success'
]


{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "slot": 430,
    "transaction": {
      "message": {
        "accountKeys": [
          "3UVYmECPPMZSCqWKfENfuoTv51fTDTWicX9xmBD2euKe"
        ],
        "header": {
          "numReadonlySignedAccounts": 0,
          "numReadonlyUnsignedAccounts": 3,
          "numRequiredSignatures": 1
        },
        "instructions": [
          {
            "accounts": [
              1
            ],
            "data": "37u9WtQpcm6ULa3WRQHmj49EPs4if7o9f1jSRVZpm2dvihR9C8jY4NqEwXUbLwx15HBSNcP1",
            "programIdIndex": 4
          }
        ],
        "recentBlockhash": "mfcyqEXB3DnHXki6KjjmZck6YjmZLvpAByy2fj4nh6B"
      },
      "signatures": [
        "2nBhEBYYvfaAe16UMNqRHre4YNSskvuYgx3M6E4JP1oDYvZEJHvoPzyUidNgNX5r9sTyN1J9UxtbCXy2rqYcuyuv"
      ]
    },
    "meta": {
      "err": null,
      "fee": 5000,
      "innerInstructions": [
        {}
      ]
    }
  }
}
*/