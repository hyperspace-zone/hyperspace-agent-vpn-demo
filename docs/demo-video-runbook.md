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

> This is an agent-facing demo. The agent receives a temporary authorization
> token, requests a prepaid Hyperspace VPN route, receives a WireGuard config,
> connects through Stavanger to London, measures jitter, then revokes the
> session. Hyperspace is
> designed to become discoverable through pay.sh; today we show the underlying
> MPP / HTTP 402 payment primitive and a direct demo issuance path.

### 0:20 to 0:45

Run:

```bash
npm run check-env
```

Explain:

> The public staging endpoint is live. The agent can list available gates and
> sees Stavanger and London as active route choices.

### 0:45 to 1:05

Run:

```bash
npm run challenge
```

Explain:

> This is the live paid endpoint. Without credentials it returns HTTP 402 with
> MPP payment challenges. In production this is what a pay.sh-enabled agent
> would satisfy with USDC. For the hackathon recording we use a temporary direct
> agent token to issue the config, because Hyperspace is not yet listed in the
> pay.sh catalog and production billing is still being finalized.

### 1:05 to 1:25

Run:

```bash
npm run baseline
```

Explain:

> Before buying connectivity, the agent measures direct TCP connect latency and
> jitter to an LSEG infrastructure endpoint. We use TCP connect timing because
> financial infrastructure often blocks ICMP ping.

### 1:25 to 1:50

Run:

```bash
npm run issue-vpn
```

Explain:

> The agent now requests a prepaid route from Stavanger ingress to London egress.
> In this demo mode the same live Hyperspace issuance API returns a standard
> WireGuard config after direct agent authorization. The private key is saved
> locally and never printed.

### 1:50 to 2:20

Run:

```bash
sudo npm run connect
npm run vpn-measure
```

Explain:

> The agent connects the tunnel and repeats the same jitter measurement over the
> Hyperspace route.

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
