# London Demo Targets

## Public Looking-Glass Default

```text
185.97.160.8:443
```

This IP is the default public diagnostic target for basic network timing
checks. It is the current IPv4 address used for `lg01-ld4.primexm.com`.

## Preferred Jitter Target

For clean network jitter measurement, use a controlled London probe when one is
available:

```bash
HYPERSPACE_TARGET_IP=<controlled-london-probe-ip>
JITTER_TARGET_HOST=<controlled-london-probe-ip>
JITTER_TARGET_PORT=443
HTTP_TIMING_URL=https://<controlled-london-probe-ip>/
```

This avoids measuring application behavior from an unrelated third-party
service.

## Safety Rule

Do not probe third-party production systems unless they explicitly permit
diagnostics from your source host. Prefer public looking-glass services or
targets you control.
