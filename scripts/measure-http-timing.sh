#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/env.sh
source "${SCRIPT_DIR}/lib/env.sh"
load_env_file ".env"

: "${HTTP_TIMING_URL:=https://185.97.160.8/}"
: "${HTTP_TIMING_INSECURE_TLS:=true}"
: "${JITTER_SAMPLES:=10}"

echo "== HTTP/TLS timing =="
echo "url: ${HTTP_TIMING_URL}"

curl_args=(-o /dev/null -sS)
if [[ "${HTTP_TIMING_INSECURE_TLS}" == "true" ]]; then
  curl_args+=(-k)
fi

for i in $(seq 1 "${JITTER_SAMPLES}"); do
  curl "${curl_args[@]}" \
    -w "${i} remote_ip=%{remote_ip} connect=%{time_connect}s tls=%{time_appconnect}s total=%{time_total}s\n" \
    "${HTTP_TIMING_URL}" || true
  sleep 0.2
done
