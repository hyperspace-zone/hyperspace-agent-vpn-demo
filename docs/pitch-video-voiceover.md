# Pitch Video Voiceover: Hyperspace

Target length: about 2 minutes at a calm pitch pace.

Text in gray blocks is not meant to be read aloud. It is a screen/action cue.

## Script

**0:00 - Title**

```text
Show slide 1. Hold on "Pay-as-you-go VPN paths for AI agents".
```

Hyperspace turns Solana payments into machine-native network access.

An agent can pay for a prepaid IP-to-IP VPN route, receive a WireGuard config,
use a DoubleZero-backed path, and revoke access programmatically.

**0:18 - Market And Timing**

```text
Show slides 2 and 3. Move through the market and user insights quickly.
```

Why now? pay.sh and MPP / HTTP 402 make paid resources discoverable at protocol
level. Solana gives fast USDC settlement. DoubleZero makes low-jitter routes
sellable to software.

The users are hosted agent platforms, crawlers, automation tools, RPC workloads,
and indexers. They need isolated egress, stable latency, caps, top-ups, and
revocation.

**0:42 - Problem**

```text
Show slide 4. Emphasize the contrast between agents and human VPN signup.
```

Autonomous software needs network access, but VPNs are built for humans.
Signup forms, cards, dashboards, static accounts, and best-effort internet
routes do not fit agent workflows.

Agents can pay for APIs, but still cannot reliably buy the network path needed
to use them.

**1:00 - Solution**

```text
Show slides 5 and 6. Keep the payment-to-WireGuard flow visible.
```

Hyperspace turns connectivity into a paid API call.

An agent discovers the endpoint, receives an MPP / HTTP 402 challenge, pays
USDC, and gets a prepaid WireGuard configuration. The route can be scoped to a
source and destination IP, metered, topped up, and revoked.

Under the hood, the flow connects a pay.sh-compatible gateway, Solana SPL USDC,
the Hyperspace control plane, gate agents, WireGuard, and DoubleZero-optimized
paths.

**1:25 - Differentiation And Stage**

```text
Show slides 7 and 8. Move from competitors to current stage.
```

Traditional VPNs require human signup and subscriptions. Cloud proxies are
mostly HTTP-only. Self-hosted WireGuard creates an ops burden and has no payment
API.

Hyperspace is agent-paid prepaid WireGuard with route health, caps, revocation,
and DoubleZero-backed paths.

We already have the web UI, customer API, control plane, gate agents, European
staging gates, config issue and revoke, and a mainnet payment smoke test.

**1:48 - Team And Proof**

```text
Show slides 9, 10, and 11. End on the launch ask.
```

I am Andrey Manolov, co-founder and CTO of Hyperspace. I worked on Solana
restaking devtools and partnerships at Cambrian. STAKR.space supports validator,
node, Linux networking, and gate operations.

The demo proves the core flow: a client pays `0.000001 USDC` on Solana
mainnet-beta, the server receives funds, Hyperspace issues a WireGuard config,
the route is used, and the session is revoked.

Our ask is simple: test agent-native paid connectivity with hosted agents,
crawlers, Solana RPC teams, and indexer teams.
