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
  twitter: 'https://x.com/nocontextscats/status/1950061928099041554'
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

    if (metadata.twitter.includes('/i/communities/')) {
        reasons.push(`Link Twitter non valido: community rilevata (${metadata.twitter})`);
        console.log("❌ Link Twitter non valido: community rilevata", metadata.twitter);
      } 
  // https://x.com/i/communities/1958214329238528374
    // Estrai handle da Twitter (se c'è)
    let twitterHandle = null;
    if (metadata.twitter) {
      const match = metadata.twitter.match(/twitter\.com\/([^\/\?]+)/) 
                 || metadata.twitter.match(/x\.com\/([^\/\?]+)/);
      if (match){twitterHandle = match[1].toLowerCase();} else{
        reasons.push(`no-twitter link (${metadata.twitter})`);
        console.log("no-twitter link",metadata.twitter);
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
  