
/**
 * jupiterTriangularAtomic.js
 *
 * - costruisce route A->B->C->A usando Jupiter /quote + /swap-instructions
 * - unisce le istruzioni in un'unica VersionedTransaction atomica
 * - cache locale per quote/instructions e throttling 1 req/sec
 *
 * IMPORTANT:
 *  - Testa su devnet prima di mainnet.
 *  - Proteggi la PRIVATE_KEY (use secret manager).
 */

import fetch from "node-fetch";
import {
  Keypair,
  Connection,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  PublicKey,
} from "@solana/web3.js";

// ---------------- CONFIG ----------------
const RPC_URL = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
const PRIVATE_KEY = process.env.PRIVATE_KEY || null; // JSON array of secretKey bytes
const USER_PUBLIC_KEY = process.env.USER_PUBLIC_KEY || null;
const AMOUNT_LAMPORTS = Number(process.env.AMOUNT_LAMPORTS || 0.1 * 1e9); // default 0.1 SOL
const MIN_PROFIT_PCT = Number(0.3); // 0.3%
const SLIPPAGE_BPS = Number(50);
const RATE_DELAY_MS = Number(1000); // 1 request/sec throttle
const CACHE_TTL_MS = Number(3000); // cache TTL for quote/instr

// Example token set (customize)
const TOKENS = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  BONK:"DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  TRUMP: "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
  PUMP: "pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn",
  WFLI:"WLFinEv6ypjkczcS83FZqFpgFZYwQXutRbxGe7oC16g"
};
const TOKENS_JUP={
    MET: "METvsvVRapdj9cFLzq4Tr43xK4tAjQfwX76z3n6mWQL",
    META: "METAwkXcqyXKy1AtsSgJ8JiUHwGCafnZL38n3vYmeta",
    AVICI:"BANKJmvhT8tiJRsBSS1n2HryMBPvT5Ze4HU95DUAmeta",
    POPCAT:"7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
    UMBRA:"PRVT6TB7uss3FrUd2D9xs2zqDBsa3GbMJMwCQsgmeta",
    USCR:"USCRdwZP5UkKhJzhWuD7XjTUviHBtZJbLG7XpbKng9S"
}

// Jupiter endpoints (v6)
const JUP_QUOTE = "https://quote-api.jup.ag/v6/quote";
const JUP_SWAP_INSTRUCTIONS = "https://quote-api.jup.ag/v6/swap-instructions";

// ---------------- Init & guards ----------------
if (!PRIVATE_KEY) {
  console.error("🔴 Set PRIVATE_KEY (JSON array) as env var before running.");
  process.exit(1);
}

const connection = new Connection(RPC_URL, "confirmed");
let payer;
try {
  const secret = JSON.parse(PRIVATE_KEY);
  payer = Keypair.fromSecretKey(Buffer.from(secret));
} catch (err) {
  console.error("🔴 Error parsing PRIVATE_KEY:", err.message);
  process.exit(1);
}
const USER_PUBKEY = USER_PUBLIC_KEY || payer.publicKey.toBase58();
console.log("Using payer:", payer.publicKey.toBase58());

// ---------------- Throttler (global) ----------------
let lastRequestTime = 0;
async function throttle() {
  const now = Date.now();
  const diff = now - lastRequestTime;
  if (diff < RATE_DELAY_MS) {
    await new Promise((r) => setTimeout(r, RATE_DELAY_MS - diff));
  }
  lastRequestTime = Date.now();
}

// ---------------- Simple cache (Map with TTL) ----------------
class TTLCache {
  constructor(ttlMs = 3000) {
    this.ttl = ttlMs;
    this.map = new Map();
  }
  set(key, value) {
    const entry = { value, expiresAt: Date.now() + this.ttl };
    this.map.set(key, entry);
  }
  get(key) {
    const e = this.map.get(key);
    if (!e) return null;
    if (Date.now() > e.expiresAt) {
      this.map.delete(key);
      return null;
    }
    return e.value;
  }
  has(key) {
    return this.get(key) !== null;
  }
}
const quoteCache = new TTLCache(CACHE_TTL_MS);
const instrCache = new TTLCache(CACHE_TTL_MS);

