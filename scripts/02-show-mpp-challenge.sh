#!/usr/bin/env bash
set -euo pipefail

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${HYPERSPACE_PAY_BASE:=https://80.69.175.159/pay}"
: "${HYPERSPACE_API_INSECURE_TLS:=true}"
: "${HYPERSPACE_INGRESS_GATE_ID:=gate-eu-svg-01}"
: "${HYPERSPACE_EGRESS_GATE_ID:=gate-eu-lon-01}"
: "${DEMO_CONFIG_NAME:=hyperspace-svg-london-agent-demo}"
: "${PREPAID_DURATION_MINUTES:=30}"
: "${PREPAID_BANDWIDTH_GB:=0.1}"
: "${ALLOW_ANY_SOURCE:=true}"

url="${HYPERSPACE_PAY_BASE%/}/v1/agent/wireguard/configs"
headers_file="$(mktemp)"
body_file="$(mktemp)"
trap 'rm -f "$headers_file" "$body_file"' EXIT

request_body="$(
  node -e '
const env = process.env;
process.stdout.write(JSON.stringify({
  name: env.DEMO_CONFIG_NAME,
  ingress_gate_id: env.HYPERSPACE_INGRESS_GATE_ID,
  egress_gate_id: env.HYPERSPACE_EGRESS_GATE_ID,
  duration_minutes: Number(env.PREPAID_DURATION_MINUTES || 30),
  bandwidth_gb: Number(env.PREPAID_BANDWIDTH_GB || 0.1),
  allow_any_source: String(env.ALLOW_ANY_SOURCE || "true") === "true",
}));
'
)"

curl_args=(-sS -D "$headers_file" -o "$body_file" -w "%{http_code}")
if [[ "${HYPERSPACE_API_INSECURE_TLS}" == "true" ]]; then
  curl_args+=(-k)
fi

status="$(curl "${curl_args[@]}" -X POST "$url" -H "content-type: application/json" -d "$request_body")"

echo "== Raw MPP / HTTP 402 challenge =="
echo "POST ${url}"
echo "status: ${status}"
echo
echo "payment headers:"
grep -i '^www-authenticate: Payment ' "$headers_file" \
  | sed -E 's/(request=")[^"]+/\1<base64-payment-request>/; s/(id=")[^"]+/\1<payment-id>/; s/(expires=")[^"]+/\1<timestamp>/' \
  | head -3 || true
echo
node - "$headers_file" <<'NODE'
const fs = require("node:fs");
const headerPath = process.argv[2];
const headers = fs.readFileSync(headerPath, "utf8");
const header = headers.split(/\r?\n/).find((line) => /^www-authenticate:\s*Payment /i.test(line));
const match = header && header.match(/request="([^"]+)"/);
if (!match) process.exit(0);
try {
  const request = JSON.parse(Buffer.from(match[1], "base64").toString("utf8"));
  const network = request.methodDetails?.network || "unknown";
  console.log("decoded challenge summary:");
  console.log(`network: ${network}`);
  if (network !== "mainnet") {
    console.log("warning: this endpoint is not serving a mainnet payment challenge");
  }
  console.log();
} catch {
  process.exit(0);
}
NODE
echo "response body:"
cat "$body_file"
echo
