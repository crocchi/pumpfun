// metadataFilter.js

/**
 * 
 * /*
  Controllo metadati per: {
  name: '3I/ATLAS',
  symbol: 'ATLAS',
  description: '',
  image: 'https://ipfs.io/ipfs/bafybeibhj43sg4kj7aupbp3llap5dbrv35ika6hmgdjcdwinwffab25dmy',
  showName: true,
  createdOn: 'https://pump.fun',
  twitter: 'https://x.com/nocontextscats/3I-ATLAS'
  website: 'https://en.wikipedia.org/wiki/3I/ATLAS'
   telegram: '',
}
    */
  

  // --- Funzione: estrai handle da URL Twitter/X ---
// --- Funzione: estrai handle da URL Twitter/X ---
function extractTwitterHandle(url) {
    try {
      const u = new URL(url);
  
      // Se è una community o altro che non è un profilo, errore
      if (u.pathname.startsWith("/i/")) {
        return { valid: false, reason: "No Twitter community" }
      }
  
      // Match normale: /username
      const match = u.pathname.match(/^\/([^/?]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }
  
  // --- Funzione: normalizza testo (minuscole, rimuove simboli/spazi) ---
  export function normalize(str) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  
  // --- Algoritmo: distanza di Levenshtein ---
  function levenshtein(a, b) {
    const m = [];
    for (let i = 0; i <= b.length; i++) {
      m[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      m[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        m[i][j] =
          b.charAt(i - 1) === a.charAt(j - 1)
            ? m[i - 1][j - 1]
            : Math.min(
                m[i - 1][j - 1] + 1, // sostituzione
                m[i][j - 1] + 1,     // inserimento
                m[i - 1][j] + 1      // rimozione
              );
      }
    }
    return m[b.length][a.length];
  }
  
  // --- Similarità normalizzata (0 = diverso, 1 = uguale) ---
  export function similarity(a, b) {
    if (!a.length && !b.length) return 1;
    const distance = levenshtein(a, b);
    return 1 - distance / Math.max(a.length, b.length);
  }
  
  // --- Funzione principale: controllo Twitter ---
  export function checkTwitterMatch(metadata) {
    if (!metadata.twitter) return { valid: false, reason: "⚠️ No Twitter link" };
    if(metadata.twitter.includes('/i/'))  return {  valid: false, reason: "⚠️ No Twitter communy link" };
    const handle = extractTwitterHandle(metadata.twitter);
    if (!handle) return { valid: false, reason: "⚠️ Invalid Twitter URL" };
  
    const normHandle = normalize(handle);
    const normName = normalize(metadata.name || "");
    const normSymbol = normalize(metadata.symbol || "");
  
    const scoreName = similarity(normHandle, normName);
    const scoreSymbol = similarity(normHandle, normSymbol);
  
    const maxScore = Math.max(scoreName, scoreSymbol);
  
    return {
      handle,
      scoreName: scoreName.toFixed(2),
      scoreSymbol: scoreSymbol.toFixed(2),
      valid: maxScore > 0.5, // soglia regolabile
      reason: maxScore > 0.5 ? "Match ok" : "❌ Account X non coerente con name/symbol",
    };
  }
  
  // --- Esempio di test ---
  const metadata = {
    name: "3I/ATLAS",
    symbol: "ATLAS",
    twitter: "https://x.com/3I-ATLAS",
  };
  
  