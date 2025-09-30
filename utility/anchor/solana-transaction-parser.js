import { Connection, PublicKey } from "@solana/web3.js";
import { SolanaParser } from "@shyft-to/solana-transaction-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { RPC_URL_SOLANA } from '../../config.js';
//import raydiumLaunchpadIdl from "./idl-.json";

const connection = new Connection(RPC_URL_SOLANA, "confirmed");

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

// Aggiungi il parser basato su IDL
parser.addParserFromIdl(PROGRAM_ID.toBase58(), idl);

export async function parseLaunchpadTx(signature) {
  const tx = await connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed"
  });

  if (!tx) {
    console.log("Transazione non trovata");
    return;
  }

  // Decodifica le istruzioni
  const parsed = parser.parseTransactionWithInnerInstructions(tx);
  //console.log("Parsed Transaction:", JSON.stringify(parsed, null, 2));
/*/   "args": {

      "base_mint_param": {

        "decimals": 6,

        "name": "Rated R For Retarded",

        "symbol": "R",

        "uri": "https://ipfs.io/ipfs/bafkreicgu7qv66whnq47wvr5mafdks4kjynnvqk6ciaeykwioksjftbvbq"

      },{

      "args": {

      "base_mint_param": {

        "decimals": 6,

        "name": "Rated R For Retarded",

        "symbol": "R",

        "uri": "https://ipfs.io/ipfs/bafkreicgu7qv66whnq47wvr5mafdks4kjynnvqk6ciaeykwioksjftbvbq"

      },
*/

  // Filtra quelle che indicano una "creazione" token
  //const creates = parsed.filter(ix => ix.name?.toLowerCase().includes("create"));
  const quote_mint = parsed.find(ix => ix.name === "quote_mint");
  const base_mint = parsed.find(ix => ix.name === "base_mint");
  //const name = parsed.find(ix => ix.name === "name");
  const base_mint_param = parsed.find(ix => ix.name === "initialize_v2");//name: 'initialize_v2',
  if (base_mint_param) {
 console.log("Name:", base_mint_param.args.base_mint_param.name);
 console.log("Symbol:", base_mint_param.args.base_mint_param.symbol);
 console.log("URI:", base_mint_param.args.base_mint_param.uri);
 console.log("Decimals:", base_mint_param.args.base_mint_param.decimals);
 console.log(JSON.stringify(base_mint_param, null, 2));
  }else{
    console.log(parsed);
  }
  //a[0].args.quote_mint_param
  //a[0].args.base_mint_param
  if (quote_mint) {
    console.log("Quote Mint:", quote_mint.parsed?.mint);
  }
  if (base_mint) {
    console.log("Base Mint:", base_mint.parsed?.mint);
  }
  console.log("Istruzioni decodificate:", parsed);
 // console.log("Eventuali CREATE trovate:", creates);
}

// 🔍 esempio con una signature che hai già loggato
//parseLaunchpadTx("2Wjfv2thD2McR19cVpMcg8R6Ra6Qk2gYEnjJJ65Bgvnx7HE19SxhJ92ruhENAGKawZvsJTyNVgUNnk6nCzZKaDi4");
/*    programId: PublicKey [PublicKey(TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)] {

    
Personal

Containers
hopeful_bouman

hopeful_bouman
635d8ba1c9e2
mio-progetto:latest
STATUS
Running (1 second ago)


    args: {

      unknown: <Buffer e4 45 a5 2e 51 cb 9a 1d bd db 7f d3 4e e6 61 ee fc f3 e5 8b 7d c4 6a 50 13 b9 5b 47 c5 72 37 01 4d d3 78 4d 62 58 d8 fe bf 15 71 88 ac d5 10 9f 00 78 ... 105 more bytes>

    },

    name: 'unknown',

    parentProgramId: PublicKey [PublicKey(LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj)] {

      _bn: <BN: 5043b954dca26e1ef91b52c4f8f89af8a6f5ac8c62156f171cf0f21ac51c922>

    }

  },

  {

    name: 'transferChecked',

    accounts: [ [Object], [Object], [Object], [Object] ],

    args: { amount: <BN: e76ef9>, decimals: 6 },

    programId: PublicKey [PublicKey(TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)] {

      _bn: <BN: 6ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9>

    },

    parentProgramId: PublicKey [PublicKey(LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj)] {

      _bn: <BN: 5043b954dca26e1ef91b52c4f8f89af8a6f5ac8c62156f171cf0f21ac51c922>

    }

  },

  {

    name: 'transferChecked',

    accounts: [ [Object], [Object], [Object], [Object] ],

    args: { amount: <BN: 34cd8a60dcc>, decimals: 6 },

    programId: PublicKey [PublicKey(TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)] {

      _bn: <BN: 6ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9>

    },

    parentProgramId: PublicKey [PublicKey(LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj)] {

      _bn: <BN: 5043b954dca26e1ef91b52c4f8f89af8a6f5ac8c62156f171cf0f21ac51c922>

    }

  },

  {

    name: 'transferChecked',

    accounts: [ [Object], [Object], [Object], [Object] ],

    args: { amount: <BN: 25078>, decimals: 6 },

    programId: PublicKey [PublicKey(TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)] {

      _bn: <BN: 6ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9>

    },

    parentProgramId: PublicKey [PublicKey(LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj)] {

      _bn: <BN: 5043b954dca26e1ef91b52c4f8f89af8a6f5ac8c62156f171cf0f21ac51c922>

    }

  },

  {

    name: 'transferChecked',

    accounts: [ [Object], [Object], [Object], [Object] ],

    args: { amount: <BN: 1d9f>, decimals: 6 },

    programId: PublicKey [PublicKey(TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)] {

      _bn: <BN: 6ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9>

    },

    parentProgramId: PublicKey [PublicKey(LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj)] {

      _bn: <BN: 5043b954dca26e1ef91b52c4f8f89af8a6f5ac8c62156f171cf0f21ac51c922>

    }



] */