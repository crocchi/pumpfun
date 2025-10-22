import http from 'http';
import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';
import { checkPrice } from './moralis.js';
import { botOptions } from './config.js';
import { instancesToken, instances } from './index.js';
import { initSocket } from './socketio.js';

let tokenLog = [];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function logToken(tokenData) {
  tokenLog.unshift({ timestamp: Date.now(), ...tokenData });
  if (tokenLog.length > 50) tokenLog.pop();
}

function serveStatic(req, res) {
  const parsed = url.parse(req.url);
  const filePath = path.join(__dirname, 'public', decodeURIComponent(parsed.pathname.replace(/^\/public\//, '')));
  if (!filePath.startsWith(path.join(__dirname, 'public'))) {
    res.writeHead(403); return res.end('Forbidden');
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const ct = ext === '.css' ? 'text/css' : ext === '.js' ? 'application/javascript' : ext === '.jpg' ? 'image/jpeg' : 'image/png';
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
        if (!body.liquidityMin) return
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

        if ('minVolumeMonitor' in body) botOptions.minVolumeMonitor = Number(body.minVolumeMonitor) || botOptions.minVolumeMonitor;

        if ('buyAmount' in body) botOptions.buyAmount = Math.max(0, Number(body.buyAmount)) || botOptions.buyAmount;
        if ('sellOffPanic' in body) botOptions.sellOffPanic = Number(body.sellOffPanic) || botOptions.sellOffPanic;
        if ('maxTrxNumMonitor' in body) botOptions.maxTrxNumMonitor = Number(body.maxTrxNumMonitor) || botOptions.maxTrxNumMonitor;
        if ('minTrxNumMonitor' in body) botOptions.minTrxNumMonitor = Number(body.minTrxNumMonitor) || botOptions.minTrxNumMonitor;
        if ('netVolumeUpBuy' in body) botOptions.netVolumeUpBuy = body.netVolumeUpBuy === 'true' || body.netVolumeUpBuy === true || false;
        if ('volumeMax' in body) botOptions.volumeMax = Number(body.volumeMax) || botOptions.volumeMax;


        if ('quickBuyTrxNumb' in body) botOptions.quickBuyTrxNumb = Number(body.quickBuyTrxNumb) || botOptions.quickBuyTrxNumb;
        if ('quickBuyVolumeUp' in body) botOptions.quickBuyVolumeUp = Number(body.quickBuyVolumeUp) || botOptions.quickBuyVolumeUp;

        if ('marketCapSolUpQuickBuy' in body) botOptions.marketCapSolUpQuickBuy = Number(body.marketCapSolUpQuickBuy) || botOptions.marketCapSolUpQuickBuy;
        if ('marketCapSolUpMode' in body) botOptions.marketCapSolUpMode = body.marketCapSolUpMode === 'true' || body.marketCapSolUpMode === true || false;

        if ('quickBuyVolumeMin' in body) botOptions.quickBuyVolumeMin = Number(body.quickBuyVolumeMin) || botOptions.quickBuyVolumeMin;

        if ('priceSolUpMode' in body) botOptions.priceSolUpMode = body.priceSolUpMode === 'true' || body.priceSolUpMode === true || false;
        if ('priceSolUpQuickBuy' in body) botOptions.priceSolUpQuickBuy = Number(body.priceSolUpQuickBuy) || botOptions.priceSolUpQuickBuy;
        if ('priceSolUpModeQuickBuyVolumeMin' in body) botOptions.priceSolUpModeQuickBuyVolumeMin = Number(body.priceSolUpModeQuickBuyVolumeMin) || botOptions.priceSolUpModeQuickBuyVolumeMin;
        if ('priceSolUpModeQuickBuyVolumeNetMin' in body) botOptions.priceSolUpModeQuickBuyVolumeNetMin = Number(body.priceSolUpModeQuickBuyVolumeNetMin) || botOptions.priceSolUpModeQuickBuyVolumeNetMin;

        if ('hasWeb_filter' in body) botOptions.hasWeb_filter = body.hasWeb_filter === 'true' || body.hasWeb_filter === true || false;
        if ('hasWebCheck_filter' in body) botOptions.hasWebCheck_filter = body.hasWebCheck_filter === 'true' || body.hasWebCheck_filter === true || false;
        if ('hasDescription_filter' in body) botOptions.hasDescription_filter = body.hasDescription_filter === 'true' || body.hasDescription_filter === true || false;
        if ('hasTwitterOrTelegram_filter' in body) botOptions.hasTwitterOrTelegram_filter = body.hasTwitterOrTelegram_filter === 'true' || body.hasTwitterOrTelegram_filter === true || false;
        if ('hasTwitterCheck_filter' in body) botOptions.hasTwitterCheck_filter = body.hasTwitterCheck_filter === 'true' || body.hasTwitterCheck_filter === true || false;

        if ('enableTrailing' in body) botOptions.enableTrailing = body.enableTrailing === 'true' || body.enableTrailing === true;
        if ('adaptiveTrailingLcrRate' in body) botOptions.adaptiveTrailingLcrRate = body.adaptiveTrailingLcrRate === 'true' || body.adaptiveTrailingLcrRate === true;
        if ('trailingPercent' in body) botOptions.trailingPercent = Number(body.trailingPercent) || botOptions.trailingPercent;
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

    if (parsed.pathname === '/UI' && req.method === 'GET') {
      /*
      const templatePath = path.join(__dirname, 'views', 'status.ejs');
      const html = await ejs.renderFile(templatePath, { tokens: tokenLog });
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);*/

      const tpl = fs.readFileSync(path.join(__dirname, 'views', 'main.ejs'), 'utf8');
      const html = ejs.render(tpl, { tokensMonitor: instances, tokens: tokenLog, tokenLogger: instancesToken, botOptions });
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end(html);
    }

    if (parsed.pathname === '/status' && req.method === 'GET') {
      /*
      const templatePath = path.join(__dirname, 'views', 'status.ejs');
      const html = await ejs.renderFile(templatePath, { tokens: tokenLog });
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);*/

      const tpl = fs.readFileSync(path.join(__dirname, 'views', 'status.ejs'), 'utf8');
      const html = ejs.render(tpl, { tokens: tokenLog, botOptions });
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end(html);
    }

    else if (parsed.pathname === '/transactions') {
      const mint = parsed.query.mint;
      const token = tokenLog.find(t => t.mint === mint);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(token ? token.transactions : []));
    }
    else if (parsed.pathname === '/twitter' && req.method === 'GET') {
      const filePath = path.join(__dirname, 'account-nofound-screenshot.png');
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = ext === '.png' ? 'image/png' : 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        return res.end(fs.readFileSync(filePath));
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('File not found');
      }

    }

    else if (parsed.pathname === '/showinfo') {
      const mint = parsed.query.mint;
      let token;
      if (instancesToken.has(mint)) {
        token = instancesToken.get(mint);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(token ? token : []));
    }

    else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h2>Server attivo</h2> <p>Vai su <a href="/status">/status</a></p> <p>o <a href="/UI">/UI</a></p> ');
    }
  });

  initSocket(server);// inizializza socket.io con il server creato


  server.listen(port, () => {
    console.log(`🌐 Server attivo su http://localhost:${port}`);
  });
}



export async function returnTokenLog(mint) {
  const token = tokenLog.find(t => t.mint === mint);
  if (token) { return token }
}

export async function updateBuyPrice(mint, updates) {
  const token = tokenLog.find(t => t.mint === mint);
  if (token) {
    token.buyPrice = updates.buyPrice;
    Object.assign(token, updates);
  }
}

export async function buyTokenLog(mint, tokenAmount, solAmount, price) {
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

export async function updateToken(mint, updates, type) {
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
        time: new Date().toLocaleTimeString("it-IT", {
          timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit",
          second: "2-digit"
        }),
        mCap: updates.marketCapSol
      });
    }

    Object.assign(token, updates);
  }
  return token
}


