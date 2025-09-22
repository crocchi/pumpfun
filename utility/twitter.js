import { chromium } from 'playwright';
import { sendMessageToClient } from '../socketio.js';

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Calcola __dirname per ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//const fs = require('fs').promises; // Per leggere/scrivere file JSON
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const viewport = { width: 1280, height: 720 };
  const storageStatePath = path.join(__dirname, 'storage-state.json');

export async function checkAccount(username) {
  // Configurazioni anti-bot avanzate

  
  const browser = await chromium.launch({ headless: true }); // headless: false per debug visivo
  
  let context;

  // Controlla se esiste il file di stato
  let storageState = {};
  try {
    storageState = JSON.parse(await fs.readFile(storageStatePath, 'utf-8'));
    console.log('Caricato stato precedente da storage-state.json');
  } catch (error) {
    console.log('Nessun file di stato trovato, verrà creato uno nuovo.');
  }
  
  // Crea contesto con stato salvato (se esiste)
  context = await browser.newContext({
    userAgent: userAgent,
    viewport: viewport,
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
    storageState: storageState, // Carica cookie/state
    bypassCSP: true,
  });

  const page = await context.newPage();

  
    // Naviga al profilo X con timeout aumentato
    const profileUrl = `https://x.com/${username.replace('@', '')}`;
    console.log(`Navigando a: ${profileUrl}`);
    await page.goto(profileUrl, { 
      waitUntil: 'domcontentloaded', // Meno restrittivo di 'networkidle'
      timeout: 10000 // Timeout a 10 secondi
    });

    // Ritardo esplicito per contenuti dinamici
    await page.waitForTimeout(3000); // Aspetta 2 secondi per caricamento JS
 
    // Aspetta il selettore del profilo con timeout aumentato
    await page.waitForSelector('[data-testid="UserName"]');

    // Estrai informazioni base
    const displayName = await page.locator('[data-testid="UserName"]').textContent();

//    const handle = await page.locator('[data-testid="UserHandle"]').textContent();
    //const bio = await (await page.locator('[data-testid="UserDescription"] span').textContent()) || 'Nessuna bio';
    let bio = (await page.locator('[data-testid="UserDescription"] span')) || 'Nessuna bio';
    //if(bio)bio.textContent();
    //const whoFollowersText = await page.locator('a[href$="/following"] span').first().textContent();
    
   // const who_followers = whoFollowersText ? parseInt(whoFollowersText.replace(/[^\d]/g, '')) : 'N/A';
    

    const followersText = await page.locator('a[href$="/verified_followers"] span').first().textContent();
    
    const followers = followersText ? parseInt(followersText.replace(/[^\d]/g, '')) : 'N/A';



    //const postsText = await page.locator('a[href$="/with_replies"]').first().textContent() || 'N/A';

    // Primi 3 post
    const posts = await page.locator('[data-testid="tweet"]', { timeout: 1000 }).all();
    //const firstPost = await page.locator('div[data-testid="tweetText"]').textContent();

    const recentPosts = [];
    for (let i = 0; i < Math.min(3, posts.length); i++) {
      const text = await posts[i].locator('div[data-testid="tweetText"]').textContent();
      recentPosts.push(text ? text.trim() : 'Post senza testo');
    }

    // Output risultati
    let msgg=`( --- X Account ---)
              Nome visualizzato: ${displayName}
              Bio: ${bio}
              Follower: ${followers}
              
              `;
    console.log(msgg);
    sendMessageToClient('event' , msgg)
    console.log('Primi 3 post recenti:');
    sendMessageToClient('event' , JSON.stringify(recentPosts))
    console.log(recentPosts)
    recentPosts.forEach((post, index) => console.log(`  ${index + 1}. ${post.substring(0, 100)}...`));

 /* } catch (error) {
    console.error('Errore durante il controllo:', error.message);
    console.log('Possibili cause:');
    console.log('- Blocco anti-bot da X (prova headless: false o proxy).');
    console.log('- Problemi di rete (verifica connessione).');
    console.log('- Selettori UI cambiati (usa page.pause() per debug).');
    console.log('- Profilo privato o non esistente.');
    // Salva screenshot per debug
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('Screenshot salvato come error-screenshot.png');
  } finally {
   
  } */
  await browser.close();
}

// Argomenti da riga di comando
/*
const username = process.argv[2];
if (!username) {
  console.error('Uso: node check-account.js @username');
  process.exit(1);
}

checkAccount(username);

*/