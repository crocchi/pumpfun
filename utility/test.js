//import { Connection } from '@solana/web3.js';

import { RPC_URL_HELIUS, RPC_WS_HELIUS } from '../config.js';
import WebSocket from 'ws';

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


const PUMP_FUN_PROGRAM_ID = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';//'Fgde3bKtZ8NzjSNLmmSNkSp9mQTXhfj91Wg1ksfK9xrB';
const LETSBONK_PROGRAM_ID = 'FfYek5vEz23cMkWsdJwG2oa6EphsvXSHrGpdALN4g6W1'

export const wshelius = new WebSocket(RPC_WS_HELIUS);

wshelius.on('open', () => {
  console.log('✅ Connesso a Helius WebSocket');

  // Sottoscrizione ai log del programma di Pump.fun
  wshelius.send(JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "logsSubscribe",
    params: [
      {
        mentions: [PUMP_FUN_PROGRAM_ID]
      },
      {
        commitment: "confirmed"
      }
    ]
  }));
});

wshelius.on('message', async (data) => {
  const message = JSON.parse(data);


  if (message.method === "logsNotification") {
    const logs = message.params.result.value.logs;
    const signature = message.params.result.value.signature;


    const isCreate = logs.some(log => log.includes('Instruction: Create') && log.includes('Instruction: MintTo'));

    if (isCreate) {
      console.log(`--------------------------`);
      console.log(`🆕 Nuovo token creato su Pump.fun`);
      console.log(`🔗 TX: https://solscan.io/tx/${signature}`);
    console.log('Messaggio ricevuto value:', message.params.result.value);
    console.log('Messaggio ricevuto context:', message.params.result.context);
    console.log(`--------------------------`);
      // (opzionale) Puoi ora chiamare l'RPC Helius per recuperare i dettagli della transazione
      // e determinare l'indirizzo del mint e del creatore.
    }
  }
});

wshelius.on('error', (err) => {
  console.error('❌ Errore WebSocket:', err.message);
});

wshelius.on('close', () => {
  console.log('🔌 Connessione WebSocket chiusa');
});


/*
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
*/