//import * as anchor from "@project-serum/anchor";
/*
import * as anchor from "@coral-xyz/anchor";
import { BorshAccountsCoder } from "@coral-xyz/anchor";
import { SolanaParser } from "@shyft-to/solana-transaction-parser";

//@coral-xyz/anchor@0.31.1. nuova versione..
import { Connection, PublicKey } from "@solana/web3.js";
import fs from "fs";
import { RPC_URL_SOLANA } from '../../config.js';
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const idlPath = path.join(__dirname, "IDL-.json");
const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

const program_idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
const coder = new BorshAccountsCoder(program_idl); //initializing BorshCoder with IDL

// --- CREAZIONE PROGRAM SOLO PER CODER ---
const dummyConnection = new Connection(RPC_URL_SOLANA, "confirmed"); // può essere anche un endpoint inutile
//const connection = new Connection(RPC_URL_HELIUS, "confirmed");

const dummyProvider = new anchor.AnchorProvider(dummyConnection, {
  //publicKey: PublicKey.default,
  commitment: "confirmed",
  publicKey: PublicKey.default,
  signAllTransactions: async txs => txs,
  signTransaction: async tx => tx,
}, {});

const PROGRAM_ID = new PublicKey("LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj");


console.log("IDL name:", idl.metadata.name);
console.log("Program ID:", PROGRAM_ID.toBase58());
console.log("Wallet:", dummyProvider.publicKey.toBase58());

const program = new anchor.Program(idl,dummyProvider);
//const program = new anchor.Program(idl, PROGRAM_ID, dummyProvider);
//console.log("Program loaded:", program.coder.instruction);

// funzione di decoding
export function decodeAnchorProgramData(base64Data) {
  const buf = Buffer.from(base64Data, "base64");
  console.log("Buffer length:", buf.length);
  console.log("Buffer data (hex):", buf.toString("hex"));
  console.log("Buffer data (utf8):", buf.toString("utf8"));
  let dd=program.coder.instruction.decode(buf.toString("hex"));
  console.log("Decoded data:", dd);
  try {
    let dd=program.coder.instruction.decode(buf,"hex");
      console.log("Decoded data hex:", dd);
    return program.coder.instruction.decode(buf);
  } catch (err) {
    console.error("Errore decodifica:", err);
    return null;
  }
}

*/