#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/env.sh
source "${SCRIPT_DIR}/lib/env.sh"
load_env_file ".env"

: "${WG_CONFIG_PATH:=runtime/hyperspace-demo.conf}"
: "${WG_CONNECT_CONFIG_PATH:=runtime/hsvgdemo.conf}"

safe_connect_config_path() {
  local requested="$1"
  local base iface
  base="$(basename "${requested}")"
  if [[ "${base}" == *.conf ]]; then
    iface="${base%.conf}"
    if [[ "${iface}" =~ ^[A-Za-z0-9_=+.-]{1,15}$ ]]; then
      printf '%s\n' "${requested}"
      return
    fi
  fi

  local dir
  dir="$(dirname "${WG_CONFIG_PATH}")"
  if [[ "${dir}" == "." ]]; then
    printf 'hsvgdemo.conf\n'
  else
    printf '%s/hsvgdemo.conf\n' "${dir}"
  fi
}

connect_config="$(safe_connect_config_path "${WG_CONNECT_CONFIG_PATH}")"
legacy_nodns_config="${WG_CONFIG_PATH%.conf}-nodns.conf"

if [[ ! -f "${WG_CONFIG_PATH}" && ! -f "${connect_config}" && ! -f "${legacy_nodns_config}" ]]; then
  echo "WireGuard config not found: ${WG_CONFIG_PATH}" >&2
  exit 0
fi

echo "== Disconnecting WireGuard =="

wg-quick down "${connect_config}" \
  || wg-quick down "${legacy_nodns_config}" \
  || wg-quick down "${WG_CONFIG_PATH}" \
  || true
