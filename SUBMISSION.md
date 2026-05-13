# Hyperspace — Colosseum Frontier 2026 Submission

Hyperspace turns Solana payments into machine-native network access. AI agents can pay for a prepaid IP-to-IP VPN session, receive a destination-restricted WireGuard config as an API response, route traffic through a DoubleZero-backed path, measure route quality, and revoke the session when the task is done.

This repository is the public agent VPN demo for the Hyperspace Colosseum Frontier 2026 project.

## Quick Links

| Resource | Link |
| --- | --- |
| Colosseum Frontier 2026 project | https://arena.colosseum.org/projects/explore/hyperspace |
| Public demo repository | https://github.com/hyperspace-zone/hyperspace-agent-vpn-demo |
| Project website | https://hyperspace.zone |
| Development app / paid API gateway | https://app.dev.hyperspace.zone/pay |
| Project / founder X profile | https://x.com/yadrena |
| STAKR.space | https://stakr.space |
| pay.sh | https://pay.sh |
| DoubleZero | https://doublezero.xyz |
| Demo video | https://vimeo.com/1191436559 |
| Pitch video | https://vimeo.com/1191436561?share=copy&fl=sv&fe=ci |
| Pitch deck | https://docsend.com/v/rhzhd/hyperspace-colosseum-frontier |

## What We Built

Hyperspace is developer infrastructure for autonomous agents and Web3 apps. The core product is a control plane that lets a machine buy temporary network access, receive a prepaid WireGuard config, use the route for a bounded task, and then revoke it.

During Colosseum Frontier 2026, we focused on the agent-facing paid IP-to-IP VPN flow:

1. An agent checks wallet balances and the live staging gateway.
2. It inspects available Hyperspace gates.
3. It requests and decodes a live MPP / HTTP 402 payment challenge.
4. It measures baseline route quality to a target IP.
5. It pays for a prepaid IP-to-IP VPN session with USDC on Solana mainnet through the pay.sh-compatible flow.
6. Hyperspace returns a destination-restricted WireGuard config.
7. The agent connects through the paid route, backed by DoubleZero for a more stable jitter profile.
8. It repeats the latency and jitter measurement through the VPN.
9. It compares direct vs Hyperspace/DoubleZero-backed results.
10. It disconnects and revokes the prepaid session.

The public demo currently uses a Stavanger ingress and London egress path. The default test target is `185.97.160.8:443`, and the issued WireGuard config is restricted to `AllowedIPs = 185.97.160.8/32`.

## Current Demo Status

The repository now defaults to the no-Solana-CLI path. Reviewers only need Node.js, WireGuard tools, `curl`, `jq`, `@solana/pay`, and a funded Solana mainnet-beta `id.json` wallet. Wallet address, SOL balance, and USDC balance are checked by a local Node.js script through Solana JSON-RPC.

A separate `README.solana-cli.md` remains available for reviewers who prefer explicit checks with `solana`, `solana-keygen`, and `spl-token`.

The latest successful SVG -> LON run to `185.97.160.8:443` showed the intended behavior:

| Metric | Direct path | Hyperspace VPN path | Delta |
| --- | ---: | ---: | ---: |
| Median TCP connect time | 29.054 ms | 32.599 ms | +3.545 ms |
| p95 TCP connect time | 98.535 ms | 33.007 ms | -65.528 ms |
| Stddev jitter | 23.400 ms | 0.206 ms | -23.194 ms |
| Mean abs delta jitter | 19.316 ms | 0.209 ms | -19.107 ms |
| Failures | 0 | 0 | 0 |

The median was slightly higher through the paid route, but p95 and jitter became much more stable. That is the key DoubleZero-backed routing result demonstrated in the video.

## Why This Matters

AI agents increasingly need real infrastructure, not just LLM calls. They need to access APIs, RPCs, data services, and external systems from reliable network paths, but VPNs and network services are still sold through human dashboards, credit cards, subscriptions, and manual credential management.

Hyperspace makes connectivity callable:

- pay for network access as an API call;
- receive credentials programmatically;
- use a route scoped to a specific source and destination;
- measure the route immediately;
- revoke access when the task is complete;
- avoid long-lived static VPN accounts.

