# Hyperspace IP-to-IP VPN for Agents Demo

This repository is a live-product demo for an autonomous agent that requests a
prepaid Hyperspace IP-to-IP VPN route, connects through a Stavanger ingress
and London egress, and compares network latency and jitter before and
after the paid session.

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
- Hyperspace returns a destination-restricted WireGuard config after
  authorization.
- The session is prepaid and can be revoked when the task is complete.
- Latency and jitter can be compared before and after the tunnel.

## Public Staging Target

The current public staging base is:

```bash
https://app.dev.hyperspace.zone/pay
```

The default route is:

```text
Stavanger ingress: gate-eu-svg-01 / 212.147.234.64
London egress:     gate-eu-lon-01 / 94.237.56.185
```

The default test scenario is a TCP timing check from the demo server to
`185.97.160.8:443`, the current IPv4 address used for
`lg01-ld4.primexm.com`. The paid WireGuard config is issued specifically for
that target IP (`AllowedIPs = 185.97.160.8/32`) through the Stavanger to London
route.

For clean network jitter measurement, set `HYPERSPACE_TARGET_IP` and
`JITTER_TARGET_HOST` to a controlled probe IP if you have one.

`HTTP_TIMING_INSECURE_TLS=true` is enabled by default for timing-only requests
against looking-glass targets that may not provide a complete public certificate
chain. The scripts measure network timing; they do not trust or parse response
content.

## Quick Start

These steps were tested on Ubuntu 24.04 LTS.

This default README does not require Solana CLI, `solana-keygen`, or
`spl-token`. Wallet address and balances are checked by a local Node.js script
that reads `id.json` and queries Solana mainnet-beta JSON-RPC. If you prefer
explicit CLI checks, use [README.solana-cli.md](README.solana-cli.md).

Before starting, prepare a Solana mainnet-beta keypair JSON file (`id.json`).
The wallet must already contain:

- more than `0.000001 USDC` for the paid test request
- SOL for Solana transaction fees; recent demo payment signatures are around
  `0.000005001 SOL`, so keep at least `0.00001 SOL` for a single run

USDC alone is not enough because the payment transaction still needs SOL fees.
Keep the wallet file outside this repository.

The server running the demo also needs a stable internet egress IPv4 address.
It does not have to be assigned directly to the server as a public interface
address; a stable NAT gateway egress address is fine. It must not change during
the test, because the IP-to-IP VPN config is issued for that source address.

### 1. Install Base Packages And Node.js

Ubuntu 24.04 apt currently ships Node.js 18, while the current `@solana/pay`
package expects Node.js 20+. Install Node.js 22 from NodeSource:

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates wireguard-tools

curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

If npm prints a notice about a newer major version, ignore it for this demo.
NodeSource's bundled npm is sufficient. Do not run `npm install -g npm@...`
as part of the quick start.

### 2. Clone The Demo

```bash
mkdir -p "$HOME/hyperspace"
cd "$HOME/hyperspace"
git clone https://github.com/hyperspace-zone/hyperspace-agent-vpn-demo.git
cd hyperspace-agent-vpn-demo
cp .env.example .env
```

### 3. Copy A Funded Wallet

Copy your already-funded Solana mainnet-beta `id.json` to the server.

On the server:

```bash
mkdir -p "$HOME/.config/hyperspace"
```

From your workstation:

```bash
scp /path/to/id.json <server-user>@<server-ip>:~/.config/hyperspace/id.json
```

Back on the server:

```bash
HYPERSPACE_WALLET="$HOME/.config/hyperspace/id.json"
chmod 600 "$HYPERSPACE_WALLET"
sed -i "s|^SOLANA_KEYPAIR_PATH=.*|SOLANA_KEYPAIR_PATH=$HYPERSPACE_WALLET|" .env
```

### 4. Verify Wallet Address And Balances

This step does not use Solana CLI or SPL Token CLI. It derives the public key
from `id.json`, prints a Solscan link, then checks SOL and USDC through Solana
JSON-RPC.

```bash
npm run wallet-info
```

Expected output shape:

```text
== Wallet balances ==
wallet: <wallet-address>
solscan: https://solscan.io/account/<wallet-address>
SOL: <amount> SOL (<lamports> lamports)
USDC: <amount> USDC
```

Continue only if the wallet has at least `0.00001 SOL` and more than
`0.000001 USDC`. `npm run check-env` repeats these checks before the paid
command sequence continues.

### 5. Install pay CLI

