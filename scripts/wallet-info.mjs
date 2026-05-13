#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { loadEnv, envString } from "./lib/env.mjs";
import { base58Encode, publicKeyFromKeypairBytes, readSolanaKeypair } from "./lib/solana-keypair.mjs";

loadEnv();

const requireMinimums = process.argv.includes("--require-minimums");
const walletPath = envString("SOLANA_KEYPAIR_PATH");
const rpcUrl = envString("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com");
const usdcMint = envString("USDC_MINT", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const minSolFeeBalance = envString("MIN_SOL_FEE_BALANCE", "0.00001");
const minUsdcBalance = envString("MIN_USDC_BALANCE", "0.000001");

if (!walletPath) {
  throw new Error("SOLANA_KEYPAIR_PATH is required");
}

const absoluteWalletPath = path.resolve(walletPath);
const repoRoot = process.cwd();
if (isInsidePath(absoluteWalletPath, repoRoot)) {
  throw new Error("wallet path is inside this repository; move id.json outside the repo");
}
if (!fs.existsSync(absoluteWalletPath)) {
  throw new Error(`SOLANA_KEYPAIR_PATH does not exist: ${absoluteWalletPath}`);
}

const keypair = readSolanaKeypair(absoluteWalletPath);
const owner = base58Encode(publicKeyFromKeypairBytes(keypair));

const solLamports = BigInt((await rpc("getBalance", [owner, { commitment: "confirmed" }])).value ?? 0);
const usdc = await getTokenBalance(owner, usdcMint);

console.log("== Wallet balances ==");
console.log(`wallet: ${owner}`);
console.log(`solscan: https://solscan.io/account/${owner}`);
console.log(`SOL: ${formatUnits(solLamports, 9)} SOL (${solLamports} lamports)`);
console.log(`USDC: ${formatUnits(usdc.amount, usdc.decimals)} USDC`);

const minSolLamports = parseDecimalToUnits(minSolFeeBalance, 9);
const minUsdcUnits = parseDecimalToUnits(minUsdcBalance, usdc.decimals);

let errors = 0;
if (solLamports < minSolLamports) {
  reportBalanceProblem(`wallet needs at least ${minSolFeeBalance} SOL for transaction fees`);
  errors = 1;
}
if (usdc.amount <= minUsdcUnits) {
  reportBalanceProblem(`wallet needs more than ${minUsdcBalance} USDC for the paid request`);
  errors = 1;
}

if (errors && requireMinimums) {
  process.exit(errors);
}

async function getTokenBalance(owner, mint) {
  const result = await rpc("getTokenAccountsByOwner", [
    owner,
    { mint },
    { encoding: "jsonParsed", commitment: "confirmed" },
  ]);

  let amount = 0n;
  let decimals = 6;
  for (const entry of result.value || []) {
    const tokenAmount = entry?.account?.data?.parsed?.info?.tokenAmount;
    if (!tokenAmount) continue;
    decimals = Number(tokenAmount.decimals ?? decimals);
    amount += BigInt(tokenAmount.amount ?? "0");
  }
  return { amount, decimals };
}

async function rpc(method, params) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!response.ok) {
    throw new Error(`Solana RPC ${method} failed with HTTP ${response.status}`);
  }
  const payload = await response.json();
  if (payload.error) {
    throw new Error(`Solana RPC ${method} failed: ${payload.error.message || JSON.stringify(payload.error)}`);
  }
  return payload.result;
}

function formatUnits(amount, decimals) {
  const scale = 10n ** BigInt(decimals);
  const whole = amount / scale;
  const fraction = (amount % scale).toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${whole}${fraction ? "." + fraction : ""}`;
}

function parseDecimalToUnits(value, decimals) {
  const raw = String(value).trim();
  if (!/^\d+(\.\d+)?$/.test(raw)) {
    throw new Error(`invalid decimal amount: ${value}`);
  }
  const [whole, fraction = ""] = raw.split(".");
  const paddedFraction = fraction.slice(0, decimals).padEnd(decimals, "0");
  return BigInt(whole) * (10n ** BigInt(decimals)) + BigInt(paddedFraction || "0");
}

function reportBalanceProblem(message) {
  console.error(`${requireMinimums ? "error" : "warning"}: ${message}`);
}

function isInsidePath(child, parent) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
