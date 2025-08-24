import axios from 'axios';
import { checkRugRisk } from './utility/rugCheck.js';
let safeProblem = [];
import { botOptions } from './config.js';
import { checkTwitterMatch } from './utility/twitterCheck.js';
import { checkWebsiteMatch } from './utility/websiteCheck.js';

import { checkTokenDistribution } from './utility/checkOwner.js';
const MAX_CREATOR_SUPPLY_PERCENT = 5; // massimo accettabile per il creator
const MAX_BURN_PERCENT = 50; // opzionale: es. se >50% burned, è sospetto

// 🔥 Lista di wallet noti per rugpull (aggiungi i tuoi)
const blacklist = [
  'FkeYEXAMPLEdGycd3t7asdfsas', 
  '6QsW5rSMYaQTGJxg9UiwmhxEQ7w1DypdN9kfHQuWoobi'
];
let cont=0
export async function isSafeToken(token) {
  safeProblem=[];
  try {
    // 1. ✅ Controllo liquidità min 2 max 20
    if (token.solInPool < botOptions.liquidityMin+30 || token.solInPool > botOptions.liquidityMax+30 ) {
      //console.log("❌ Liquidità fuori range.");
      safeProblem.push("❌ Liquidità fuori range."+`: ${token.solInPool} SOL`);
      //return false;
    }

    // 2. ✅ Controllo market cap
    if (token.marketCapSol < botOptions.marketcapMin || token.marketCapSol > botOptions.marketcapMax) {
      //console.log("❌ Market cap sospetto.");
      safeProblem.push("❌ Market cap sospetto"+`: ${token.marketCapSol} SOL`);
      //return false;
    }

    // 3. ✅ Dev token share (dev ha ricevuto troppi token)
    const totalTokens = token.tokensInPool + token.initialBuy;
    const devShare = token.initialBuy / totalTokens;
    if (devShare > botOptions.devShare) {
      //console.log("❌ Il creatore ha preso troppi token iniziali.");
      safeProblem.push("❌ Il creatore ha comprato il"+ ` (${(devShare * 100).toFixed(2)}%) di token iniziali`);
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


// Verifica creator / owner balance
cont++
if(cont < 0){
try {
    const dist = await checkTokenDistribution(token.mint);

    if (dist.ownerPercent > MAX_CREATOR_SUPPLY_PERCENT) {
        safeProblem.push(`❌ Creator possiede ${dist.ownerPercent}% della supply`);
    }

    if ((dist.burned / dist.totalSupply) * 100 > MAX_BURN_PERCENT) {
        safeProblem.push(`⚠️ Supply bruciata superiore al ${MAX_BURN_PERCENT}%`);
    }

    // Puoi loggare anche per debug
    console.log(`🔍 Distribuzione ${token.name}:`, dist);
  } catch (err) {
    console.warn(`⚠️ Errore nel calcolo distribuzione per ${token.mint}`, err.message);
    //reasons.push("❌ Errore nella verifica della distribuzione token");
  }
}

    // 6. ✅ Controllo metadati (opzionale)
    
    if (token.uri) {
      const socialCheck = await checkMissingSocials(token.uri);
      //if (!socialCheck) safeProblem.push('❌ Nessun social (website, Twitter o Telegram)');
      /*
      if (!meta || !meta.image || meta.image.includes('base64') || meta.name !== token.name) {
        console.log("❌ Metadata sospetti o immagine mancante.");
        return false;
      }*/
        
    }

    // 7. ✅ Controllo sicurezza rugPull (api rugpull.xyz)
if(safeProblem.length === 0 && botOptions.rugpullxyz) {
    const info = await checkRugRisk(token.mint);
    if (info) {
      console.log(`🔎 Rischio per ${token.mint}:`, info.risks[0]?.level, `(Score: ${info.risks[0]?.score})` , info.risks[0]?.description);
      if (info.risks[0]?.score > 1500) {
        console.log("⛔ Token rischioso: rugpull possibile.");
        safeProblem.push(`⛔ Token rischioso: rugpull possibile.`);

      }
    }
}
    /*
    {
  "tokenProgram": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "tokenType": "",
  "risks": [
    {
      "name": "Low Liquidity",
      "value": "$0.41",
      "description": "Low amount of liquidity in the token pool",
      "score": 1990,
      "level": "danger"
    }
  ],
  "score": 1991,
  "score_normalised": 29,
  "lpLockedPct": 0
} */


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
  
//controllo social
export async function checkMissingSocials(uri) {
    try {
      const response = await fetch(uri);
      const metadata = await response.json();
    //console.log("New Token:", metadata);
    console.log(`New Token: Name:${metadata.name}[${metadata.symbol}], Description: ${metadata.description || 'N/A'}`);
    console.log(`Created on: ${metadata.createdOn || 'N/A'} | Website: ${metadata.website || 'N/A'} | Twitter: ${metadata.twitter || 'N/A'} telegram: ${metadata.telegram || 'N/A'}`);
    /**Controllo metadati per: {
  name: "4chan's Worthless Coin",
  symbol: 'Worthless',
  description: 'https://x.com/MostChadDev/status/1952546537697100265',
  createdOn: 'https://bonk.fun',
  image: 'https://ipfs.io/ipfs/bafkreicp2a7b3sozfg4c2morqy73dbpixvv2nv2wwmjvgvrx4oede6642i',
  website: 'https://warosu.org/biz/?task=search2&ghost=false&search_text=worthless+coin&search_subject=&search_username=&search_tripcode=&search_email=&search_filename=&search_datefrom=&search_dateto=&search_media_hash=&search_op=all&search_del=dontcare&search_int=dontcare&search_ord=old&search_capcode=all&search_res=post',
  twitter: 'https://x.com/MostChadDev/status/1952546537697100265'
} */

      // 🔍 Alcuni token usano direttamente i social nel metadata (senza extensions)
    const extensions = metadata?.extensions || metadata || {};

    // Controllo Twitter e Telegram
    const hasTwitterOrTelegram =
    typeof extensions.twitter === 'string' && extensions.twitter.length > 5 ||
    typeof extensions.telegram === 'string' && extensions.telegram.length > 5;

    if (!hasTwitterOrTelegram) {
        safeProblem.push("❌ Manca Twitter o Telegram");
        return false   // '❌ Manca Twitter o Telegram';
      }
    

      //creato su Pump.Fun
      if (typeof extensions.createdOn === 'string' && extensions.createdOn.includes('raydium.launchlab')) {
        //safeProblem.push("✅ Creato su Pump.Fun"); createdOn: 'https://raydium.io/',
        console.log("✅ Creato su Raydium LaunchLab");
        safeProblem=[];
        return true; // Creato su Raydium LaunchLab
      }//createdOn: 'https://bonk.fun',createdOn: 'https://letsbonk.fun',  createdOn: 'raydium.launchlab',

  //controllo descrizione
  const hasDescription = typeof extensions.description === 'string' && extensions.description.length > 14;
  if (hasDescription && extensions.description.length > 400) {
    console.log("⚠️ Descrizione lunga, potrebbe essere interessante... testiamo..");
    safeProblem=[];
    return true; // Descrizione lunga, potrebbe essere interessante... testiamo..
  }
  if (!hasDescription) {
    safeProblem.push("❌ Descrizione breve o assente"+ ` (${extensions.description.length} caratteri)`);

    return false     
  }

        // Controllo sito web
        const hasWebsite = typeof extensions.website === 'string' && extensions.website.length > 5;
  
        if (!hasWebsite) {
         safeProblem.push("❌ Manca il sito web");
         //return false     
       }else{
const websiteCheck= checkWebsiteMatch(metadata);
if (websiteCheck.valid !== true) {
  safeProblem.push(websiteCheck.reason);
  return false; // Problema con sito web
}else if (websiteCheck.valid === true) {
  console.log("✅ Sito OK:", metadata.website);
  safeProblem=[];
  return true; // sito ok
}
      }
    
//controllo Twitter
const twitterCheck= checkTwitterMatch(metadata);
//console.log("check Twitter:",twitterCheck);
if (twitterCheck.valid !== true) {
  safeProblem.push(twitterCheck.reason);
  return false; // Problema con Twitter
}else if (twitterCheck.valid === true) {
  console.log("✅ Twitter OK:", metadata.twitter);
  safeProblem=[];
  return true; // Twitter ok
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

async function getTwitterFollowers(url) {
    console.log("Controllo Twitter per:", url);
    try {
      // Scarta se è una community o link non standard
      if (!url.includes('twitter.com') && !url.includes('x.com')) return 0;
      if (url.includes('/i/')) return 0;
  
      // Estrai username
      const match = url.match(/(?:twitter\.com|x\.com)\/(#!\/)?@?([^\/\?\s]+)/i);
      if (!match || !match[2]) return 0;
  
      const username = match[2];
  
      const response = await axios.get(`https://twitter241.p.rapidapi.com/followers`, {
        params: { user: username, count: 20 },
        headers: {
          'x-rapidapi-host': 'twitter241.p.rapidapi.com',
          'x-rapidapi-key': 'd148339df6msh7f81efe03530b3bp14ee7fjsn7d4c5e2f0c36',
        },
      });
  console.log("Risposta Twitter:"+username, response.data);
      return response.data?.followers_count || 0;
    } catch (err) {
      console.warn('❌ Errore follower Twitter:', err.message);
      return 0;
    }
  }