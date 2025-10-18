
async function showObject(mint) {
    const res = await fetch(`/showinfo?mint=${mint}`);
    const txs = await res.json();
    // Crea una nuova finestra o scheda
    const newWindow = window.open('', '_blank');

    // Controlla se la finestra è stata bloccata dal browser
    if (!newWindow) {
      alert('Impossibile aprire una nuova finestra. Controlla le impostazioni del tuo browser.');
      return;
    }

    // Crea il contenuto HTML per la nuova pagina
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dettagli Oggetto</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f4f4f4;
          }
        </style>
      </head>
      <body>
        <h1>Dettagli Oggetto</h1>
        <table>
          <thead>
            <tr>
              <th>Chiave</th>
              <th>Valore</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(txs).map(([key, value]) => `
              <tr>
                <td>${key}</td>
                <td>${JSON.stringify(value, null, 2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Scrive il contenuto nella nuova finestra
    newWindow.document.open();
    newWindow.document.write(htmlContent);
    newWindow.document.close();

}

async function showTransactions(mint) {
    const res = await fetch(`/transactions?mint=${mint}`);
    const txs = await res.json();
    const list = document.getElementById('txList');
    list.innerHTML = '';
    if (txs.length === 0) {
      list.innerHTML = '<li>Nessuna transazione registrata</li>';
    } else {
      txs.forEach(tx => {
        const li = document.createElement('li');
        li.textContent = `${tx.time} - ${tx.type} @ ${tx.price} [${tx.amount || ''} SOL]`;
        list.appendChild(li);
      });
    }
    document.getElementById('modal').style.display = 'block';
  }
  
  document.getElementById('close').onclick = function() {
    document.getElementById('modal').style.display = 'none';
  }
  
  window.onclick = function(e) {
    if (e.target === document.getElementById('modal')) {
      document.getElementById('modal').style.display = 'none';
    }
  }

  function openConfig() {
    document.getElementById("configOverlay").classList.add("active");
}
function closeConfig() {
    document.getElementById("configOverlay").classList.remove("active");
}

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          alert('Contratto copiato negli appunti: ' + text);
        })
        .catch(err => {
          console.error('Errore durante la copia negli appunti:', err);
          alert('Errore durante la copia negli appunti.');
        });
    } else {
      // Fallback per browser che non supportano la Clipboard API
      const tempInput = document.createElement('input');
      tempInput.value = text;
      document.body.appendChild(tempInput);
      tempInput.select();
      tempInput.setSelectionRange(0, 99999); // Per dispositivi mobili
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      alert('Contratto copiato negli appunti: ' + text);
    }
  }


async function saveOptions(e) {
  e.preventDefault();
  const payload = {
    quickSellMultiplier: document.getElementById('quickSellMultiplier').value,
    quickSellMinTrades: document.getElementById('quickSellMinTrades').value,
    rugpullMaxTrades: document.getElementById('rugpullMaxTrades').value,
    rugpullMinGainMultiplier: document.getElementById('rugpullMinGainMultiplier').value,
   // enableTrailing: document.getElementById('enableTrailing').checked,
   // trailingPercent: document.getElementById('trailingPercent').value,
   // clientRefreshMs: document.getElementById('clientRefreshMs').value,
    liquidityMax: document.getElementById('liquidityMax').value,
    liquidityMin: document.getElementById('liquidityMin').value,
    devShare: document.getElementById('devShare').value / 100, // Converti in decimale
    marketcapMin: document.getElementById('marketcapMin').value,
    marketcapMax: document.getElementById('marketcapMax').value,
    rugpullxyz: document.getElementById('enablerugpullxyz').checked,
    time_monitor: document.getElementById('timeMonitor').value * 1000, // Converti in millisecondi 
    volumeMinMonitor: document.getElementById('volumeMinMonitor').value,
    minVolumeMonitor: document.getElementById('minVolumeMonitor').value,
    volumeMax: document.getElementById('volumeMax').value,

    netVolumeUpBuy: document.getElementById('netVolumeUpBuy').checked,
    quickBuyTrxNumb: document.getElementById('quickBuyTrxNumb').value,
    quickBuyVolumeUp: document.getElementById('quickBuyVolumeUp').value,
    quickBuyVolumeMin: document.getElementById('quickBuyVolumeMin').value,

    marketCapSolUpMode: document.getElementById('marketCapSolUpMode').checked,
    marketCapSolUpQuickBuy: document.getElementById('marketCapSolUpQuickBuy').value,
    
    priceSolUpMode: document.getElementById('priceSolUpMode').checked,
    priceSolUpQuickBuy: document.getElementById('priceSolUpQuickBuy').value,
    priceSolUpModeQuickBuyVolumeMin: document.getElementById('priceSolUpModeQuickBuyVolumeMin').value,
    priceSolUpModeQuickBuyVolumeNetMin: document.getElementById('priceSolUpModeQuickBuyVolumeNetMin').value,

    buyAmount: document.getElementById('buyAmount').value,
    sellOffPanic: document.getElementById('sellOffPanic').value,
    maxTrxNumMonitor: document.getElementById('maxTrxNumMonitor').value,
    minTrxNumMonitor : document.getElementById('minTrxNumMonitor').value,
    hasWeb_filter: document.getElementById('website').checked,
    hasWebCheck_filter: document.getElementById('websitecheck').checked,
    hasDescription_filter: document.getElementById('Description').checked,
    hasTwitterOrTelegram_filter: document.getElementById('TwitterOrTelegram').checked,
    demoVersion: document.getElementById('demoversion').checked,
    hasTwitterCheck_filter: document.getElementById('TwitterCheck').checked,
    enableTrailing: document.getElementById('enableTrailing').checked,
    trailingPercent: document.getElementById('trailingPercent').value,


  };
  // Salvarlo in localStorage
  localStorage.setItem("myConfig", JSON.stringify(payload));

  const r = await fetch('/bot-options', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await r.json();
  if (data.ok) {
    refreshMs = data.botOptions.clientRefreshMs;
    alert('Opzioni salvate con successo!');
  }
  return false;
}

async function loadOptions() {
  const r = await fetch('/bot-options');
  const o = await r.json();
  // Salvarlo in localStorage
  localStorage.setItem("myConfig", JSON.stringify(o));

  document.getElementById('quickSellMultiplier').value = o.quickSellMultiplier;
  document.getElementById('quickSellMinTrades').value = o.quickSellMinTrades;
  document.getElementById('rugpullMaxTrades').value = o.rugpullMaxTrades;
  document.getElementById('rugpullMinGainMultiplier').value = o.rugpullMinGainMultiplier;
 // document.getElementById('enableTrailing').checked = !!o.enableTrailing;
 // document.getElementById('trailingPercent').value = o.trailingPercent;
  //document.getElementById('clientRefreshMs').value = o.clientRefreshMs;
  document.getElementById('liquidityMin').value = o.liquidityMin;
  document.getElementById('liquidityMax').value = o.liquidityMax
  document.getElementById('devShare').value = o.devShare* 100; // Converti in percentuale
  document.getElementById('marketcapMin').value = o.marketcapMin;
  document.getElementById('marketcapMax').value = o.marketcapMax;
  document.getElementById('timeMonitor').value = o.time_monitor / 1000; // Converti in secondi
  document.getElementById('volumeMinMonitor').value = o.volumeMin || o.volumeMinMonitor;
  document.getElementById('volumeMax').value = o.volumeMax;
  
  
  document.getElementById('minVolumeMonitor').value = o.minVolumeMonitor;

  document.getElementById('buyAmount').value = o.buyAmount;
  document.getElementById('sellOffPanic').value = o.sellOffPanic;
  document.getElementById('maxTrxNumMonitor').value = o.maxTrxNumMonitor;
  document.getElementById('minTrxNumMonitor').value = o.minTrxNumMonitor;

  document.getElementById('netVolumeUpBuy').checked = o.netVolumeUpBuy;
  document.getElementById('quickBuyTrxNumb').value = o.quickBuyTrxNumb;
  document.getElementById('quickBuyVolumeUp').value = o.quickBuyVolumeUp;
  document.getElementById('quickBuyVolumeMin').value = o.quickBuyVolumeMin;

  document.getElementById('marketCapSolUpMode').checked = o.marketCapSolUpMode;
  document.getElementById('marketCapSolUpQuickBuy').value = o.marketCapSolUpQuickBuy;

  document.getElementById('priceSolUpMode').checked = o.priceSolUpMode;
  document.getElementById('priceSolUpQuickBuy').value = o.priceSolUpQuickBuy;
  document.getElementById('priceSolUpModeQuickBuyVolumeMin').value = o.priceSolUpModeQuickBuyVolumeMin;
  document.getElementById('priceSolUpModeQuickBuyVolumeNetMin').value = o.priceSolUpModeQuickBuyVolumeNetMin;

  // Imposta il checkbox rugpullxyz
  document.getElementById('website').checked = o.hasWeb_filter;
  document.getElementById('websitecheck').checked = o.hasWebCheck_filter;
  document.getElementById('Description').checked = o.hasDescription_filter;
  document.getElementById('TwitterOrTelegram').checked = o.hasTwitterOrTelegram_filter;
  document.getElementById('TwitterCheck').checked = o.hasTwitterCheck_filter;

  document.getElementById('demoversion').checked = o.demoVersion;
  document.getElementById('enableTrailing').checked = o.enableTrailing;
  document.getElementById('trailingPercent').value = o.trailingPercent;
  // Imposta il checkbox rugpullxyz

  if (o.rugpullxyz === 'true' || o.rugpullxyz === true){
    o.rugpullxyz = true; // Imposta default se non presente
    document.getElementById('enablerugpullxyz').checked = true;
  } else {document.getElementById('enablerugpullxyz').checked = false;}
  // Aggiorna la variabile globale refreshMs
  //refreshMs = o.clientRefreshMs;
}

let soundbutton;
let soundSystem;


async function saveConfig() {

  let slotSave=document.getElementById('save-category').value;

  const payload = {
    quickSellMultiplier: document.getElementById('quickSellMultiplier').value,
    quickSellMinTrades: document.getElementById('quickSellMinTrades').value,
    rugpullMaxTrades: document.getElementById('rugpullMaxTrades').value,
    rugpullMinGainMultiplier: document.getElementById('rugpullMinGainMultiplier').value,
   // enableTrailing: document.getElementById('enableTrailing').checked,
   // trailingPercent: document.getElementById('trailingPercent').value,
   // clientRefreshMs: document.getElementById('clientRefreshMs').value,
    liquidityMax: document.getElementById('liquidityMax').value,
    liquidityMin: document.getElementById('liquidityMin').value,
    devShare: document.getElementById('devShare').value / 100, // Converti in decimale
    marketcapMin: document.getElementById('marketcapMin').value,
    marketcapMax: document.getElementById('marketcapMax').value,
    rugpullxyz: document.getElementById('enablerugpullxyz').checked,
    time_monitor: document.getElementById('timeMonitor').value * 1000, // Converti in millisecondi 
    volumeMinMonitor: document.getElementById('volumeMinMonitor').value,
    minVolumeMonitor: document.getElementById('minVolumeMonitor').value,
    volumeMax: document.getElementById('volumeMax').value,

    netVolumeUpBuy: document.getElementById('netVolumeUpBuy').checked,
    quickBuyTrxNumb: document.getElementById('quickBuyTrxNumb').value,
    quickBuyVolumeUp: document.getElementById('quickBuyVolumeUp').value,
    quickBuyVolumeMin: document.getElementById('quickBuyVolumeMin').value,

    marketCapSolUpMode: document.getElementById('marketCapSolUpMode').checked,
    marketCapSolUpQuickBuy: document.getElementById('marketCapSolUpQuickBuy').value,
    priceSolUpMode: document.getElementById('priceSolUpMode').checked,
    priceSolUpQuickBuy: document.getElementById('priceSolUpQuickBuy').value,
    priceSolUpModeQuickBuyVolumeMin: document.getElementById('priceSolUpModeQuickBuyVolumeMin').value,
    priceSolUpModeQuickBuyVolumeNetMin: document.getElementById('priceSolUpModeQuickBuyVolumeNetMin').value,

    buyAmount: document.getElementById('buyAmount').value,
    sellOffPanic: document.getElementById('sellOffPanic').value,
    maxTrxNumMonitor: document.getElementById('maxTrxNumMonitor').value,
    minTrxNumMonitor : document.getElementById('minTrxNumMonitor').value,
    hasWeb_filter: document.getElementById('website').checked,
    hasWebCheck_filter: document.getElementById('websitecheck').checked,
    hasDescription_filter: document.getElementById('Description').checked,
    hasTwitterOrTelegram_filter: document.getElementById('TwitterOrTelegram').checked,
    demoVersion: document.getElementById('demoversion').checked,
    hasTwitterCheck_filter: document.getElementById('TwitterCheck').checked,
    enableTrailing: document.getElementById('enableTrailing').checked,
    trailingPercent: document.getElementById('trailingPercent').value,


  };

  localStorage.setItem(slotSave, JSON.stringify(payload));
  

}

async function loadConfig() {

  let slotSave=document.getElementById('save-category').value;

  const savedConfig = JSON.parse(localStorage.getItem(slotSave));
  //localStorage.setItem(slotSave, JSON.stringify(payload));
   let o=savedConfig;
    loadConf(o)

}


const soundOnOff= ()=>{
  let soundbutton=document.getElementById('SoundOnOff').checked;
  if(soundbutton){
    // Attiva il suono
    console.log("Suono attivato");
    soundSystem=true;
    localStorage.setItem("soundSystem", true);
  } else {
    // Disattiva il suono
    console.log("Suono disattivato");
    soundSystem=false;
    localStorage.setItem("soundSystem", false);
  }
}


const loadConf = async (o) => {
  
  document.getElementById('quickSellMultiplier').value = o.quickSellMultiplier;
  document.getElementById('quickSellMinTrades').value = o.quickSellMinTrades;
  document.getElementById('rugpullMaxTrades').value = o.rugpullMaxTrades;
  document.getElementById('rugpullMinGainMultiplier').value = o.rugpullMinGainMultiplier;
 // document.getElementById('enableTrailing').checked = !!o.enableTrailing;
 // document.getElementById('trailingPercent').value = o.trailingPercent;
  //document.getElementById('clientRefreshMs').value = o.clientRefreshMs;
  document.getElementById('liquidityMin').value = o.liquidityMin;
  document.getElementById('liquidityMax').value = o.liquidityMax
  document.getElementById('devShare').value = o.devShare* 100; // Converti in percentuale
  document.getElementById('marketcapMin').value = o.marketcapMin;
  document.getElementById('marketcapMax').value = o.marketcapMax;
  document.getElementById('timeMonitor').value = o.time_monitor / 1000; // Converti in secondi
  document.getElementById('volumeMinMonitor').value = o.volumeMin || o.volumeMinMonitor;
  document.getElementById('minVolumeMonitor').value = o.minVolumeMonitor;
  document.getElementById('volumeMax').value = o.volumeMax;

  document.getElementById('buyAmount').value = o.buyAmount;
  document.getElementById('sellOffPanic').value = o.sellOffPanic;
  document.getElementById('maxTrxNumMonitor').value = o.maxTrxNumMonitor;
  document.getElementById('minTrxNumMonitor').value = o.minTrxNumMonitor;

  document.getElementById('netVolumeUpBuy').checked = o.netVolumeUpBuy;
  document.getElementById('quickBuyTrxNumb').value = o.quickBuyTrxNumb;
  document.getElementById('quickBuyVolumeUp').value = o.quickBuyVolumeUp;
  document.getElementById('quickBuyVolumeMin').value = o.quickBuyVolumeMin;

   document.getElementById('marketCapSolUpMode').checked = o.marketCapSolUpMode;
  document.getElementById('marketCapSolUpQuickBuy').value = o.marketCapSolUpQuickBuy;

  document.getElementById('priceSolUpMode').checked = o.priceSolUpMode;
  document.getElementById('priceSolUpQuickBuy').value = o.priceSolUpQuickBuy;
  document.getElementById('priceSolUpModeQuickBuyVolumeMin').value = o.priceSolUpModeQuickBuyVolumeMin;
  document.getElementById('priceSolUpModeQuickBuyVolumeNetMin').value = o.priceSolUpModeQuickBuyVolumeNetMin;

  // Imposta il checkbox rugpullxyz
  document.getElementById('website').checked = o.hasWeb_filter;
  document.getElementById('websitecheck').checked = o.hasWebCheck_filter;
  document.getElementById('Description').checked = o.hasDescription_filter;
  document.getElementById('TwitterOrTelegram').checked = o.hasTwitterOrTelegram_filter;
  document.getElementById('TwitterCheck').checked = o.hasTwitterCheck_filter;

  document.getElementById('demoversion').checked = o.demoVersion;
  document.getElementById('enableTrailing').checked = o.enableTrailing;
  document.getElementById('trailingPercent').value = o.trailingPercent;
  document.getElementById('enablerugpullxyz').checked = o.rugpullxyz;

   if(localStorage.getItem("soundSystem")){
       soundSystem = localStorage.getItem("soundSystem");
   }else{
      soundSystem=document.getElementById('SoundOnOff').checked
      localStorage.setItem("soundSystem", soundSystem);
   }
  //localStorage.setItem("soundSystem", soundSystem);
}


document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ Pagina caricata!");

    soundbutton=document.getElementById('SoundOnOff');
    soundSystem=soundbutton.checked;
    soundbutton.addEventListener('change', soundOnOff);
    if(localStorage.getItem("myConfig")){
      // recupero
    const savedConfig = JSON.parse(localStorage.getItem("myConfig"));
    let o=savedConfig;
    loadConf(o)

    }
    
});

const socket = io();

		socket.on('connect', () => {
			console.log('🔌 Connesso al server con socket.io, ID:', socket.id);
		});

		socket.on('message', (data) => {
			console.log('📩 Messaggio dal server:', data);
		});

		socket.on('wallet', (data) => {
			//console.log('🆕 Nuovo token monitorato:', token);
			document.getElementById('walletSol').textContent = `${data.walletSol.toFixed(4)} SOL`
			// Qui puoi aggiornare la tua interfaccia utente con i dati del nuovo token
		});

		socket.on('event', (token) => {
			//console.log('🆕 Nuovo token monitorato:', token);
			const oraIt = new Date().toLocaleTimeString("it-IT", {
				timeZone: "Europe/Rome",
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit"
			});
			let logggerEl = document.getElementById("loggerEvent")

			logggerEl.textContent += "[" + oraIt + "] " + token + "\n";
			// Qui puoi aggiornare la tua interfaccia utente con i dati del nuovo token
			//let size = logggerEl.textLength;

		});

		socket.on('logger', (token) => {
			//console.log('🆕 Nuovo token monitorato:', token);

			const oraIt = new Date().toLocaleTimeString("it-IT", {
				timeZone: "Europe/Rome",
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit"
			});
			let logggerEl = document.getElementById("loggerHtml")

			logggerEl.textContent += "[" + oraIt + "] " + token + "\n";
			// Qui puoi aggiornare la tua interfaccia utente con i dati del nuovo token
			let size = logggerEl.textLength;
			logggerEl.scrollTop = logggerEl.scrollHeight;
			if (size > 90000) logggerEl.textContent = '0\n';
		});

		socket.on('notifyMe', (data) => {
			if (!soundSystem) return;
      playScale();
		})
		socket.on('tokenLogger', (token) => {
			//let date = new Date().toLocaleTimeString();
			//const audio = new Audio('../public/assetsClient/sounds/notification.mp3');

			let searchEl = document.getElementById(`log${token.id}`)
			// Check if the token already exists - search by id


			let defiExchange;
			if (token.token.mint.includes('BONK') || token.token.mint.includes('bonk')) {
				defiExchange = `<a href="https://bonk.fun/token/${token.token.mint}" target="_blank">Apri Pool</a>`;
			} else if (token.token.mint.includes('PUMP') || token.token.mint.includes('pump')) {
				defiExchange = `<a href="https://pump.fun/coin/${token.token.mint}" target="_blank">Apri Pool</a>`;
			} else {
				defiExchange = 'N/A';
			}

			const gain = ((token.LivePrice - token.buyPrice) / token.buyPrice) * 100;


			if (searchEl) {// fix se tova id da tokenmonitor element 
				// Update the existing row
				searchEl.cells[1].textContent = `${token.LivePrice}`;
				searchEl.cells[2].textContent = token.buyPrice;
				searchEl.cells[3].textContent = token.startPrice;
				searchEl.cells[4].textContent = token.highPrice;

				searchEl.cells[5].textContent = token.solTrxNum;
				//existingRow.cells[6].textContent = token.solTrxNumMonitor;

				searchEl.cells[7].textContent = token.marketCapSol.toFixed(2);
				searchEl.cells[8].textContent = token.volumeNet.toFixed(2);

				searchEl.cells[9].textContent = token.volume.toFixed(2);
				searchEl.cells[10].textContent = token.time;
				searchEl.cells[11].innerHTML = defiExchange;
				//existingRow.cells[12].innerHTML = defiExchange;

				searchEl.cells[13].innerHTML = `${gain.toFixed(2)}%`;

        searchEl.cells[15].innerHTML = `LiqDrop[${token.stats.liqDrop.toFixed(2)}] Speed[${token.stats.speedLiq.toFixed(2)}] Trx 1/s[${token.stats.tradesPerSec.toFixed(2)}] Trx/m[${token.stats.tradesPerMin}]`;
			} else {
				// Add a new row for the token
				let html = `<tr id='log${token.id}'>
								<td>${token.name}</td>
								<td>${token.LivePrice} SOL</td>
								<td>${token.buyPrice}</td>
								<td>${token.startPrice}</td>
								<td>${token.highPrice}</td>

								<td>${token.solTrxNum}</td>
								<td><button onclick="showTransactions('${token.token.mint}')">Vedi</button></td>

								<td>${token.marketCapSol.toFixed(3)}</td>
								<td>${token.volumeNet.toFixed(3)} SOL</td>

								<td>${token.volume.toFixed(3)} SOL</td>
								<td>${token.time}</td>

								<td>${defiExchange}</td>
								<td> <button onclick="showObject('${token.token.mint}')">info</button></td>

								<td>${gain.toFixed(2)}%</td>
                <td class='strat'>${token.strategy}</td>
                <td >LiqDrop[${token.stats.liqDrop.toFixed(2)}] Speed[${token.stats.speedLiq.toFixed(2)}] Trx 1/s[${token.stats.tradesPerSec.toFixed(2)}] Trx/m[${token.stats.tradesPerMin}]</td>

							</tr>`;
				document.getElementById("tokenMonitorBody").innerHTML += html;
			}

		})


		let timerRemoveEl = (tokenid) => {
			setTimeout(() => {

				let searchEl = document.getElementById(`mon${tokenid}`)
				searchEl.remove();
			}, 70000);
		}
		socket.on('tokenMonitor', (token) => {
			//console.log('🆕 Nuovo token monitorato:', token);

			if (!token.name) { token.name = 'N/A' }

			//let searchEl=document.querySelectorAll(`#tokenMonitorBody tr#${token.id}`)
			let searchEl = document.getElementById(`mon${token.id}`)
			// Check if the token already exists in the table
			/*
			let existingRow = Array.from(document.querySelectorAll("#tokenLoggerBody tr")).find(row => {
				return row.cells[0].textContent === token?.name;
			});*/

			let defiExchange;
			if (token.token.mint.includes('BONK') || token.token.mint.includes('bonk')) {
				defiExchange = `<a href="https://bonk.fun/token/${token.token.mint}" target="_blank">Apri Pool</a>`;
			} else if (token.token.mint.includes('PUMP') || token.token.mint.includes('pump')) {
				defiExchange = `<a href="https://pump.fun/coin/${token.token.mint}" target="_blank">Apri Pool</a>`;
			} else {
				defiExchange = 'N/A';
			}


			/*		if (existingRow) {
				// Update the existing row
				existingRow.cells[1].textContent = `${token.LivePrice}`;
				existingRow.cells[2].textContent = token.solTrxNumMonitor;
				existingRow.cells[3].textContent = token.marketCapSol.toFixed(2);
				existingRow.cells[4].textContent = token.volumeNet;
				existingRow.cells[5].textContent = token.volume;
				existingRow.cells[6].textContent = token.timee;
				existingRow.cells[7].innerHTML = `${defiExchange}`*/
			if (searchEl) {
				// Update the existing row
				searchEl.cells[1].textContent = `${token.LivePrice}`;
				searchEl.cells[2].textContent = token.solTrxNumMonitor;
				searchEl.cells[3].textContent = token.marketCapSol.toFixed(2);
				searchEl.cells[4].textContent = token.volumeNet;
				searchEl.cells[5].textContent = token.volume;
				searchEl.cells[6].textContent = token.time;
				searchEl.cells[7].innerHTML = `${defiExchange}`
			} else {
				// Add a new row for the token
				let html = `<tr id='mon${token.id}'>
								<td>${token?.name}</td>
								<td>${token.LivePrice} SOL</td>
								<td>${token.solTrxNumMonitor}</td>
								<td>${token.marketCapSol.toFixed(4)}</td>
								<td>${token.volumeNet.toFixed(2)} SOL</td>
								<td>${token.volume.toFixed(2)} SOL</td>
								<td>${token.time}</td>
								<td>${defiExchange}</td>
								
							</tr>`;
				document.getElementById("tokenLoggerBody").innerHTML += html;

				timerRemoveEl(token.id)

			}


		});

		socket.on('disconnect', () => {
			console.log('🔌 Disconnesso dal server');
		});

		function playBeep(frequency, duration = 500) {
			const audioContext = new (window.AudioContext || window.webkitAudioContext)();
			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();

			// Configura il tipo di suono e la frequenza
			oscillator.type = 'sine'; // Puoi provare anche 'square', 'triangle', 'sawtooth'
			oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime); // Frequenza in Hz

			// Configura il volume
			gainNode.gain.setValueAtTime(0.5, audioContext.currentTime); // Volume (0.1 = basso)

			// Collega l'oscillatore al gainNode e poi al contesto audio
			oscillator.connect(gainNode);
			gainNode.connect(audioContext.destination);

			// Avvia il suono
			oscillator.start();

			// Ferma il suono dopo la durata specificata
			setTimeout(() => {
				oscillator.stop();
				audioContext.close();
			}, duration);
		}

		// Esempio: Riproduci una scala musicale
		function playScale() {
			const notesTwo = [
				{ frequency: 392.00, duration: 400 }, // Sol
				{ frequency: 440.00, duration: 400 }, // La
				{ frequency: 493.88, duration: 400 }, // Si
				{ frequency: 523.25, duration: 600 }, // Do (ottava successiva)
				{ frequency: 493.88, duration: 400 }, // Si
				{ frequency: 440.00, duration: 400 }, // La
				{ frequency: 392.00, duration: 800 }, // Sol
				{ frequency: 440.00, duration: 400 }, // La
				{ frequency: 493.88, duration: 400 }, // Si
				{ frequency: 523.25, duration: 600 }, // Do (ottava successiva)
				{ frequency: 587.33, duration: 800 }  // Re
			];

			const myMusic = [
				{ frequency: 392.00, duration: 400 }, // Sol
				{ frequency: 392.00, duration: 200 }, // Sol
				{ frequency: 392.00, duration: 200 }, // Sol
				{ frequency: 440.00, duration: 400 }, // La
				{ frequency: 392.00, duration: 800 }, // Sol
				{ frequency: 493.88, duration: 500 }, // Si
				{ frequency: 523.25, duration: 500 }, // Do

			];

			let delayTwo = 0;
			myMusic.forEach(note => {
				setTimeout(() => playBeep(note.frequency, note.duration), delayTwo);
				delayTwo += note.duration;
			});
			/*
			const notes = [
				{ frequency: 261.63, duration: 500 }, // Do
				{ frequency: 293.66, duration: 500 }, // Re
				{ frequency: 329.63, duration: 500 }, // Mi
				{ frequency: 349.23, duration: 500 }, // Fa
				{ frequency: 392.00, duration: 500 }, // Sol
				{ frequency: 440.00, duration: 500 }, // La
				{ frequency: 493.88, duration: 500 }, // Si
				{ frequency: 523.25, duration: 500 }  // Do (ottava successiva)
			];
		
			let delay = 0;
			notes.forEach(note => {
				setTimeout(() => playBeep(note.frequency, note.duration), delay);
				delay += note.duration;
			});*/
		}

		// Esegui la scala musicale
