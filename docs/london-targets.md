# London Demo Targets

## Safe Public Default

```text
data.mft.lseg.com:443
```

This host resolves to LSEG managed-file-transfer infrastructure. It is not a
trading/order-entry API. It is useful for safe public TCP timing because it is
exchange-adjacent infrastructure and does not require credentials for a TCP/TLS
connect attempt.

ICMP ping may be blocked. That is expected.

## Preferred Jitter Target

For clean network jitter measurement, use a controlled London probe:

```bash
JITTER_TARGET_HOST=<controlled-london-probe-hostname-or-ip>
JITTER_TARGET_PORT=443
```

This avoids measuring application behavior from a third-party service.

## Authorized Exchange Connectivity

Real LSE trading connectivity uses FIX, native trading, market data, drop copy,
or other venue-specific gateways. Those endpoints can require contracts,
certification, source-IP allowlisting, and explicit permission.

Do not put production trading gateway IPs into this public demo unless the user
confirms they are authorized to test them.
