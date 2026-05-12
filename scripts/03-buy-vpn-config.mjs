#!/usr/bin/env node
import fs from "node:fs";
import { loadEnv, envBool, envNumber, envString, ensureRuntimeDir, redactWireGuardConfig } from "./lib/env.mjs";
import { payCurlJson, preflightPaidChallenge } from "./lib/pay.mjs";

loadEnv();
ensureRuntimeDir();

const base = selectApiBase();
const url = `${base}/v1/agent/wireguard/configs`;
const sessionPath = envString("SESSION_PATH", "runtime/session.json");
const configPath = envString("WG_CONFIG_PATH", "runtime/hyperspace-demo.conf");

const body = {
  name: envString("DEMO_CONFIG_NAME", `hyperspace-agent-${Date.now()}`),
  ingress_gate_id: envString("HYPERSPACE_INGRESS_GATE_ID", "gate-eu-svg-01"),
  egress_gate_id: envString("HYPERSPACE_EGRESS_GATE_ID", "gate-eu-lon-01"),
  duration_minutes: envNumber("PREPAID_DURATION_MINUTES", 30),
  bandwidth_gb: envNumber("PREPAID_BANDWIDTH_GB", 0.1),
  allow_any_source: envBool("ALLOW_ANY_SOURCE", true),
};

if (!body.ingress_gate_id || !body.egress_gate_id) {
  throw new Error("HYPERSPACE_INGRESS_GATE_ID and HYPERSPACE_EGRESS_GATE_ID are required");
}
if (body.ingress_gate_id === body.egress_gate_id) {
  throw new Error("ingress and egress gates must be different");
}

console.log("== Issuing prepaid Hyperspace WireGuard config ==");
console.log(`route: ${body.ingress_gate_id} -> ${body.egress_gate_id}`);
console.log(`endpoint: ${url}`);
console.log("authorization: MPP / HTTP 402 payment flow");
console.log(`budget: ${envString("PAY_YOLO_UPTO", "0.000001 USDC")}`);

const challenge = preflightPaidChallenge({ method: "POST", url, body });
console.log(`challenge network: ${challenge.network}`);
console.log(`challenge max price: ${challenge.maxPriceUsd} USDC`);

const response = payCurlJson({ method: "POST", url, body, charge: true });
const config = response.config || response;
const prepaid = response.prepaid || response.config?.prepaid || null;
const wireguardConfig = config.wireguardConfig || config.wireguard_config || config.fileData || config.file_data;
const configId = config.id || config.config_id || prepaid?.id;

if (response.error || response.message) {
  throw new Error(`paid response error: ${summarizePaidResponse(response)}`);
}
if (!configId) {
  throw new Error(`paid response did not include config id: ${summarizePaidResponse(response)}`);
}
if (!wireguardConfig) {
  throw new Error(`paid response did not include WireGuard config: ${summarizePaidResponse(response)}`);
}

fs.writeFileSync(configPath, wireguardConfig, { mode: 0o600 });

const session = {
  configId,
  configName: config.name || body.name,
  fileName: config.fileName || config.file_name || "hyperspace-demo.conf",
  route: {
    ingressGateId: body.ingress_gate_id,
    egressGateId: body.egress_gate_id,
  },
  prepaid,
  configPath,
  issuedAt: new Date().toISOString(),
};

fs.writeFileSync(sessionPath, `${JSON.stringify(session, null, 2)}\n`, { mode: 0o600 });

console.log(`issued config id: ${configId}`);
console.log(`wireguard config saved: ${configPath}`);
console.log(`session metadata saved: ${sessionPath}`);
console.log("redacted config preview:");
console.log(redactWireGuardConfig(wireguardConfig).split("\n").slice(0, 12).join("\n"));

function selectApiBase() {
  return envString("HYPERSPACE_PAY_BASE", "https://80.69.175.159/pay").replace(/\/+$/, "");
}

function summarizePaidResponse(value) {
  if (!value || typeof value !== "object") {
    return "<non-object response>";
  }
  const summary = {
    error: value.error,
    message: value.message,
    status: value.status,
    details: value.details,
    keys: Object.keys(value).slice(0, 12),
  };
  return JSON.stringify(summary);
}
