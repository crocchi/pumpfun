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
  
  // Funzione per aggiornare la pagina ogni 10 secondi
setInterval(() => {
  location.reload(); // Ricarica la pagina
}, 120000000); // 5000 millisecondi = 5 secondi


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
    netVolumeUpBuy: document.getElementById('netVolumeUpBuy').checked,
    buyAmount: document.getElementById('buyAmount').value,
    maxTrxNumMonitor: document.getElementById('maxTrxNumMonitor').value,
    minTrxNumMonitor : document.getElementById('minTrxNumMonitor').value,
    hasWeb_filter: document.getElementById('website').checked,
    hasWebCheck_filter: document.getElementById('websitecheck').checked,
    hasDescription_filter: document.getElementById('Description').checked,
    hasTwitterOrTelegram_filter: document.getElementById('TwitterOrTelegram').checked,
    demoVersion: document.getElementById('demoversion').checked,
    hasTwitterCheck_filter: document.getElementById('TwitterCheck').checked,
  };
  const r = await fetch('/bot-options', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await r.json();
  if (data.ok) {
    refreshMs = data.botOptions.clientRefreshMs;
  }
  return false;
}

async function loadOptions() {
  const r = await fetch('/bot-options');
  const o = await r.json();
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
  document.getElementById('volumeMinMonitor').value = o.volumeMin;
  document.getElementById('buyAmount').value = o.buyAmount;
  document.getElementById('maxTrxNumMonitor').value = o.maxTrxNumMonitor;
  document.getElementById('minTrxNumMonitor').value = o.minTrxNumMonitor;
  document.getElementById('netVolumeUpBuy').checked = o.netVolumeUpBuy;
  // Imposta il checkbox rugpullxyz
  document.getElementById('website').checked = o.hasWeb_filter;
  document.getElementById('websitecheck').checked = o.hasWebCheck_filter;
  document.getElementById('Description').checked = o.hasDescription_filter;
  document.getElementById('TwitterOrTelegram').checked = o.hasTwitterOrTelegram_filter;
  document.getElementById('TwitterCheck').checked = o.hasTwitterCheck_filter;

  document.getElementById('demoversion').checked = o.demoVersion;

  if (o.rugpullxyz === 'true' || o.rugpullxyz === true){
    o.rugpullxyz = true; // Imposta default se non presente
    document.getElementById('enablerugpullxyz').checked = true;
  } else {document.getElementById('enablerugpullxyz').checked = false;}
  // Aggiorna la variabile globale refreshMs
  //refreshMs = o.clientRefreshMs;
}
