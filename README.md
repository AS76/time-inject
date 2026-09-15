# 🕐 Time Inject — OpenClaw Plugin

> Injects an exact, timezone-aware wall-clock timestamp into every model call.

Time Inject started as a workaround for [OpenClaw issue #82968](https://github.com/openclaw/openclaw/issues/82968), where agents lacked a reliable agent-facing wall clock.

Modern OpenClaw now provides a native **Temporal Context** with the local date and timezone and points agents to `session_status` for exact current time. This plugin therefore has a narrower purpose: **make exact wall-clock time available directly in the system context on every prompt build**, with no extra tool call.

## What it injects

```text
## Exact Wall-Clock Time
UTC: 2026-09-15T14:41:12.345Z
Local: 2026-09-15T16:41:12.345+02:00
Time zone: Europe/Rome
Use this block as the authoritative value of 'now' for this model call. Uptime/session age are elapsed-duration signals, not wall-clock time.
```

The output is intentionally language-neutral and machine-parseable.

## Why keep it if OpenClaw has Temporal Context?

OpenClaw's native prompt context provides the **date** and **timezone**, while exact current time is tool-backed. Time Inject complements that behavior by adding the exact timestamp on every model call.

Useful when you want:

- exact time without a `session_status` tool call;
- long-running sessions to always receive a fresh wall clock;
- UTC and local timestamps together;
- deterministic timestamps for deadline, recency, heartbeat, or log reasoning.

If OpenClaw's native Temporal Context + `session_status` is sufficient for your setup, you do not need this plugin.

## Timezone resolution

Timezone precedence is:

1. `plugins.entries.time-inject.config.timezone`
2. OpenClaw `agents.defaults.userTimezone`
3. host runtime timezone
4. `UTC` as a final fallback

Invalid plugin timezone values are ignored and logged as a warning.

## Installation

```bash
mkdir -p /root/.openclaw/workspace/main/plugins
cd /root/.openclaw/workspace/main/plugins
git clone https://github.com/AS76/time-inject.git
cd time-inject
npm install
npm run build
```

Then enable it in `openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "time-inject": {
        "enabled": true,
        "config": {
          "timezone": "Europe/Rome"
        }
      }
    },
    "load": {
      "paths": [
        "/root/.openclaw/workspace/main/plugins/time-inject"
      ]
    }
  }
}
```

The `timezone` override is optional. If omitted, Time Inject follows `agents.defaults.userTimezone` when configured.

Restart OpenClaw and verify the plugin is enabled:

```bash
openclaw plugins list
```

## Development

```bash
npm install
npm run build
npm run typecheck
npm test
```

The clock formatter is split from the OpenClaw adapter so DST/offset behavior can be tested independently.

## Design notes

- Uses `api.pluginConfig`, the plugin configuration exposed by the OpenClaw SDK.
- Hooks `before_prompt_build`, so the clock is regenerated for each model call.
- Uses `Intl.DateTimeFormat` with an IANA timezone and an ISO-8601 calendar.
- Includes the correct local UTC offset, including daylight-saving transitions.
- Keeps uptime/session age explicitly separate from wall-clock time.
- Has no runtime dependencies beyond OpenClaw and the JavaScript runtime.

## Related

- [OpenClaw issue #82968](https://github.com/openclaw/openclaw/issues/82968)
- [OpenClaw date/time documentation](https://docs.openclaw.ai/date-time)
- [OpenClaw plugin hooks](https://docs.openclaw.ai/plugins/hooks)

## License

MIT.
