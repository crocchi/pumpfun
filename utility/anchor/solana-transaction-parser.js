import { Connection, PublicKey } from "@solana/web3.js";
import { SolanaParser } from "@shyft-to/solana-transaction-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { RPC_URL_SOLANA, RPC_URL_HELIUS } from '../../config.js';
import { getTransactionInfo } from '../../moralis.js';
import { decodeBN } from '../bigNum.js';

//import raydiumLaunchpadIdl from "./idl-.json";
const TOKEN_CONTRACT = [
  { "symbol": "USDC", "address": "USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB", "decimals": 9 },//World Liberty Financial USD
]

const connection = new Connection(RPC_URL_HELIUS, "confirmed");

// Carichi l’IDL del Launchpad (salvato prima da Solscan in raydium_launchpad.json)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const idlPath = path.join(__dirname, "IDL-.json");
const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
// Carichi l’IDL del Launchpad (salvato prima da Solscan in raydium_launchpad.json)

// Ini
// Inizializzi il parser
const parser = new SolanaParser([]);
const PROGRAM_ID = new PublicKey("LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj");
let lastMessageTime;
// Aggiungi il parser basato su IDL
parser.addParserFromIdl(PROGRAM_ID.toBase58(), idl);


export async function parseLaunchpadLogs(logs) {
  // Decodifica i logs
  //const parsed = parser.parseLogs(logs);
  //  console.log("Parsed Logs:", JSON.stringify(parsed, null, 2));

  const paredIxs = parser.parseTransactionData(logs
  );
  // Filtra quelli relativi alla "creazione" token
  console.log("Parsed Ixs:", JSON.stringify(paredIxs, null, 2));
  //const name = parsed.find(ix => ix.name === "name");
}

export async function parseLaunchpadTx(signature, trx) {
  let tx, lastMessageTimeNow;
  if (!trx) {
    lastMessageTimeNow = Date.now();
    if (lastMessageTime && (lastMessageTimeNow - lastMessageTime) < 2000) {
      console.log("Aspetta almeno 2 secondi tra le richieste per evitare rate limit.");
      return { valid: false };
    }
    tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed"//confirmed - processed
    });

    if (!tx) {
      console.log("Transazione non trovata");
      //tx=await getTransactionInfo(signature)
      return { valid: false };
    }
  } else { tx = trx; }
  lastMessageTime = lastMessageTimeNow;
  // Decodifica le istruzioni
  const parsed = parser.parseTransactionWithInnerInstructions(tx);
  //console.log("Parsed Transaction:", JSON.stringify(parsed, null, 2));


  // Filtra quelle che indicano una "creazione" token
  //const creates = parsed.filter(ix => ix.name?.toLowerCase().includes("create"));
  const quote_mint = parsed.find(ix => ix.name === "quote_mint");
  const base_mint = parsed.find(ix => ix.name === "base_mint");
  //const name = parsed.find(ix => ix.name === "name");

  const base_mint_param = parsed.find(ix => ix.name === "initialize_v2");//name: 'initialize_v2',
  const buy_exact_in = parsed.find(ix => ix.name === "buy_exact_in"); //  name: 'buy_exact_in',

  let qt, amount_in, creator;
  if (buy_exact_in) {

    const quote_token_mint = buy_exact_in.accounts.find(ix => ix.name === "quote_token_mint");
    creator = buy_exact_in.accounts.find(ix => ix.name === "creator");//
    amount_in = decodeBN(buy_exact_in.args.amount_in, base_mint_param.args.base_mint_param.decimals);

    if (quote_token_mint) {
      qt = TOKEN_CONTRACT.find(t => t.address === quote_token_mint.pubkey.toBase58());

    }
    console.log("Creator:", creator?.pubkey.toBase58());
    console.log("Quote Token Mint:", qt?.symbol);
    console.log("Minimum Amount Out:", decodeBN(buy_exact_in.args.minimum_amount_out, base_mint_param.args.base_mint_param.decimals));
    console.log("Amount In:", amount_in);
    //console.log("Buy Exact In:", JSON.stringify(buy_exact_in, null, 2));
  }
  if (base_mint_param) {
    console.log("Name:", base_mint_param.args.base_mint_param.name);
    console.log("Symbol:", base_mint_param.args.base_mint_param.symbol);
    console.log("URI:", base_mint_param.args.base_mint_param.uri);
    console.log("Decimals:", base_mint_param.args.base_mint_param.decimals);
    // console.log(JSON.stringify(base_mint_param, null, 2));
  }
  //a[0].args.quote_mint_param
  //a[0].args.base_mint_param
  if (quote_mint) {
    console.log("Quote Mint:", quote_mint.parsed?.mint);
  }
  if (base_mint) {
    console.log("Base Mint:", base_mint.parsed?.mint);
  }
  //console.log("Istruzioni decodificate:", parsed);
  // console.log("Eventuali CREATE trovate:", creates);
  return {
    valid: true,
    name: base_mint_param?.args.base_mint_param.name,
    symbol: base_mint_param?.args.base_mint_param.symbol,
    uri: base_mint_param?.args.base_mint_param.uri,
    decimals: base_mint_param?.args.base_mint_param.decimals,
    creator: creator?.pubkey.toBase58(),
    quote_token: qt?.symbol,
    usdtAmount: amount_in,
    minimum_amount_out: decodeBN(buy_exact_in?.args.minimum_amount_out, base_mint_param?.args.base_mint_param.decimals),
  }
}


const idlPathPump = path.join(__dirname, "idl-pumpfun.json");
const idlPump = JSON.parse(fs.readFileSync(idlPathPump, "utf8"));
// Carichi l’IDL del Launchpad (salvato prima da Solscan in raydium_launchpad.json)

// Ini
// Inizializzi il parser
const parserPump = new SolanaParser([]);
const PROGRAM_ID_PUMP = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");

// Aggiungi il parser basato su IDL
parserPump.addParserFromIdl(PROGRAM_ID_PUMP.toBase58(), idlPump);



