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
console.log("| metric | direct | hyperspace vpn | delta |");
console.log("| --- | ---: | ---: | ---: |");
row("median ms", baseline.medianMs, vpn.medianMs);
row("p95 ms", baseline.p95Ms, vpn.p95Ms);
row("stddev jitter ms", baseline.jitterStddevMs, vpn.jitterStddevMs);
row("mean abs delta jitter ms", baseline.jitterMeanAbsDeltaMs, vpn.jitterMeanAbsDeltaMs);
row("failures", baseline.failures, vpn.failures);

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

function row(label, direct, tunnel) {
  const delta =
    typeof direct === "number" && typeof tunnel === "number"
      ? Number((tunnel - direct).toFixed(3))
      : "";
  console.log(`| ${label} | ${format(direct)} | ${format(tunnel)} | ${format(delta)} |`);
}

function format(value) {
  return value === null || value === undefined || value === "" ? "n/a" : String(value);
}
