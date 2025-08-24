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
  
    return {
      domain,
      scoreName: scoreName.toFixed(2),
      scoreSymbol: scoreSymbol.toFixed(2),
      valid: maxScore > 0.5,
      reason: maxScore > 0.5 ? "Website match ok" : "Website non coerente",
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