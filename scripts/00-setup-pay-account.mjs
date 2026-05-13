#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadEnv, envString } from "./lib/env.mjs";
import { base58Encode, publicKeyFromKeypairBytes, readSolanaKeypair } from "./lib/solana-keypair.mjs";

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
if (!fs.existsSync(absoluteWalletPath)) {
  throw new Error(
    `SOLANA_KEYPAIR_PATH does not exist: ${absoluteWalletPath}. ` +
      "Create a Solana keypair with solana-keygen or point .env to an existing funded id.json.",
  );
}

const keypair = readSolanaKeypair(absoluteWalletPath);
const publicKey = publicKeyFromKeypairBytes(keypair);
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

function normalizeNetwork(value) {
  if (value === "mainnet-beta") return "mainnet";
  return value;
}

function isInsidePath(child, parent) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
