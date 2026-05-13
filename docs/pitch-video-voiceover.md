# Pitch Video Voiceover: Hyperspace

Target length: about 2 minutes at a normal pitch pace.

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

```text
0:00 Start on slide 1 with title "Hyperspace".
Hold on "Pay-as-you-go VPN paths for AI agents".
```

Hyperspace turns Solana payments into machine-native network access.

Agents pay for prepaid IP-to-IP VPN routes, receive WireGuard configs, use
DoubleZero-backed paths, and revoke access when done.

```text
0:14 Switch to slide 2 with title "Current market".
Keep this slide on screen for the "Why now?" lines.
```

pay.sh and MPP / HTTP 402 make resources discoverable. Solana settles USDC.
DoubleZero makes low-jitter routes software can buy.

```text
0:25 Switch to slide 3 with title "User insights".
Keep this slide on screen for the "users" and "needs" lines.
```

Hosted agents, crawlers, automation, RPC teams, and indexers need isolated
egress, stable latency, caps, top-ups, and revocation.

```text
0:36 Switch to slide 4 with title "Problem".
Emphasize the contrast between agents and human VPN signup.
```

VPNs are built for humans: signup, cards, dashboards, static accounts, and
best-effort routes. Agents need programmable paths.

```text
0:52 Switch to slide 5 with title "Solution".
Keep this slide on screen for the paid API call explanation.
```

Hyperspace exposes connectivity as an API: discover endpoint, answer payment
challenge, pay USDC, receive scoped WireGuard config.

```text
1:06 Switch to slide 6 with title "Tech overview".
Keep this slide on screen for the technical flow.
```

The flow connects a pay.sh-compatible gateway, Solana SPL USDC, the Hyperspace
control plane, gate agents, WireGuard, and DoubleZero routing.

```text
1:18 Switch to slide 7 with title "Competitors".
Keep this slide on screen for the competitor comparison.
```

Traditional VPNs are subscriptions. Cloud proxies are HTTP-only. Self-hosted
WireGuard is ops. Hyperspace is agent-paid prepaid WireGuard with route health
and revocation.

```text
1:30 Switch to slide 8 with title "Current stage".
Keep this slide on screen for current stage.
```

We have the web UI, API, control plane, gate agents, European staging gates,
config issue and revoke, and a mainnet payment smoke test.

```text
1:40 Switch to slide 9 with title "Team".
Keep this slide on screen for team.
```

I am Andrey Manolov, co-founder and CTO. At Cambrian, I worked on pre-seed,
the restaking devtools pivot, partnerships, hiring, and pilots. STAKR supports
validator and gate operations.

```text
1:48 Switch to slide 10 with title "Demo proof".
Keep this slide on screen for payment proof, SVG -> LON outcomes, and launch ask.
The demo repo link and QR code are on this slide.
```

The demo proves payment and access, then shows the SVG to London outcome:
p95 drops from 98.5 to 33 milliseconds, and stddev jitter from 23.4 to 0.2.

We want teams to test paid connectivity with hosted agents, crawlers, RPC, and
indexers.

```text
1:58 Switch to slide 11 with title "Contacts".
Use this as the final end card; do not read the contact lines aloud.
```
