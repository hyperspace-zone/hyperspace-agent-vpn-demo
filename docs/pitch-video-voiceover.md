# Pitch Video Voiceover: Hyperspace

Target length: about 2 minutes at a calm pitch pace.

Text in gray blocks is not meant to be read aloud. It is a screen/action cue.

## Script

**0:00 - Title**

```text
0:00 Start on slide 1.
Hold on "Pay-as-you-go VPN paths for AI agents".
```

Hyperspace turns Solana payments into machine-native network access.

An agent can pay for a prepaid IP-to-IP VPN route, receive a WireGuard config,
use a DoubleZero-backed path, and revoke access programmatically.

**0:18 - Market And Timing**

```text
0:18 Switch from slide 1 to slide 2.
Keep slide 2 on screen for the "Why now?" lines.
```

Why now? pay.sh and MPP / HTTP 402 make paid resources discoverable at protocol
level. Solana gives fast USDC settlement. DoubleZero makes low-jitter routes
sellable to software.

```text
0:32 Switch from slide 2 to slide 3.
Keep slide 3 on screen for the "users" and "needs" lines.
```

The users are hosted agent platforms, crawlers, automation tools, RPC workloads,
and indexers. They need isolated egress, stable latency, caps, top-ups, and
revocation.

**0:42 - Problem**

```text
0:42 Switch from slide 3 to slide 4.
Emphasize the contrast between agents and human VPN signup.
```

Autonomous software needs network access, but VPNs are built for humans.
Signup forms, cards, dashboards, static accounts, and best-effort internet
routes do not fit agent workflows.

Agents can pay for APIs, but still cannot reliably buy the network path needed
to use them.

**1:00 - Solution**

```text
1:00 Switch from slide 4 to slide 5.
Keep slide 5 on screen for the paid API call explanation.
```

Hyperspace turns connectivity into a paid API call.

An agent discovers the endpoint, receives an MPP / HTTP 402 challenge, pays
USDC, and gets a prepaid WireGuard configuration. The route can be scoped to a
source and destination IP, metered, topped up, and revoked.

```text
1:14 Switch from slide 5 to slide 6.
Keep slide 6 on screen for the technical flow.
```

Under the hood, the flow connects a pay.sh-compatible gateway, Solana SPL USDC,
the Hyperspace control plane, gate agents, WireGuard, and DoubleZero-optimized
paths.

**1:25 - Differentiation And Stage**

```text
1:25 Switch from slide 6 to slide 7.
Keep slide 7 on screen for the competitor comparison.
```

Traditional VPNs require human signup and subscriptions. Cloud proxies are
mostly HTTP-only. Self-hosted WireGuard creates an ops burden and has no payment
API.

Hyperspace is agent-paid prepaid WireGuard with route health, caps, revocation,
and DoubleZero-backed paths.

```text
1:38 Switch from slide 7 to slide 8.
Keep slide 8 on screen for current stage.
```

We already have the web UI, customer API, control plane, gate agents, European
staging gates, config issue and revoke, and a mainnet payment smoke test.

**1:48 - Team And Proof**

```text
1:48 Switch from slide 8 to slide 9.
Keep slide 9 on screen for team.
```

I am Andrey Manolov, co-founder and CTO of Hyperspace. I worked on Solana
restaking devtools and partnerships at Cambrian. STAKR.space supports validator,
node, Linux networking, and gate operations.

```text
1:58 Switch from slide 9 to slide 10.
Use slide 10 as a short contact bridge; do not read the contact lines aloud.

2:02 Switch from slide 10 to slide 11.
End on slide 11 for proof and launch ask.
```

The demo proves the core flow: a client pays `0.000001 USDC` on Solana
mainnet-beta, the server receives funds, Hyperspace issues a WireGuard config,
the route is used, and the session is revoked.

Our ask is simple: test agent-native paid connectivity with hosted agents,
crawlers, Solana RPC teams, and indexer teams.