// ---------------- Helpers: Jupiter quote & swap-instructions ----------------
async function getQuoteCached(inputMint, outputMint, amountRaw, slippageBps = SLIPPAGE_BPS) {
  const key = `q|${inputMint}|${outputMint}|${Math.floor(amountRaw)}|${slippageBps}`;
  const cached = quoteCache.get(key);
  if (cached) return cached;

  await throttle();
  const url = `${JUP_QUOTE}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${Math.floor(amountRaw)}&slippageBps=${slippageBps}`;
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Jupiter quote error ${res.status} ${txt}`);
  }
  const json = await res.json();
  // Cache full response (array or object)
  quoteCache.set(key, json);
  return json;
}

/**
 * Request swap-instructions for a given quoteResponse (the entire quote JSON or its chosen route)
 * Returns an array of { programId, data (base64), accounts: [{pubkey, isSigner, isWritable}, ...] }
 */
async function getSwapInstructionsCached(quoteResponse, userPublicKey, wrapAndUnwrapSol = true) {
  // We build a cache key from quoteResponse.routePlan / routeHash / outAmount etc.
  // some quote responses are arrays: pick representative fields
  const routeId = JSON.stringify(quoteResponse).slice(0, 120); // pragmatic
  const key = `si|${routeId}|${userPublicKey}|${wrapAndUnwrapSol}`;
  const cached = instrCache.get(key);
  if (cached) return cached;

  await throttle();
  const body = {
    quoteResponse, // the exact quote item you got from /quote (or the full response as required)
    userPublicKey,
    wrapAndUnwrapSol,
    // optional: computeUnitPriceMicroLamports, useSharedAccounts, etc.
  };

  const res = await fetch(JUP_SWAP_INSTRUCTIONS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`swap-instructions error ${res.status} ${txt}`);
  }

  const json = await res.json();
  // Expect shape { instructions: [ { programId, data, accounts: [...] }, ... ], cleanupInstructions: [...] }
  // Cache and return
  instrCache.set(key, json);
  return json;
}

// ---------------- Utility: convert Jupiter "instruction" object to TransactionInstruction ----------------
function jupInstToTxInstr(jupInst) {
  // jupInst: { programId: string, data: string (base64), accounts: [{pubkey, isSigner, isWritable}] }
  const programId = new PublicKey(jupInst.programId);
  const keys = (jupInst.accounts || []).map((a) => ({
    pubkey: new PublicKey(a.pubkey),
    isSigner: !!a.isSigner,
    isWritable: !!a.isWritable,
  }));
  const data = Buffer.from(jupInst.data || "", "base64");
  return new TransactionInstruction({ programId, keys, data });
}

// ---------------- Core: build atomic tx for A->B->C->A ----------------
/**
 * returns { txid, profitPct } on success or null
 */
async function tryAtomicTriangle(A, B, C, amountLamports = AMOUNT_LAMPORTS) {
  try {
    // 1) Quote A->B
    const qABall = await getQuoteCached(A, B, amountLamports);
    // choose first route result: quote API might return object or array
    const qAB = Array.isArray(qABall) ? qABall[0] : qABall;
    const abOut = Number(qAB?.outAmount || 0);
    if (!abOut) return null;

    // 2) Quote B->C using abOut
    const qBCall = await getQuoteCached(B, C, Math.floor(abOut));
    const qBC = Array.isArray(qBCall) ? qBCall[0] : qBCall;
    const bcOut = Number(qBC?.outAmount || 0);
    if (!bcOut) return null;

    // 3) Quote C->A using bcOut
    const qCAll = await getQuoteCached(C, A, Math.floor(bcOut));
    const qCA = Array.isArray(qCAll) ? qCAll[0] : qCAll;
    const caOut = Number(qCA?.outAmount || 0);
    if (!caOut) return null;

    const profitRatio = caOut / amountLamports;
    const profitPct = (profitRatio - 1) * 100;
    if (profitPct < MIN_PROFIT_PCT) {
      // no interesting opportunity
      return { profitPct, executed: false };
    }

    console.log(`Candidate triangle profit ${profitPct.toFixed(4)}% — building atomic tx...`);

    // Get swap-instructions for each hop (we ask Jupiter to return instructions instead of full tx)
    const siAB = await getSwapInstructionsCached(qAB, USER_PUBKEY, true);
    const siBC = await getSwapInstructionsCached(qBC, USER_PUBKEY, true);
    const siCA = await getSwapInstructionsCached(qCA, USER_PUBKEY, true);

    // Each response expected to contain "instructions" array and possibly "cleanupInstructions"
    const instrs = [];
    [siAB, siBC, siCA].forEach((siResp) => {
      if (!siResp || !siResp.instructions) return;
      for (const inst of siResp.instructions) {
        instrs.push(jupInstToTxInstr(inst));
      }
      // optionally include cleanup instructions (creation of ata...). Usually no need if using same user accounts
      if (siResp.cleanupInstructions) {
        for (const inst of siResp.cleanupInstructions) instrs.push(jupInstToTxInstr(inst));
      }
    });

    if (instrs.length === 0) {
      console.warn("No instructions returned by swap-instructions for these routes.");
      return { profitPct, executed: false };
    }

    // Build VersionedTransaction from instructions
    const { blockhash } = await connection.getLatestBlockhash("finalized");
    // TransactionMessage helps compile to v0 message
    const messageV0 = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: blockhash,
      instructions: instrs,
    }).compileToV0Message();

    const vtx = new VersionedTransaction(messageV0);
    // sign with payer
    vtx.sign([payer]);

    // send raw tx
    const serialized = vtx.serialize();
    const txid = await connection.sendRawTransaction(serialized, { skipPreflight: false });
    console.log("Sent atomic tx:", txid);
    await connection.confirmTransaction(txid, "confirmed");
    console.log("Confirmed tx:", txid);

    return { txid, profitPct, executed: true };
  } catch (err) {
    console.error("tryAtomicTriangle error:", err.message || err);
    return { executed: false, error: err.message || String(err) };
  }
}

// ---------------- Runner: scan triples with cache+throttle ----------------
async function runScanner(useTokenKeys = Object.keys(TOKENS)) {
  const triples = [];
  const keys = useTokenKeys;
  for (let i = 0; i < keys.length; i++) {
    for (let j = 0; j < keys.length; j++) {
      for (let k = 0; k < keys.length; k++) {
        if (new Set([i, j, k]).size < 3) continue;
        triples.push([keys[i], keys[j], keys[k]]);
      }
    }
  }

  console.log(`Scanning ${triples.length} triples...`);
  for (const [a, b, c] of triples) {
    console.log(`Checking ${a} → ${b} → ${c} → ${a}`);
    const A = TOKENS[a], B = TOKENS[b], C = TOKENS[c];
    const res = await tryAtomicTriangle(A, B, C, AMOUNT_LAMPORTS);
    if (res && res.executed) {
      console.log("✅ Executed atomic triangular swap:", res);
      // Optionally break or continue depending on strategy
      // break;
    } else if (res && res.profitPct !== undefined) {
      console.log(`  -> Profit % ${res.profitPct.toFixed(4)} (below threshold or not executed)`);
    } else {
      // error or no route
      // console.log("  -> no route or error");
    }
  }
  console.log("Scan finished.");
}

// ---------------- Start ----------------
(async () => {
  try {
    await runScanner(Object.keys(TOKENS));
  } catch (err) {
    console.error("Fatal:", err);
  }
})();











/*
import fetch from "node-fetch";

// Token di esempio
const TOKENS = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERZ6M6Xb4Rcs2M3e6L5x5n3v3FqzYfAkBj",
  BONK: "DezXzjvE55Sda3EaG8hJZz37Q5XrQpJrRgnT1rcwxrMi",
  WIF:  "Wif6Pr9PHTbqZmSW7tqPbQ2zdmznz3kY2oJz2ZPWwAD"
};

const AMOUNT = 0.1 * 1e9;
const MIN_PROFIT = 0.003; // 0.3%

// ⏳ --- Throttler: garantisce 1 richiesta al secondo ---
let lastRequest = 0;
async function throttle() {
  const now = Date.now();
  const diff = now - lastRequest;
  if (diff < 1200) {
    await new Promise(r => setTimeout(r, 1000 - diff));
  }
  lastRequest = Date.now();
}

// 🧠 --- Wrapper API Jupiter ---
async function getQuote(inputMint, outputMint, amount) {
  await throttle(); // <-- limita la velocità
  const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${Math.floor(amount)}&slippageBps=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Jupiter API error (${res.status})`);
  const data = await res.json();
  return data?.outAmount || 0;
}

