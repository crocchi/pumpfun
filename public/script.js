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
        li.textContent = `${tx.time} - ${tx.type} @ ${tx.price}`;
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

  function copyToClipboard(text) {
    // Crea un elemento di input temporaneo
    const tempInput = document.createElement('input');
    tempInput.value = text; // Imposta il valore dell'input al testo da copiare
    document.body.appendChild(tempInput); // Aggiungi l'input al DOM
    tempInput.select(); // Seleziona il contenuto dell'input
    tempInput.setSelectionRange(0, 99999); // Per dispositivi mobili
    document.execCommand('copy'); // Copia il testo negli appunti
    document.body.removeChild(tempInput); // Rimuovi l'input temporaneo
    alert('Contratto copiato negli appunti: ' + text); // Mostra un messaggio di conferma
  }
  
  // Funzione per aggiornare la pagina ogni 10 secondi
setInterval(() => {
  location.reload(); // Ricarica la pagina
}, 10000); // 5000 millisecondi = 5 secondi