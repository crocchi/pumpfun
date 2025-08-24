// --- Funzione: controllo Website ---
import { normalize,similarity } from "./twitterCheck.js";


export function checkWebsiteMatch(metadata) {
    if (!metadata.website) return { valid: false, reason: "No website link" };
  
    const domain = extractDomain(metadata.website);
    if (!domain) return { valid: false, reason: "Invalid website URL" };
  
    const normDomain = normalize(domain);
    const normName = normalize(metadata.name || "");
    const normSymbol = normalize(metadata.symbol || "");
  
    const scoreName = similarity(normDomain, normName);
    const scoreSymbol = similarity(normDomain, normSymbol);
    const maxScore = Math.max(scoreName, scoreSymbol);

    findMintInPage(metadata.website).then(result => {
      if (result.found) {
        console.log("✅ Mint address trovato nella pagina:", result.addresses);
      } else {
        console.log("❌ Nessun mint address trovato:", result.reason);
      }
    })
  
    return {
      domain,
      scoreName: scoreName.toFixed(2),
      scoreSymbol: scoreSymbol.toFixed(2),
      valid: maxScore > 0.5,
      reason: maxScore > 0.5 ? "Website match ok" : "❌ Website non coerente",
    };
  }

  // --- Funzione: estrai dominio dal sito ---
function extractDomain(url) {
    try {
      const u = new URL(url);
      return u.hostname.replace("www.", "");
    } catch {
      return null;
    }
  }

  // Funzione: scarica HTML e cerca mint address
async function findMintInPage(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Impossibile scaricare la pagina");

    const html = await res.text();

    // Regex base58 Solana (43-44 caratteri)
    const regex = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g;
    const matches = html.match(regex);

    if (!matches || matches.length === 0) {
      return { found: false, reason: "Nessun mint address trovato" };
    }

    return { found: true, addresses: [...new Set(matches)] };
  } catch (err) {
    return { found: false, reason: err.message };
  }
}

// --- Esempio ---
(async () => {
  const result = await findMintInPage("https://pump.fun/coin/xxxxx");
  console.log(result);
})();
