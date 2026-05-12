#!/usr/bin/env bash
set -euo pipefail

echo "This runs the full demo. For video recording, run each npm command manually."
echo

npm run check-env
npm run baseline
npm run buy-vpn
sudo npm run connect
npm run vpn-measure
npm run compare
sudo npm run disconnect
npm run revoke
