import { BorshAccountsCoder } from "@coral-xyz/anchor";

const program_idl = JSON.parse(fs.readFileSync('./idls/raydium_launchpad.json', "utf8"));

const coder = new BorshAccountsCoder(program_idl); //initializing BorshCoder with IDL

export async function decodeRaydiumLaunchpadTxnData(data) {
    if (!data || !data.account || !data.account.account) return;

    const dataTx = data.account.account;

    let parsedAccount;
    try {
        parsedAccount = coder.decodeAny(dataTx?.data); //decoding account
    } catch (error) {
        console.error("Failed to decode pool state:", error);
    }
}
