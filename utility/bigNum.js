import BN from "bn.js";

/**
 * Converte un valore BN in un numero leggibile
 * @param {BN} bnVal - Valore BigNumber
 * @param {number} decimals - Decimali del token (es: 9 per SOL, 6 per USDC)
 * @returns {number} - Quantità leggibile
 */
function decodeBN(bnVal, decimals) {
  if (!bnVal) return 0;
  return parseFloat(bnVal.toString()) / (10 ** decimals);
}

// --- ESEMPIO USO ---

// Valori come appaiono nei log Anchor
/*
const amount_in = new BN("26cc1930", 16);       // 0x26cc1930 → 650000000
const minimum_amount_out = new BN("7ace4fa5fa19", 16);
const share_fee_rate = new BN("0", 16);

// Supponiamo che sia SOL (9 decimali)
const solDecimals = 9;

// Conversione
console.log("Amount In (SOL):", decodeBN(amount_in, solDecimals));
console.log("Min Amount Out (SOL):", decodeBN(minimum_amount_out, solDecimals));
console.log("Share Fee Rate:", share_fee_rate.toString());
*/

// Esporta la funzione per l'uso in altri moduli
export { decodeBN };