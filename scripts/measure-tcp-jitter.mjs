#!/usr/bin/env node
import net from "node:net";
import fs from "node:fs";
import process from "node:process";
import { loadEnv, envNumber, envString, ensureRuntimeDir } from "./lib/env.mjs";

loadEnv();
ensureRuntimeDir();

const args = parseArgs(process.argv.slice(2));
const label = args.label || "measurement";
const host = args.host || envString("JITTER_TARGET_HOST", "data.mft.lseg.com");
const port = Number(args.port || envString("JITTER_TARGET_PORT", "443"));
const samples = Number(args.samples || envNumber("JITTER_SAMPLES", 30));
const timeoutMs = Number(args.timeoutMs || envNumber("JITTER_TIMEOUT_MS", 3000));
const intervalMs = Number(args.intervalMs || envNumber("JITTER_INTERVAL_MS", 200));
const out = args.out || "";

if (!host || !port || !samples) {
  throw new Error("host, port and samples are required");
}

console.log(`== TCP jitter measurement: ${label} ==`);
console.log(`target: ${host}:${port}`);
console.log(`samples: ${samples}, timeout: ${timeoutMs}ms`);

const results = [];
for (let i = 0; i < samples; i += 1) {
  const sample = await tcpConnectSample(host, port, timeoutMs);
  results.push(sample);
  const text = sample.ok ? `${sample.ms.toFixed(3)} ms` : `fail:${sample.error}`;
  console.log(`${String(i + 1).padStart(2, "0")}/${samples} ${text}`);
  if (i < samples - 1) await sleep(intervalMs);
}

const report = buildReport({ label, host, port, samples: results });
console.log();
printReport(report);

if (out) {
  fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`report saved: ${out}`);
}

function tcpConnectSample(targetHost, targetPort, timeout) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const started = process.hrtime.bigint();
    let done = false;

    const finish = (sample) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve(sample);
    };

    socket.setTimeout(timeout);
    socket.once("connect", () => {
      const elapsed = Number(process.hrtime.bigint() - started) / 1e6;
      finish({ ok: true, ms: elapsed });
    });
    socket.once("timeout", () => finish({ ok: false, error: "timeout" }));
    socket.once("error", (error) => finish({ ok: false, error: error.code || error.message }));
    socket.connect(targetPort, targetHost);
  });
}

function buildReport({ label: reportLabel, host: reportHost, port: reportPort, samples: rawSamples }) {
  const values = rawSamples.filter((s) => s.ok).map((s) => s.ms);
  const failures = rawSamples.length - values.length;
  const deltas = [];
  for (let i = 1; i < values.length; i += 1) {
    deltas.push(Math.abs(values[i] - values[i - 1]));
  }
  return {
    label: reportLabel,
    target: `${reportHost}:${reportPort}`,
    measuredAt: new Date().toISOString(),
    requestedSamples: rawSamples.length,
    successfulSamples: values.length,
    failures,
    minMs: round(min(values)),
    medianMs: round(percentile(values, 0.5)),
    avgMs: round(avg(values)),
    p95Ms: round(percentile(values, 0.95)),
    maxMs: round(max(values)),
    jitterStddevMs: round(stddev(values)),
    jitterMeanAbsDeltaMs: round(avg(deltas)),
    samplesMs: values.map(round),
    failedSamples: rawSamples.filter((s) => !s.ok),
  };
}

function printReport(report) {
  console.log(`label: ${report.label}`);
  console.log(`target: ${report.target}`);
  console.log(`success: ${report.successfulSamples}/${report.requestedSamples}`);
  console.log(`median: ${report.medianMs} ms`);
  console.log(`p95: ${report.p95Ms} ms`);
  console.log(`stddev jitter: ${report.jitterStddevMs} ms`);
  console.log(`mean abs delta jitter: ${report.jitterMeanAbsDeltaMs} ms`);
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    parsed[key] = argv[i + 1];
    i += 1;
  }
  return parsed;
}

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil(sorted.length * p) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

function avg(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stddev(values) {
  if (values.length < 2) return 0;
  const mean = avg(values);
  return Math.sqrt(avg(values.map((value) => (value - mean) ** 2)));
}

function min(values) {
  return values.length ? Math.min(...values) : null;
}

function max(values) {
  return values.length ? Math.max(...values) : null;
}

function round(value) {
  return value === null || value === undefined ? null : Number(value.toFixed(3));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
