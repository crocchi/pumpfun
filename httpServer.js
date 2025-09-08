import http from 'http';
import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';
import { checkPrice } from './moralis.js';
import { botOptions } from './config.js';
import { instancesToken } from './index.js';

let tokenLog = [];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function logToken(tokenData) {
  tokenLog.unshift({ timestamp: Date.now(), ...tokenData });
  if (tokenLog.length > 40) tokenLog.pop();
}

function serveStatic(req, res) {
    const parsed = url.parse(req.url);
    const filePath = path.join(__dirname, 'public', decodeURIComponent(parsed.pathname.replace(/^\/public\//, '')));
    if (!filePath.startsWith(path.join(__dirname, 'public'))) {
      res.writeHead(403); return res.end('Forbidden');
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const ct = ext === '.css' ? 'text/css' : ext === '.js' ? 'application/javascript' : 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': ct });
      return res.end(fs.readFileSync(filePath));
    }
    res.writeHead(404); res.end('Not found');
  }


async function parseBody(req) {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => (data += chunk));
      req.on('end', () => {
        try {
          const ct = req.headers['content-type'] || '';
          if (ct.includes('application/json')) resolve(JSON.parse(data || '{}'));
          else if (ct.includes('application/x-www-form-urlencoded')) {
            resolve(Object.fromEntries(new URLSearchParams(data)));
          } else resolve({ raw: data });
        } catch (e) { reject(e); }
      });
    });
  }

export function startHttpServer(port = 4000) {
    const server = http.createServer(async (req, res) => {
      const parsed = url.parse(req.url, true);
  
    // static
    if (req.url.startsWith('/public/')) return serveStatic(req, res);

    if (parsed.pathname === '/tokens' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(tokenLog, null, 2));
      }
  
      if (parsed.pathname === '/bot-options' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(botOptions, null, 2));
      }

      if (parsed.pathname === '/bot-options' && req.method === 'POST') {
        try {
          const body = await parseBody(req);
          // coerce & salva
          if(!body.liquidityMin) return
          console.log("Aggiornamento botOptions:", body);
          
          if ('liquidityMin' in body) botOptions.liquidityMin = Math.max(0, Number(body.liquidityMin)) || botOptions.liquidityMin;
          if ('liquidityMax' in body) botOptions.liquidityMax = Number(body.liquidityMax) || botOptions.liquidityMax;
          if ('devShare' in body) botOptions.devShare = Math.min(0.5, Math.max(0, Number(body.devShare))) || botOptions.devShare;
          if ('marketcapMin' in body) botOptions.marketcapMin = Math.max(0, Number(body.marketcapMin)) || botOptions.marketcapMin;
          if ('marketcapMax' in body) botOptions.marketcapMax = Math.max(0, Number(body.marketcapMax)) || botOptions.marketcapMax;
          if ('rugpullxyz' in body) botOptions.rugpullxyz = body.rugpullxyz === 'true' || body.rugpullxyz === true || false;
          if ('quickSellMultiplier' in body) botOptions.quickSellMultiplier = Number(body.quickSellMultiplier) || botOptions.quickSellMultiplier;
          if ('quickSellMinTrades' in body) botOptions.quickSellMinTrades = Number(body.quickSellMinTrades) || botOptions.quickSellMinTrades;
          if ('rugpullMaxTrades' in body) botOptions.rugpullMaxTrades = Number(body.rugpullMaxTrades) || botOptions.rugpullMaxTrades;
          if ('rugpullMinGainMultiplier' in body) botOptions.rugpullMinGainMultiplier = Number(body.rugpullMinGainMultiplier) || botOptions.rugpullMinGainMultiplier;
          if ('time_monitor' in body) botOptions.time_monitor = Number(body.time_monitor) || botOptions.time_monitor;
          if ('volumeMinMonitor' in body) botOptions.volumeMin = Number(body.volumeMinMonitor) || botOptions.volumeMin;
          if ('buyAmount' in body) botOptions.buyAmount = Math.max(0, Number(body.buyAmount)) || botOptions.buyAmount;
          if(' sellOffPanic' in body) botOptions.sellOffPanic = Number(body.sellOffPanic) || botOptions.sellOffPanic;
          if ('maxTrxNumMonitor' in body) botOptions.maxTrxNumMonitor = Number(body.maxTrxNumMonitor) || botOptions.maxTrxNumMonitor;
          if ('minTrxNumMonitor' in body) botOptions.minTrxNumMonitor = Number(body.minTrxNumMonitor) || botOptions.minTrxNumMonitor;
          if ('netVolumeUpBuy' in body) botOptions.netVolumeUpBuy = body.netVolumeUpBuy === 'true' || body.netVolumeUpBuy === true || false;

          if ('hasWeb_filter' in body) botOptions.hasWeb_filter = body.hasWeb_filter === 'true' || body.hasWeb_filter === true || false;
          if ('hasWebCheck_filter' in body) botOptions.hasWebCheck_filter = body.hasWebCheck_filter === 'true' || body.hasWebCheck_filter === true || false;
          if ('hasDescription_filter' in body) botOptions.hasDescription_filter = body.hasDescription_filter === 'true' || body.hasDescription_filter === true || false;
          if ('hasTwitterOrTelegram_filter' in body) botOptions.hasTwitterOrTelegram_filter = body.hasTwitterOrTelegram_filter === 'true' || body.hasTwitterOrTelegram_filter === true || false;
          if ('hasTwitterCheck_filter' in body) botOptions.hasTwitterCheck_filter = body.hasTwitterCheck_filter === 'true' || body.hasTwitterCheck_filter === true || false;
        
          if ('enableTrailing' in body) botOptions.enableTrailing = body.enableTrailing === 'true' || body.enableTrailing === true;
          if ('trailingPercent' in body) botOptions.trailingPercent = Math.min(0.9, Math.max(0.01, Number(body.trailingPercent))) || botOptions.trailingPercent;
          if ('clientRefreshMs' in body) botOptions.clientRefreshMs = Math.max(1000, Number(body.clientRefreshMs)) || botOptions.clientRefreshMs;
          if ('demoVersion' in body) botOptions.demoVersion = body.demoVersion;

          console.log(" botOptions config live:", botOptions);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: true, botOptions }, null, 2));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error: e.message }));
        }
      }
  
