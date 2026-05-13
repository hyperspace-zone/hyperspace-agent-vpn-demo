# Hyperspace IP-to-IP VPN for Agents Demo Without Solana CLI

This is an alternative Ubuntu 24.04 quick start for running the same paid
Hyperspace IP-to-IP VPN demo without installing `solana`, `solana-keygen`, or
`spl-token`.

The tradeoff is simple: wallet address and balances are checked by a local
Node.js script that reads `id.json` and queries Solana mainnet-beta JSON-RPC.
The private key is not printed.

## What You Need

Before starting, prepare a Solana mainnet-beta keypair JSON file (`id.json`).
The wallet must already contain:

- more than `0.000001 USDC` for the paid test request
- SOL for Solana transaction fees; recent demo payment signatures are around
  `0.000005001 SOL`, so keep at least `0.00001 SOL` for a single run

The server running the demo also needs a stable internet egress IPv4 address.
It can be a stable NAT gateway egress address; it does not have to be assigned
directly to the server as a public interface address.

## Quick Start

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
`0.000001 USDC`.

### 5. Install pay CLI

Hyperspace uses the [pay.sh](https://pay.sh/) CLI for MPP / HTTP 402 payment
authorization. Install it locally inside this demo directory:

```bash
npm install @solana/pay
./node_modules/.bin/pay --version
```

The default `.env.example` uses `PAY_BIN=./node_modules/.bin/pay`, so `pay`
does not need to be installed globally.

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

Verify the important values:

```bash
grep -E '^(SOLANA_KEYPAIR_PATH|PAY_ACCOUNT|PAY_YOLO_UPTO|SOLANA_RPC_URL|USDC_MINT|MIN_SOL_FEE_BALANCE|MIN_USDC_BALANCE|HYPERSPACE_SOURCE_IP|HYPERSPACE_TARGET_IP|JITTER_TARGET_HOST)=' .env
```

At `npm run buy-vpn`, the paid WireGuard config will be issued for
`HYPERSPACE_SOURCE_IP -> HYPERSPACE_TARGET_IP` only.

### 7. Run The Demo

Run the demo step by step. Stop on the first error.

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

`npm run check-env` also uses the Node-only balance checker, so this README does
not require `solana` or `spl-token` at any point.

## Notes

- `npm run wallet-info` and `npm run check-env` never print the private key.
- The wallet file must stay outside this repository.
- `SOLANA_RPC_URL` defaults to `https://api.mainnet-beta.solana.com`.
- Mainnet USDC mint defaults to
  `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`.
