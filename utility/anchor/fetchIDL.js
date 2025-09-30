import { Connection, PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { RPC_URL_SOLANA } from '../../config.js';
//import require("zlib").inflateSync(compressed);

const connection = new Connection(RPC_URL_SOLANA);

// Program ID Raydium Launchpad
const programId = new PublicKey("LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj");

// Calcola l'account che contiene l'IDL
const [idlAddress] = PublicKey.findProgramAddressSync(
  [programId.toBuffer(), Buffer.from("anchor:idl")],
  programId
);

async function fetchIdl() {
  const accountInfo = await connection.getAccountInfo(idlAddress);
  if (!accountInfo) {
    console.log("⚠️ Nessun account IDL trovato.");
    return;
  }

  // L'IDL è compresso con zlib e codificato base64
  const data = accountInfo.data;
  const compressed = data.slice(8); // skip header
  const inflated = require("zlib").inflateSync(compressed);

  const idl = JSON.parse(inflated.toString());
  console.log("✅ IDL trovato:", idl.name, "version:", idl.version);
}

fetchIdl();
