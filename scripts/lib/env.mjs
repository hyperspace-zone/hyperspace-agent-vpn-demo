import fs from "node:fs";
import path from "node:path";
import process from "node:process";

export function loadEnv(filePath = ".env") {
  const absolute = path.resolve(filePath);
  if (fs.existsSync(absolute)) {
    const lines = fs.readFileSync(absolute, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue;
      process.env[key] = unquote(rawValue.trim());
    }
  }
  return process.env;
}

export function envString(name, fallback = "") {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

export function envNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

export function envBool(name, fallback = false) {
  const value = envString(name, fallback ? "true" : "false").toLowerCase();
  return ["1", "true", "yes", "y", "on"].includes(value);
}

export function ensureRuntimeDir() {
  const dir = envString("RUNTIME_DIR", "runtime");
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  return dir;
}

export function redactWireGuardConfig(config) {
  return String(config || "")
    .replace(/PrivateKey\s*=\s*.*/gi, "PrivateKey = <redacted>")
    .replace(/PresharedKey\s*=\s*.*/gi, "PresharedKey = <redacted>");
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}
