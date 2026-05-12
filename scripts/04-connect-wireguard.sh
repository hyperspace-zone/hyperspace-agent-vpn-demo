#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/env.sh
source "${SCRIPT_DIR}/lib/env.sh"
load_env_file ".env"

: "${WG_CONFIG_PATH:=runtime/hyperspace-demo.conf}"
: "${WG_STRIP_DNS:=true}"

if [[ ! -f "${WG_CONFIG_PATH}" ]]; then
  echo "WireGuard config not found: ${WG_CONFIG_PATH}" >&2
  echo "Run npm run buy-vpn first." >&2
  exit 1
fi

if ! command -v wg-quick >/dev/null 2>&1; then
  echo "wg-quick is required" >&2
  exit 1
fi

echo "== Connecting WireGuard =="
echo "config: ${WG_CONFIG_PATH}"

connect_config="${WG_CONFIG_PATH}"
if [[ "${WG_STRIP_DNS}" == "true" ]]; then
  connect_config="${WG_CONFIG_PATH%.conf}-nodns.conf"
  grep -viE '^[[:space:]]*DNS[[:space:]]*=' "${WG_CONFIG_PATH}" > "${connect_config}"
  chmod 600 "${connect_config}"
  echo "dns handling: stripped DNS lines for headless Ubuntu compatibility"
fi

wg-quick up "${connect_config}"

echo
echo "== Active WireGuard interfaces =="
wg show || true
