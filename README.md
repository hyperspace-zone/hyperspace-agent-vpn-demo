# Hyperspace Agent VPN Demo

This repository is a live-product demo for an autonomous agent that requests a
prepaid Hyperspace WireGuard route, connects through a Stavanger ingress and
London egress, and compares network latency and jitter before and after the VPN
session.

The demo is intentionally agent-facing: give an agent this repository, a
temporary Hyperspace agent token, optionally a Solana wallet path outside the
repo for payment experiments, and the task in `AGENTS.md`. The agent can then
inspect available gates, observe the live HTTP 402 / MPP payment challenge,
receive a WireGuard config through the direct demo API path, connect, measure,
report, disconnect, and revoke the session.

## What This Shows

- A machine can buy network access without human signup or subscriptions.
- The public endpoint exposes a real MPP / HTTP 402 payment challenge.
- For this demo, config issuance uses a temporary direct agent token because
  Hyperspace is not yet listed in the pay.sh catalog and production billing is
  still being finalized.
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

For a direct demo issuance flow, edit `.env` and set:

```bash
HYPERSPACE_AGENT_API_TOKEN=...
HYPERSPACE_DIRECT_API_BASE=https://80.69.175.159/api
```

If you also want to experiment with Solana/pay.sh locally, set:

```bash
SOLANA_KEYPAIR_PATH=/secure/path/outside/this/repo/id.json
PAY_ACCOUNT=hyperspace-agent-demo
```

Then run the demo step by step:

```bash
npm run check-env
npm run challenge
npm run baseline
npm run issue-vpn
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
- pay.sh compatible CLI available as `pay`, or a temporary
  `HYPERSPACE_AGENT_API_TOKEN` for direct demo issuance
- Optional: a funded Solana mainnet-beta wallet with USDC and SOL for payment
  experiments

The wallet must live outside this repository. Never commit wallet files,
recovery phrases, WireGuard configs, API tokens, or raw payment credentials.

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