Hyperspace uses the [pay.sh](https://pay.sh/) CLI for MPP / HTTP 402 payment
authorization. Install it locally inside this demo directory:

```bash
npm install @solana/pay
./node_modules/.bin/pay --version
```

The default `.env.example` uses `PAY_BIN=./node_modules/.bin/pay`, so `pay`
does not need to be installed globally. If you already have a global `pay`
binary and prefer to use it, set `PAY_BIN=pay` in `.env`.

For this demo, do not run GUI/keyring account setup on a headless server; the
repository script below imports a Solana keypair JSON into the local pay account
file.

### 6. Configure `.env`

Set the source and target IPs. The source IP must be this server's stable
internet egress address; the target IP is the destination allowed by the paid
WireGuard config.

```bash
SOURCE_IP="$(curl -fsS https://api.ipify.org)"
sed -i "s|^HYPERSPACE_SOURCE_IP=.*|HYPERSPACE_SOURCE_IP=$SOURCE_IP|" .env
sed -i "s|^HYPERSPACE_TARGET_IP=.*|HYPERSPACE_TARGET_IP=185.97.160.8|" .env
sed -i "s|^JITTER_TARGET_HOST=.*|JITTER_TARGET_HOST=185.97.160.8|" .env
```

Verify that `.env` points to the wallet and the intended IP-to-IP VPN test:

```bash
grep -E '^(SOLANA_KEYPAIR_PATH|PAY_ACCOUNT|PAY_YOLO_UPTO|SOLANA_RPC_URL|USDC_MINT|MIN_SOL_FEE_BALANCE|MIN_USDC_BALANCE|HYPERSPACE_SOURCE_IP|HYPERSPACE_TARGET_IP|JITTER_TARGET_HOST)=' .env
```

Expected values:

```text
SOLANA_KEYPAIR_PATH=/home/<user>/.config/hyperspace/id.json
PAY_ACCOUNT=hyperspace-agent-demo
PAY_YOLO_UPTO="0.000001 USDC"
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
MIN_SOL_FEE_BALANCE=0.00001
MIN_USDC_BALANCE=0.000001
HYPERSPACE_SOURCE_IP=<stable server egress IPv4>
HYPERSPACE_TARGET_IP=185.97.160.8
JITTER_TARGET_HOST=185.97.160.8
```

At `npm run buy-vpn`, the paid WireGuard config will be issued for
`HYPERSPACE_SOURCE_IP -> HYPERSPACE_TARGET_IP` only.

### 7. Run The Demo

Run the demo step by step. Stop on the first error; the comparison is valid only
after `npm run buy-vpn` and `sudo bash scripts/04-connect-wireguard.sh` both
succeed.

```bash
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
```

## Requirements

- Linux host close to the Stavanger (SVG) ingress gate
- Node.js 20.18+; Node.js 22 is used in the Ubuntu 24.04 quick start
- `curl` and `jq`
- WireGuard tools: `wg`, `wg-quick`
- `sudo` rights for `wg-quick up/down`
- pay.sh compatible CLI installed locally with `npm install @solana/pay`
- a funded Solana mainnet-beta wallet with USDC and SOL
- a server with a stable internet egress IPv4 address for `HYPERSPACE_SOURCE_IP`

The hackathon demo uses the smallest nonzero USDC amount, `0.000001 USDC`, to
prove paid access without making every proof-of-concept run expensive. This is
not production pricing.

Before spending, `npm run buy-vpn` preflights the HTTP 402 challenge and refuses
to continue if the gateway asks for a different network or any `price_usd` above
`PAY_YOLO_UPTO`.

The paid config uses the platform's IP-to-IP VPN mechanism. The issued
`AllowedIPs` is the configured `HYPERSPACE_TARGET_IP/32`, and the config does
not include DNS lines. The connect script uses this issued config unchanged.

The demo overwrites the canonical runtime files on each run, but also writes
timestamped sibling copies such as `runtime/baseline-20260513T120000Z.json`,
`runtime/vpn-20260513T120000Z.json`,
`runtime/session-20260513T120000Z.json`, and
`runtime/hyperspace-demo-20260513T120000Z.conf`.

`WG_CONFIG_PATH` defaults to `runtime/hyperspace-demo.conf`. `wg-quick` derives
the Linux interface name from the filename, so keep the basename before `.conf`
at 15 characters or fewer if you change this path.

The wallet must live outside this repository. Never commit wallet files,
recovery phrases, WireGuard configs, or raw payment credentials.

## Useful Commands

Check staging health:

```bash
curl -k https://app.dev.hyperspace.zone/pay/v1/agent/health
curl -k https://app.dev.hyperspace.zone/pay/v1/agent/gates
```

Show the live MPP / HTTP 402 challenge without using the pay CLI:

```bash
npm run challenge
```

The raw challenge body is omitted by default so an old or misconfigured gateway
does not print an unexpectedly high `price_usd` into demo output. Set
`SHOW_RAW_CHALLENGE_BODY=true` only when debugging gateway configuration.

For the paid demo, the decoded challenge summary must say `network: mainnet`.
If it says `localnet`, the public staging URL is still pointing at the sandbox
gateway and a mainnet `id.json` wallet will not be charged.

Configure `pay` for a headless server from the Solana keypair JSON:

```bash
npm run setup-pay-account
./node_modules/.bin/pay --mainnet whoami --account hyperspace-agent-demo
```

`pay whoami` may round token display for readability. Use `npm run wallet-info`
when you need the exact token amount from Solana JSON-RPC:

```bash
npm run wallet-info
```

Run only TCP jitter measurement:

```bash
node scripts/measure-tcp-jitter.mjs \
  --label baseline \
  --host 185.97.160.8 \
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
README.solana-cli.md          Alternative quick start with Solana CLI checks
scripts/                      Demo automation scripts
docs/security.md              Secret-handling rules
docs/voiceover.md             English voiceover script for the demo flow
runtime/                      Local generated files, ignored by git
```

## License

Apache License 2.0.
