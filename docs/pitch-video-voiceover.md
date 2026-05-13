# Pitch Video Voiceover: Hyperspace

Target length: about 2 minutes at a brisk pitch pace.

Text in gray blocks is not meant to be read aloud. It is a screen/action cue.

## Slide Order

The PPTX in this repository is ordered to match this script:

1. `Hyperspace`
2. `Current market`
3. `User insights`
4. `Problem`
5. `Solution`
6. `Tech overview`
7. `Competitors`
8. `Current stage`
9. `Team`
10. `Demo proof`
11. `Contacts`

## Script

**0:00 - Title**

```text
0:00 Start on slide 1 with title "Hyperspace".
Hold on "Pay-as-you-go VPN paths for AI agents".
```

Hyperspace turns Solana payments into machine-native network access.

An agent can pay for a prepaid IP-to-IP VPN route, receive a WireGuard config,
use a DoubleZero-backed path, and revoke access programmatically.

**0:14 - Market And Timing**

```text
0:14 Switch to slide 2 with title "Current market".
Keep this slide on screen for the "Why now?" lines.
```

Why now? pay.sh and MPP / HTTP 402 make paid resources discoverable at protocol
level. Solana gives fast USDC settlement. DoubleZero makes low-jitter routes
sellable to software.

```text
0:25 Switch to slide 3 with title "User insights".
Keep this slide on screen for the "users" and "needs" lines.
```

The users are hosted agent platforms, crawlers, automation tools, RPC workloads,
and indexers. They need isolated egress, stable latency, caps, top-ups, and
revocation.

**0:36 - Problem**

```text
0:36 Switch to slide 4 with title "Problem".
Emphasize the contrast between agents and human VPN signup.
```

Autonomous software needs network access, but VPNs are built for humans.
Signup forms, cards, dashboards, static accounts, and best-effort internet
routes do not fit agent workflows.

Agents can pay for APIs, but still cannot reliably buy the network path needed
to use them.

**0:52 - Solution**

```text
0:52 Switch to slide 5 with title "Solution".
Keep this slide on screen for the paid API call explanation.
```

Hyperspace turns connectivity into a paid API call.

An agent discovers the endpoint, receives an MPP / HTTP 402 challenge, pays
USDC, and gets a prepaid WireGuard configuration. The route can be scoped to a
source and destination IP, metered, topped up, and revoked.

```text
1:06 Switch to slide 6 with title "Tech overview".
Keep this slide on screen for the technical flow.
```

Under the hood, the flow connects a pay.sh-compatible gateway, Solana SPL USDC,
the Hyperspace control plane, gate agents, WireGuard, and DoubleZero-optimized
paths.

**1:18 - Differentiation And Stage**

```text
1:18 Switch to slide 7 with title "Competitors".
Keep this slide on screen for the competitor comparison.
```

Traditional VPNs require human signup and subscriptions. Cloud proxies are
mostly HTTP-only. Self-hosted WireGuard creates an ops burden and has no payment
API.

Hyperspace is agent-paid prepaid WireGuard with route health, caps, revocation,
and DoubleZero-backed paths.

```text
1:30 Switch to slide 8 with title "Current stage".
Keep this slide on screen for current stage.
```

We already have the web UI, customer API, control plane, gate agents, European
staging gates, config issue and revoke, and a mainnet payment smoke test.

**1:40 - Team And Proof**

```text
1:40 Switch to slide 9 with title "Team".
Keep this slide on screen for team.
```

I am Andrey Manolov, co-founder and CTO. I worked on Solana restaking devtools
and partnerships at Cambrian. STAKR.space supports validator and gate
operations.

```text
1:48 Switch to slide 10 with title "Demo proof".
Keep this slide on screen for payment proof and launch ask.
```

The demo proves payment and access: `0.000001 USDC` paid on Solana
mainnet-beta, funds received, WireGuard config issued, route used, session
revoked.

Now we want teams to test agent-native paid connectivity with hosted agents,
crawlers, RPC teams, and indexers.

```text
2:00 Switch to slide 11 with title "Contacts".
Use this as the final end card; do not read the contact lines aloud.
```
