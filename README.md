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

The default public diagnostic target is `lg01-ld4.primexm.com:443`, a public
looking-glass host suitable for basic network timing checks.

For clean network jitter measurement, set `JITTER_TARGET_HOST` to a controlled
probe if you have one.

`HTTP_TIMING_INSECURE_TLS=true` is enabled by default for timing-only requests
against looking-glass targets that may not provide a complete public certificate
chain. The scripts measure network timing; they do not trust or parse response
content.

## Quick Start

Run the demo from a normal SSH user with `sudo` access, not from a long-lived
root shell. On a fresh Ubuntu 24.04 server, install the base tools first:

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates wireguard-tools nodejs npm
```

Clone and configure the demo repository:

```bash
mkdir -p "$HOME/hyperspace"
cd "$HOME/hyperspace"
git clone https://github.com/hyperspace-zone/hyperspace-agent-vpn-demo.git
cd hyperspace-agent-vpn-demo
cp .env.example .env
```

Install the `pay` CLI locally inside this demo directory:

```bash
npm install --no-save --package-lock=false @solana/pay
./node_modules/.bin/pay --version
```

The default `.env.example` uses `PAY_BIN=./node_modules/.bin/pay`, so `pay`
does not need to be installed globally. If you already have a global `pay`
binary and prefer to use it, set `PAY_BIN=pay` in `.env`.

For this demo, do not run GUI/keyring account setup on a headless server; the
repository script below imports a Solana CLI keypair into the local pay account
file.

Optional: install the Solana CLI if the server does not already have it:

```bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
solana --version
```

Optional: create a dedicated test wallet outside the repository:

```bash
mkdir -p "$HOME/.config/hyperspace"
HYPERSPACE_WALLET="$HOME/.config/hyperspace/id.json"
solana-keygen new --outfile "$HYPERSPACE_WALLET" --no-bip39-passphrase
solana-keygen pubkey "$HYPERSPACE_WALLET"
```

Fund the printed address with a small amount of SOL for network fees and enough
USDC for the test calls. The demo currently spends the smallest nonzero USDC
amount, `0.000001 USDC`, per issued config.

To check SOL:

```bash
OWNER="$(solana-keygen pubkey "$HYPERSPACE_WALLET")"
solana balance "$OWNER" --url https://api.mainnet-beta.solana.com
```

Optional: install SPL Token CLI if you want an exact USDC balance from the
server:

```bash
sudo apt-get install -y build-essential pkg-config libssl-dev libudev-dev
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
. "$HOME/.cargo/env"
cargo install spl-token-cli --locked
```

Then check mainnet USDC:

```bash
USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
spl-token balance "$USDC_MINT" \
  --owner "$OWNER" \
  --url https://api.mainnet-beta.solana.com
```

Edit `.env` and set `SOLANA_KEYPAIR_PATH` to an absolute wallet path outside
this repository. Keep:

```bash
PAY_ACCOUNT=hyperspace-agent-demo
PAY_YOLO_UPTO="0.000001 USDC"
```

If you created the wallet with the `HYPERSPACE_WALLET` command above:

```bash
sed -i "s|^SOLANA_KEYPAIR_PATH=.*|SOLANA_KEYPAIR_PATH=$HYPERSPACE_WALLET|" .env
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
- Node.js 18+
- `curl`
- WireGuard tools: `wg`, `wg-quick`
- `sudo` rights for `wg-quick up/down`
- pay.sh compatible CLI available as `pay`
- a funded Solana mainnet-beta wallet with USDC and SOL
- optional Solana CLI for generating and checking the wallet
- optional SPL Token CLI for exact USDC balance checks

The hackathon demo uses the smallest nonzero USDC amount, `0.000001 USDC`, to
prove paid access without making every proof-of-concept run expensive. This is
not production pricing.

Before spending, `npm run buy-vpn` preflights the HTTP 402 challenge and refuses
to continue if the gateway asks for a different network or any `price_usd` above
`PAY_YOLO_UPTO`.

The default `WG_STRIP_DNS=true` avoids `wg-quick` failures on minimal Ubuntu
hosts where `openresolv` is unavailable.

For remote SSH safety, the demo does not install the issued full-tunnel route by
default. `WG_ALLOWED_IPS_MODE=diagnostic-target` rewrites `AllowedIPs` to the
resolved `JITTER_TARGET_HOST` IPv4 `/32`, so SSH stays on the original server
route while the diagnostic target is measured through Hyperspace. Full-tunnel
mode over an active SSH session is refused unless
`WG_ALLOW_FULL_TUNNEL_ON_SSH=true` is set explicitly.

`WG_CONNECT_CONFIG_PATH` defaults to `runtime/hsvgdemo.conf` because `wg-quick`
derives the interface name from the config basename, and Linux interface names
must fit within 15 characters.

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

The raw challenge body is omitted by default so an old or misconfigured gateway
does not print an unexpectedly high `price_usd` into demo output. Set
`SHOW_RAW_CHALLENGE_BODY=true` only when debugging gateway configuration.

For the paid demo, the decoded challenge summary must say `network: mainnet`.
If it says `localnet`, the public staging URL is still pointing at the sandbox
gateway and a mainnet `id.json` wallet will not be charged.

Configure `pay` for a headless server from the Solana CLI keypair:

```bash
npm run setup-pay-account
pay --mainnet whoami --account hyperspace-agent-demo
```

`pay whoami` may round token display for readability. Use `spl-token balance`
with the USDC mint shown above when you need the exact token amount.

Run only TCP jitter measurement:

```bash
node scripts/measure-tcp-jitter.mjs \
  --label baseline \
  --host lg01-ld4.primexm.com \
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
