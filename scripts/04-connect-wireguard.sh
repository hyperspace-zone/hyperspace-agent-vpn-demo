#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/env.sh
source "${SCRIPT_DIR}/lib/env.sh"
load_env_file ".env"

: "${WG_CONFIG_PATH:=runtime/hyperspace-demo.conf}"
: "${WG_CONNECT_CONFIG_PATH:=runtime/hsvgdemo.conf}"
: "${WG_STRIP_DNS:=true}"
: "${WG_ALLOWED_IPS_MODE:=diagnostic-target}"
: "${WG_ALLOWED_IPS:=}"
: "${WG_ALLOW_FULL_TUNNEL_ON_SSH:=false}"
: "${JITTER_TARGET_HOST:=lg01-ld4.primexm.com}"

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

replace_allowed_ips() {
  local config_path="$1"
  local allowed_ips="$2"
  local tmp_config="${config_path}.tmp"
  awk -v allowed_ips="${allowed_ips}" '
    BEGIN { replaced = 0 }
    /^[[:space:]]*AllowedIPs[[:space:]]*=/ {
      print "AllowedIPs = " allowed_ips
      replaced = 1
      next
    }
    { print }
    END {
      if (!replaced) {
        print "AllowedIPs = " allowed_ips
      }
    }
  ' "${config_path}" > "${tmp_config}"
  mv "${tmp_config}" "${config_path}"
  chmod 600 "${config_path}"
}

resolve_ipv4() {
  local host="$1"
  if [[ "${host}" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
    printf '%s\n' "${host}"
    return
  fi
  local ip
  ip="$(getent ahostsv4 "${host}" | awk '{print $1; exit}')"
  if [[ -z "${ip}" ]]; then
    echo "Could not resolve IPv4 address for ${host}" >&2
    exit 1
  fi
  printf '%s\n' "${ip}"
}

guard_full_tunnel_over_ssh() {
  local allowed_ips="$1"
  if ! has_active_ssh_session; then
    return
  fi
  if [[ "${allowed_ips}" == *"0.0.0.0/0"* || "${allowed_ips}" == *"::/0"* ]]; then
    if [[ "${WG_ALLOW_FULL_TUNNEL_ON_SSH}" != "true" ]]; then
      echo "Refusing full-tunnel WireGuard over an active SSH session." >&2
      echo "This can break SSH access on headless servers." >&2
      echo "Default safe mode is WG_ALLOWED_IPS_MODE=diagnostic-target." >&2
      echo "If you really need full tunnel, run inside tmux and set WG_ALLOW_FULL_TUNNEL_ON_SSH=true." >&2
      exit 1
    fi
  fi
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

is_valid_wg_quick_config_path() {
  local config_path="$1"
  local base iface
  base="$(basename "${config_path}")"
  [[ "${base}" == *.conf ]] || return 1
  iface="${base%.conf}"
  [[ "${iface}" =~ ^[A-Za-z0-9_=+.-]{1,15}$ ]]
}

safe_connect_config_path() {
  local requested="$1"
  if is_valid_wg_quick_config_path "${requested}"; then
    printf '%s\n' "${requested}"
    return
  fi

  local dir
  dir="$(dirname "${WG_CONFIG_PATH}")"
  if [[ "${dir}" == "." ]]; then
    printf 'hsvgdemo.conf\n'
  else
    printf '%s/hsvgdemo.conf\n' "${dir}"
  fi
}

echo "== Connecting WireGuard =="
echo "config: ${WG_CONFIG_PATH}"

connect_config="$(safe_connect_config_path "${WG_CONNECT_CONFIG_PATH}")"
if [[ "${connect_config}" != "${WG_CONNECT_CONFIG_PATH}" ]]; then
  echo "connect config path adjusted for wg-quick interface-name limit: ${connect_config}"
fi
cp "${WG_CONFIG_PATH}" "${connect_config}"
chmod 600 "${connect_config}"

if [[ "${WG_STRIP_DNS}" == "true" ]]; then
  tmp_config="${connect_config}.tmp"
  grep -viE '^[[:space:]]*DNS[[:space:]]*=' "${connect_config}" > "${tmp_config}"
  mv "${tmp_config}" "${connect_config}"
  chmod 600 "${connect_config}"
  echo "dns handling: stripped DNS lines for headless Ubuntu compatibility"
fi

case "${WG_ALLOWED_IPS_MODE}" in
  full)
    allowed_ips="${WG_ALLOWED_IPS:-}"
    if [[ -n "${allowed_ips}" ]]; then
      guard_full_tunnel_over_ssh "${allowed_ips}"
      replace_allowed_ips "${connect_config}" "${allowed_ips}"
      echo "route scope: custom AllowedIPs (${allowed_ips})"
    else
      existing_allowed_ips="$(extract_allowed_ips "${connect_config}")"
      guard_full_tunnel_over_ssh "${existing_allowed_ips}"
      echo "route scope: as issued by server (${existing_allowed_ips})"
    fi
    ;;
  custom)
    if [[ -z "${WG_ALLOWED_IPS}" ]]; then
      echo "WG_ALLOWED_IPS_MODE=custom requires WG_ALLOWED_IPS" >&2
      exit 1
    fi
    guard_full_tunnel_over_ssh "${WG_ALLOWED_IPS}"
    replace_allowed_ips "${connect_config}" "${WG_ALLOWED_IPS}"
    echo "route scope: custom AllowedIPs (${WG_ALLOWED_IPS})"
    ;;
  diagnostic-target)
    target_ip="$(resolve_ipv4 "${JITTER_TARGET_HOST}")"
    allowed_ips="${target_ip}/32"
    replace_allowed_ips "${connect_config}" "${allowed_ips}"
    echo "route scope: diagnostic target only (${JITTER_TARGET_HOST} -> ${allowed_ips})"
    ;;
  *)
    echo "Unsupported WG_ALLOWED_IPS_MODE: ${WG_ALLOWED_IPS_MODE}" >&2
    echo "Use diagnostic-target, custom, or full." >&2
    exit 1
    ;;
esac

wg-quick up "${connect_config}"

echo
echo "== Active WireGuard interfaces =="
wg show || true
