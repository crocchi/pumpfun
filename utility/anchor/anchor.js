import * as anchor from "@project-serum/anchor";
//@coral-xyz/anchor@0.31.1. nuova versione..
import { Connection, PublicKey } from "@solana/web3.js";
import fs from "fs";
//import { botOptions } from '.././config.js';
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const idlPath = path.join(__dirname, "raydium_amm.json");
const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

// --- CREAZIONE PROGRAM SOLO PER CODER ---
const dummyConnection = new Connection("http://localhost:8899", "confirmed"); // può essere anche un endpoint inutile
//const connection = new Connection(RPC_URL_HELIUS, "confirmed");


const dummyProvider = new anchor.AnchorProvider(dummyConnection, {
  publicKey: PublicKey.default,
  signAllTransactions: async txs => txs,
  signTransaction: async tx => tx,
}, {});

const programId = new PublicKey("LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj");
const program = new anchor.Program(idl, programId, dummyProvider);

// funzione di decoding
export function decodeAnchorProgramData(base64Data) {
  const buf = Buffer.from(base64Data, "base64");
  try {
    return program.coder.instruction.decode(buf);
  } catch (err) {
    console.error("Errore decodifica:", err);
    return null;
  }
}
