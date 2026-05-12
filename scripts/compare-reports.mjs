#!/usr/bin/env node
import fs from "node:fs";
import { loadEnv, envString } from "./lib/env.mjs";

loadEnv();

const baselinePath = envString("BASELINE_REPORT_PATH", "runtime/baseline.json");
const vpnPath = envString("VPN_REPORT_PATH", "runtime/vpn.json");

const baseline = readReport(baselinePath);
const vpn = readReport(vpnPath);

console.log("== Hyperspace network comparison ==");
console.log(`target: ${baseline.target}`);
console.log();
printTable([
  metricRow("median ms", baseline.medianMs, vpn.medianMs),
  metricRow("p95 ms", baseline.p95Ms, vpn.p95Ms),
  metricRow("stddev jitter ms", baseline.jitterStddevMs, vpn.jitterStddevMs),
  metricRow("mean abs delta jitter ms", baseline.jitterMeanAbsDeltaMs, vpn.jitterMeanAbsDeltaMs),
  metricRow("failures", baseline.failures, vpn.failures, { integer: true }),
]);

console.log();
console.log("Narrative:");
console.log(
  "Lower p95 and lower jitter indicate a tighter, more predictable path. This script uses repeatable TCP connect timing against the configured diagnostic target.",
);

function readReport(path) {
  if (!fs.existsSync(path)) {
    throw new Error(`missing report: ${path}`);
  }
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function metricRow(label, direct, tunnel, options = {}) {
  const delta =
    typeof direct === "number" && typeof tunnel === "number"
      ? tunnel - direct
      : "";
  return {
    metric: label,
    direct: formatValue(direct, options),
    tunnel: formatValue(tunnel, options),
    delta: formatDelta(delta, options),
  };
}

function printTable(rows) {
  const headers = {
    metric: "metric",
    direct: "direct",
    tunnel: "hyperspace vpn",
    delta: "delta",
  };
  const widths = {
    metric: Math.max(headers.metric.length, ...rows.map((item) => item.metric.length)),
    direct: Math.max(headers.direct.length, ...rows.map((item) => item.direct.length)),
    tunnel: Math.max(headers.tunnel.length, ...rows.map((item) => item.tunnel.length)),
    delta: Math.max(headers.delta.length, ...rows.map((item) => item.delta.length)),
  };

  console.log(
    `${headers.metric.padEnd(widths.metric)}  ${headers.direct.padStart(widths.direct)}  ${headers.tunnel.padStart(widths.tunnel)}  ${headers.delta.padStart(widths.delta)}`,
  );
  console.log(
    `${"-".repeat(widths.metric)}  ${"-".repeat(widths.direct)}  ${"-".repeat(widths.tunnel)}  ${"-".repeat(widths.delta)}`,
  );
  for (const item of rows) {
    console.log(
      `${item.metric.padEnd(widths.metric)}  ${item.direct.padStart(widths.direct)}  ${item.tunnel.padStart(widths.tunnel)}  ${item.delta.padStart(widths.delta)}`,
    );
  }
}

function formatValue(value, { integer = false } = {}) {
  if (value === null || value === undefined || value === "") {
    return "n/a";
  }
  if (typeof value !== "number") {
    return String(value);
  }
  return integer ? String(value) : value.toFixed(3);
}

function formatDelta(value, { integer = false } = {}) {
  if (value === null || value === undefined || value === "") {
    return "n/a";
  }
  if (typeof value !== "number") {
    return String(value);
  }
  if (integer) {
    return value > 0 ? `+${value}` : String(value);
  }
  const formatted = value.toFixed(3);
  return value > 0 ? `+${formatted}` : formatted;
}