export async function parseTrx(signature, poolDecodeTrx = "pumpfun") {
  let tx, lastMessageTimeNow;

  lastMessageTimeNow = Date.now();
  if (lastMessageTime && (lastMessageTimeNow - lastMessageTime) < 2000) {
    console.log("Aspetta almeno 2 secondi tra le richieste per evitare rate limit.");
    return { valid: false };
  }
  tx = await connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed"//confirmed - processed
  });
  lastMessageTime = lastMessageTimeNow;
  if (!tx) {
    console.log("Transazione non trovata");
    return { valid: false };
  }


  // Decodifica le istruzioni
  const parsed = parserPump.parseTransactionWithInnerInstructions(tx);

  //filtra tutti i transfer
  const transfers = parsed.filter(ix => ix.name === "transfer");

  //analizza le istruzioni.
  //console.log(transfers)
  console.log("Transaction:", transfers);
  // controlla jito fee
  let jitoFee = transfers[0]//transfers.find(ix => ix?.accounts.some(account => account?.pubkey === "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt"));
  //console.log('jitofee:',jitoFee)
  let feeJito = decodeBN(jitoFee.args.lamports, 9);
  jitoFee = feeJito || 0; // in sol

  let buyAmountQnt=0;
  let buyAmount = transfers[3]//transfers.find(ix => ix?.accounts.some(account => account?.pubkey === "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt"));
  if(buyAmount?.args){
     buyAmountQnt = decodeBN(buyAmount.args.lamports, 9);
  }else{
    buyAmountQnt=-1;
  }
/*file:///Pumpfun/utility/anchor/solana-transaction-parser.js:177
  let buyAmountQnt = decodeBN(buyAmount.args.lamports, 9);
                                        ^
TypeError: Cannot read properties of undefined (reading 'args')
    at parseTrx (file:///Pumpfun/utility/anchor/solana-transaction-parser.js:177:41)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
 */


  // totale di token acquistati...
  const tokenAmountBuy = parsed.find(ix => ix.args.amount); //  hex number
  const decimals = 6; // Decimali del token (es. USDC)
  //const decimalAmount = BigInt(`0x${tokenAmountBuy.args.amount}`).toString();
  //const realAmount = (Number(decimalAmount) / Math.pow(10, decimals)).toFixed(decimals);
  const realAmount = decodeBN(tokenAmountBuy.args.amount, decimals);

  const createAssociatedTokenAccount = parsed.find(ix => ix.name === "createAssociatedTokenAccount"); //  name: 'buy_exact_in',
  const quote_token_mint = createAssociatedTokenAccount.accounts.find(ix => ix.name === "tokenMint");
  //quote_token_mint.pubkey.toBase58(). contratto del token

  //"name": "createAssociatedTokenAccount",


  console.log(`
  ToT Acquistato: ${realAmount} 
  Qnt Acquistata: ${buyAmountQnt} SOL
  Prezzo per token: ${(buyAmountQnt / realAmount).toFixed(10)} SOL
  TokenMint: ${quote_token_mint.pubkey.toBase58()}
  Fee Jito6: ${jitoFee} SOL
  
  
  `);
