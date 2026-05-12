# Security Notes

This repository is public. It must never contain secret material.

Do not commit:

- funded wallet files such as `id.json`
- seed or recovery words
- `.env`
- API tokens
- raw WireGuard configs
- WireGuard private keys
- generated runtime reports that include private paths or host-specific data

The demo writes generated files under `runtime/`, which is ignored by git.

Use a wallet path outside this repository:

```bash
SOLANA_KEYPAIR_PATH=/secure/path/outside/this/repo/id.json
```

The scripts redact WireGuard private keys from console previews, but the full
config file still contains secret key material. Treat `runtime/*.conf` as
private and delete it after the recording.

Use public looking-glass or controlled probe targets for timing checks. Do not
probe third-party production systems unless they explicitly permit diagnostics
from your source host.
