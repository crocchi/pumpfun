// --- Funzione: controllo Website ---
import { normalize,similarity } from "./twitterCheck.js";


export async function checkWebsiteMatch(metadata,token) {
    if (!metadata.website) return { valid: false, reason: "No website link" };
  
    const domain = extractDomain(metadata.website);
    if (!domain) return { valid: false, reason: "Invalid website URL" };
  
    const normDomain = normalize(domain);
    const normName = normalize(metadata.name || "");
    const normSymbol = normalize(metadata.symbol || "");
  
    const scoreName = similarity(normDomain, normName);
    const scoreSymbol = similarity(normDomain, normSymbol);
    const maxScore = Math.max(scoreName, scoreSymbol);
    let finpage={ found: false, reason: 'no-check' }
    if(maxScore > 0.3){
      finpage=await checkMintInPage(metadata.website,token.mint)
  
    }
    
    return {
      domain,
      finpage,
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
async function checkMintInPage(url, mintAddress) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Impossibile scaricare la pagina");
  
      const html = await res.text();
  
      // Cerca esattamente il mint passato
      const found = html.includes(mintAddress);
  console.log('check webpage'+url,found)
      return found
        ? { found: true, mint: mintAddress }
        : { found: false, reason: "Mint non trovato nella pagina" };
    } catch (err) {
      return { found: false, reason: err.message };
    }
  }


