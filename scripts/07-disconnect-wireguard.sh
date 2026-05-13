#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/env.sh
source "${SCRIPT_DIR}/lib/env.sh"
load_env_file ".env"

: "${WG_CONFIG_PATH:=runtime/hyperspace-demo.conf}"

config_dir="$(dirname "${WG_CONFIG_PATH}")"
if [[ "${config_dir}" == "." ]]; then
  legacy_connect_config="hsvgdemo.conf"
else
  legacy_connect_config="${config_dir}/hsvgdemo.conf"
fi
legacy_nodns_config="${WG_CONFIG_PATH%.conf}-nodns.conf"

if [[ ! -f "${WG_CONFIG_PATH}" && ! -f "${legacy_connect_config}" && ! -f "${legacy_nodns_config}" ]]; then
  echo "WireGuard config not found: ${WG_CONFIG_PATH}" >&2
  exit 0
fi

echo "== Disconnecting WireGuard =="

wg-quick down "${WG_CONFIG_PATH}" \
  || wg-quick down "${legacy_connect_config}" \
  || wg-quick down "${legacy_nodns_config}" \
  || true
