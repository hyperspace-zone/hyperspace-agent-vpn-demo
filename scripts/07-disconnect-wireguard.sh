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
  exit 0
fi

echo "== Disconnecting WireGuard =="
wg-quick down "${WG_CONFIG_PATH}" || true