if (parsed.pathname === '/status' && req.method === 'GET') {
    /*
    const templatePath = path.join(__dirname, 'views', 'status.ejs');
    const html = await ejs.renderFile(templatePath, { tokens: tokenLog });
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);*/

      const tpl = fs.readFileSync(path.join(__dirname, 'views', 'status.ejs'), 'utf8');
      const html = ejs.render(tpl, { tokens: tokenLog , botOptions });
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end(html);
    }
  
      else if (parsed.pathname === '/transactions') {
        const mint = parsed.query.mint;
        const token = tokenLog.find(t => t.mint === mint);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(token ? token.transactions : []));
      }

      else if (parsed.pathname === '/showinfo') {
        const mint = parsed.query.mint;
        let token;
      if (instancesToken.has(mint)) {
          token= instancesToken.get(mint);
      }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(token ? token : []));
      }
  
      else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h2>Server attivo</h2><p>Vai su <a href="/status">/status</a></p>');
      }
    });
  
    server.listen(port, () => {
      console.log(`🌐 Server attivo su http://localhost:${port}`);
    });
  }


/*    old client
export function startHttpServer(port = process.env.PORT || 4000) {
const server = http.createServer(async (req, res) => {
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
            button { padding: 0.5rem; margin: 0.5rem; background: #333; color: #ddd; border: none; cursor: pointer; }
            button:hover { background: #444; }
            </style>
        </head>
        <body>
            <h1>Status Token Monitorati</h1>
            <table>
            <thead>
                <tr>
                    <th>Symbol</th>
                    <th>Nome</th>
                    <th>Start Price</th>
                    <th>Prezzo</th>
                    <th>GAIN</th>
                    <th>MarketCap SOl</th>
                    <th>MarketCap Usd</th>
                    <th>Variazione %</th>
                    <th>Sicuro</th>
                    <th>Contract</th>
                    <th>trx</th>
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
  // Calcolo venerabili della percentuale di change se t.oldMarketCapUsd esiste
    let pct = 0;
    if (t.oldMarketCapUsd && t.marketCapUsd) {
      pct = getPercentageChange(t.oldMarketCapUsd, t.marketCapUsd);
    }

    const color = pct > 0 ? 'lime' : (pct < 0 ? 'red' : '#ddd');
    const sign = pct > 0 ? '+' : '';
    const pctText = pct ? \`\${sign}\${pct.toFixed(2)}%\` : \`0%\`;
    const price = t.price ? t.price : (t.solInPool / t.tokensInPool).toFixed(10);
    const time = new Date(t.timestamp).toLocaleTimeString();
    const safe = t.safe ? 'YES' : 'NO'; //t.safe.includes('✅');
    const colorClass = safe ? 'good' : 'bad';
    const gain = calcolaGuadagno(t.startPrice, price);
    const contractAddress = t.mint || 'N/A';
                    const row = document.createElement('tr');
                    

                    row.innerHTML = \`
                    <td>\${t.symbol}</td>
                    <td>\${t.name}</td>
                    <td>\${t.startPrice}</td>
                    <td>\${price}</td>
                    <td>\${gain.toFixed(2)}%</td>
                    <td>\${t.marketCapSol}</td>
                     
                    <td>$\${t.marketCapUsd}</td>
                    
                    <td style="color:\${color}">\${pctText}</td>
                    <td class="\${colorClass}">\${safe}</td>

                     <td>\${t.mint}</td>
                     <td>\${t.trxNum}</td>
                    <td>\${time}</td>
                    \`;

                    tbody.appendChild(row);
                }
            }

            async function checkPrice(symbol) {
                try {
                    const response = await fetch('/checkPrice?symbol=' + encodeURIComponent(symbol));
                    const data = await response.json();
                    //console.log(data.raw);
                    alert(\`Current price of \${symbol}: \${data.price}\`);
                } catch (error) {
                    console.error('Error checking price:', error);
                    alert('Failed to fetch price.');
                }
            }
            function getPercentageChange(oldValue, newValue) {
                if (!oldValue || oldValue === 0) return 0;
                 return ((newValue - oldValue) / oldValue) * 100;
            }
                 function calcolaGuadagno(prezzoIniziale, prezzoFinale) {
                     const percentuale = ((prezzoFinale - prezzoIniziale) / prezzoIniziale) * 100;
                return percentuale;
                    }



            setInterval(load, 2000);
            load();
            </script>
        </body>
        </html>
    `);
    } else if (req.url.startsWith('/checkPrice?symbol=')) {
        const urlParams = new URLSearchParams(req.url.split('?')[1]);
        const symbol = urlParams.get('symbol');

        if (symbol) {
            try {
                const priceData = checkPrice(symbol);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ symbol, price: priceData }, null, 2));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to fetch price' }, null, 2));
            }
        } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Symbol parameter is missing' }, null, 2));
        }
    } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<h2>Server attivo</h2><p>Usa <a href="/tokens">/tokens</a> o <a href="/status">/status</a></p>`);
    }
});

  server.listen(port, () => {
    console.log(`🌐 HTTP Server attivo su http://localhost:${port}`);
  });
}*/
export async function returnTokenLog(mint) {
    const token = tokenLog.find(t => t.mint === mint);
    if (token) {return token}
}

