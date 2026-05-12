#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadEnv, envString } from "./lib/env.mjs";

loadEnv();

const walletPath = envString("SOLANA_KEYPAIR_PATH");
const payAccount = envString("PAY_ACCOUNT", "hyperspace-agent-demo");
const payNetwork = normalizeNetwork(envString("PAY_NETWORK", "mainnet"));
const accountsPath = path.join(os.homedir(), ".config", "pay", "accounts.yml");

if (!walletPath) {
  throw new Error("SOLANA_KEYPAIR_PATH is required");
}
if (!/^[A-Za-z0-9_.-]+$/.test(payAccount)) {
  throw new Error("PAY_ACCOUNT may only contain letters, numbers, dot, underscore, and hyphen");
}
if (payNetwork !== "mainnet") {
  throw new Error("this demo setup writes a mainnet pay account; set PAY_NETWORK=mainnet");
}

const absoluteWalletPath = path.resolve(walletPath);
const repoRoot = process.cwd();
if (isInsidePath(absoluteWalletPath, repoRoot)) {
  throw new Error("wallet path is inside this repository; move id.json outside the repo");
}

const keypair = readSolanaKeypair(absoluteWalletPath);
const publicKey = keypair.slice(32, 64);
const secretKeyB58 = base58Encode(keypair);
const publicKeyB58 = base58Encode(publicKey);
const createdAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

fs.mkdirSync(path.dirname(accountsPath), { recursive: true, mode: 0o700 });
if (fs.existsSync(accountsPath)) {
  const backupPath = `${accountsPath}.bak-${Date.now()}`;
  fs.copyFileSync(accountsPath, backupPath);
  fs.chmodSync(backupPath, 0o600);
}

const yaml = [
  "version: 2",
  "accounts:",
  "  mainnet:",
  `    ${payAccount}:`,
  "      keystore: ephemeral",
  "      auth_required: false",
  `      pubkey: '${publicKeyB58}'`,
  `      secret_key_b58: '${secretKeyB58}'`,
  `      created_at: '${createdAt}'`,
  "",
].join("\n");

fs.writeFileSync(accountsPath, yaml, { mode: 0o600 });
fs.chmodSync(accountsPath, 0o600);

console.log("== pay account configured ==");
console.log(`network: mainnet`);
console.log(`account: ${payAccount}`);
console.log(`pubkey: ${publicKeyB58}`);
console.log(`accounts file: ${accountsPath}`);
console.log("secret key: <redacted>");

function readSolanaKeypair(filePath) {
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

function normalizeNetwork(value) {
  if (value === "mainnet-beta") return "mainnet";
  return value;
}

function isInsidePath(child, parent) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function base58Encode(buffer) {
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
