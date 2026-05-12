#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/env.sh
source "${SCRIPT_DIR}/lib/env.sh"
load_env_file ".env"

: "${WG_CONFIG_PATH:=runtime/hyperspace-demo.conf}"
: "${WG_CONNECT_CONFIG_PATH:=${WG_CONFIG_PATH%.conf}-connect.conf}"
: "${WG_STRIP_DNS:=true}"

if [[ ! -f "${WG_CONFIG_PATH}" && ! -f "${WG_CONNECT_CONFIG_PATH}" ]]; then
  echo "WireGuard config not found: ${WG_CONFIG_PATH}" >&2
  exit 0
fi

echo "== Disconnecting WireGuard =="
legacy_nodns_config="${WG_CONFIG_PATH%.conf}-nodns.conf"

wg-quick down "${WG_CONNECT_CONFIG_PATH}" \
  || wg-quick down "${legacy_nodns_config}" \
  || wg-quick down "${WG_CONFIG_PATH}" \
  || true
