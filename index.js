import WebSocket from 'ws';
import http from 'http';
const PORT = process.env.PORT || 4000;

// rimani in ascolto su un server HTTP per rispondere a richieste
const server = http.createServer((req, res) => {
    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('🚀 Pump.fun sniper bot is running');
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  });
  
  server.listen(PORT, () => {
    console.log(`🌐 HTTP server attivo su http://localhost:${PORT}`);
  });


const ws = new WebSocket('wss://pumpportal.fun/api/data');

ws.on('open', function open() {
    console.log('📡 Connesso al WebSocket di Pump.fun');
  // Subscribing to token creation events
  let payload = {
      method: "subscribeNewToken", 
    }
  ws.send(JSON.stringify(payload));
/*
  // Subscribing to migration events
  let payload = {
      method: "subscribeMigration", 
    }
  ws.send(JSON.stringify(payload));

  // Subscribing to trades made by accounts
  payload = {
      method: "subscribeAccountTrade",
      keys: ["AArPXm8JatJiuyEffuC1un2Sc835SULa4uQqDcaGpAjV"] // array of accounts to watch
    }
  ws.send(JSON.stringify(payload));

    //"@solana/spl-token": "^0.3.8",
    //"@solana/web3.js": "^1.91.0",
    //"axios": "^1.6.8",
    //"bs58": "^5.0.1",


  // Subscribing to trades on tokens
  payload = {
      method: "subscribeTokenTrade",
      keys: ["91WNez8D22NwBssQbkzjy4s2ipFrzpmn5hfvWVe2aY5p"] // array of token CAs to watch
    }
  ws.send(JSON.stringify(payload));

  */
});

ws.on('message', function message(data) {
  console.log(JSON.parse(data));
  try {
    const parsed = JSON.parse(data);

    if (parsed.method === 'newToken') {
      const token = parsed.data;

      console.log('🚀 Nuovo token creato!');
      console.log(`🔹 Nome: ${token.tokenName}`);
      console.log(`🔹 Address: ${token.mint}`);
      console.log(`🔹 Creatore: ${token.creator}`);
      console.log(`🔹 Ora: ${new Date(token.timestamp * 1000).toLocaleString()}`);

      // 👉 Qui puoi chiamare la tua funzione `snipeToken(token.mint)`
    }

    // Aggiungi altri tipi di eventi se vuoi
  } catch (e) {
    console.error('❌ Errore nel parsing:', e);
  }

});