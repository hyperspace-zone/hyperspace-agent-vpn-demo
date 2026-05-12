# London Demo Targets

## Public Looking-Glass Default

```text
lg01-ld4.primexm.com:443
```

This host is used as a public diagnostic target for basic network timing checks.
It is appropriate for ping, traceroute, MTR, TCP connect timing, and HTTP/TLS
timing during the demo.

## Preferred Jitter Target

For clean network jitter measurement, use a controlled London probe when one is
available:

```bash
JITTER_TARGET_HOST=<controlled-london-probe-hostname-or-ip>
JITTER_TARGET_PORT=443
HTTP_TIMING_URL=https://<controlled-london-probe-hostname-or-ip>/
```

This avoids measuring application behavior from an unrelated third-party
service.

## Safety Rule

Do not probe third-party production systems unless they explicitly permit
diagnostics from your source host. Prefer public looking-glass services or
targets you control.
