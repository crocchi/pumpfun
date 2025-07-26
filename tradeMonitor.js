import WebSocket from 'ws';

export async function monitorEarlyTrades(token, snipeCallback) {
    
  const TIME_LIMIT = 10000; // 10 secondi
  let suspiciousSellDetected = false;

  const ws = new WebSocket('wss://pumpportal.fun/api/data');

  ws.on('open', () => {
    const payload = {
      method: 'subscribeTokenTrade',
      keys: [token.mint],
    };
    ws.send(JSON.stringify(payload));
    console.log(`👁️  Monitoraggio trade per ${token.symbol} (${token.mint}) attivo per ${TIME_LIMIT / 1000}s`);
  });

  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.method === 'tokenTrade') {
        const trade = parsed.data;
        if (trade.mint === token.mint && trade.txType === 'sell') {
          console.log(`⚠️  Vendita precoce da ${trade.traderPublicKey} – possibile dev bot.`);
          suspiciousSellDetected = true;
        }
      }
    } catch (err) {
      console.error("❌ Errore parsing trade:", err.message);
    }
  });

  ws.on('error', (err) => {
    console.error("WebSocket error:", err.message);
  });

  return new Promise((resolve) => {
    setTimeout(async () => {
      ws.close();

      if (suspiciousSellDetected) {
        console.log("⛔ Vendita rilevata troppo presto. Token scartato.");
        resolve(false);
      } else {
        console.log("✅ Nessuna vendita sospetta. Procedo con snipe...");
        await snipeCallback(token);
        resolve(true);
      }
    }, TIME_LIMIT);
  });
}