return {
    valid: true,
    totBuyToken: realAmount,
    totBuySol: buyAmountQnt,
    priceBuy: (buyAmountQnt / realAmount).toFixed(10),
    feeJito6: jitoFee,
    mint: quote_token_mint.pubkey.toBase58(),
  }
  // console.log("Parsed Transaction:", JSON.stringify(parsed, null, 2));
}
// 🔍 esempio con una signature che hai già loggato
//parseLaunchpadTx("2Wjfv2thD2McR19cVpMcg8R6Ra6Qk2gYEnjJJ65Bgvnx7HE19SxhJ92ruhENAGKawZvsJTyNVgUNnk6nCzZKaDi4");
/*    programId: PublicKey [PublicKey(TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)] {


2025-10-08 20:15:16.417 | Parsed Transaction: [
2025-10-08 20:15:16.417 |   {
2025-10-08 20:15:16.417 |     "name": "setComputeUnitLimit",
2025-10-08 20:15:16.417 |     "accounts": [],
2025-10-08 20:15:16.417 |     "args": {
2025-10-08 20:15:16.417 |       "units": 145000
2025-10-08 20:15:16.417 |     },
2025-10-08 20:15:16.417 |     "programId": "ComputeBudget111111111111111111111111111111"
2025-10-08 20:15:16.417 |   },
2025-10-08 20:15:16.417 |   {
2025-10-08 20:15:16.417 |     "name": "setComputeUnitPrice",
2025-10-08 20:15:16.417 |     "accounts": [],
2025-10-08 20:15:16.417 |     "args": {
2025-10-08 20:15:16.417 |       "microLamports": "019418"
2025-10-08 20:15:16.417 |     },
2025-10-08 20:15:16.417 |     "programId": "ComputeBudget111111111111111111111111111111"
2025-10-08 20:15:16.417 |   },
2025-10-08 20:15:16.417 |   {
2025-10-08 20:15:16.417 |     "name": "transfer",
2025-10-08 20:15:16.417 |     "accounts": [
2025-10-08 20:15:16.417 |       {
2025-10-08 20:15:16.417 |         "name": "from",
2025-10-08 20:15:16.417 |         "pubkey": "CsaevkbQLYnHeu3LnEMz1ZiL95sPU8ezEryJrr1AaniG",
2025-10-08 20:15:16.417 |         "isSigner": true,
2025-10-08 20:15:16.417 |         "isWritable": true
2025-10-08 20:15:16.417 |       },
2025-10-08 20:15:16.417 |       {
2025-10-08 20:15:16.417 |         "name": "to",
2025-10-08 20:15:16.417 |         "pubkey": "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
2025-10-08 20:15:16.417 |         "isWritable": true,
2025-10-08 20:15:16.417 |         "isSigner": false
2025-10-08 20:15:16.417 |       }
2025-10-08 20:15:16.417 |     ],
2025-10-08 20:15:16.417 |     "args": {
2025-10-08 20:15:16.417 |       "lamports": "88b8"
2025-10-08 20:15:16.417 |     },
2025-10-08 20:15:16.417 |     "programId": "11111111111111111111111111111111"
2025-10-08 20:15:16.417 |   },
2025-10-08 20:15:16.417 |   {
2025-10-08 20:15:16.417 |     "name": "createAssociatedTokenAccount",
2025-10-08 20:15:16.417 |     "accounts": [
2025-10-08 20:15:16.417 |       {
2025-10-08 20:15:16.417 |         "name": "fundingAccount",
2025-10-08 20:15:16.417 |         "isSigner": true,
2025-10-08 20:15:16.417 |         "isWritable": true,
2025-10-08 20:15:16.417 |         "pubkey": "CsaevkbQLYnHeu3LnEMz1ZiL95sPU8ezEryJrr1AaniG"
2025-10-08 20:15:16.417 |       },
2025-10-08 20:15:16.417 |       {
2025-10-08 20:15:16.417 |         "name": "newAccount",
2025-10-08 20:15:16.417 |         "isSigner": false,
2025-10-08 20:15:16.417 |         "isWritable": true,
2025-10-08 20:15:16.417 |         "pubkey": "BGRQ12SBMotAGaE4BcS6EytGt4Y6yVnRARA3YCDYvGWe"
2025-10-08 20:15:16.417 |       },
2025-10-08 20:15:16.417 |       {
2025-10-08 20:15:16.417 |         "name": "wallet",
2025-10-08 20:15:16.417 |         "isSigner": true,
2025-10-08 20:15:16.417 |         "isWritable": true,
2025-10-08 20:15:16.417 |         "pubkey": "CsaevkbQLYnHeu3LnEMz1ZiL95sPU8ezEryJrr1AaniG"
2025-10-08 20:15:16.417 |       },
2025-10-08 20:15:16.417 |       {
2025-10-08 20:15:16.417 |         "name": "tokenMint",
2025-10-08 20:15:16.417 |         "isSigner": false,
2025-10-08 20:15:16.417 |         "isWritable": false,
2025-10-08 20:15:16.417 |         "pubkey": "HXSsiNMjvbT6HwMxvKggMcGCbbFP4N3ggbqNCJF4pump"
2025-10-08 20:15:16.417 |       },
2025-10-08 20:15:16.417 |       {
2025-10-08 20:15:16.417 |         "name": "systemProgram",
2025-10-08 20:15:16.417 |         "isSigner": false,
2025-10-08 20:15:16.417 |         "isWritable": false,
2025-10-08 20:15:16.417 |         "pubkey": "11111111111111111111111111111111"
2025-10-08 20:15:16.417 |       },
2025-10-08 20:15:16.417 |       {
2025-10-08 20:15:16.417 |         "name": "tokenProgram",
2025-10-08 20:15:16.417 |         "isSigner": false,
2025-10-08 20:15:16.417 |         "isWritable": true,
2025-10-08 20:15:16.417 |         "pubkey": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
2025-10-08 20:15:16.417 |       },
2025-10-08 20:15:16.417 |       null
2025-10-08 20:15:16.417 |     ],
2025-10-08 20:15:16.417 |     "args": {},
2025-10-08 20:15:16.417 |     "programId": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
2025-10-08 20:15:16.417 |   },
2025-10-08 20:15:16.417 |   {
2025-10-08 20:15:16.417 |     "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
2025-10-08 20:15:16.417 |     "name": "unknown",
2025-10-08 20:15:16.417 |     "accounts": [
2025-10-08 20:15:16.417 |       {
2025-10-08 20:15:16.417 |         "isSigner": false,
2025-10-08 20:15:16.417 |         "isWritable": false,
2025-10-08 20:15:16.417 |         "pubkey": "HXSsiNMjvbT6HwMxvKggMcGCbbFP4N3ggbqNCJF4pump"
2025-10-08 20:15:16.417 |       }
2025-10-08 20:15:16.417 |     ],
2025-10-08 20:15:16.418 |     "args": {
2025-10-08 20:15:16.418 |       "unknown": {
2025-10-08 20:15:16.418 |         "type": "Buffer",
2025-10-08 20:15:16.418 |         "data": [
2025-10-08 20:15:16.418 |           21,
2025-10-08 20:15:16.418 |           7,
2025-10-08 20:15:16.418 |           0
2025-10-08 20:15:16.418 |         ]
2025-10-08 20:15:16.418 |       }
2025-10-08 20:15:16.418 |     },
2025-10-08 20:15:16.418 |     "parentProgramId": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
2025-10-08 20:15:16.418 |   },
2025-10-08 20:15:16.418 |   {
2025-10-08 20:15:16.418 |     "name": "createAccount",
2025-10-08 20:15:16.418 |     "accounts": [
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "name": "from",
2025-10-08 20:15:16.418 |         "pubkey": "CsaevkbQLYnHeu3LnEMz1ZiL95sPU8ezEryJrr1AaniG",
2025-10-08 20:15:16.418 |         "isSigner": true,
2025-10-08 20:15:16.418 |         "isWritable": true
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "name": "to",
2025-10-08 20:15:16.418 |         "pubkey": "BGRQ12SBMotAGaE4BcS6EytGt4Y6yVnRARA3YCDYvGWe",
2025-10-08 20:15:16.418 |         "isSigner": true,
2025-10-08 20:15:16.418 |         "isWritable": true
2025-10-08 20:15:16.418 |       }
2025-10-08 20:15:16.418 |     ],
2025-10-08 20:15:16.418 |     "args": {
2025-10-08 20:15:16.418 |       "lamports": "1f1df0",
2025-10-08 20:15:16.418 |       "owner": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
2025-10-08 20:15:16.418 |       "space": "a5"
2025-10-08 20:15:16.418 |     },
2025-10-08 20:15:16.418 |     "programId": "11111111111111111111111111111111",
2025-10-08 20:15:16.418 |     "parentProgramId": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
2025-10-08 20:15:16.418 |   },
2025-10-08 20:15:16.418 |   {
2025-10-08 20:15:16.418 |     "name": "initializeImmutableOwner",
2025-10-08 20:15:16.418 |     "accounts": [
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "name": "account",
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "BGRQ12SBMotAGaE4BcS6EytGt4Y6yVnRARA3YCDYvGWe"
2025-10-08 20:15:16.418 |       }
2025-10-08 20:15:16.418 |     ],
2025-10-08 20:15:16.418 |     "args": {},
2025-10-08 20:15:16.418 |     "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
2025-10-08 20:15:16.418 |     "parentProgramId": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
2025-10-08 20:15:16.418 |   },
2025-10-08 20:15:16.418 |   {
2025-10-08 20:15:16.418 |     "name": "initializeAccount3",
2025-10-08 20:15:16.418 |     "accounts": [
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "name": "account",
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "BGRQ12SBMotAGaE4BcS6EytGt4Y6yVnRARA3YCDYvGWe"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "name": "mint",
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": false,
2025-10-08 20:15:16.418 |         "pubkey": "HXSsiNMjvbT6HwMxvKggMcGCbbFP4N3ggbqNCJF4pump"
2025-10-08 20:15:16.418 |       }
2025-10-08 20:15:16.418 |     ],
2025-10-08 20:15:16.418 |     "args": {
2025-10-08 20:15:16.418 |       "owner": "CsaevkbQLYnHeu3LnEMz1ZiL95sPU8ezEryJrr1AaniG"
2025-10-08 20:15:16.418 |     },
2025-10-08 20:15:16.418 |     "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
2025-10-08 20:15:16.418 |     "parentProgramId": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
2025-10-08 20:15:16.418 |   },
2025-10-08 20:15:16.418 |   {
2025-10-08 20:15:16.418 |     "programId": "FAdo9NCw1ssek6Z6yeWzWjhLVsr8uiCwcWNUnKgzTnHe",
2025-10-08 20:15:16.418 |     "accounts": [
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": false,
2025-10-08 20:15:16.418 |         "pubkey": "4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "62qc2CNXwrYqQScmEdiZFFAnJR262PxWEuNQtxfafNgV"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": false,
2025-10-08 20:15:16.418 |         "pubkey": "HXSsiNMjvbT6HwMxvKggMcGCbbFP4N3ggbqNCJF4pump"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "BFNU4SdjN6mJdJetUV8Aq5Zqf5uunjAu6uYa9LEXYBuX"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "7C4sUKPBCN95NH7Bs3sgxPHkMzNDN1gNH5ZMC8YCpDyK"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "BGRQ12SBMotAGaE4BcS6EytGt4Y6yVnRARA3YCDYvGWe"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": true,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "CsaevkbQLYnHeu3LnEMz1ZiL95sPU8ezEryJrr1AaniG"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": false,
2025-10-08 20:15:16.418 |         "pubkey": "11111111111111111111111111111111"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "9tnmE1fA1fiq6TFh42n1jaDe8bZHDKWnTMSGqC6vvfaS"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": false,
2025-10-08 20:15:16.418 |         "pubkey": "Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": false,
2025-10-08 20:15:16.418 |         "pubkey": "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "Hq2wp8uJ9jCPsYgNHex8RtqdvMPfVGoYwjvF1ATiwn2Y"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "BymAJB5LCfnjTZANynWV3kgwdWtzci7DzyhycEvmtPXi"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "8Wf5TiAheLUqBrKXeYg2JtAFFMWtKdG2BSFgqUcPVwTt"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "FgX1cdFq7khWeivEfHCULBA6ovtSr9djdAfJ9r3LvNST"
2025-10-08 20:15:16.418 |       }
2025-10-08 20:15:16.418 |     ],
2025-10-08 20:15:16.418 |     "args": {
2025-10-08 20:15:16.418 |       "unknown": {
2025-10-08 20:15:16.418 |         "type": "Buffer",
2025-10-08 20:15:16.418 |         "data": [
2025-10-08 20:15:16.418 |           102,
2025-10-08 20:15:16.418 |           50,
2025-10-08 20:15:16.418 |           61,
2025-10-08 20:15:16.418 |           18,
2025-10-08 20:15:16.418 |           1,
2025-10-08 20:15:16.418 |           218,
2025-10-08 20:15:16.418 |           235,
2025-10-08 20:15:16.418 |           234,
2025-10-08 20:15:16.418 |           188,
2025-10-08 20:15:16.418 |           6,
2025-10-08 20:15:16.418 |           46,
2025-10-08 20:15:16.418 |           45,
2025-10-08 20:15:16.418 |           240,
2025-10-08 20:15:16.418 |           0,
2025-10-08 20:15:16.418 |           0,
2025-10-08 20:15:16.418 |           0,
2025-10-08 20:15:16.418 |           192,
2025-10-08 20:15:16.418 |           25,
2025-10-08 20:15:16.418 |           166,
2025-10-08 20:15:16.418 |           2,
2025-10-08 20:15:16.418 |           0,
2025-10-08 20:15:16.418 |           0,
2025-10-08 20:15:16.418 |           0,
2025-10-08 20:15:16.418 |           0,
2025-10-08 20:15:16.418 |           100,
2025-10-08 20:15:16.418 |           0
2025-10-08 20:15:16.418 |         ]
2025-10-08 20:15:16.418 |       }
2025-10-08 20:15:16.418 |     },
2025-10-08 20:15:16.418 |     "name": "unknown"
2025-10-08 20:15:16.418 |   },
2025-10-08 20:15:16.418 |   {
2025-10-08 20:15:16.418 |     "programId": "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
2025-10-08 20:15:16.418 |     "accounts": [
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": false,
2025-10-08 20:15:16.418 |         "pubkey": "4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "62qc2CNXwrYqQScmEdiZFFAnJR262PxWEuNQtxfafNgV"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": false,
2025-10-08 20:15:16.418 |         "pubkey": "HXSsiNMjvbT6HwMxvKggMcGCbbFP4N3ggbqNCJF4pump"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "BFNU4SdjN6mJdJetUV8Aq5Zqf5uunjAu6uYa9LEXYBuX"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "7C4sUKPBCN95NH7Bs3sgxPHkMzNDN1gNH5ZMC8YCpDyK"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "BGRQ12SBMotAGaE4BcS6EytGt4Y6yVnRARA3YCDYvGWe"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": true,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "CsaevkbQLYnHeu3LnEMz1ZiL95sPU8ezEryJrr1AaniG"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": false,
2025-10-08 20:15:16.418 |         "pubkey": "11111111111111111111111111111111"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "9tnmE1fA1fiq6TFh42n1jaDe8bZHDKWnTMSGqC6vvfaS"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": false,
2025-10-08 20:15:16.418 |         "pubkey": "Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": false,
2025-10-08 20:15:16.418 |         "pubkey": "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "Hq2wp8uJ9jCPsYgNHex8RtqdvMPfVGoYwjvF1ATiwn2Y"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "BymAJB5LCfnjTZANynWV3kgwdWtzci7DzyhycEvmtPXi"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "8Wf5TiAheLUqBrKXeYg2JtAFFMWtKdG2BSFgqUcPVwTt"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ"
2025-10-08 20:15:16.418 |       }
2025-10-08 20:15:16.418 |     ],
2025-10-08 20:15:16.418 |     "args": {
2025-10-08 20:15:16.418 |       "unknown": {
2025-10-08 20:15:16.418 |         "type": "Buffer",
2025-10-08 20:15:16.418 |         "data": [
2025-10-08 20:15:16.418 |           102,
2025-10-08 20:15:16.418 |           6,
2025-10-08 20:15:16.418 |           61,
2025-10-08 20:15:16.418 |           18,
2025-10-08 20:15:16.418 |           1,
2025-10-08 20:15:16.418 |           218,
2025-10-08 20:15:16.418 |           235,
2025-10-08 20:15:16.418 |           234,
2025-10-08 20:15:16.418 |           188,
2025-10-08 20:15:16.418 |           6,
2025-10-08 20:15:16.418 |           46,
2025-10-08 20:15:16.418 |           45,
2025-10-08 20:15:16.418 |           240,
2025-10-08 20:15:16.418 |           0,
2025-10-08 20:15:16.418 |           0,
2025-10-08 20:15:16.418 |           0,
2025-10-08 20:15:16.418 |           192,
2025-10-08 20:15:16.418 |           25,
2025-10-08 20:15:16.418 |           166,
2025-10-08 20:15:16.418 |           2,
2025-10-08 20:15:16.418 |           0,
2025-10-08 20:15:16.418 |           0,
2025-10-08 20:15:16.418 |           0,
2025-10-08 20:15:16.418 |           0
2025-10-08 20:15:16.418 |         ]
2025-10-08 20:15:16.418 |       }
2025-10-08 20:15:16.418 |     },
2025-10-08 20:15:16.418 |     "name": "unknown",
2025-10-08 20:15:16.418 |     "parentProgramId": "FAdo9NCw1ssek6Z6yeWzWjhLVsr8uiCwcWNUnKgzTnHe"
2025-10-08 20:15:16.418 |   },
2025-10-08 20:15:16.418 |   {
2025-10-08 20:15:16.418 |     "programId": "pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ",
2025-10-08 20:15:16.418 |     "accounts": [
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": true,
2025-10-08 20:15:16.418 |         "pubkey": "8Wf5TiAheLUqBrKXeYg2JtAFFMWtKdG2BSFgqUcPVwTt"
2025-10-08 20:15:16.418 |       },
2025-10-08 20:15:16.418 |       {
2025-10-08 20:15:16.418 |         "isSigner": false,
2025-10-08 20:15:16.418 |         "isWritable": false,
2025-10-08 20:15:16.418 |         "pubkey": "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
2025-10-08 20:15:16.418 |       }
2025-10-08 20:15:16.418 |     ],
2025-10-08 20:15:16.418 |     "args": {
2025-10-08 20:15:16.418 |       "unknown": {
2025-10-08 20:15:16.418 |         "type": "Buffer",
2025-10-08 20:15:16.418 |         "data": [
2025-10-08 20:15:16.418 |           231,
2025-10-08 20:15:16.418 |           37,
2025-10-08 20:15:16.418 |           126,
2025-10-08 20:15:16.418 |           85,
2025-10-08 20:15:16.418 |           207,
2025-10-08 20:15:16.418 |           91,
2025-10-08 20:15:16.418 |           63,
2025-10-08 20:15:16.418 |           52,
2025-10-08 20:15:16.418 |           1,
2025-10-08 20:15:16.418 |           51,
2025-10-08 20:15:16.418 |           87,
2025-10-08 20:15:16.418 |           166,
2025-10-08 20:15:16.418 |           4,
2025-10-08 20:15:16.418 |           9,
2025-10-08 20:15:16.418 |           0,
2025-10-08 20:15:16.418 |           0,
2025-10-08 20:15:16.418 |           0,
2025-10-08 20:15:16.418 |           0,
2025-10-08 20:15:16.418 |           0,
2025-10-08 20:15:16.418 |           0,
2025-10-08 20:15:16.419 |           0,
2025-10-08 20:15:16.419 |           0,
2025-10-08 20:15:16.419 |           0,
2025-10-08 20:15:16.419 |           0,
2025-10-08 20:15:16.419 |           0,
2025-10-08 20:15:16.419 |           1,
2025-10-08 20:15:16.419 |           90,
2025-10-08 20:15:16.419 |           98,
2025-10-08 20:15:16.419 |           2,
2025-10-08 20:15:16.419 |           0,
2025-10-08 20:15:16.419 |           0,
2025-10-08 20:15:16.419 |           0,
2025-10-08 20:15:16.419 |           0
2025-10-08 20:15:16.419 |         ]
2025-10-08 20:15:16.419 |       }
2025-10-08 20:15:16.419 |     },
2025-10-08 20:15:16.419 |     "name": "unknown",
2025-10-08 20:15:16.419 |     "parentProgramId": "FAdo9NCw1ssek6Z6yeWzWjhLVsr8uiCwcWNUnKgzTnHe"
2025-10-08 20:15:16.419 |   },
2025-10-08 20:15:16.419 |   {
2025-10-08 20:15:16.419 |     "name": "transfer",
2025-10-08 20:15:16.419 |     "accounts": [
2025-10-08 20:15:16.419 |       {
2025-10-08 20:15:16.419 |         "name": "source",
2025-10-08 20:15:16.419 |         "isSigner": false,
2025-10-08 20:15:16.419 |         "isWritable": true,
2025-10-08 20:15:16.419 |         "pubkey": "7C4sUKPBCN95NH7Bs3sgxPHkMzNDN1gNH5ZMC8YCpDyK"
2025-10-08 20:15:16.419 |       },
2025-10-08 20:15:16.419 |       {
2025-10-08 20:15:16.419 |         "name": "destination",
2025-10-08 20:15:16.419 |         "isSigner": false,
2025-10-08 20:15:16.419 |         "isWritable": true,
2025-10-08 20:15:16.419 |         "pubkey": "BGRQ12SBMotAGaE4BcS6EytGt4Y6yVnRARA3YCDYvGWe"
2025-10-08 20:15:16.419 |       },
2025-10-08 20:15:16.419 |       {
2025-10-08 20:15:16.419 |         "name": "authority",
2025-10-08 20:15:16.419 |         "isSigner": false,
2025-10-08 20:15:16.419 |         "isWritable": true,
2025-10-08 20:15:16.419 |         "pubkey": "BFNU4SdjN6mJdJetUV8Aq5Zqf5uunjAu6uYa9LEXYBuX"
2025-10-08 20:15:16.419 |       }
2025-10-08 20:15:16.419 |     ],
2025-10-08 20:15:16.419 |     "args": {
2025-10-08 20:15:16.419 |       "amount": "f02d2e06bc"
2025-10-08 20:15:16.419 |     },
2025-10-08 20:15:16.419 |     "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
2025-10-08 20:15:16.419 |     "parentProgramId": "FAdo9NCw1ssek6Z6yeWzWjhLVsr8uiCwcWNUnKgzTnHe"
2025-10-08 20:15:16.419 |   },
2025-10-08 20:15:16.419 |   {
2025-10-08 20:15:16.419 |     "name": "transfer",
2025-10-08 20:15:16.419 |     "accounts": [
2025-10-08 20:15:16.419 |       {
2025-10-08 20:15:16.419 |         "name": "from",
2025-10-08 20:15:16.419 |         "pubkey": "CsaevkbQLYnHeu3LnEMz1ZiL95sPU8ezEryJrr1AaniG",
2025-10-08 20:15:16.419 |         "isSigner": true,
2025-10-08 20:15:16.419 |         "isWritable": true
2025-10-08 20:15:16.419 |       },
2025-10-08 20:15:16.419 |       {
2025-10-08 20:15:16.419 |         "name": "to",
2025-10-08 20:15:16.419 |         "pubkey": "9tnmE1fA1fiq6TFh42n1jaDe8bZHDKWnTMSGqC6vvfaS",
2025-10-08 20:15:16.419 |         "isWritable": true,
2025-10-08 20:15:16.419 |         "isSigner": false
2025-10-08 20:15:16.419 |       }
2025-10-08 20:15:16.419 |     ],
2025-10-08 20:15:16.419 |     "args": {
2025-10-08 20:15:16.419 |       "lamports": "01d4c1"
2025-10-08 20:15:16.419 |     },
2025-10-08 20:15:16.419 |     "programId": "11111111111111111111111111111111",
2025-10-08 20:15:16.419 |     "parentProgramId": "FAdo9NCw1ssek6Z6yeWzWjhLVsr8uiCwcWNUnKgzTnHe"
2025-10-08 20:15:16.419 |   },
2025-10-08 20:15:16.419 |   {
2025-10-08 20:15:16.419 |     "name": "transfer",
2025-10-08 20:15:16.419 |     "accounts": [
2025-10-08 20:15:16.419 |       {
2025-10-08 20:15:16.419 |         "name": "from",
2025-10-08 20:15:16.419 |         "pubkey": "CsaevkbQLYnHeu3LnEMz1ZiL95sPU8ezEryJrr1AaniG",
2025-10-08 20:15:16.419 |         "isSigner": true,
2025-10-08 20:15:16.419 |         "isWritable": true
2025-10-08 20:15:16.419 |       },
2025-10-08 20:15:16.419 |       {
2025-10-08 20:15:16.419 |         "name": "to",
2025-10-08 20:15:16.419 |         "pubkey": "BFNU4SdjN6mJdJetUV8Aq5Zqf5uunjAu6uYa9LEXYBuX",
2025-10-08 20:15:16.419 |         "isWritable": true,
2025-10-08 20:15:16.419 |         "isSigner": false
2025-10-08 20:15:16.419 |       }
2025-10-08 20:15:16.419 |     ],
2025-10-08 20:15:16.419 |     "args": {
2025-10-08 20:15:16.419 |       "lamports": "02625a01"
2025-10-08 20:15:16.419 |     },
2025-10-08 20:15:16.419 |     "programId": "11111111111111111111111111111111",
2025-10-08 20:15:16.419 |     "parentProgramId": "FAdo9NCw1ssek6Z6yeWzWjhLVsr8uiCwcWNUnKgzTnHe"
2025-10-08 20:15:16.419 |   },
2025-10-08 20:15:16.419 |   {
2025-10-08 20:15:16.419 |     "name": "transfer",
2025-10-08 20:15:16.419 |     "accounts": [
2025-10-08 20:15:16.419 |       {
2025-10-08 20:15:16.419 |         "name": "from",
2025-10-08 20:15:16.419 |         "pubkey": "CsaevkbQLYnHeu3LnEMz1ZiL95sPU8ezEryJrr1AaniG",
2025-10-08 20:15:16.419 |         "isSigner": true,
2025-10-08 20:15:16.419 |         "isWritable": true
2025-10-08 20:15:16.419 |       },
2025-10-08 20:15:16.419 |       {
2025-10-08 20:15:16.419 |         "name": "to",
2025-10-08 20:15:16.419 |         "pubkey": "62qc2CNXwrYqQScmEdiZFFAnJR262PxWEuNQtxfafNgV",
2025-10-08 20:15:16.419 |         "isWritable": true,
2025-10-08 20:15:16.419 |         "isSigner": false
2025-10-08 20:15:16.419 |       }
2025-10-08 20:15:16.419 |     ],
2025-10-08 20:15:16.419 |     "args": {
2025-10-08 20:15:16.419 |       "lamports": "05cc61"
2025-10-08 20:15:16.419 |     },
2025-10-08 20:15:16.419 |     "programId": "11111111111111111111111111111111",
2025-10-08 20:15:16.419 |     "parentProgramId": "FAdo9NCw1ssek6Z6yeWzWjhLVsr8uiCwcWNUnKgzTnHe"
2025-10-08 20:15:16.419 |   },
2025-10-08 20:15:16.419 |   {
2025-10-08 20:15:16.419 |     "programId": "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
2025-10-08 20:15:16.419 |     "accounts": [
2025-10-08 20:15:16.419 |       {
2025-10-08 20:15:16.419 |         "isSigner": false,
2025-10-08 20:15:16.419 |         "isWritable": false,
2025-10-08 20:15:16.419 |         "pubkey": "Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1"
2025-10-08 20:15:16.419 |       }
2025-10-08 20:15:16.419 |     ],
2025-10-08 20:15:16.419 |     "args": {
2025-10-08 20:15:16.419 |       "unknown": {
2025-10-08 20:15:16.419 |         "type": "Buffer",
2025-10-08 20:15:16.419 |         "data": [
2025-10-08 20:15:16.419 |           228,
2025-10-08 20:15:16.419 |           69,
2025-10-08 20:15:16.419 |           165,
2025-10-08 20:15:16.419 |           46,
2025-10-08 20:15:16.419 |           81,
2025-10-08 20:15:16.419 |           203,
2025-10-08 20:15:16.419 |           154,
2025-10-08 20:15:16.419 |           29,
2025-10-08 20:15:16.419 |           189,
2025-10-08 20:15:16.419 |           219,
2025-10-08 20:15:16.419 |           127,
2025-10-08 20:15:16.419 |           211,
2025-10-08 20:15:16.419 |           78,
2025-10-08 20:15:16.419 |           230,
2025-10-08 20:15:16.419 |           97,
2025-10-08 20:15:16.419 |           238,
2025-10-08 20:15:16.419 |           245,
2025-10-08 20:15:16.419 |           135,
2025-10-08 20:15:16.419 |           171,
2025-10-08 20:15:16.419 |           220,
2025-10-08 20:15:16.419 |           125,
2025-10-08 20:15:16.419 |           5,
2025-10-08 20:15:16.419 |           99,
2025-10-08 20:15:16.419 |           193,
2025-10-08 20:15:16.419 |           194,
2025-10-08 20:15:16.419 |           172,
2025-10-08 20:15:16.419 |           174,
2025-10-08 20:15:16.419 |           183,
2025-10-08 20:15:16.419 |           219,
2025-10-08 20:15:16.419 |           34,
2025-10-08 20:15:16.419 |           225,
2025-10-08 20:15:16.419 |           125,
2025-10-08 20:15:16.419 |           9,
2025-10-08 20:15:16.419 |           95,
2025-10-08 20:15:16.419 |           159,
2025-10-08 20:15:16.419 |           190,
2025-10-08 20:15:16.419 |           142,
2025-10-08 20:15:16.419 |           131,
2025-10-08 20:15:16.419 |           93,
2025-10-08 20:15:16.419 |           205,
2025-10-08 20:15:16.419 |           94,
2025-10-08 20:15:16.419 |           31,
2025-10-08 20:15:16.419 |           229,
2025-10-08 20:15:16.419 |           244,
2025-10-08 20:15:16.419 |           119,
2025-10-08 20:15:16.419 |           245,
2025-10-08 20:15:16.419 |           219,
2025-10-08 20:15:16.419 |           127,
2025-10-08 20:15:16.419 |           1,
2025-10-08 20:15:16.419 |           90,
2025-10-08 20:15:16.419 |           98,
2025-10-08 20:15:16.419 |           2,
2025-10-08 20:15:16.419 |           0,
2025-10-08 20:15:16.419 |           0,
2025-10-08 20:15:16.419 |           0,
2025-10-08 20:15:16.419 |           0,
2025-10-08 20:15:16.419 |           188,
2025-10-08 20:15:16.419 |           6,
2025-10-08 20:15:16.419 |           46,
2025-10-08 20:15:16.419 |           45,
2025-10-08 20:15:16.419 |           240,
2025-10-08 20:15:16.419 |           0,
2025-10-08 20:15:16.419 |           0,
2025-10-08 20:15:16.419 |           0,
2025-10-08 20:15:16.419 |           1,
2025-10-08 20:15:16.419 |           176,
2025-10-08 20:15:16.419 |           101,
2025-10-08 20:15:16.419 |           166,
2025-10-08 20:15:16.419 |           52,
2025-10-08 20:15:16.419 |           158,
2025-10-08 20:15:16.419 |           236,
2025-10-08 20:15:16.419 |           105,
2025-10-08 20:15:16.419 |           104,
2025-10-08 20:15:16.419 |           146,
2025-10-08 20:15:16.419 |           203,
2025-10-08 20:15:16.419 |           183,
2025-10-08 20:15:16.419 |           184,
2025-10-08 20:15:16.419 |           55,
2025-10-08 20:15:16.419 |           228,
2025-10-08 20:15:16.419 |           23,
2025-10-08 20:15:16.419 |           245,
2025-10-08 20:15:16.419 |           111,
2025-10-08 20:15:16.419 |           222,
2025-10-08 20:15:16.419 |           155,
2025-10-08 20:15:16.419 |           62,
2025-10-08 20:15:16.419 |           76,
2025-10-08 20:15:16.419 |           85,
2025-10-08 20:15:16.419 |           53,
2025-10-08 20:15:16.419 |           69,
2025-10-08 20:15:16.419 |           80,
2025-10-08 20:15:16.419 |           28,
2025-10-08 20:15:16.419 |           134,
2025-10-08 20:15:16.419 |           76,
2025-10-08 20:15:16.419 |           211,
2025-10-08 20:15:16.419 |           179,
2025-10-08 20:15:16.419 |           95,
2025-10-08 20:15:16.419 |           37,
2025-10-08 20:15:16.419 |           198,
2025-10-08 20:15:16.419 |           139,
2025-10-08 20:15:16.419 |           229,
2025-10-08 20:15:16.419 |           104,
2025-10-08 20:15:16.419 |           0,
2025-10-08 20:15:16.419 |           0,
2025-10-08 20:15:16.419 |           0,
2025-10-08 20:15:16.419 |           0,
2025-10-08 20:15:16.419 |           228,
2025-10-08 20:15:16.419 |           91,
2025-10-08 20:15:16.419 |           8,
2025-10-08 20:15:16.419 |           59,
2025-10-08 20:15:16.419 |           8,
2025-10-08 20:15:16.419 |           0,
2025-10-08 20:15:16.419 |           0,
2025-10-08 20:15:16.419 |           0,
2025-10-08 20:15:16.419 |           137,
2025-10-08 20:15:16.419 |           153,
2025-10-08 20:15:16.419 |           155,
2025-10-08 20:15:16.419 |           164,
2025-10-08 20:15:16.419 |           48,
2025-10-08 20:15:16.419 |           60,
2025-10-08 20:15:16.419 |           3,
2025-10-08 20:15:16.419 |           0,
2025-10-08 20:15:16.419 |           228,
2025-10-08 20:15:16.420 |           175,
2025-10-08 20:15:16.420 |           228,
2025-10-08 20:15:16.420 |           62,
2025-10-08 20:15:16.420 |           1,
2025-10-08 20:15:16.420 |           0,
2025-10-08 20:15:16.420 |           0,
2025-10-08 20:15:16.420 |           0,
2025-10-08 20:15:16.420 |           137,
2025-10-08 20:15:16.420 |           1,
2025-10-08 20:15:16.420 |           137,
2025-10-08 20:15:16.420 |           88,
2025-10-08 20:15:16.420 |           159,
2025-10-08 20:15:16.420 |           61,
2025-10-08 20:15:16.420 |           2,
2025-10-08 20:15:16.420 |           0,
2025-10-08 20:15:16.420 |           74,
2025-10-08 20:15:16.420 |           194,
2025-10-08 20:15:16.420 |           248,
2025-10-08 20:15:16.420 |           208,
2025-10-08 20:15:16.420 |           221,
2025-10-08 20:15:16.420 |           92,
2025-10-08 20:15:16.420 |           188,
2025-10-08 20:15:16.420 |           151,
2025-10-08 20:15:16.420 |           227,
2025-10-08 20:15:16.420 |           40,
2025-10-08 20:15:16.420 |           156,
2025-10-08 20:15:16.420 |           25,
2025-10-08 20:15:16.420 |           124,
2025-10-08 20:15:16.420 |           181,
2025-10-08 20:15:16.420 |           6,
2025-10-08 20:15:16.420 |           42,
2025-10-08 20:15:16.420 |           84,
2025-10-08 20:15:16.420 |           243,
2025-10-08 20:15:16.420 |           217,
2025-10-08 20:15:16.420 |           86,
2025-10-08 20:15:16.420 |           185,
2025-10-08 20:15:16.420 |           206,
2025-10-08 20:15:16.420 |           110,
2025-10-08 20:15:16.420 |           81,
2025-10-08 20:15:16.420 |           21,
2025-10-08 20:15:16.420 |           249,
2025-10-08 20:15:16.420 |           101,
2025-10-08 20:15:16.420 |           103,
2025-10-08 20:15:16.420 |           170,
2025-10-08 20:15:16.420 |           92,
2025-10-08 20:15:16.420 |           179,
2025-10-08 20:15:16.420 |           230,
2025-10-08 20:15:16.420 |           95,
2025-10-08 20:15:16.420 |           0,
2025-10-08 20:15:16.420 |           0,
2025-10-08 20:15:16.420 |           0,
2025-10-08 20:15:16.420 |           0,
2025-10-08 20:15:16.420 |           0,
2025-10-08 20:15:16.420 |           0,
2025-10-08 20:15:16.420 |           0,
2025-10-08 20:15:16.420 |           97,
2025-10-08 20:15:16.420 |           204,
2025-10-08 20:15:16.420 |           5,
2025-10-08 20:15:16.420 |           0,
2025-10-08 20:15:16.420 |           0,
2025-10-08 20:15:16.420 |           0,
2025-10-08 20:15:16.420 |           0,
2025-10-08 20:15:16.420 |           0,
2025-10-08 20:15:16.420 |           4,
2025-10-08 20:15:16.420 |           134,
2025-10-08 20:15:16.420 |           114,
2025-10-08 20:15:16.420 |           211,
2025-10-08 20:15:16.420 |           238,
2025-10-08 20:15:16.420 |           169,
2025-10-08 20:15:16.420 |           230,
2025-10-08 20:15:16.420 |           80,
2025-10-08 20:15:16.420 |           143,
2025-10-08 20:15:16.420 |           133,
2025-10-08 20:15:16.420 |           101,
2025-10-08 20:15:16.420 |           48,
2025-10-08 20:15:16.420 |           64,
2025-10-08 20:15:16.420 |           116,
2025-10-08 20:15:16.420 |           144,
2025-10-08 20:15:16.420 |           107,
2025-10-08 20:15:16.420 |           243,
2025-10-08 20:15:16.420 |           9,
2025-10-08 20:15:16.420 |           166,
2025-10-08 20:15:16.420 |           186,
2025-10-08 20:15:16.420 |           30,
2025-10-08 20:15:16.420 |           8,
2025-10-08 20:15:16.420 |           123,
2025-10-08 20:15:16.420 |           114,
2025-10-08 20:15:16.420 |           110,
2025-10-08 20:15:16.420 |           188,
2025-10-08 20:15:16.420 |           235,
2025-10-08 20:15:16.420 |           12,
2025-10-08 20:15:16.420 |           82,
2025-10-08 20:15:16.420 |           49,
2025-10-08 20:15:16.420 |           190,
2025-10-08 20:15:16.421 |           182,
2025-10-08 20:15:16.421 |           30,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           193,
2025-10-08 20:15:16.421 |           212,
2025-10-08 20:15:16.421 |           1,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0,
2025-10-08 20:15:16.421 |           0
2025-10-08 20:15:16.421 |         ]
2025-10-08 20:15:16.421 |       }
2025-10-08 20:15:16.421 |     },
2025-10-08 20:15:16.421 |     "name": "unknown",
2025-10-08 20:15:16.421 |     "parentProgramId": "FAdo9NCw1ssek6Z6yeWzWjhLVsr8uiCwcWNUnKgzTnHe"
2025-10-08 20:15:16.421 |   },
2025-10-08 20:15:16.421 |   {
2025-10-08 20:15:16.421 |     "name": "transfer",
2025-10-08 20:15:16.421 |     "accounts": [
2025-10-08 20:15:16.421 |       {
2025-10-08 20:15:16.421 |         "name": "from",
2025-10-08 20:15:16.421 |         "pubkey": "CsaevkbQLYnHeu3LnEMz1ZiL95sPU8ezEryJrr1AaniG",
2025-10-08 20:15:16.421 |         "isSigner": true,
2025-10-08 20:15:16.421 |         "isWritable": true
2025-10-08 20:15:16.421 |       },
2025-10-08 20:15:16.421 |       {
2025-10-08 20:15:16.421 |         "name": "to",
2025-10-08 20:15:16.421 |         "pubkey": "FgX1cdFq7khWeivEfHCULBA6ovtSr9djdAfJ9r3LvNST",
2025-10-08 20:15:16.421 |         "isWritable": true,
2025-10-08 20:15:16.421 |         "isSigner": false
2025-10-08 20:15:16.421 |       }
2025-10-08 20:15:16.421 |     ],
2025-10-08 20:15:16.421 |     "args": {
2025-10-08 20:15:16.421 |       "lamports": "061a7f"
2025-10-08 20:15:16.421 |     },
2025-10-08 20:15:16.421 |     "programId": "11111111111111111111111111111111",
2025-10-08 20:15:16.421 |     "parentProgramId": "FAdo9NCw1ssek6Z6yeWzWjhLVsr8uiCwcWNUnKgzTnHe"
2025-10-08 20:15:16.421 |   }
2025-10-08 20:15:16.421 | ]
2025-10-08 20:15:16.844 | ⛔ Token 'SOLstice' scartato per sicurezza. {"safeProblem":["❌ Liquidità fuori range.: 30.109 SOL"],"valid":false}
2025-10-08 20:15:16.845 | --------------------------------------------
2025-10-08 20:15:24.854 | ⛔ Token '浇给人生' scartato per sicurezza. {"safeProblem":["❌ Liquidità fuori range.: 30.020 SOL"],"valid":false}
2025-10-08 20:15:24.854 | --------------------------------------------
    





    
] */