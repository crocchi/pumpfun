import axios from "axios";

/**
 * Controlla il rischio rugpull usando rugcheck.xyz per un token su Pump.fun
 * @param {string} mint - Mint address del token (es: AxVN72gnKbdwktrRsDRC7ERQnWjhBjerPNaPVxWxpump)
 * @returns {Promise<object|null>} - Oggetto con valutazione o null se errore
 */
export async function checkRugRisk(mint) {
  const url = `https://api.rugcheck.xyz/v1/tokens/${mint}/report/summary`;

  try {
    const res = await axios.get(url, {
      headers: {
        accept: "application/json",
      },
    });

    const data = res.data;

    return {
      riskLevel: data.rugpull_score?.risk_level || "unknown",
      score: data.rugpull_score?.score || null,
      scoreColor: data.rugpull_score?.score_color || "#999",
      supplyLocked: data.token_distribution?.supply_locked,
      ownerBalance: data.token_distribution?.owner_balance,
    };
  } catch (error) {
    console.warn(`⚠️ RugCheck API errore per ${mint}:`, error.response?.data || error.message);
    return null;
  }
}
