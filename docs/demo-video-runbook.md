# Demo Video Runbook

This is the suggested OBS flow for a live demo video under three minutes.

## Screen Setup

Use one terminal window with large font. Keep `.env`, wallet files, and
WireGuard configs closed. Do not show private keys or seed phrases.

Suggested panes:

- Left: terminal running commands
- Right: browser open to `https://80.69.175.159/` or the GitHub repo README

## Recording Flow

### 0:00 to 0:20

Show the README and explain:

> This is an agent-facing demo. The agent has a funded Solana wallet, buys a
> prepaid Hyperspace VPN route, receives a WireGuard config, connects through
> Stavanger to London, measures jitter, then revokes the session.

### 0:20 to 0:45

Run:

```bash
npm run check-env
```

Explain:

> The public staging endpoint is live. The agent can list available gates and
> sees Stavanger and London as active route choices.

### 0:45 to 1:10

Run:

```bash
npm run baseline
```

Explain:

> Before buying connectivity, the agent measures direct TCP connect latency and
> jitter to an LSEG infrastructure endpoint. We use TCP connect timing because
> financial infrastructure often blocks ICMP ping.

### 1:10 to 1:45

Run:

```bash
npm run buy-vpn
```

Explain:

> The agent now requests a prepaid route from Stavanger ingress to London egress.
> The pay flow charges a tiny USDC amount, and after payment Hyperspace returns
> a standard WireGuard config. The private key is saved locally and never
> printed.

### 1:45 to 2:15

Run:

```bash
sudo npm run connect
npm run vpn-measure
```

Explain:

> The agent connects the tunnel and repeats the same jitter measurement over the
> Hyperspace route.

### 2:15 to 2:40

Run:

```bash
npm run compare
```

Explain:

> The report compares median latency, p95 latency, and jitter. The important
> DoubleZero-style metric is path predictability, especially p95 and jitter.

### 2:40 to 3:00

Run:

```bash
sudo npm run disconnect
npm run revoke
```

Explain:

> The agent cleans up after itself by disconnecting and revoking the prepaid
> session.