// 🧮 --- Triangolo singolo ---
async function checkTriangle(A, B, C) {
  try {
    const ab = await getQuote(A, B, AMOUNT);
    if (ab === 0) return null;

    const bc = await getQuote(B, C, ab);
    if (bc === 0) return null;

    const ca = await getQuote(C, A, bc);
    if (ca === 0) return null;

    const profitRatio = ca / AMOUNT;
    const profitPct = (profitRatio - 1) * 100;
    return { A, B, C, profitPct };
  } catch (e) {
    console.error("Errore nel triangolo:", e.message);
    return null;
  }
}

// 🚀 --- Loop principale ---
async function run() {
  console.log("🔁 Triangular Arbitrage Scanner (via Jupiter v6 - throttled)\n");
  const tokenKeys = Object.keys(TOKENS);
  const results = [];

  for (let i = 0; i < tokenKeys.length; i++) {
    for (let j = 0; j < tokenKeys.length; j++) {
      for (let k = 0; k < tokenKeys.length; k++) {
        if (new Set([i, j, k]).size < 3) continue;

        const A = TOKENS[tokenKeys[i]];
        const B = TOKENS[tokenKeys[j]];
        const C = TOKENS[tokenKeys[k]];

        const result = await checkTriangle(A, B, C);
        if (result && result.profitPct > MIN_PROFIT * 100) {
          results.push({
            route: `${tokenKeys[i]} → ${tokenKeys[j]} → ${tokenKeys[k]} → ${tokenKeys[i]}`,
            profit: result.profitPct.toFixed(2) + "%"
          });
          console.log("✅ Profitto trovato:", results.at(-1));
        }
      }
    }
  }

  console.log("\n📊 Risultati finali:");
  if (results.length === 0) {
    console.log("⚠️ Nessuna opportunità di profitto trovata.");
  } else {
    console.table(results);
  }
}

