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
const viewport = { width: 1280, height: 998 };
const storageStatePath = path.join(__dirname, 'storage-state.json');

export async function checkAccount(username, token) {
    // Configurazioni anti-bot avanzate

    let context;

    // Controlla se esiste il file di stato
    let storageState = { cookies: [], origins: [] }; 
    try {
        //storageState = JSON.parse(await fs.readFile(storageStatePath, 'utf-8'));
        //(console.log('Caricato stato precedente da storage-state.json');

         const fileContent = await fs.readFile(storageStatePath, 'utf-8');
         storageState = JSON.parse(fileContent);
         console.log('Caricato stato precedente da storage-state.json');
         
  // Carica lo stato salvato
 // const context = await browser.newContext({ storageState: 'cookies-state.json' });
 
    } catch (error) {
       /* fs.writeFile(storageStatePath, JSON.stringify(storageState, null, 2), (err) => {
            if (err) {
                console.error('Errore:', err);
                return;
            }
            console.log('File JSON creato!');
        });*/
         // Opzionale: crea un file vuoto
    await fs.writeFile(storageStatePath, JSON.stringify(storageState, null, 2));
    console.log('File storage-state.json creato vuoto.');
        console.log('Nessun file di stato trovato, verrà creato uno nuovo.');

    }

const browser = await chromium.launch({ headless: true }); // headless: false per debug visivo

    // Crea contesto con stato salvato (se esiste)
    context = await browser.newContext({
        userAgent: userAgent,
        viewport: viewport,
        extraHTTPHeaders: {
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },/*
        proxy: {
      server: 'http://127.0.0.1:8080', // Sostituisci con il tuo proxy
      username: 'myUsername', // (Opzionale) Nome utente
      password: 'myPassword'  // (Opzionale) Password
    },*/
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
    await page.waitForTimeout(3000); // Aspetta 4 secondi per caricamento JS

    //salva coockie,localstorage e tutte le info del browser appena collegato a x.com
    await context.storageState({ path: './utility/storage-state.json' }).then((data)=>{
       // console.log(data)
    })

    // Aspetta il selettore del profilo con timeout aumentato
    //await page.waitForSelector('[data-testid="UserName"]');
    let user; //(await page.locator('[data-testid="UserDescription"] span').textContent()) || 'Nessuna bio';
    let locatorr = page.locator('[data-testid="UserName"]');
    if (await locatorr.count() > 0) {
        user = await locatorr.textContent();
    } else {
        console.log('account nn esistente');
        await page.screenshot({ path: 'account-nofound-screenshot.png' });
        await browser.close();
        return {
            valid: false
        }
    }

    // Estrai informazioni base
    const displayName = await page.locator('[data-testid="UserName"]').textContent();
    const nickName = displayName.replace(/@.*/, '');
    const handleName = displayName.replace(/.*@/, '');

    //    const handle = await page.locator('[data-testid="UserHandle"]').textContent();
    //const bio = await (await page.locator('[data-testid="UserDescription"] span').textContent()) || 'Nessuna bio';
    let bio; //(await page.locator('[data-testid="UserDescription"] span').textContent()) || 'Nessuna bio';
    let locator = page.locator('[data-testid="UserDescription"]');
    if (await locator.count() > 0) {
        bio = await locator.textContent();
    } else {
        bio = 'Nessuna bio';
    }
    //if(bio)bio.textContent();
    //const whoFollowersText = await page.locator('a[href$="/following"] span').first().textContent();

    // const who_followers = whoFollowersText ? parseInt(whoFollowersText.replace(/[^\d]/g, '')) : 'N/A';


    const followers = await page.locator('a[href$="/verified_followers"] span').first().textContent();

    // Gestione banner cookie (opzionale: solo se visibile)
    await page.waitForSelector('[data-testid="BottomBar"]', { timeout: 5000 });

    // Clicca sul bottone "Accetta tutto" o equivalente
    // Opzione 1: Selettore per bottone con testo "Accetta tutto"
    try {
        await page.getByRole('button', { name: 'Accept all cookies', exact: true }).click();
    } catch (error) {
        console.log('Bottone "Accetta tutto" non trovato.');
        await page.screenshot({ path: 'account-nofound-screenshot.png' });
    }

    // Opzione 2: Se il selettore è diverso (es. link o altro bottone), usa questo
    // await page.locator('button[data-testid="accept-all"]').click();

    console.log('Cookie accettati con successo.');

    //const postsText = await page.locator('a[href$="/with_replies"]').first().textContent() || 'N/A';
    const recentPosts = [];
    let postsText; //(await page.locator('[data-testid="UserDescription"] span').textContent()) || 'Nessuna bio';
    let locatorpost = await page.locator('div[data-testid="tweetText"]', { timeout: 2000 });


    let firstPost;
    try {//fa perdere un sacco di tempo se nn ci sono post...
        firstPost = await page.locator('div[data-testid="tweetText"]', { timeout: 2000 }).first().textContent();
    } catch (error) {
        await page.screenshot({ path: 'firts-post-error.png' });
        console.log(error);
    }
    //const firstPost = await page.locator('div[data-testid="tweetText"]').first().textContent();
    if (await locatorpost.count() > 0) {
        postsText = await page.locator('div[data-testid="tweetText"]', { timeout: 2000 }).all();
        console.log(postsText)
        for (let i = 0; i < Math.min(8, postsText.length); i++) {
            const text = await postsText[i].textContent();
            recentPosts.push(text ? text.trim() : 'Post senza testo');
        }
    } else {

        postsText = 'Nessun Post';
    }


    // await page.screenshot({ path: 'error-screenshot.png' });

    /*
    for (let i = 0; i < Math.min(3, posts.length); i++) {
        const text = await posts[i].locator('div[data-testid="tweetText"]').first().textContent();
        recentPosts.push(text ? text.trim() : 'Post senza testo');
    }
*/

    // Output risultati
    let msgg = `( --- X Account ---)
              Nome visualizzato: ${displayName}
              nickName:${nickName}
              handleName:${handleName}
              Bio: ${bio}
              Follower: ${followers}
              PostNumb: ${recentPosts.length || postsText}
              `;
    if (firstPost) { msgg = msgg + ` 1Post: ${firstPost}` }

    console.log(msgg);
    sendMessageToClient('event', msgg)
    console.log('Primi 3 post recenti:');
    sendMessageToClient('event', JSON.stringify(recentPosts))
    //console.log(recentPosts)
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
     // Ottieni il contenuto HTML della pagina
  const htmlContent = await page.content();

  // Stringa da cercare
  const searchString = token.mint;
  console.log('stringa da cercare..'+searchString)

  // Verifica se la stringa è presente
  if (htmlContent.includes(searchString)) {
    let msg=(`Il contratto "${searchString}" è presente nella pagina X!`);
    console.log(msg);
    sendMessageToClient('event',msg)
    await browser.close();
    return {
        valid: true,
        data:msgg
    }
  } else {
     let msg=(`Il contratto "${searchString}" NON è presente nella pagina X!`);
    console.log(msg);
    sendMessageToClient('event',msg)
    await browser.close();
    return {
        valid: false,
    }
  }
    
}

// Argomenti da riga di comando

const username = process.argv[2];
if (username) {
    console.error('Uso: node check-account.js @username');
    checkAccount(username);
    process.exit(1);
} else {

}



