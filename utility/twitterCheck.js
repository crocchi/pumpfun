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
  
 * Controlla se il nome/symbol del token è coerente con i link social dichiarati.
 * @param {Object} metadata - Metadati del token (name, symbol, twitter, website, etc.)
 * @returns {Object} risultato { suspicious: boolean, reasons: string[] }
 */
export function checkMetadataTwitter(metadata) {
    const reasons = [];
    const name = (metadata.name || "").toLowerCase();
    const symbol = (metadata.symbol || "").toLowerCase();

    
  // https://x.com/i/communities/1958214329238528374
    // Estrai handle da Twitter (se c'è)
    let twitterHandle = null;
    if (metadata.twitter) {
      const match = metadata.twitter.match(/twitter\.com\/([^\/\?]+)/) 
                 || metadata.twitter.match(/x\.com\/([^\/\?]+)/);
      if (match){
        twitterHandle = match[1].toLowerCase();
      } else if (metadata.twitter.includes('/i/communities/')) {
        reasons.push(`Link Twitter non valido: community rilevata (${metadata.twitter})`);
        console.log("❌ Link Twitter non valido: community rilevata", metadata.twitter);
      } 
    }
  console.log("twitterHandle",twitterHandle);
    // Se c'è un handle Twitter → deve essere incluso nel name o symbol
    if (twitterHandle) {
      if (!name.includes(twitterHandle) /*|| !symbol.includes(twitterHandle)*/) {
        reasons.push(`Name/symbol non coerente con Twitter (${twitterHandle})`);
      }
    }
  
    // Controllo website: se è un dominio "strano" vs name
    /*
    if (metadata.website) {
      const url = metadata.website.toLowerCase();
      if (name.length > 0 && !url.includes(name.split(" ")[0].toLowerCase())) {
        reasons.push("Website non coerente col nome");
      }
    }*/
  
    return {
      suspicious: reasons.length > 0,
      reasons
    };
  }
  

  // --- Funzione: estrai handle da URL Twitter/X ---
function extractTwitterHandle(url) {
    try {
      const match = url.match(/x\.com\/([^/?]+)/) || url.match(/twitter\.com\/([^/?]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }
  
  // --- Funzione: normalizza testo (minuscole, rimuove simboli/spazi) ---
  function normalize(str) {
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
  function similarity(a, b) {
    if (!a.length && !b.length) return 1;
    const distance = levenshtein(a, b);
    return 1 - distance / Math.max(a.length, b.length);
  }
  
  // --- Funzione principale: controllo Twitter ---
  export function checkTwitterMatch(metadata) {
    if (!metadata.twitter) return { valid: false, reason: "No Twitter link" };
  
    const handle = extractTwitterHandle(metadata.twitter);
    if (!handle) return { valid: false, reason: "Invalid Twitter URL" };
  
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
      reason: maxScore > 0.5 ? "Match ok" : "Handle non coerente con name/symbol",
    };
  }
  
  // --- Esempio di test ---
  const metadata = {
    name: "3I/ATLAS",
    symbol: "ATLAS",
    twitter: "https://x.com/3I-ATLAS",
  };
  
  