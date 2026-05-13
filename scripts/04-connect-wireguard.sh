#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/env.sh
source "${SCRIPT_DIR}/lib/env.sh"
load_env_file ".env"

: "${WG_CONFIG_PATH:=runtime/hyperspace-demo.conf}"
: "${WG_ALLOW_FULL_TUNNEL_ON_SSH:=false}"

if [[ ! -f "${WG_CONFIG_PATH}" ]]; then
  echo "WireGuard config not found: ${WG_CONFIG_PATH}" >&2
  echo "Run npm run buy-vpn first." >&2
  exit 1
fi

if ! command -v wg-quick >/dev/null 2>&1; then
  echo "wg-quick is required" >&2
  exit 1
fi

extract_allowed_ips() {
  awk -F= '/^[[:space:]]*AllowedIPs[[:space:]]*=/{gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2); print $2; exit}' "$1"
}

has_active_ssh_session() {
  if [[ -n "${SSH_CONNECTION:-}" ]]; then
    return 0
  fi
  if command -v ss >/dev/null 2>&1; then
    ss -Htn state established 2>/dev/null \
      | awk '$4 ~ /:22$/ || $5 ~ /:22$/ { found = 1 } END { exit found ? 0 : 1 }'
    return $?
  fi
  return 1
}

guard_full_tunnel_over_ssh() {
  local allowed_ips="$1"
  if [[ "${allowed_ips}" != *"0.0.0.0/0"* && "${allowed_ips}" != *"::/0"* ]]; then
    return
  fi
  if ! has_active_ssh_session; then
    return
  fi
  if [[ "${WG_ALLOW_FULL_TUNNEL_ON_SSH}" == "true" ]]; then
    return
  fi

  echo "Refusing full-tunnel WireGuard over an active SSH session." >&2
  echo "This can break SSH access on headless servers." >&2
  echo "The IP-to-IP VPN demo should receive a target-restricted AllowedIPs value from the API." >&2
  echo "If you really need full tunnel, run inside tmux and set WG_ALLOW_FULL_TUNNEL_ON_SSH=true." >&2
  exit 1
}

is_valid_wg_quick_config_path() {
  local config_path="$1"
  local base iface
  base="$(basename "${config_path}")"
  [[ "${base}" == *.conf ]] || return 1
  iface="${base%.conf}"
  [[ "${iface}" =~ ^[A-Za-z0-9_=+.-]{1,15}$ ]]
}

echo "== Connecting WireGuard =="
echo "config: ${WG_CONFIG_PATH}"

if ! is_valid_wg_quick_config_path "${WG_CONFIG_PATH}"; then
  echo "WG_CONFIG_PATH must end with .conf and the basename before .conf must be a valid WireGuard interface name: max 15 chars." >&2
  echo "Current path: ${WG_CONFIG_PATH}" >&2
  exit 1
fi

allowed_ips="$(extract_allowed_ips "${WG_CONFIG_PATH}")"
if [[ -z "${allowed_ips}" ]]; then
  echo "AllowedIPs not found in ${WG_CONFIG_PATH}" >&2
  exit 1
fi
guard_full_tunnel_over_ssh "${allowed_ips}"

echo "route scope: as issued by server (${allowed_ips})"

wg-quick up "${WG_CONFIG_PATH}"

echo
echo "== Active WireGuard interfaces =="
wg show || true