This creates a machine-to-machine infrastructure primitive for Solana-native agents.

## Solana / Payment Angle

The demo uses USDC payment on Solana-compatible rails to unlock a real-world service: prepaid network access.

Instead of using stablecoins only for financial apps, Hyperspace uses them for infrastructure settlement. An autonomous agent can pay, receive access, complete a task, and close the session without a human signup flow.

This aligns with pay.sh-style paid API discovery and HTTP 402 flows: payment becomes the access-control primitive for infrastructure.

## Network / DoubleZero Angle

Hyperspace is designed for low-latency, high-reliability agent connectivity. DoubleZero is a key network component in the architecture: the paid IP-to-IP VPN route can move traffic away from the unstable public-internet path and onto a more controlled route.

The current video highlights this at the metric level. The direct path had acceptable median latency but poor tail behavior; the Hyperspace route through the DoubleZero-backed path made jitter dramatically more stable. This is the infrastructure behavior real-time applications, RPC workloads, indexers, automation systems, and AI agents care about.

## Superteam Kazakhstan Side Tracks

This page is intended to work as the single submission link for relevant Superteam Earn side-track forms.

| Side track | Link | Relevance |
| --- | --- | --- |
| Superteam KZ x S1lkPay Frontier side track | https://superteam.fun/earn/listing/superteam-kz-x-s1lkpay-frontier-side-track | Solana payment unlocks infrastructure access through a paid API flow. |
| Superteam Kazakhstan Frontier side track | https://superteam.fun/earn/listing/side-track-superteam-kazakhstan | Hyperspace is Solana infrastructure for autonomous agents and Web3 applications. |
| Superteam KZ and Metaforra Frontier side track | https://superteam.fun/earn/listing/superteam-kz-and-metaforra-frontier-side-track | The same paid connectivity primitive can support agent, app, and interactive workloads that need programmatic network access. |

## Public Demo Repository Scope

This repository is intentionally safe to review publicly.

Included:

- agent instructions;
- safe environment template;
- default no-Solana-CLI quick start;
- optional Solana CLI quick start;
- demo scripts;
- pay.sh / MPP / HTTP 402 challenge flow;
- payment/config issuance flow;
- IP-to-IP WireGuard session flow;
- latency/jitter measurement scripts;
- comparison/reporting scripts;
- timestamped runtime artifact copies;
- security notes;
- English voiceover script.

Not included:

- wallet files;
- recovery phrases;
- raw payment credentials;
- production secrets;
- production gateway credentials;
- private WireGuard configs;
- generated runtime artifacts;
- internal infrastructure settings.

## How To Review

For the fastest review, open the demo video and the Colosseum project page first.

For a technical review, start with the default README:

```bash
git clone https://github.com/hyperspace-zone/hyperspace-agent-vpn-demo.git
cd hyperspace-agent-vpn-demo
cp .env.example .env
npm run wallet-info
npm run check-env
npm run challenge
```

The full paid flow requires a funded Solana mainnet-beta wallet with more than `0.000001 USDC` and enough SOL for transaction fees. The demo README explains the complete run sequence.

## Team

Hyperspace is built by a distributed team.

Andrey Manolov is Co-founder & CTO at Hyperspace.zone. He has Solana/Web3 BD and infrastructure experience from Cambrian.one, where he worked on Solana restaking devtools, GTM, partnerships, pilots, and DevRel.

The project includes STAKR.space as an infrastructure partner.

## Contact

- Website: https://hyperspace.zone
- Development app / paid API gateway: https://app.dev.hyperspace.zone/pay
- Colosseum: https://arena.colosseum.org/projects/explore/hyperspace
- GitHub: https://github.com/hyperspace-zone/hyperspace-agent-vpn-demo
- X: https://x.com/yadrena
- TG contact: https://t.me/yadren_a
- STAKR.space: https://stakr.space

The full paid IP-to-IP VPN flow requires a funded Solana wallet and the live staging/demo payment gateway described in the repository README. Do not commit `.env`, wallet files, generated WireGuard configs, or anything under `runtime/`.
