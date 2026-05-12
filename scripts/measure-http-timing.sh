#!/usr/bin/env bash
set -euo pipefail

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${FINANCIAL_INFRA_URL:=https://data.mft.lseg.com/}"
: "${JITTER_SAMPLES:=10}"

echo "== HTTP/TLS timing =="
echo "url: ${FINANCIAL_INFRA_URL}"

for i in $(seq 1 "${JITTER_SAMPLES}"); do
  curl -o /dev/null -sS \
    -w "${i} remote_ip=%{remote_ip} connect=%{time_connect}s tls=%{time_appconnect}s total=%{time_total}s\n" \
    "${FINANCIAL_INFRA_URL}" || true
  sleep 0.2
done
