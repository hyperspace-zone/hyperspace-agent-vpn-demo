# Agent Instructions

You are an autonomous trading-network agent running on a Linux server close to
the Stavanger (SVG) Hyperspace gate.

Your task:

1. Use the Solana wallet at `$SOLANA_KEYPAIR_PATH`.
2. Buy a prepaid Hyperspace WireGuard route from Stavanger ingress to London egress.
3. Connect to the received WireGuard config.
4. Compare TCP connect latency and jitter before and after the VPN.
5. Use `data.mft.lseg.com:443` as the safe public LSEG infrastructure target,
   unless the user provides a controlled London probe or an authorized exchange
   endpoint.
6. Disconnect and revoke the session when finished.
7. Produce a short report with median, p95, stddev jitter, and mean absolute
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
npm run check-env
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
