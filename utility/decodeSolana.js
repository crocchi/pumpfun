
import bs58 from 'bs58';

// Inserisci qui la tua stringa base64 (senza "Program data: " davanti)
const base64String = 'G3KpTd7rY3YWAAAAUGlua3kgcHJvbWlzZSBpdCBzZW5kcwUAAABQaW5reVAAAABodHRwczovL2lwZnMuaW8vaXBmcy9iYWZrcmVpZGRiZ3lpdmVyZ29vb200Ym41bWh3NDZieWVuNWpmN3FoM3p4NHhta3VlaWR4bmZ6cTRzedZocrL43v5V1zwkw/jWcjgn/q744/ge2h9rRj170QUfN87HA6TNtnSr6bCx+7fKV8LfU+ASawS4rjvJkAD0IJyolR6tVisW+AxPKuA7CoTanDY9XlTth5djcLuyB9k8lqiVHq1WKxb4DE8q4DsKhNqcNj1eVO2Hl2Nwu7IH2TyWQ06TaAAAAAAAENhH488DAACsI/wGAAAAAHjF+1HRAgAAgMakfo0DAA==';

export function readString(buffer, offset) {
    const length = buffer.readUInt32LE(offset); // LUNGHEZZA della stringa
    const start = offset + 4;
    const end = start + length;
  
    if (end > buffer.length) {
      throw new RangeError(`Trying to read beyond buffer length. Requested: ${end}, Buffer length: ${buffer.length}`);
    }
  
    return {
      string: buffer.toString('utf8', start, end),
      offset: end
    };
  }

export function decodeProgramData(base64) {
  const buffer = Buffer.from(base64, 'base64');
  let offset = 0;

  // Skip 8 bytes header/discriminator
  offset += 8;

  // Read name
  const nameRes = readString(buffer, offset);
  const name = nameRes.value;
  offset += nameRes.bytesRead;

  // Read symbol
  const symbolRes = readString(buffer, offset);
  const symbol = symbolRes.value;
  offset += symbolRes.bytesRead;

  // Read URI
  const uriRes = readString(buffer, offset);
  const uri = uriRes.value;
  offset += uriRes.bytesRead;

  // Read creator (32 bytes pubkey)
  const creator = bs58.encode(buffer.slice(offset, offset + 32));
  offset += 32;

  // Read bonding curve (next 32 bytes)
  const bondingCurve = bs58.encode(buffer.slice(offset, offset + 32));
  offset += 32;

  return {
    name,
    symbol,
    uri,
    creator,
    bondingCurve
  };
}

//const decoded = decodeProgramData(base64String);
//console.log('📦 Decoded Program Data:', decoded);
