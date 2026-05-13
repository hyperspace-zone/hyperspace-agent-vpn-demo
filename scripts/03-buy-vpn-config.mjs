#!/usr/bin/env node
import {
  loadEnv,
  envNumber,
  envString,
  ensureRuntimeDir,
  redactWireGuardConfig,
  writeFileWithTimestampCopy,
} from "./lib/env.mjs";
import { payCurlJson, preflightPaidChallenge } from "./lib/pay.mjs";

loadEnv();
ensureRuntimeDir();

const base = selectApiBase();
const url = `${base}/v1/agent/wireguard/configs`;
const sessionPath = envString("SESSION_PATH", "runtime/session.json");
const configPath = envString("WG_CONFIG_PATH", "runtime/hyperspace-demo.conf");
const sourceIp = envString("HYPERSPACE_SOURCE_IP");
const targetIp = envString("HYPERSPACE_TARGET_IP", envString("JITTER_TARGET_HOST", ""));

if (!isIpv4(sourceIp)) {
  throw new Error("HYPERSPACE_SOURCE_IP must be set to this server's stable public egress IPv4 address");
}
if (!isIpv4(targetIp)) {
  throw new Error("HYPERSPACE_TARGET_IP must be set to the destination IPv4 address for the paid IP-to-IP VPN config");
}

const body = {
  mode: "ip_to_ip",
  name: envString("DEMO_CONFIG_NAME", `hyperspace-agent-${Date.now()}`),
  source_ip: sourceIp,
  target_ip: targetIp,
  ingress_gate_id: envString("HYPERSPACE_INGRESS_GATE_ID", "gate-eu-svg-01"),
  egress_gate_id: envString("HYPERSPACE_EGRESS_GATE_ID", "gate-eu-lon-01"),
  duration_minutes: envNumber("PREPAID_DURATION_MINUTES", 30),
  bandwidth_gb: envNumber("PREPAID_BANDWIDTH_GB", 0.1),
};

if (!body.ingress_gate_id || !body.egress_gate_id) {
  throw new Error("HYPERSPACE_INGRESS_GATE_ID and HYPERSPACE_EGRESS_GATE_ID are required");
}
if (body.ingress_gate_id === body.egress_gate_id) {
  throw new Error("ingress and egress gates must be different");
}

console.log("== Issuing prepaid Hyperspace WireGuard config ==");
console.log(`route: ${body.ingress_gate_id} -> ${body.egress_gate_id}`);
console.log(`mode: ${body.mode}`);
console.log(`source ip: ${body.source_ip}`);
console.log(`target ip: ${body.target_ip}`);
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

const configArchivePath = writeFileWithTimestampCopy(configPath, wireguardConfig, { mode: 0o600 });

const session = {
  configId,
  configName: config.name || body.name,
  fileName: config.fileName || config.file_name || "hyperspace-demo.conf",
  mode: body.mode,
  sourceIp: body.source_ip,
  targetIp: body.target_ip,
  route: {
    ingressGateId: body.ingress_gate_id,
    egressGateId: body.egress_gate_id,
  },
  prepaid,
  configPath,
  issuedAt: new Date().toISOString(),
};

const sessionArchivePath = writeFileWithTimestampCopy(sessionPath, `${JSON.stringify(session, null, 2)}\n`, {
  mode: 0o600,
});

console.log(`issued config id: ${configId}`);
console.log(`wireguard config saved: ${configPath}`);
console.log(`timestamped wireguard config saved: ${configArchivePath}`);
console.log(`session metadata saved: ${sessionPath}`);
console.log(`timestamped session metadata saved: ${sessionArchivePath}`);
console.log("redacted config preview:");
console.log(redactWireGuardConfig(wireguardConfig).split("\n").slice(0, 12).join("\n"));

function selectApiBase() {
  return envString("HYPERSPACE_PAY_BASE", "https://app.dev.hyperspace.zone/pay").replace(/\/+$/, "");
}

function isIpv4(value) {
  const parts = String(value || "").split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const num = Number(part);
    return num >= 0 && num <= 255;
  });
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
