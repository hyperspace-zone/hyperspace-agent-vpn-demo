# Voiceover Script: Hyperspace IP-to-IP VPN Demo

Target length: under 3 minutes at a calm demo pace.

## Script

**0:00 - Landing**

Show: open `https://hyperspace.zone/`. Hold on the hero text and the
"Download Client" button for a few seconds.

This is Hyperspace: a low-latency network access layer delivered through a
client VPN.

The core idea is that real-time applications, and increasingly AI agents, need
more than generic internet access. They need predictable routes, stable
latency, and a way to acquire network access programmatically.

In this demo, I will show a concrete agent workflow: buy a short-lived
IP-to-IP VPN session, connect it on a server, measure the network path, and
then revoke the session.

**0:25 - What The Agent Is Buying**

Show: switch to the GitHub repository README. Keep the "What This Shows" or
"Public Staging Target" section visible. Point out the staging URL only if it
is already on screen.

Instead of a manual VPN subscription, the agent talks to a payment-gated API.

The API returns an HTTP 402 payment challenge using the MPP flow. The agent
checks the network, checks the price, pays a tiny USDC amount on Solana
mainnet, and receives a WireGuard configuration.

That configuration is restricted to one destination IP. In this run, the target
is `185.97.160.8:443`, and the issued `AllowedIPs` value is exactly
`185.97.160.8/32`.

So this is not a broad full-tunnel VPN. It is paid network access for one
specific route.

**0:55 - Setup**

Show: terminal on a clean Ubuntu 24.04 server. Run or show the completed output
for:

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates wireguard-tools
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

Then show clone and wallet setup:

```bash
git clone https://github.com/hyperspace-zone/hyperspace-agent-vpn-demo.git
cd hyperspace-agent-vpn-demo
cp .env.example .env
```

Do not zoom into the raw contents of `id.json`.

I am running this on a clean Ubuntu 24.04 server.

The default README path does not require Solana CLI. I install Node.js,
WireGuard tools, clone the demo repository, and copy in a funded Solana
`id.json` wallet outside the repo.

The wallet check is done by a local Node.js script. It prints the wallet
address, a Solscan link, the SOL balance for transaction fees, and the USDC
balance for payment.

Show:

```bash
npm run wallet-info
```

Hold on the wallet address, Solscan link, SOL balance, and USDC balance.

Then I install the pay.sh CLI locally with `npm install @solana/pay`, configure
the server egress IP as the source, and set the target IP for the VPN session.

Show:

```bash
npm install @solana/pay
./node_modules/.bin/pay --version
SOURCE_IP="$(curl -fsS https://api.ipify.org)"
sed -i "s|^HYPERSPACE_SOURCE_IP=.*|HYPERSPACE_SOURCE_IP=$SOURCE_IP|" .env
sed -i "s|^HYPERSPACE_TARGET_IP=.*|HYPERSPACE_TARGET_IP=185.97.160.8|" .env
sed -i "s|^JITTER_TARGET_HOST=.*|JITTER_TARGET_HOST=185.97.160.8|" .env
```

**1:25 - Challenge And Baseline**

Show:

```bash
npm run setup-pay-account
npm run check-env
npm run challenge
```

Hold on `network: mainnet` and `price: 0.000001 USDC`.

Before buying anything, the agent requests the payment challenge.

The challenge says `network: mainnet` and `price: 0.000001 USDC`. The purchase
script also enforces the local spending limit before it will pay.

Now I run the baseline measurement: 30 TCP connect attempts directly to the
target, without Hyperspace.

Show:

```bash
npm run baseline
```

During the run, let several samples scroll. Then stop on the summary lines.

In this run, the direct path has a median around 29.8 milliseconds, but the
tail is unstable: p95 is about 98.9 milliseconds, and jitter is about
33 milliseconds.

The median is fine, but the route is not predictable.

**1:55 - Buy, Connect, Measure**

Show:

```bash
npm run buy-vpn
```

Hold on `mode: ip_to_ip`, `source ip`, `target ip`, `issued config id`, and the
redacted config preview. Do not reveal private key material.

Now the agent buys the VPN config.

After payment, the API returns a WireGuard config for the IP-to-IP route from
this server to the target. The connect script uses the issued config directly,
without rewriting DNS or routes.

WireGuard creates the `hyperspace-demo` interface and adds a route only for
`185.97.160.8/32`.

Show:

```bash
sudo bash scripts/04-connect-wireguard.sh
```

Hold on `route scope: as issued by server (185.97.160.8/32)` and the WireGuard
interface summary.

Now I repeat the same 30 TCP connect measurements through the Hyperspace VPN.

Show:

```bash
npm run vpn-measure
```

Let the stable samples scroll, then stop on the summary.

The VPN path has a median around 32.9 milliseconds, so the median is about
3 milliseconds higher. But the important result is the tail: p95 drops to about
33.6 milliseconds, and jitter drops to about 0.3 milliseconds.

For real-time systems, that predictability is often more important than the
lowest possible median.

**2:35 - Cleanup And Takeaway**

Show:

```bash
npm run compare
```

Hold on the comparison table, especially `p95 ms`, `stddev jitter ms`, and
`mean abs delta jitter ms`.

Finally, the agent disconnects WireGuard and revokes the session.

Show:

```bash
sudo bash scripts/07-disconnect-wireguard.sh
npm run revoke
```

End on the `revocation requested` line or the timestamped session metadata
line.

The session is prepaid, short-lived, and task-scoped. The run also keeps
timestamped reports and the issued config metadata for auditability.

This is the Hyperspace model in one flow: discover the route, receive a
payment challenge, pay, connect, measure, and revoke.

It turns network access into something an agent can request and verify as part
of its own workflow.
