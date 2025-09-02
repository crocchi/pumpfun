import axios from 'axios';
import { checkRugRisk } from './utility/rugCheck.js';
//let safeProblem = [];
import { botOptions } from './config.js';
import { checkTwitterMatch } from './utility/twitterCheck.js';
import { checkWebsiteMatch } from './utility/websiteCheck.js';
import { searchTwitter } from './utility/desearchTwitter.js';

import { checkTokenDistribution } from './utility/checkOwner.js';
const MAX_CREATOR_SUPPLY_PERCENT = 5; // massimo accettabile per il creator
const MAX_BURN_PERCENT = 50; // opzionale: es. se >50% burned, è sospetto

// 🔥 Lista di wallet noti per rugpull (aggiungi i tuoi)
const blacklist = [ // o aggiungi dev wallet che hanno creato un token ultimi 20o piuè
  'FkeYEXAMPLEdGycd3t7asdfsas', 
  '6QsW5rSMYaQTGJxg9UiwmhxEQ7w1DypdN9kfHQuWoobi'
];
let cont=0
export async function isSafeToken(token) {
  let safeProblem=[];

  try {
    // 1. ✅ Controllo liquidità min 2 max 20
    if(token.mint.includes('bonk') || token.mint.includes('BONK') ) {
      if (token.solInPool < botOptions.liquidityMin || token.solInPool > botOptions.liquidityMax ) {
        safeProblem.push("❌ Liquidità fuori range."+`: ${token.solInPool.toFixed(3)} SOL`);
        return {
          safeProblem,
          valid: safeProblem.length === 0, // soglia regolabile
        }
      }
      
    }else if(token.mint.includes('pump') || token.mint.includes('PUMP') ) {
      if (token.solInPool < botOptions.liquidityMin+30 || token.solInPool > botOptions.liquidityMax+30 ) {
      //console.log("❌ Liquidità fuori range.");
      safeProblem.push("❌ Liquidità fuori range."+`: ${token.solInPool.toFixed(3)} SOL`);
     
      //se la liquidità e bassa molto allora skippa altrimenti...
      let diffPrice=(botOptions.liquidityMin +30) - token.solInPool;
      if(diffPrice < 0.5){
        console.log('poca differenza liquidità ..skippa problema')
      }else{
        return {
          safeProblem,
          valid: safeProblem.length === 0, // soglia regolabile
        }
      }
    }
      
    
    }

    // 2. ✅ Controllo market cap
    if (token.marketCapSol < botOptions.marketcapMin || token.marketCapSol > botOptions.marketcapMax) {
      //console.log("❌ Market cap sospetto.");
      safeProblem.push("❌ Market cap sospetto"+`: ${token.marketCapSol} SOL`);
      return {
        safeProblem,
        valid: safeProblem.length === 0, // soglia regolabile
      }
    }

    // 3. ✅ Dev token share (dev ha ricevuto troppi token)
    const totalTokens = token.tokensInPool + token.initialBuy;
    const devShare = token.initialBuy / totalTokens;
    if (devShare > botOptions.devShare) {
      //console.log("❌ Il creatore ha preso troppi token iniziali.");
      safeProblem.push("❌ Il creatore ha comprato il"+ ` (${(devShare * 100).toFixed(2)}%) di token iniziali`);
      return {
        safeProblem,
        valid: safeProblem.length === 0, // soglia regolabile
      }
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
      return {
        safeProblem,
        valid: safeProblem.length === 0, // soglia regolabile
      }
    }
//aggiungi dev wallet,ultimi token creati.cosi un dev se lancia 2 token
// di seguito viene bloccato
blacklist.push(token.traderPublicKey);
if(blacklist.length >= 80){ blacklist.shift() }

    // 6. ✅ Controllo metadati (opzionale)
    
    if (token.uri) {
      //const socialCheck = await checkMissingSocials(token.uri);
      let metadata;
       
      try {
          const response = await fetch(token.uri);
          metadata = await response.json();
      } catch (e) {
        safeProblem.push("⚠️ Impossibile leggere metadata URI");
        return {
          safeProblem,
          valid: safeProblem.length === 0, // soglia regolabile
        }
      }
     //console.log("New Token:", metadata);
       console.log(`New Token: Name:${metadata.name}[${metadata.symbol}], Description: ${metadata.description || 'N/A'}`);
       console.log(`Created on: ${metadata.createdOn || 'N/A'} | Website: ${metadata.website || 'N/A'} | Twitter: ${metadata.twitter || 'N/A'} telegram: ${metadata.telegram || 'N/A'}`);
   
      // Controllo se almeno ci sono ...Twitter e Telegram
      const hasTwitterOrTelegram =
      typeof metadata.twitter === 'string' && metadata.twitter?.length > 5 ||
      typeof metadata.telegram === 'string' && metadata.telegram?.length > 5;
  
      if (!hasTwitterOrTelegram) {
          if(botOptions.hasTwitterOrTelegram_filter){
            safeProblem.push("❌ Manca Twitter o Telegram");
          return {
            safeProblem,
            valid: safeProblem.length === 0, // soglia regolabile
          }
        }
        }
      
  
        //creato su Pump.Fun
        if (typeof metadata.createdOn === 'string' && metadata.createdOn.includes('raydium.launchlab')) {
          //safeProblem.push("✅ Creato su Pump.Fun"); createdOn: 'https://raydium.io/',
          console.log("✅ Creato su Raydium LaunchLab");
          safeProblem=[];
         // return true; // Creato su Raydium LaunchLab
        }//createdOn: 'https://bonk.fun',createdOn: 'https://letsbonk.fun',  createdOn: 'raydium.launchlab',
  
    //controllo descrizione
    const hasDescription = typeof metadata.description === 'string' && metadata.description?.length > 14;
    if (hasDescription && metadata.description?.length > 400) {
      console.log("⚠️ Descrizione lunga, potrebbe essere interessante... testiamo..");
      safeProblem=[];
      //return true; // Descrizione lunga, potrebbe essere interessante... testiamo..
    }
    if (!hasDescription) {
     if(botOptions.hasDescription_filter) safeProblem.push("❌ Descrizione breve o assente"+ ` (${metadata.description.length} caratteri)`);
  
      //return false     
    }
  

  
  //controllo Twitter
  const twitterCheck= checkTwitterMatch(metadata);
  //console.log("check Twitter:",twitterCheck);
  if (twitterCheck.valid !== true) {
    if(botOptions.hasTwitterOrTelegram_filter)safeProblem.push(twitterCheck.reason);
    
  }else if (twitterCheck.valid === true) {
    console.log("✅ Twitter OK:", metadata.twitter);
   // safeProblem=[];// aggiungere controllo twitter account profile
    //account x = twitterCheck.handle
    //token.mint
   // searchTwitter(twitterCheck.handle , token.mint )
  }


          // Controllo sito web
          const hasWebsite = typeof metadata.website === 'string' && metadata.website.length > 5;
    
          if (!hasWebsite) {
           if(botOptions.hasWeb_filter) safeProblem.push("❌ Manca il sito web");
           //return false     
         }else{ //se non manca il sito web...controlla

  const websiteCheck= await checkWebsiteMatch(metadata,token);
  console.log('websitechek:',websiteCheck);

  if (websiteCheck.valid !== true && botOptions.hasWebCheck_filter) {
    safeProblem.push(websiteCheck.reason);
    return {
      safeProblem,
      valid: safeProblem.length === 0, // soglia regolabile
    }
  }else if (websiteCheck.valid === true && botOptions.hasWebCheck_filter) {
    console.log("✅ Sito OK:", metadata.website);
     if(!websiteCheck.finpage.found){ 
      safeProblem.push(websiteCheck.finpage.reason);
      console.log("❌ Contratto token Non trovato nella pagina: ", websiteCheck.finpage.reason);
     } else if(websiteCheck.finpage.found){
        console.log(' ✅ Indirizzo contratto trovato nella pagina...')
    safeProblem=[];
    return {
      safeProblem,
      valid: safeProblem.length === 0,
      fastBuy:true // soglia regolabile
    }
     }
   
     }
        }
    

        
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

    return {
      safeProblem,
      valid: safeProblem.length === 0, // soglia regolabile
    }
  } catch (err) {
    console.error("Errore nel controllo sicurezza:", err);
    return false;
  }
}







 /* 
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
} 

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
