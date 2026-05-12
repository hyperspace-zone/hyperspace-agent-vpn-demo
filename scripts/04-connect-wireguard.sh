#!/usr/bin/env bash
set -euo pipefail

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${WG_CONFIG_PATH:=runtime/hyperspace-demo.conf}"

if [[ ! -f "${WG_CONFIG_PATH}" ]]; then
  echo "WireGuard config not found: ${WG_CONFIG_PATH}" >&2
  echo "Run npm run issue-vpn first." >&2
  exit 1
fi

if ! command -v wg-quick >/dev/null 2>&1; then
  echo "wg-quick is required" >&2
  exit 1
fi

echo "== Connecting WireGuard =="
echo "config: ${WG_CONFIG_PATH}"
wg-quick up "${WG_CONFIG_PATH}"

echo
echo "== Active WireGuard interfaces =="
wg show || true
