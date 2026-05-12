import { spawnSync } from "node:child_process";
import process from "node:process";
import { envBool, envString } from "./env.mjs";

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
