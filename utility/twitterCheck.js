// metadataFilter.js

/**
 * Controlla se il nome/symbol del token è coerente con i link social dichiarati.
 * @param {Object} metadata - Metadati del token (name, symbol, twitter, website, etc.)
 * @returns {Object} risultato { suspicious: boolean, reasons: string[] }
 */
export function checkMetadataTwitter(metadata) {
    const reasons = [];
    const name = (metadata.name || "").toLowerCase();
    const symbol = (metadata.symbol || "").toLowerCase();
  
    // Estrai handle da Twitter (se c'è)
    let twitterHandle = null;
    if (metadata.twitter) {
      const match = metadata.twitter.match(/twitter\.com\/([^\/\?]+)/) 
                 || metadata.twitter.match(/x\.com\/([^\/\?]+)/);
      if (match) twitterHandle = match[1].toLowerCase();
    }
  
    // Se c'è un handle Twitter → deve essere incluso nel name o symbol
    if (twitterHandle) {
      if (!name.includes(twitterHandle) && !symbol.includes(twitterHandle)) {
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
  