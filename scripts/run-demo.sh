#!/usr/bin/env bash
set -euo pipefail

echo "This runs the full demo. For video recording, run each npm command manually."
echo

npm run setup-pay-account
npm run check-env
npm run challenge
npm run baseline
npm run buy-vpn
sudo bash scripts/04-connect-wireguard.sh
npm run vpn-measure
npm run compare
sudo bash scripts/07-disconnect-wireguard.sh
npm run revoke
