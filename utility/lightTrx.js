import { LIGHT_WALLET_API , botOptions } from '../config.js';
import {returnTokenLog } from '../httpServer.js'
/*
const response = await fetch("https://pumpportal.fun/api/trade?api-key=your-api-key-here", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        "action": "buy",            // "buy" or "sell"
        "mint": "your CA here",     // contract address of the token you want to trade
        "amount": 0.01,             // amount of SOL or tokens to trade
        "denominatedInSol": "true", // "true" if amount is SOL, "false" if amount is tokens
        "slippage": 10,             // percent slippage allowed
        "priorityFee": 0.00005,       // amount to use as Jito tip or priority fee
        "pool": "auto"              // exchange to trade on. "pump", "raydium", "pump-amm", "launchlab", "raydium-cpmm", "bonk" or "auto"
    })
});
const data = await response.json();  // JSON object with tx signature or error(s)
*/


// =======================
// CONFIGURAZIONE
// =======================
//.   en46wathencqavkre9bp2cvje9q6cturf90jppjk8xd6yrk8dgv38xkpenmmej9paru7gk3k9nb6adu3a4w58t37ett4rg9genn4mduje9b62m1gdhwngm2qct9pyxupchc6rtvf84ykuax92ynkke14medbu70qqad2b689tk68m35b1176khr9cu66x2mdnn72v9g89vkuf8
const API_KEY = LIGHT_WALLET_API; // ottienila dal Pump.fun portal
const AMOUNT_SOL = botOptions.buyAmount; // quantità in SOL che vuoi spendere
const SLIPPAGE = 10; // % massima slippage
const PRIORITY_FEE = 0.00005; // SOL per Jito tip / priority fee
const POOL = "auto"; // "pump", "raydium", ecc.
const TOKEN_AMOUNT = 0; // QNT di token acquistato

// =======================
// FUNZIONE PRINCIPALE
// =======================
export async function buyToken(mintToken) {
    try {
        const response = await fetch(`https://pumpportal.fun/api/trade?api-key=${API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "buy",
                mint: mintToken,
                amount: AMOUNT_SOL,
                denominatedInSol: "true", // true = AMOUNT_SOL è in SOL
                slippage: SLIPPAGE,
                priorityFee: PRIORITY_FEE,
                pool: POOL
            })
        });

        const data = await response.json();
       // console.log(data)
        if (response.ok) {
            console.log("✅ Transazione inviata!");
            
            console.log("Signature:", data.signature || JSON.stringify(data));
            return data.signature
        } else {
            console.error("❌ Errore:", data);
        }
    } catch (err) {
        console.error("Errore di connessione o fetch:", err);
    }
}
/*
👁️  Monitoraggio trade per WDOC (6QUqrsoZfVnKWE5fuFq16TvmjzLMZzakKeti1JYFpump) attivo per 3s
👁️  Nuovo trade sol:(0.06141074) di acquisto per 6QUqrsoZfVnKWE5fuFq16TvmjzLMZzakKeti1JYFpump da 53FjGt6zdFyDia16LKcSgG2Cegzqkn7NPFjAAm1hT6D
SOL: Promise { '0.0000000390' }

{
  signature: '3j4hcj6WmdKrGupkJsnpbruVr7RfpZ2qePop41vHJbrKYKgRzprChekZYBmXexURdGsqTCAiVFAj8cTR7AsaypYM',
  errors: []
}
✅ Transazione inviata! 

{
  signature: '672vYRsJwPD7HyLPJDzCoRaqAeRwYdaRHGshdEpkPB1iqrneDn59rTqxxNRvffS2BwcwSbwzj46FTMTagGktAieq',
  errors: []
}
✅ Transazione inviata!

Signature: 3j4hcj6WmdKrGupkJsnpbruVr7RfpZ2qePop41vHJbrKYKgRzprChekZYBmXexURdGsqTCAiVFAj8cTR7AsaypYM
trade: {
  signature: '3j4hcj6WmdKrGupkJsnpbruVr7RfpZ2qePop41vHJbrKYKgRzprChekZYBmXexURdGsqTCAiVFAj8cTR7AsaypYM',
  mint: '6QUqrsoZfVnKWE5fuFq16TvmjzLMZzakKeti1JYFpump',
  traderPublicKey: 'CsaevkbQLYnHeu3LnEMz1ZiL95sPU8ezEryJrr1AaniG',
  txType: 'buy',
  tokenAmount: 512474.726148,
  solAmount: 0.02,
  newTokenBalance: 512474.726148,
  bondingCurveKey: '3MueiWvtboyVn7x8Er99mhR4rFUGPN2mgvDEbYYLpNMR',
  vTokensInBondingCurve: 907944256.68719,
  vSolInBondingCurve: 35.45371840056727,
  marketCapSol: 39.048342604123086,
  pool: 'pump'
}
(WinDogeOSCoin)📊 Trade su 6QUqrsoZfVnKWE5fuFq16TvmjzLMZzakKeti1JYFpump: buy - 512474.726148- SOL:0.02

*/


export async function sellToken(mintToken ,sol_or_not=false) {
    try {
        let totAmountToSell=await returnTokenLog(mintToken)
        const response = await fetch(`https://pumpportal.fun/api/trade?api-key=${API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "sell",
                mint: mintToken,
                amount: totAmountToSell.buySign[1].tokenAmount-1 || AMOUNT_SOL*1.5 ,
                denominatedInSol: sol_or_not, // true = AMOUNT_SOL è in SOL
                slippage: SLIPPAGE,
                priorityFee: PRIORITY_FEE,
                pool: POOL
            })
        });

        const data = await response.json();
        console.log(data)
        if (response.ok) {
            console.log("✅ Transazione inviata!");
            
            console.log("Signature:", data.signature || JSON.stringify(data));
        } else {
            console.error("❌ Errore:", data);
        }
    } catch (err) {
        console.error("Errore di connessione o fetch:", err);
    }
}



