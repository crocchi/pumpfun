import axios from 'axios';

// 🔥 Lista di wallet noti per rugpull (aggiungi i tuoi)
const blacklist = [
  'FkeYEXAMPLEdGycd3t7asdfsas', 
  '6QsW5rSMYaQTGJxg9UiwmhxEQ7w1DypdN9kfHQuWoobi'
];

export async function isSafeToken(token) {
  try {
    // 1. ✅ Controllo liquidità
    if (token.solInPool < 0.5 || token.solInPool > 5) {
      console.log("❌ Liquidità fuori range.");
      return false;
    }

    // 2. ✅ Controllo market cap
    if (token.marketCapSol < 5 || token.marketCapSol > 100) {
      console.log("❌ Market cap sospetto.");
      return false;
    }

    // 3. ✅ Dev token share (dev ha ricevuto troppi token)
    const totalTokens = token.tokensInPool + token.initialBuy;
    const devShare = token.initialBuy / totalTokens;
    if (devShare > 0.15) {
      console.log("❌ Il creatore ha preso troppi token iniziali.");
      return false;
    }

    // 4. ✅ Simbolo/token name valido
    const symbolValid = /^[a-zA-Z0-9]{2,12}$/.test(token.symbol);
    const nameValid = token.name.length <= 20 && !token.name.includes('💩') && !token.name.includes('http');
    if (!symbolValid || !nameValid) {
      console.log("❌ Nome o simbolo sospetti.");
      return false;
    }

    // 5. ✅ Dev non in blacklist
    if (blacklist.includes(token.traderPublicKey)) {
      console.log("❌ Dev è in blacklist.");
      return false;
    }

    // 6. ✅ Controllo metadati (opzionale)
    if (token.uri) {
      const meta = await fetchMetadata(token.uri);
      if (!meta || !meta.image || meta.image.includes('base64') || meta.name !== token.name) {
        console.log("❌ Metadata sospetti o immagine mancante.");
        return false;
      }
    }

    // ✅ Tutto ok!
    return true;
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
