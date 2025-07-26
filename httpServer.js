import http from 'http';

let tokenLog = [];

export function logToken(tokenData) {
  tokenLog.unshift({ timestamp: Date.now(), ...tokenData });
  if (tokenLog.length > 20) tokenLog.pop();
}

export function startHttpServer(port = process.env.PORT || 4000) {
  const server = http.createServer((req, res) => {
    if (req.url === '/tokens') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(tokenLog, null, 2));

    } else if (req.url === '/status') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!doctype html>
        <html><head>
          <title>Token Status</title>
          <style>
            body { font-family: sans-serif; background: #111; color: #ddd; padding: 2rem; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 0.5rem; border: 1px solid #444; text-align: left; }
            th { background: #222; }
            tr:nth-child(even) { background: #1a1a1a; }
            .good { color: lime; }
            .bad { color: red; }
          </style>
        </head>
        <body>
          <h1>Status Token Monitorati</h1>
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Nome</th>
                <th>Prezzo</th>
                <th>MarketCap</th>
                <th>Sicuro</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody id="body"></tbody>
          </table>

          <script>
            async function load() {
              const r = await fetch('/tokens');
              const tokens = await r.json();
              const tbody = document.getElementById('body');
              tbody.innerHTML = '';

              for (const t of tokens) {
                const row = document.createElement('tr');
                const price = (t.solInPool / t.tokensInPool).toFixed(10);
                const time = new Date(t.timestamp).toLocaleTimeString();
                const safe = t.safe ? 'YES' : 'NO';
                const colorClass = t.safe ? 'good' : 'bad';

                row.innerHTML = \`
                  <td>\${t.symbol}</td>
                  <td>\${t.name}</td>
                  <td>\${price}</td>
                  <td>\${t.marketCapSol?.toFixed(2)}</td>
                  <td class="\${colorClass}">\${safe}</td>
                  <td>\${time}</td>
                \`;

                tbody.appendChild(row);
              }
            }

            setInterval(load, 5000);
            load();
          </script>
        </body>
        </html>
      `);
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<h2>Server attivo</h2><p>Usa <a href="/tokens">/tokens</a> o <a href="/status">/status</a></p>`);
    }
  });

  server.listen(port, () => {
    console.log(`🌐 HTTP Server attivo su http://localhost:${port}`);
  });
}
