# Voiceover Script: Hyperspace IP-to-IP VPN Demo

Target length: under 3 minutes at a calm demo pace.

## Script

**0:00 - Landing**

This is Hyperspace: a low-latency network access layer delivered through a
client VPN.

The core idea is that real-time applications, and increasingly AI agents, need
more than generic internet access. They need predictable routes, stable
latency, and a way to acquire network access programmatically.

In this demo, I will show a concrete agent workflow: buy a short-lived
IP-to-IP VPN session, connect it on a server, measure the network path, and
then revoke the session.

**0:25 - What The Agent Is Buying**

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

I am running this on a clean Ubuntu 24.04 server.

The default README path does not require Solana CLI. I install Node.js,
WireGuard tools, clone the demo repository, and copy in a funded Solana
`id.json` wallet outside the repo.

The wallet check is done by a local Node.js script. It prints the wallet
address, a Solscan link, the SOL balance for transaction fees, and the USDC
balance for payment.

Then I install the pay.sh CLI locally with `npm install @solana/pay`, configure
the server egress IP as the source, and set the target IP for the VPN session.

**1:25 - Challenge And Baseline**

Before buying anything, the agent requests the payment challenge.

The challenge says `network: mainnet` and `price: 0.000001 USDC`. The purchase
script also enforces the local spending limit before it will pay.

Now I run the baseline measurement: 30 TCP connect attempts directly to the
target, without Hyperspace.

In this run, the direct path has a median around 29.8 milliseconds, but the
tail is unstable: p95 is about 98.9 milliseconds, and jitter is about
33 milliseconds.

The median is fine, but the route is not predictable.

**1:55 - Buy, Connect, Measure**

Now the agent buys the VPN config.

After payment, the API returns a WireGuard config for the IP-to-IP route from
this server to the target. The connect script uses the issued config directly,
without rewriting DNS or routes.

WireGuard creates the `hyperspace-demo` interface and adds a route only for
`185.97.160.8/32`.

Now I repeat the same 30 TCP connect measurements through the Hyperspace VPN.

The VPN path has a median around 32.9 milliseconds, so the median is about
3 milliseconds higher. But the important result is the tail: p95 drops to about
33.6 milliseconds, and jitter drops to about 0.3 milliseconds.

For real-time systems, that predictability is often more important than the
lowest possible median.

**2:35 - Cleanup And Takeaway**

Finally, the agent disconnects WireGuard and revokes the session.

The session is prepaid, short-lived, and task-scoped. The run also keeps
timestamped reports and the issued config metadata for auditability.

This is the Hyperspace model in one flow: discover the route, receive a
payment challenge, pay, connect, measure, and revoke.

It turns network access into something an agent can request and verify as part
of its own workflow.
