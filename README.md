# Hyperspace Agent VPN Demo

This repository is a live-product demo for an autonomous agent that requests a
prepaid Hyperspace WireGuard route, connects through a Stavanger ingress and
London egress, and compares network latency and jitter before and after the VPN
session.

The demo is intentionally agent-facing: give an agent this repository, a Solana
wallet path outside the repo, and the task in `AGENTS.md`. The agent can then
inspect available gates, observe the live HTTP 402 / MPP payment challenge, pay
from the wallet, receive a WireGuard config, connect, measure, report,
disconnect, and revoke the session.

## What This Shows

- A machine can buy network access without human signup or subscriptions.
- The public endpoint exposes a real MPP / HTTP 402 payment challenge.
- Hyperspace is not yet listed in the public pay.sh catalog, so the demo calls
  the live MPP / HTTP 402 gateway URL directly.
- Hyperspace returns a standard WireGuard config after authorization.
- The session is prepaid and can be revoked when the task is complete.
- Latency and jitter can be compared before and after the tunnel.

## Public Staging Target

The current public staging base is:

```bash
https://80.69.175.159/pay
```

The default route is:

```text
Stavanger ingress: gate-eu-svg-01 / 212.147.234.64
London egress:     gate-eu-lon-01 / 94.237.56.185
```

The default public financial-infrastructure target is `data.mft.lseg.com:443`.
This is an official LSEG managed-file-transfer infrastructure endpoint, not a
trading/order-entry API. It is useful for safe TCP timing in a public demo
because public exchange endpoints often block ICMP.

For clean network jitter measurement, set `JITTER_TARGET_HOST` to a controlled
London probe if you have one. For public demo recordings, use TCP connect jitter
instead of ICMP ping.

## Quick Start

```bash
git clone https://github.com/hyperspace-zone/hyperspace-agent-vpn-demo.git
cd hyperspace-agent-vpn-demo
cp .env.example .env
```

Edit `.env` and set the wallet path. The wallet must be outside this repository
and must hold enough USDC for the config plus a little SOL for fees:

```bash
SOLANA_KEYPAIR_PATH=/root/hyperspace/id.json
PAY_ACCOUNT=hyperspace-agent-demo
PAY_YOLO_UPTO=0.10 USDC
```

Then run the demo step by step:

```bash
npm run setup-pay-account
npm run check-env
npm run challenge
npm run baseline
npm run buy-vpn
sudo npm run connect
npm run vpn-measure
npm run compare
sudo npm run disconnect
npm run revoke
```

For an OBS recording, run the commands one by one instead of `npm run demo` so
the screen stays readable.

## Requirements

- Linux host close to the Stavanger (SVG) ingress gate
- Node.js 20+
- `curl`
- WireGuard tools: `wg`, `wg-quick`
- `sudo` rights for `wg-quick up/down`
- pay.sh compatible CLI available as `pay`
- a funded Solana mainnet-beta wallet with USDC and SOL

The wallet must live outside this repository. Never commit wallet files,
recovery phrases, WireGuard configs, or raw payment credentials.

## Useful Commands

Check staging health:

```bash
curl -k https://80.69.175.159/pay/v1/agent/health
curl -k https://80.69.175.159/pay/v1/agent/gates
```

Show the live MPP / HTTP 402 challenge without using the pay CLI:

```bash
npm run challenge
```

For the paid demo, the decoded challenge summary must say `network: mainnet`.
If it says `localnet`, the public staging URL is still pointing at the sandbox
gateway and a mainnet `id.json` wallet will not be charged.

Configure `pay` for a headless server from the Solana CLI keypair:

```bash
npm run setup-pay-account
pay --mainnet whoami --account hyperspace-agent-demo
```

Run only TCP jitter measurement:

```bash
node scripts/measure-tcp-jitter.mjs \
  --label baseline \
  --host data.mft.lseg.com \
  --port 443 \
  --samples 30 \
  --out runtime/baseline.json
```

Show a report after both measurements:

```bash
npm run compare
```

## Repository Layout

```text
AGENTS.md                     Agent instructions
.env.example                  Safe environment template
scripts/                      Demo automation scripts
docs/demo-video-runbook.md    Screen recording plan
docs/security.md              Secret-handling rules
runtime/                      Local generated files, ignored by git
```

## License

Apache License 2.0.