run();

*/

/*// === Jupiter Triangular Arbitrage Scanner (Browser Edition) ===
// ⚡ Versione ottimizzata: 1 richiesta/sec max, 3 triple in parallelo

const TOKENS = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  ZEC: "A7bdiYdS5GjqGFtxf17ppRHtDKPkkRqbKtR27dxvQXaS",
  PUMP: "pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn",
  WFLI:"WLFinEv6ypjkczcS83FZqFpgFZYwQXutRbxGe7oC16g"
};

const AMOUNT = 0.1 * 1e9;   // 0.1 SOL
const MIN_PROFIT = 0.003;   // 0.3%
const MAX_PARALLEL = 3;     // fino a 3 triple in parallelo
const RATE_DELAY = 1000;    // 1 richiesta/sec

// ⏳ rate limiter semplice
let lastRequest = 0;
async function throttle() {
  const diff = Date.now() - lastRequest;
  if (diff < RATE_DELAY) await new Promise(r => setTimeout(r, RATE_DELAY - diff));
  lastRequest = Date.now();
}

// 🧠 funzione per ottenere quote Jupiter
async function getQuote(inputMint, outputMint, amount) {
    console.log(inputMint, outputMint, amount)
  await throttle();
  const url = `https://lite-api.jup.ag/swap/v1/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${Math.floor(amount)}&slippageBps=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Errore Jupiter (${res.status})`);
  const data = await res.json();
  console.log("RETURN:", data);
  return data?.outAmount || 0;
}

// 💰 calcolo singolo triangolo
async function checkTriangle(A, B, C) {
  try {
    const ab = await getQuote(A, B, AMOUNT);
    if (!ab) return null;
    const bc = await getQuote(B, C, ab);
    if (!bc) return null;
    const ca = await getQuote(C, A, bc);
    if (!ca) return null;

    const profitPct = ((ca / AMOUNT) - 1) * 100;
    return { A, B, C, profitPct };
  } catch (err) {
    console.warn("Errore triangolo:", err.message);
    return null;
  }
}

// 🚀 funzione principale con batching asincrono
async function runTriangularScanner() {
  console.log("🔁 Triangular Arbitrage Scanner (Browser Version)");
  const keys = Object.keys(TOKENS);
  const results = [];

  const allTriples = [];
  for (let i = 0; i < keys.length; i++) {
    for (let j = 0; j < keys.length; j++) {
      for (let k = 0; k < keys.length; k++) {
        if (new Set([i, j, k]).size < 3) continue;
        allTriples.push([keys[i], keys[j], keys[k]]);
      }
    }
  }

  // Esegui a batch di 3 triple per volta
  for (let batch = 0; batch < allTriples.length; batch += MAX_PARALLEL) {
    const slice = allTriples.slice(batch, batch + MAX_PARALLEL);
    const promises = slice.map(async ([a, b, c]) => {
      const res = await checkTriangle(TOKENS[a], TOKENS[b], TOKENS[c]);
      if (res && res.profitPct > MIN_PROFIT * 100) {
        const route = `${a} → ${b} → ${c} → ${a}`;
        console.log(`✅ Profitto: ${route} | +${res.profitPct.toFixed(2)}%`);
        results.push({ route, profit: res.profitPct.toFixed(2) + "%" });
      }
    });
    await Promise.all(promises);
  }

  console.log("\n📊 Risultati finali:");
  if (results.length === 0) {
    console.log("⚠️ Nessuna opportunità trovata al momento.");
  } else {
    console.table(results);
  }
}

// Avvio
runTriangularScanner(); 












versione browser by ChatGPT github.com/copilot

// === Jupiter Triangular Arbitrage Scanner con Cache ===

// Token di esempio

const TOKENS = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  ZEC: "A7bdiYdS5GjqGFtxf17ppRHtDKPkkRqbKtR27dxvQXaS",
  PUMP: "pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn",
  WFLI:"WLFinEv6ypjkczcS83FZqFpgFZYwQXutRbxGe7oC16g"
};

const AMOUNT = 0.1 * 1e9; // 0.1 SOL
const MIN_PROFIT = 0.003; // 0.3%
const MAX_PARALLEL = 3; // fino a 3 triple in parallelo
const RATE_DELAY = 1000; // 1 richiesta/sec
const CACHE_TTL = 3000; // Cache TTL in millisecondi (3 secondi)

// ⏳ Rate limiter semplice
let lastRequest = 0;
async function throttle() {
  const diff = Date.now() - lastRequest;
  if (diff < RATE_DELAY) await new Promise((r) => setTimeout(r, RATE_DELAY - diff));
  lastRequest = Date.now();
}

// 🗂️ Cache con TTL
class TTLCache {
  constructor(ttlMs = CACHE_TTL) {
    this.ttl = ttlMs;
    this.map = new Map();
  }

  set(key, value) {
    const entry = { value, expiresAt: Date.now() + this.ttl };
    this.map.set(key, entry);
  }

  get(key) {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key); // Rimuovi l'elemento scaduto
      return null;
    }
    return entry.value;
  }

  has(key) {
    return this.get(key) !== null;
  }
}

const quoteCache = new TTLCache(CACHE_TTL); // Cache per le quote

// 🧠 Funzione per ottenere quote Jupiter con cache
async function getQuote(inputMint, outputMint, amount) {
  const cacheKey = `${inputMint}-${outputMint}-${amount}`;
  if (quoteCache.has(cacheKey)) {
    console.log(`♻️ Cache hit per ${cacheKey}`);
    return quoteCache.get(cacheKey);
  }

  console.log(`🌐 Richiesta API per ${cacheKey}`);
  await throttle();
  const url = `https://lite-api.jup.ag/swap/v1/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${Math.floor(amount)}&slippageBps=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Errore Jupiter (${res.status})`);
  const data = await res.json();
  const outAmount = data?.data?.[0]?.outAmount || 0;

  // Memorizza il risultato nella cache
  quoteCache.set(cacheKey, outAmount);
  return outAmount;
}

// 💰 Calcolo singolo triangolo
async function checkTriangle(A, B, C) {
  try {
    const ab = await getQuote(A, B, AMOUNT);
    if (!ab) return null;

    const bc = await getQuote(B, C, ab);
    if (!bc) return null;

    const ca = await getQuote(C, A, bc);
    if (!ca) return null;

    const profitPct = ((ca / AMOUNT) - 1) * 100;
    return { A, B, C, profitPct };
  } catch (err) {
    console.warn("Errore triangolo:", err.message);
    return null;
  }
}

// 🚀 Funzione principale con batching asincrono
async function runTriangularScanner() {
  console.log("🔁 Triangular Arbitrage Scanner con Cache");
  const keys = Object.keys(TOKENS);
  const results = [];

  const allTriples = [];
  for (let i = 0; i < keys.length; i++) {
    for (let j = 0; j < keys.length; j++) {
      for (let k = 0; k < keys.length; k++) {
        if (new Set([i, j, k]).size < 3) continue; // Evita loop con token ripetuti
        allTriples.push([keys[i], keys[j], keys[k]]);
      }
    }
  }

  // Esegui a batch di 3 triple per volta
  for (let batch = 0; batch < allTriples.length; batch += MAX_PARALLEL) {
    const slice = allTriples.slice(batch, batch + MAX_PARALLEL);
    const promises = slice.map(async ([a, b, c]) => {
      const res = await checkTriangle(TOKENS[a], TOKENS[b], TOKENS[c]);
      if (res && res.profitPct > MIN_PROFIT * 100) {
        const route = `${a} → ${b} → ${c} → ${a}`;
        console.log(`✅ Profitto: ${route} | +${res.profitPct.toFixed(2)}%`);
        results.push({ route, profit: res.profitPct.toFixed(2) + "%" });
      }
    });
    await Promise.all(promises);
  }

  console.log("\n📊 Risultati finali:");
  if (results.length === 0) {
    console.log("⚠️ Nessuna opportunità trovata al momento.");
  } else {
    console.table(results);
  }
}

// Avvio
runTriangularScanner();
*/