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

This README uses the Solana CLI tool suite for explicit wallet checks. If you
want the same demo without installing those tools, use
[README.no-solana-cli.md](README.no-solana-cli.md).

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

### 1. Install Base Packages

On a fresh Ubuntu 24.04 server:

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates wireguard-tools
```

### 2. Install Node.js And npm

Ubuntu 24.04 apt currently ships Node.js 18, while the current `@solana/pay`
package expects Node.js 20+. Install Node.js 22 from NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

If npm prints a notice about a newer major version, ignore it for this demo.
NodeSource's bundled npm is sufficient. Do not run `npm install -g npm@...`
as part of the quick start; if a failed npm self-update breaks the global npm
install, restore it with:

```bash
sudo apt-get install --reinstall -y nodejs
```

### 3. Install Solana CLI Tool Suite

Install the Solana CLI tool suite with the
[official Anza installer](https://solana.com/docs/intro/installation/dependencies):

```bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
solana --version
solana-keygen --version
spl-token --version
```

The quick start requires `solana-keygen` to print the wallet address, `solana`
to check SOL for fees, and `spl-token` to check the USDC balance. The Anza
installer used above includes `spl-token`; no separate SPL Token CLI install
step is required.

Set the CLI to mainnet-beta for manual checks:

```bash
solana config set --url mainnet-beta
```

### 4. Clone The Demo

```bash
mkdir -p "$HOME/hyperspace"
cd "$HOME/hyperspace"
git clone https://github.com/hyperspace-zone/hyperspace-agent-vpn-demo.git
cd hyperspace-agent-vpn-demo
cp .env.example .env
```

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

### 6. Copy A Funded Wallet

Copy your already-funded Solana mainnet-beta `id.json` to the server.

On the server:

```bash
mkdir -p "$HOME/.config/hyperspace"
```

From your workstation, copy the keypair file to the server:

```bash
scp /path/to/id.json <server-user>@<server-ip>:~/.config/hyperspace/id.json
```

Back on the server:

```bash
HYPERSPACE_WALLET="$HOME/.config/hyperspace/id.json"
chmod 600 "$HYPERSPACE_WALLET"
sed -i "s|^SOLANA_KEYPAIR_PATH=.*|SOLANA_KEYPAIR_PATH=$HYPERSPACE_WALLET|" .env
```

### 7. Verify Wallet Address And Balances

Print the wallet address, a Solscan link, SOL for fees, and USDC for the paid
request:

```bash
OWNER="$(solana-keygen pubkey "$HYPERSPACE_WALLET")"
echo "wallet:  $OWNER"
echo "solscan: https://solscan.io/account/$OWNER"

solana balance "$OWNER" --url https://api.mainnet-beta.solana.com

USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
spl-token balance "$USDC_MINT" \
  --owner "$OWNER" \
  --url https://api.mainnet-beta.solana.com
```

Continue only if the wallet has at least `0.00001 SOL` and more than
`0.000001 USDC`. If the USDC command prints `0` or fails because the associated
token account does not exist, fund the wallet with mainnet USDC before running
the paid step. `npm run check-env` repeats these checks before the paid command
sequence continues.

### 8. Configure `.env`

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

### 9. Run The Demo

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

For an OBS recording, run the commands one by one instead of `npm run demo` so
the screen stays readable.

## Requirements

- Linux host close to the Stavanger (SVG) ingress gate
- Node.js 20.18+; Node.js 22 is used in the Ubuntu 24.04 quick start
- `curl`
- WireGuard tools: `wg`, `wg-quick`
- `sudo` rights for `wg-quick up/down`
- Solana CLI tool suite: `solana`, `solana-keygen`, `spl-token`
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

`pay whoami` may round token display for readability. Use `spl-token balance`
from the wallet verification step when you need the exact token amount.
You can also print the same wallet address, Solscan link, SOL balance, and USDC
balance without Solana CLI tools:

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

## Create A New Test Wallet

If you do not already have a dedicated funded `id.json`, create one outside the
repository and fund the printed address before continuing. Creating the keypair
only creates an address; it does not add SOL or USDC.

```bash
mkdir -p "$HOME/.config/hyperspace"
HYPERSPACE_WALLET="$HOME/.config/hyperspace/id.json"
solana-keygen new --outfile "$HYPERSPACE_WALLET" --no-bip39-passphrase
solana-keygen pubkey "$HYPERSPACE_WALLET"
chmod 600 "$HYPERSPACE_WALLET"
sed -i "s|^SOLANA_KEYPAIR_PATH=.*|SOLANA_KEYPAIR_PATH=$HYPERSPACE_WALLET|" .env
```

Check SOL:

```bash
OWNER="$(solana-keygen pubkey "$HYPERSPACE_WALLET")"
solana balance "$OWNER" --url https://api.mainnet-beta.solana.com
```

Check mainnet USDC:

```bash
USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
spl-token balance "$USDC_MINT" \
  --owner "$OWNER" \
  --url https://api.mainnet-beta.solana.com
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
