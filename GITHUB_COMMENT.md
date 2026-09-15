> **Plugin:** `time-inject` — v1.1.0
> **Repo:** https://github.com/AS76/time-inject

I originally created `time-inject` as a workaround for OpenClaw issue #82968.

OpenClaw now provides native Temporal Context (date + timezone) and uses `session_status` for exact current time. The plugin has therefore been refactored into a smaller compatibility/exact-clock layer rather than pretending the upstream problem is still completely unresolved.

### v1.1 behavior

- hooks `before_prompt_build` and injects a fresh exact timestamp on every model call;
- emits UTC + local ISO-8601 timestamp with the correct DST-aware offset;
- reads plugin configuration from `api.pluginConfig`;
- timezone precedence: plugin override → `agents.defaults.userTimezone` → host timezone → UTC;
- warns on invalid IANA timezone values instead of silently hard-coding a location;
- keeps wall-clock time explicitly separate from uptime/session age;
- includes tests for DST, UTC, timezone validation, and precedence behavior.

Example:

```text
## Exact Wall-Clock Time
UTC: 2026-09-15T14:41:12.345Z
Local: 2026-09-15T16:41:12.345+02:00
Time zone: Europe/Rome
```

This is now best viewed as an optional exact-clock companion to OpenClaw's native Temporal Context, not a replacement for it.
