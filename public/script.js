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
}, 60000); // 5000 millisecondi = 5 secondi