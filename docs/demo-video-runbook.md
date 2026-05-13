# Demo Video Runbook

This is the suggested OBS flow for a live demo video under three minutes.

## Screen Setup

Use one terminal window with large font. Keep `.env`, wallet files, and
WireGuard configs closed. Do not show private keys or seed phrases.

Suggested panes:

- Left: terminal running commands
- Right: browser open to `https://app.dev.hyperspace.zone/` or the GitHub repo README

## Recording Flow

### 0:00 to 0:20

Show the README and explain:

> This is an agent-facing demo. The agent receives a repository and a Solana
> wallet file, requests a prepaid Hyperspace IP-to-IP VPN route to the configured
> target IP, receives a destination-restricted WireGuard config, connects
> through Stavanger to London, measures jitter, then revokes the session.
> Hyperspace will become discoverable through pay.sh; today we use the
> underlying MPP / HTTP 402 payment primitive directly.

Run:

```bash
npm run setup-pay-account
```

Explain:

> On a headless server the agent imports the existing Solana CLI keypair into
> the local pay account file. It prints the public key, never the private key.

### 0:20 to 0:45

Run:

```bash
npm run check-env
```

Explain:

> The public staging endpoint is live. The agent can list available gates and
> sees Stavanger and London as active route choices. The environment also shows
> the stable source egress IP and the configured target IP for the IP-to-IP VPN
> config.

### 0:45 to 1:05

Run:

```bash
npm run challenge
```

Explain:

> This is the live paid endpoint. Without credentials it returns HTTP 402 with
> MPP payment challenges. The agent will satisfy that challenge with USDC from
> the configured wallet. Hyperspace is not in the public pay.sh catalog yet, so
> the demo calls the gateway URL directly. For the paid recording this summary
> must say mainnet; localnet means the public proxy is still on sandbox.

### 1:05 to 1:25

Run:

```bash
npm run baseline
```

Explain:

> Before buying connectivity, the agent measures direct TCP connect latency and
> jitter to the same target IP that will be placed in the paid WireGuard config.
> This keeps the demo focused on network behavior without probing sensitive
> production endpoints.

### 1:25 to 1:50

Run:

```bash
npm run buy-vpn
```

Explain:

> The agent now requests a prepaid IP-to-IP VPN route from the stable source egress
> IP to the configured target IP, through Stavanger ingress and London egress.
> The pay CLI handles the MPP / HTTP 402 challenge, pays from the demo wallet,
> and the live Hyperspace API returns a WireGuard config whose AllowedIPs is the
> target /32. The private key is saved locally and never printed.

### 1:50 to 2:20

Run:

```bash
sudo npm run connect
npm run vpn-measure
```

Explain:

> The agent connects the tunnel and repeats the same jitter measurement over the
> Hyperspace route. Because the config is IP-to-IP VPN, only the configured target
> IP is sent through WireGuard, while SSH stays on the original route.

### 2:20 to 2:45

Run:

```bash
npm run compare
```

Explain:

> The report compares median latency, p95 latency, and jitter. The important
> DoubleZero-style metric is path predictability, especially p95 and jitter.

### 2:45 to 3:00

Run:

```bash
sudo npm run disconnect
npm run revoke
```

Explain:

> The agent cleans up after itself by disconnecting and revoking the prepaid
> session.
