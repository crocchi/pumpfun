import axios from "axios";

/**
 * Controlla il rischio rugpull usando rugcheck.xyz per un token su Pump.fun
 * @param {string} mint - Mint address del token (es: AxVN72gnKbdwktrRsDRC7ERQnWjhBjerPNaPVxWxpump)
 * @returns {Promise<object|null>} - Oggetto con valutazione o null se errore
 */
export async function checkRugRisk(mint) {
    const start = performance.now();
  const url = `https://api.rugcheck.xyz/v1/tokens/${mint}/report/summary`;

  try {
    const res = await axios.get(url, {
      headers: {
        accept: "application/json",
      },
    });

    const data = res.data;
    //console.log(`RugCheck API risposta per ${mint}:`, data);
    const end = performance.now();
    if (data.risks.length === 0) {
      console.warn(`⚠️ Nessun punteggio rugpull trovato per ${mint}`);
      return null;
    }
    console.log(`⏱️ Tempo di esecuzione: ${(end - start).toFixed(2)} ms`);
    return data
  } catch (error) {
    console.warn(`⚠️ RugCheck API errore per ${mint}:`, error.response?.data || error.message);
    return null;
  }
}
/*RugCheck API risposta per DKeKj1mnYyCs8LcgGnnWhVgDUreetWna2PpNyKxAQuui: {
  tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  tokenType: '',
  risks: [
    {
      name: 'Creator history of rugged tokens',
      value: '',
      description: 'Creator has a history of rugging tokens.',
      score: 120000,
      level: 'danger'
    }
  ],
  score: 120001,
  score_normalised: 80,
  lpLockedPct: 100
} */