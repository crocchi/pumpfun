import { Connection } from '@solana/web3.js';
import { RPC_URL_HELIUS } from '../config.js';

// Initialize connection to Helius RPC
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


const WebSocket = require('ws');

const ws = new WebSocket('wss://mainnet.helius-rpc.com/?api-key=921c2fd6-8eaa-4725-afd1-5aba52bcc522');

ws.on('open', () => {
  console.log('Connected to Helius');
  
  // Subscribe to account changes
  ws.send(JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "accountSubscribe",
    params: [
      "9PejEmViKHgUkVFWN57cNEZnFS4Qo6SzsLj5UPAXfDTF", // Replace with your account
      { encoding: "jsonParsed", commitment: "confirmed" }
    ]
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  if (message.method === 'accountNotification') {
    console.log('Account updated:', message.params.result.value);
  }
});