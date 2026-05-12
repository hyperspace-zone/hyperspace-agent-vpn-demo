# Agent Instructions

You are an autonomous network agent running on a Linux server close to the
Stavanger (SVG) Hyperspace gate.

Your task:

1. Inspect the public Hyperspace staging endpoint and available gates.
2. Show the live MPP / HTTP 402 payment challenge.
   The decoded challenge summary must say `network: mainnet` before spending.
3. Issue a demo Hyperspace WireGuard route from Stavanger ingress to London
   egress by paying the MPP / HTTP 402 charge from the configured Solana wallet.
4. Connect to the received WireGuard config.
5. Compare TCP connect latency and jitter before and after the VPN.
6. Use `lg01-ld4.primexm.com:443` as the public looking-glass target, unless
   the user provides a controlled probe endpoint.
7. Disconnect and revoke the session when finished.
8. Produce a short report with median, p95, stddev jitter, and mean absolute
   delta jitter.

Never print or commit:

- Solana private keys
- seed or recovery words
- raw wallet files
- WireGuard private keys
- full WireGuard config bodies
- API tokens
- `.env`
- anything under `runtime/`

Preferred command sequence:

```bash
npm run setup-pay-account
npm run check-env
npm run challenge
npm run baseline
npm run buy-vpn
sudo npm run connect
npm run vpn-measure
npm run compare
sudo npm run disconnect
npm run revoke
```

If a command fails, explain the exact failing step and stop before spending more
funds or creating another VPN session.
