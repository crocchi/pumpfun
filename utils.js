import axios from 'axios';
let safeProblem = [];

// 🔥 Lista di wallet noti per rugpull (aggiungi i tuoi)
const blacklist = [
  'FkeYEXAMPLEdGycd3t7asdfsas', 
  '6QsW5rSMYaQTGJxg9UiwmhxEQ7w1DypdN9kfHQuWoobi'
];

export async function isSafeToken(token) {
  safeProblem=[];
  try {
    // 1. ✅ Controllo liquidità
    if (token.solInPool < 0.5 || token.solInPool > 5) {
      //console.log("❌ Liquidità fuori range.");
      safeProblem.push("❌ Liquidità fuori range.");
      //return false;
    }

    // 2. ✅ Controllo market cap
    if (token.marketCapSol < 5 || token.marketCapSol > 100) {
      //console.log("❌ Market cap sospetto.");
      safeProblem.push("❌ Market cap sospetto.")
      //return false;
    }

    // 3. ✅ Dev token share (dev ha ricevuto troppi token)
    const totalTokens = token.tokensInPool + token.initialBuy;
    const devShare = token.initialBuy / totalTokens;
    if (devShare > 0.15) {
      //console.log("❌ Il creatore ha preso troppi token iniziali.");
      safeProblem.push("❌ Il creatore ha preso troppi token iniziali.")
      //return false;
    }

    // 4. ✅ Simbolo/token name valido
    const symbolValid = /^[a-zA-Z0-9]{2,12}$/.test(token.symbol);
    const nameValid = token.name.length <= 20 && !token.name.includes('💩') && !token.name.includes('http');
    if (!symbolValid || !nameValid) {
     // console.log("❌ Nome o simbolo sospetti.");
      safeProblem.push("❌ Nome o simbolo sospetti.");
      //return false;
    }

    // 5. ✅ Dev non in blacklist
    if (blacklist.includes(token.traderPublicKey)) {
     // console.log("❌ Dev è in blacklist.");
      safeProblem.push("❌ Dev è in blacklist.");
      //return false;
    }

    // 6. ✅ Controllo metadati (opzionale)
    
    if (token.uri) {
      const socialCheck = await checkMissingSocials(token.uri);
      if (!socialCheck) safeProblem.push('❌ Nessun social (website, Twitter o Telegram)');
      /*
      if (!meta || !meta.image || meta.image.includes('base64') || meta.name !== token.name) {
        console.log("❌ Metadata sospetti o immagine mancante.");
        return false;
      }*/
    }

    // ✅ Tutto ok!
    return safeProblem
  } catch (err) {
    console.error("Errore nel controllo sicurezza:", err.message);
    return false;
  }
}

async function fetchMetadata(uri) {
  try {
    const cleanUri = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
    const res = await axios.get(cleanUri, { timeout: 3000 });
    return res.data;
  } catch (err) {
    return null;
  }
}


export function formatPrezzoTokenNoSci(numero, decimali = 18) {
    if (typeof numero !== 'number' || isNaN(numero)) return '0';
  
    if (numero === 0) return '0';
  
    // Numero positivo o negativo?
    const segno = numero < 0 ? '-' : '';
    numero = Math.abs(numero);
  
    // Se è >= 1, usa toFixed classico (max decimali)
    if (numero >= 1) {
      return segno + numero.toFixed(decimali).replace(/\.?0+$/, '');
    }
  
    // Per numeri < 1, costruisci stringa senza scientifica
    const numeroStr = numero.toString();
  
    // Es. 0.000000005089
    // Calcolo quanti zeri dopo virgola prima di un numero diverso da zero
    const parteDecimale = numeroStr.split('.')[1] || '';
    let zeriCount = 0;
    for (const c of parteDecimale) {
      if (c === '0') zeriCount++;
      else break;
    }
  
    // Numero di cifre da mostrare dopo gli zeri
    const cifreDopoZeri = decimali;
  
    // Prendo la parte significativa
    const parteSignificativa = parteDecimale.slice(zeriCount, zeriCount + cifreDopoZeri);
  
    // Ricostruisco la stringa
    return segno + '0.' + '0'.repeat(zeriCount) + parteSignificativa;
  }
  
//controllo social
export async function checkMissingSocials(uri) {
    try {
      const response = await fetch(uri);
      const metadata = await response.json();
      console.log("Controllo metadati per:", metadata);

      // 🔍 Alcuni token usano direttamente i social nel metadata (senza extensions)
    const extensions = metadata?.extensions || metadata || {};

    const hasTwitterOrTelegram =
    typeof extensions.twitter === 'string' && extensions.twitter.length > 5 ||
    typeof extensions.telegram === 'string' && extensions.telegram.length > 5;

    if (!hasTwitterOrTelegram) {
        return false   // '❌ Manca Twitter o Telegram';
      }

   const hasWebsite = typeof extensions.website === 'string' && extensions.website.length > 5;
  
   if (!hasWebsite) {
    return false     //'❌ Manca il sito web';
  }

  const hasDescription = typeof extensions.description === 'string' && extensions.description.length > 20;
  if (!hasDescription) {
    return false     //'❌ Manca descrizione o assente';
  }


      return true;
    } catch (e) {
      return '⚠️ Impossibile leggere metadata URI';
    }
  }
  /*
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
  */