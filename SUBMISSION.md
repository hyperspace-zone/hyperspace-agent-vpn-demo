# Hyperspace — Colosseum Frontier 2026 Submission

Hyperspace turns Solana payments into machine-native network access. AI agents can pay for a prepaid VPN session, receive a WireGuard config as an API response, connect through Hyperspace gates, measure route quality, and revoke the session when the task is done.

This repository is the public agent VPN demo for the Hyperspace Colosseum Frontier 2026 project.

## Quick Links

| Resource | Link |
| --- | --- |
| Colosseum Frontier 2026 project | https://arena.colosseum.org/projects/explore/hyperspace |
| Public demo repository | https://github.com/hyperspace-zone/hyperspace-agent-vpn-demo |
| Project website | https://hyperspace.zone |
| Live app | https://app.hyperspace.zone |
| Project / founder X profile | https://x.com/yadrena |
| STAKR.space | https://stakr.space |
| pay.sh | https://pay.sh |
| DoubleZero | https://doublezero.xyz |
| Demo video | https://vimeo.com/1191436559 |
| Pitch video | https://vimeo.com/1191436561?share=copy&fl=sv&fe=ci |
| Pitch deck | https://docsend.com/v/rhzhd/hyperspace-colosseum-frontier |

## What We Built

Hyperspace is developer infrastructure for autonomous agents and Web3 apps. The core product is a control plane that lets a machine buy temporary network access, receive a prepaid WireGuard config, use the route for a bounded task, and then revoke it.

During Colosseum Frontier 2026, we focused on the agent-facing VPN flow:

1. An agent inspects available Hyperspace gates.
2. It measures baseline route quality.
3. It pays for a prepaid VPN session with USDC through a pay.sh / MPP / HTTP 402-style flow.
4. Hyperspace returns a standard WireGuard config.
5. The agent connects through the route.
6. It measures latency and jitter after the VPN session.
7. It disconnects and revokes the prepaid session.

The public demo currently uses a Stavanger ingress and London egress path and includes scripts for baseline measurement, payment, connection, VPN measurement, comparison, disconnect, and revocation.

## Why This Matters

AI agents increasingly need real infrastructure, not just LLM calls. They need to access APIs, RPCs, data services, and external systems from reliable network paths, but VPNs and network services are still sold through human dashboards, credit cards, subscriptions, and manual credential management.

Hyperspace makes connectivity callable:

- pay for network access as an API call;
- receive credentials programmatically;
- meter usage by session, time, or bandwidth;
- revoke access when the task is complete;
- avoid long-lived static VPN accounts.

This creates a machine-to-machine infrastructure primitive for Solana-native agents.

## Solana / Payment Angle

The demo uses USDC payment on Solana-compatible rails to unlock a real-world service: prepaid network access.

Instead of using stablecoins only for financial apps, Hyperspace uses them for infrastructure settlement. An autonomous agent can pay, receive access, complete a task, and close the session without a human signup flow.

This aligns with pay.sh-style paid API discovery and HTTP 402 flows: payment becomes the access-control primitive for infrastructure.

## Network / DoubleZero Angle

Hyperspace is designed for low-latency, high-reliability agent connectivity. The current demo proves the paid WireGuard access flow through Hyperspace gates. The broader architecture is DoubleZero-ready and designed for DoubleZero-optimized routing: the same control plane can issue paid routes that use optimized network paths for agents, RPC workloads, indexers, automation systems, and other distributed applications.

We use “DoubleZero-ready” wording here intentionally: the public demo repo focuses on the safe, reproducible agent VPN flow, while production routing and deeper optimized-network integrations are handled outside the public repo.

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
- demo scripts;
- WireGuard session flow;
- payment/config issuance flow;
- latency/jitter measurement scripts;
- comparison/reporting scripts;
- security notes;
- demo video runbook.

Not included:

- wallet files;
- recovery phrases;
- raw payment credentials;
- production secrets;
- production gateway credentials;
- private WireGuard configs;
- internal infrastructure settings.

## How To Review

For the fastest review, open the demo video and the Colosseum project page first.

For a technical review:

```bash
git clone https://github.com/hyperspace-zone/hyperspace-agent-vpn-demo.git
cd hyperspace-agent-vpn-demo
cp .env.example .env
npm run check-env
npm run challenge
```

## Team

Hyperspace is built by a distributed team. 
Andrey Manolov is Co-founder & CTO at Hyperspace.zone. He has Solana/Web3 BD and infrastructure experience from Cambrian.one, where he worked on Solana restaking devtools, GTM, partnerships, pilots, and DevRel.

The project includes STAKR.space as an infrastructure partner.


## Contact

- Website: https://hyperspace.zone
- Live app: https://app.dev.hyperspace.zone/ (development environment made specially for Frontier)
- Colosseum: https://arena.colosseum.org/projects/explore/hyperspace
- GitHub: https://github.com/hyperspace-zone/hyperspace-agent-vpn-demo
- X: https://x.com/yadrena
- TG contact https://t.me/yadren_a
- STAKR.space: https://stakr.space

The full paid VPN flow requires a funded Solana wallet and the live staging/demo payment gateway described in the repository README. Do not commit `.env`, wallet files, generated WireGuard configs, or anything under `runtime/`.
