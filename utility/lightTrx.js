

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



// =======================
// CONFIGURAZIONE
// =======================
const API_KEY = "INSERISCI-LA-TUA-API-KEY-QUI"; // ottienila dal Pump.fun portal
const MINT = "INSERISCI-CONTRACT-ADDRESS-DEL-TOKEN"; // es: 9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E
const AMOUNT_SOL = 0.01; // quantità in SOL che vuoi spendere
const SLIPPAGE = 10; // % massima slippage
const PRIORITY_FEE = 0.00005; // SOL per Jito tip / priority fee
const POOL = "auto"; // "pump", "raydium", ecc.

// =======================
// FUNZIONE PRINCIPALE
// =======================
async function buyToken() {
    try {
        const response = await fetch(`https://pumpportal.fun/api/trade?api-key=${API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "buy",
                mint: MINT,
                amount: AMOUNT_SOL,
                denominatedInSol: "true", // true = AMOUNT_SOL è in SOL
                slippage: SLIPPAGE,
                priorityFee: PRIORITY_FEE,
                pool: POOL
            })
        });

        const data = await response.json();

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

// Esegui
buyToken();


*/