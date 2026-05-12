import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { envBool, envString } from "./env.mjs";

export function preflightPaidChallenge({ method = "GET", url, body }) {
  const expectedNetwork = normalizeNetwork(envString("PAY_NETWORK", "mainnet"));
  const maxBudgetUsd = parseUsdAmount(envString("PAY_YOLO_UPTO", "0.000001 USDC"));
  const curlBin = envString("CURL_BIN", "curl");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hyperspace-mpp-"));
  const headersPath = path.join(dir, "headers.txt");
  const bodyPath = path.join(dir, "body.json");

  try {
    const args = ["-sS", "-D", headersPath, "-o", bodyPath, "-w", "%{http_code}"];
    if (envBool("HYPERSPACE_API_INSECURE_TLS", false)) args.push("-k");
    if (method !== "GET") args.push("-X", method);
    args.push(url);
    if (body !== undefined) {
      args.push("-H", "content-type: application/json", "-d", JSON.stringify(body));
    }

    const result = spawnSync(curlBin, args, {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
    if (result.error?.code === "ENOENT") {
      throw new Error(`curl not found: ${curlBin}`);
    }
    if (result.status !== 0) {
      throw new Error(`curl preflight failed with exit ${result.status}: ${sanitizeOutput(result.stderr)}`);
    }

    const status = Number(String(result.stdout || "").trim());
    const headers = fs.readFileSync(headersPath, "utf8");
    const responseBody = fs.readFileSync(bodyPath, "utf8");
    const network = decodeChallengeNetwork(headers);
    const prices = collectPriceUsd(parseJsonMaybe(responseBody));
    const maxPriceUsd = prices.length ? Math.max(...prices) : null;

    if (status !== 402) {
      throw new Error(`expected HTTP 402 payment challenge, got HTTP ${status}; refusing to continue`);
    }
    if (!network) {
      throw new Error("payment challenge did not include a decodable network; refusing to continue");
    }
    if (network !== expectedNetwork) {
      throw new Error(
        `payment challenge network is ${network}, expected ${expectedNetwork}; refusing before payment`,
      );
    }
    if (maxPriceUsd === null) {
      throw new Error("payment challenge did not include price_usd; refusing before payment");
    }
    if (maxPriceUsd > maxBudgetUsd + Number.EPSILON) {
      throw new Error(
        `payment challenge price ${maxPriceUsd} USDC exceeds budget ${maxBudgetUsd} USDC; refusing before payment`,
      );
    }

    return { network, maxPriceUsd, status };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export function payCurlJson({ method = "GET", url, body, charge = false }) {
  const payBin = envString("PAY_BIN", "pay");
  const network = envString("PAY_NETWORK", "mainnet");
  const account = envString("PAY_ACCOUNT", "");
  const yolo = envString("PAY_YOLO_UPTO", "0.000001 USDC");

  const args = [];
  if (network === "mainnet" || network === "mainnet-beta") args.push("--mainnet");
  if (network === "sandbox") args.push("--sandbox");
  if (account) args.push("--account", account);
  if (charge && yolo) args.push("--yolo-upto", yolo);

  args.push("curl", "-sS");
  if (envBool("HYPERSPACE_API_INSECURE_TLS", false)) args.push("-k");
  if (method !== "GET") args.push("-X", method);
  args.push(url);
  if (body !== undefined) {
    args.push("-H", "content-type: application/json", "-d", JSON.stringify(body));
  }

  const result = spawnSync(payBin, args, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.error?.code === "ENOENT") {
    throw new Error(
      `pay CLI not found: ${payBin}. Install @solana/pay and run npm run setup-pay-account.`,
    );
  }
  if (result.status !== 0) {
    const stderr = sanitizeOutput(result.stderr);
    throw new Error(`pay curl failed with exit ${result.status}: ${stderr || "<no stderr>"}`);
  }

  return parseJsonFromStdout(result.stdout);
}

function normalizeNetwork(value) {
  if (value === "mainnet-beta") return "mainnet";
  return value;
}

function parseUsdAmount(value) {
  const match = String(value || "").match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) {
    throw new Error(`could not parse PAY_YOLO_UPTO as a USDC amount: ${value}`);
  }
  return Number(match[1]);
}

function decodeChallengeNetwork(headers) {
  const header = String(headers || "")
    .split(/\r?\n/)
    .find((line) => /^www-authenticate:\s*Payment /i.test(line));
  const match = header && header.match(/request="([^"]+)"/);
  if (!match) return "";
  try {
    const request = JSON.parse(Buffer.from(match[1], "base64").toString("utf8"));
    return normalizeNetwork(request.methodDetails?.network || "");
  } catch {
    return "";
  }
}

function parseJsonMaybe(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function collectPriceUsd(value, prices = []) {
  if (!value || typeof value !== "object") return prices;
  if (Object.prototype.hasOwnProperty.call(value, "price_usd")) {
    const price = Number(value.price_usd);
    if (Number.isFinite(price)) prices.push(price);
  }
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) {
      for (const item of child) collectPriceUsd(item, prices);
    } else if (child && typeof child === "object") {
      collectPriceUsd(child, prices);
    }
  }
  return prices;
}

function parseJsonFromStdout(stdout) {
  const trimmed = String(stdout || "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end < start) {
    throw new Error("response did not contain JSON; raw output intentionally not printed");
  }
  const candidate = trimmed.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch (error) {
    throw new Error(`failed to parse JSON response: ${error.message}`);
  }
}

function sanitizeOutput(value) {
  return String(value || "")
    .replace(/PrivateKey\s*=\s*.*/gi, "PrivateKey = <redacted>")
    .replace(/PresharedKey\s*=\s*.*/gi, "PresharedKey = <redacted>")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer <redacted>")
    .slice(0, 2000);
}
