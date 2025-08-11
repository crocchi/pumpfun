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
  