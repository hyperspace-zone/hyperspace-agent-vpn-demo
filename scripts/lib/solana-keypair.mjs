import fs from "node:fs";

export function readSolanaKeypair(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`failed to parse Solana keypair JSON: ${error.message}`);
  }
  if (!Array.isArray(parsed) || parsed.length !== 64) {
    throw new Error("Solana keypair must be a JSON array with 64 byte values");
  }
  const bytes = Buffer.from(parsed);
  if (bytes.length !== 64 || parsed.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) {
    throw new Error("Solana keypair contains invalid byte values");
  }
  return bytes;
}

export function publicKeyFromKeypairBytes(keypair) {
  return keypair.slice(32, 64);
}

export function base58Encode(buffer) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  if (!buffer.length) return "";

  const digits = [0];
  for (const byte of buffer) {
    let carry = byte;
    for (let index = 0; index < digits.length; index += 1) {
      const value = digits[index] * 256 + carry;
      digits[index] = value % 58;
      carry = Math.floor(value / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }

  let leadingZeroes = 0;
  for (const byte of buffer) {
    if (byte !== 0) break;
    leadingZeroes += 1;
  }

  return "1".repeat(leadingZeroes) + digits.reverse().map((digit) => alphabet[digit]).join("");
}
