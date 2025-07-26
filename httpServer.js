import http from 'http';

let tokenLog = [];

/**
 * Aggiungi un token letto al log per poi visualizzarlo via HTTP
 * @param {object} tokenData - oggetto con dati del token filtrato
 */

export function logToken(tokenData) {
  // timestamp per ordinamento o log
  tokenLog.unshift({
    timestamp: Date.now(),
    ...tokenData
  });
  // mantieni max 20 entry recenti
  if (tokenLog.length > 20) tokenLog.pop();
}

export function startHttpServer(port = process.env.PORT || 4000) {
  const server = http.createServer((req, res) => {
    if (req.url === '/tokens') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(tokenLog, null, 2));
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!doctype html>
        <html><head><title>Sniper Bot Tokens</title></head>
        <body>
          <h1>Token Sniped / Monitorati</h1>
          <pre id="data">Loading...</pre>
          <script>
            async function load(){
              const resp = await fetch('/tokens');
              const data = await resp.json();
              document.getElementById('data').textContent = JSON.stringify(data, null, 2);
            }
            setInterval(load, 3000);
            load();
          </script>
        </body></html>
      `);
    }
  });

  server.listen(port, () => {
    console.log(`🌐 HTTP Server attivo sulla porta ${port}`);
    console.log('🔍 Vai su http://localhost:' + port);
  });
}