export async function buyTokenLog(mint,tokenAmount,solAmount, price) {
    const token = tokenLog.find(t => t.mint === mint);
    if (token) {

      token.buySign.push({
            tokenAmount: tokenAmount,
            solAmount: solAmount,
            price: price,
            time: new Date().toLocaleTimeString()
          });
    }
}

export async function updateToken(mint, updates,type) {
    const token = tokenLog.find(t => t.mint === mint);
    //console.log("Aggiornamento token:", mint, updates);
    if (token) {
     // Salva il vecchio marketCapUsd prima di aggiornare
  if (updates.marketCapUsd !== undefined) {
    token.oldMarketCapUsd = token.marketCapUsd ?? updates.marketCapUsd; // fallback se non esiste
  }

    // Puoi anche aggiungere qui altre logiche simili se vuoi tracciare anche il prezzo precedente
    if (updates.price !== undefined) {
        token.oldPrice = token.price ?? updates.price;
      }

         // incrementa il numero di transazioni 
    if (type === 'buy' || type === 'sell') {
        token.trxNum = (token.trxNum || 0) + 1;
        token.transactions.push({
            type,
            price: updates.price,
            time: new Date().toLocaleTimeString()
          });
      }

      Object.assign(token, updates);
    }
    return token
  }
  
  
