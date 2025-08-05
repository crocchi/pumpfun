//import { Connection } from '@solana/web3.js';
import { RPC_URL_HELIUS, RPC_WS_HELIUS } from '../config.js';

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

const WebSocket = require('ws');

const ws = new WebSocket(RPC_WS_HELIUS);

ws.on('open', () => {
  console.log('Connected to Helius');
  
  // Subscribe to account changes
  /*
  ws.send(JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "accountSubscribe",
    params: [
      "9PejEmViKHgUkVFWN57cNEZnFS4Qo6SzsLj5UPAXfDTF", // Replace with your account
      { encoding: "jsonParsed", commitment: "confirmed" }
    ]
  }));
*/

 // Ascolta tutte le istruzioni del programma pump.fun (cambia se vuoi Orca ecc.)
 ws.send(JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "logsSubscribe",
  params: [
    {
      mentions: ["Fgde3bKtZ8NzjSNLmmSNkSp9mQTXhfj91Wg1ksfK9xrB"] // Program ID di pump.fun
    },
    {
      commitment: "confirmed"
    }
  ]
}));

});

ws.on('message', (data) => {
  const message = JSON.parse(data);

  if (message.method === 'accountNotification') {
    console.log('Account updated:', message.params.result.value);
  }

  if (message.method === "logsNotification") {
    const logs = message.params.result.value.logs;

    const signature = message.params.result.value.signature;
    console.log(`🧠 TX: ${signature}`);
    
    if (logs.some(log => log.includes("create") || log.includes("transfer") || log.includes("sell") || log.includes("buy"))) {
      console.log("📥 Log sospetto di mint/buy/sell:");
      logs.forEach(log => console.log("  ", log));
    }
  }
});