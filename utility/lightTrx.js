import { LIGHT_WALLET_API , botOptions } from '../config.js';
import {returnTokenLog } from '../httpServer.js'
import {getInstanceForTokenLogger} from '../index.js'
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

Errore di connessione o fetch: TypeError: Cannot read properties of undefined (reading 'tokenAmount')
📊 RUgPool - vendi Mylo: gain  buy at 0.0000000617 -- sold at  0.0000000765
🚫 Unsubscribed da GuhPErYHfnHGYLMYUeY19u4jX4TzAR2Afc52Z72Dpump venduto!!)
(Mylo)📊 Trade su GuhPErYHfnHGYLMYUeY19u4jX4TzAR2Afc52Z72Dpump: buy - 981919.275246- SOL:0.07505 price:0.0000000765
    at sellToken (file:///opt/render/project/src/utility/lightTrx.js:120:52)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)

*/


// =======================
// CONFIGURAZIONE
// =======================
//.   en46wathencqavkre9bp2cvje9q6cturf90jppjk8xd6yrk8dgv38xkpenmmej9paru7gk3k9nb6adu3a4w58t37ett4rg9genn4mduje9b62m1gdhwngm2qct9pyxupchc6rtvf84ykuax92ynkke14medbu70qqad2b689tk68m35b1176khr9cu66x2mdnn72v9g89vkuf8
const API_KEY = LIGHT_WALLET_API; // ottienila dal Pump.fun portal
//const AMOUNT_SOL = botOptions.buyAmount; // quantità in SOL che vuoi spendere
const SLIPPAGE = 10; // % massima slippage
const PRIORITY_FEE = 0.00005; // SOL per Jito tip / priority fee
const POOL = "auto"; // "pump", "raydium", ecc.
const TOKEN_AMOUNT = 0; // QNT di token acquistato
//const demoVersion=botOptions.demoVersion;

// =======================
// FUNZIONE PRINCIPALE
// =======================
export async function buyToken(token , retryCount = 1, timercount = 1000) {
if(botOptions.demoVersion) return false
    try {
        const response = await fetch(`https://pumpportal.fun/api/trade?api-key=${API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "buy",
                mint: token.mint,
                amount: botOptions.buyAmount,
                denominatedInSol: "true", // true = AMOUNT_SOL è in SOL
                slippage: SLIPPAGE,
                priorityFee: PRIORITY_FEE,
                pool: token.pool || POOL
            })
        });

        const data = await response.json();
        if(data.errors.length>0){ // se ci sono errori
            throw new Error(data.errors.join(", "));
        }
       // console.log(data)
        if (response.ok) {
            console.log("✅ Transazione inviata!");
            
            console.log("Signature:", data.signature || JSON.stringify(data));
            return data.signature
        } else {
            console.error("❌ Errore:", data);
            throw new Error("Errore nella risposta del server");
        }
    } catch (err) {
        console.error("Errore di connessione o fetch:", err);
         if (retryCount < 4) { // Limita il numero di tentativi a 3
            console.log(`Riprovo a comprare il token tra ${timercount / 1000} sec... Tentativo ${retryCount + 1}`);
            setTimeout(() => buyToken(token, retryCount + 1, timercount + 1000), timercount);
        } else {
            console.error("❌ Numero massimo di tentativi raggiunto. Operazione fallita.");
        }
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


export async function sellToken(token ,sol_or_not=false,retryCount = 1, timercount = 1000) {
   if(botOptions.demoVersion) return false;
   let tokenLog = await getInstanceForTokenLogger(token);
    try {
        let totAmountToSell=await returnTokenLog(token.mint);
        let amountToSell=tokenLog.tokenAmount || totAmountToSell.buySign[1]?.tokenAmount ;
        const response = await fetch(`https://pumpportal.fun/api/trade?api-key=${API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "sell",
                mint: token.mint,
                amount: amountToSell ,
                denominatedInSol: sol_or_not, // true = AMOUNT_SOL è in SOL
                slippage: SLIPPAGE,
                priorityFee: PRIORITY_FEE,
                pool: token.pool || POOL
            })
        });

        const data = await response.json();
        console.log(data)
        if(data.errors.length>0){ // se ci sono errori
            throw new Error(data.errors.join(", "));
        }
        if (response.ok) {
            console.log("✅ Transazione inviata!");
            
            console.log("Signature:", data.signature || JSON.stringify(data));
            return data.signature
        } else {
            console.error("❌ Errore:", data);
            throw new Error("Errore nella risposta del server");
        }
    } catch (err) {
        console.error("Errore di connessione o fetch:", err);
        if (retryCount < 4) { // Limita il numero di tentativi a 3
            console.log(`Riprovo a vendere il token tra ${timercount / 1000} sec... Tentativo ${retryCount + 1}`);
            setTimeout(() => sellToken(token, sol_or_not, retryCount + 1, timercount + 1000), timercount);
        } else {
            console.error("❌ Numero massimo di tentativi raggiunto. Operazione fallita.");
        }
    }
}



/*
(MEOJI)📊 Trade su 3ARRZCGqZCihkm1jTaPA3hcU32MWnJrNxnjNQ4Sipump: buy - 11453683.534209- SOL:0.95 price:0.0000000845
📊 vendi MEOJI: gain  buy at 0.0000000310 -- sold at  0.0000000845
🚫 Unsubscribed da 3ARRZCGqZCihkm1jTaPA3hcU32MWnJrNxnjNQ4Sipump venduto!!)
{
  signature: '2x1japY1iU7R6Z8pCT5TwrDpiN8UdRdJxUmEp1JU8WSBMY4cQcUVzrWWRPwrDD7Q7cAevRebwcTUsVqECnaCX67q',
  errors: []
}
✅ Transazione inviata!



✅ Transazione inviata!
Signature: 49eiTR2iES5K7WzaFyxz48gqdxhqVLJCeo4hnHryoK3NFoHB2f9dVWLYAfNAi1ivQxPBBNdxhnFZ6Vht2CZHxuuU

📊 RUgPool - vendi China Man Currency : gain  buy at 0.0000000334 -- sold at  0.0000000660
🚫 Unsubscribed da HXSsiNMjvbT6HwMxvKggMcGCbbFP4N3ggbqNCJF4pump venduto!!)
{
  errors: [
    'Attempted to trade 0.06 tokens. Trades must buy or sell at least 1 token'
  ]
}
✅ Transazione inviata!
Signature: {"errors":["Attempted to trade 0.06 tokens. Trades must buy or sell at least 1 token"]}

*/