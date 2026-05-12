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
: "${PAY_BIN:=pay}"
: "${SOLANA_KEYPAIR_PATH:=}"

echo "== Hyperspace agent demo environment =="
echo "pay base: ${HYPERSPACE_PAY_BASE}"
echo "wallet path configured: $([[ -n "${SOLANA_KEYPAIR_PATH}" ]] && echo yes || echo no)"

for cmd in node curl bash; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "missing required command: $cmd" >&2
    exit 1
  fi
done

if ! node -e 'const major=Number(process.versions.node.split(".")[0]); process.exit(major >= 20 ? 0 : 1)' ; then
  echo "Node.js 20+ is required" >&2
  exit 1
fi

if ! command -v "$PAY_BIN" >/dev/null 2>&1; then
  echo "warning: pay CLI not found as '${PAY_BIN}'. npm run buy-vpn will fail unless HYPERSPACE_AGENT_API_TOKEN is set for developer-only direct API testing." >&2
fi

if [[ -n "${SOLANA_KEYPAIR_PATH}" ]]; then
  if [[ ! -f "${SOLANA_KEYPAIR_PATH}" ]]; then
    echo "warning: SOLANA_KEYPAIR_PATH does not exist: ${SOLANA_KEYPAIR_PATH}" >&2
  fi
  repo_root="$(pwd -P)"
  wallet_abs="$(cd "$(dirname "${SOLANA_KEYPAIR_PATH}")" 2>/dev/null && pwd -P || true)"
  if [[ -n "${wallet_abs}" && "${wallet_abs}" == "${repo_root}"* ]]; then
    echo "error: wallet path is inside this repository; move it outside before running the demo" >&2
    exit 1
  fi
fi

curl_args=(-sS)
if [[ "${HYPERSPACE_API_INSECURE_TLS}" == "true" ]]; then
  curl_args+=(-k)
fi

echo
echo "== Staging health =="
curl "${curl_args[@]}" "${HYPERSPACE_PAY_BASE%/}/v1/agent/health"
echo

echo
echo "== Available gates =="
curl "${curl_args[@]}" "${HYPERSPACE_PAY_BASE%/}/v1/agent/gates" | node -e '
const fs = require("node:fs");
const payload = JSON.parse(fs.readFileSync(0, "utf8"));
for (const gate of payload.gates || []) {
  if (gate.publicIp === "212.147.234.64") {
    gate.id = "gate-eu-svg-01";
    gate.shortId = "svg";
    gate.city = "Stavanger";
  }
}
console.log(JSON.stringify(payload));
'
echo
