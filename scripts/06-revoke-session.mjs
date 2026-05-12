#!/usr/bin/env node
import fs from "node:fs";
import { loadEnv, envString } from "./lib/env.mjs";
import { payCurlJson } from "./lib/pay.mjs";

loadEnv();

const base = selectApiBase();
const sessionPath = envString("SESSION_PATH", "runtime/session.json");

if (!fs.existsSync(sessionPath)) {
  throw new Error(`session file not found: ${sessionPath}`);
}

const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
const configId = session.configId || session.config_id || session.id;
if (!configId) {
  throw new Error("session file does not contain configId");
}

const url = `${base}/v1/agent/wireguard/configs/${encodeURIComponent(configId)}/revoke`;

console.log("== Revoking Hyperspace session ==");
console.log(`config id: ${configId}`);

const response = payCurlJson({ method: "POST", url, body: {}, charge: false });
const updated = {
  ...session,
  revokedAt: new Date().toISOString(),
  revokeResponse: response.config || response,
};
fs.writeFileSync(sessionPath, `${JSON.stringify(updated, null, 2)}\n`, { mode: 0o600 });

console.log("revocation requested");
console.log(`session metadata updated: ${sessionPath}`);

function selectApiBase() {
  if (envString("HYPERSPACE_AGENT_API_TOKEN") && envString("HYPERSPACE_DIRECT_API_BASE")) {
    return envString("HYPERSPACE_DIRECT_API_BASE").replace(/\/+$/, "");
  }
  return envString("HYPERSPACE_PAY_BASE", "https://80.69.175.159/pay").replace(/\/+$/, "");
}
