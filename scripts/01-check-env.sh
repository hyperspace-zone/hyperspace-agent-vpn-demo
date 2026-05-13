#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/env.sh
source "${SCRIPT_DIR}/lib/env.sh"
load_env_file ".env"

: "${HYPERSPACE_PAY_BASE:=https://app.dev.hyperspace.zone/pay}"
: "${HYPERSPACE_API_INSECURE_TLS:=true}"
: "${PAY_BIN:=pay}"
: "${PAY_NETWORK:=mainnet}"
: "${PAY_ACCOUNT:=hyperspace-agent-demo}"
: "${SOLANA_KEYPAIR_PATH:=}"

echo "== Hyperspace agent demo environment =="
echo "pay base: ${HYPERSPACE_PAY_BASE}"
echo "pay account: ${PAY_ACCOUNT}"
echo "wallet path configured: $([[ -n "${SOLANA_KEYPAIR_PATH}" ]] && echo yes || echo no)"

errors=0

for cmd in node curl bash; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "error: missing required command: $cmd" >&2
    errors=1
  fi
done

if command -v node >/dev/null 2>&1 && ! node -e '
const [major, minor] = process.versions.node.split(".").map(Number);
process.exit(major > 20 || (major === 20 && minor >= 18) ? 0 : 1);
' ; then
  echo "error: Node.js 20.18+ is required" >&2
  errors=1
fi

if ! command -v "$PAY_BIN" >/dev/null 2>&1; then
  echo "error: pay CLI not found as '${PAY_BIN}'. Install @solana/pay before npm run buy-vpn." >&2
  errors=1
else
  pay_args=()
  if [[ "${PAY_NETWORK}" == "mainnet" || "${PAY_NETWORK}" == "mainnet-beta" ]]; then
    pay_args+=(--mainnet)
  elif [[ "${PAY_NETWORK}" == "sandbox" ]]; then
    pay_args+=(--sandbox)
  fi
  if ! "$PAY_BIN" "${pay_args[@]}" whoami --account "$PAY_ACCOUNT" >/dev/null 2>&1; then
    echo "error: pay account '${PAY_ACCOUNT}' is not configured. Run npm run setup-pay-account." >&2
    errors=1
  fi
fi

if [[ -z "${SOLANA_KEYPAIR_PATH}" ]]; then
  echo "error: SOLANA_KEYPAIR_PATH is not set in .env" >&2
  errors=1
else
  if [[ ! -f "${SOLANA_KEYPAIR_PATH}" ]]; then
    echo "error: SOLANA_KEYPAIR_PATH does not exist: ${SOLANA_KEYPAIR_PATH}" >&2
    errors=1
  fi
  repo_root="$(pwd -P)"
  wallet_abs="$(cd "$(dirname "${SOLANA_KEYPAIR_PATH}")" 2>/dev/null && pwd -P || true)"
  if [[ -n "${wallet_abs}" && "${wallet_abs}" == "${repo_root}"* ]]; then
    echo "error: wallet path is inside this repository; move it outside before running the demo" >&2
    exit 1
  fi
fi

if [[ "${errors}" -ne 0 ]]; then
  echo "Fix the environment errors above before running the paid VPN steps." >&2
  exit 1
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
