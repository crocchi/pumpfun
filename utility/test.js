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


    const isCreate = logs.some(log => log.toLowerCase().includes('Pump: Create'));

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
