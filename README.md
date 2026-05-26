# 🕐 Time Inject — OpenClaw Plugin

> **Injects reliable wall-clock time into every agent's system context.**

[![OpenClaw Plugin](https://img.shields.io/badge/OpenClaw-Plugin-%234b32c3)](https://openclaw.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## The Problem

**OpenClaw agents lack a reliable wall-clock time source.**

- Agents rely on session-start timestamps or model training cutoffs
- Long-running sessions drift — agents think it's yesterday
- No built-in mechanism to tell agents "this is the real current date and time"
- [GitHub Issue #82968](https://github.com/openclaw/openclaw/issues/82968)

For users who travel across timezones, ask about events, or rely on time-aware reasoning, this creates constant friction: agents give wrong dates, miscalculate deadlines, or need manual time correction every session.

## The Solution

A lightweight plugin that hooks into `before_prompt_build` and prepends the current wall-clock time to every agent's system prompt — **before** every single model call, not just at session start.

```
Oggi è martedì 26 maggio 2026, ore 17:30 (Europe/London)
ISO UTC: 2026-05-26T15:30:00.000Z
```

### Why a Plugin?

| Approach | Problem |
|---|---|
| Template in SOUL.md | Rendered once at session start, not per request |
| Gateway injection | Modifies core code — overwritten on update |
| **Plugin (this)** | Hooks into prompt build **per request**, survives updates, zero core changes |

## Features

- ✅ **Per-request accuracy** — time is injected before *every* model call
- ✅ **Configurable timezone** — set it in `openclaw.json`, changes at runtime
- ✅ **IANA validation** — rejects invalid timezones, falls back to `Europe/Rome`
- ✅ **Minimal overhead** — pure `Intl` formatting, no dependencies
- ✅ **Survives updates** — lives outside core, enabled by default
- ✅ **Dual format** — human-readable localized string + ISO UTC for parsing

## Installation

1. **Clone or download** this plugin into your workspace:

```bash
mkdir -p /root/.openclaw/workspace/main/plugins
cd /root/.openclaw/workspace/main/plugins
git clone <repo-url> time-inject
```

2. **Compile** (TypeScript required):

```bash
cd time-inject
npm install
npx tsc
```

3. **Enable** in `openclaw.json`:

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

4. **Restart OpenClaw** and verify:

```bash
openclaw plugins list
# Should show: Time Inject │ time-inject │ openclaw │ enabled │ 1.0.0
```

## Configuration

### `timezone` (string, optional)

IANA timezone name. Default: `Europe/Rome`.

| Value | When to use |
|---|---|
| `Europe/Rome` | Italy (CET/CEST) |
| `Europe/London` | UK (GMT/BST) |
| `America/Toronto` | Eastern Canada (YDD2 project) |
| `America/New_York` | US East Coast (MTN1 project) |
| `America/Los_Angeles` | US West Coast |
| `Asia/Shanghai` | China (CST) |
| `Asia/Kolkata` | India (IST) |

Invalid timezones are rejected by IANA validation; the plugin falls back to `Europe/Rome`.

## How It Works

```
┌─────────────┐     before_prompt_build     ┌──────────────┐
│  OpenClaw   │ ──────────────────────▶     │ Time Inject  │
│  Gateway    │                              │  Plugin      │
└─────────────┘                              └──────┬───────┘
                                                    │
                                                    ▼
                                          ┌──────────────────┐
                                          │  new Date()       │
                                          │  + IANA timezone  │
                                          │  + Intl format    │
                                          │  + ISO UTC str    │
                                          └──────┬───────────┘
                                                    │
                                                    ▼
                                          prependSystemContext:
                                          "Oggi è martedì 26 maggio 2026,
                                           ore 17:30 (Europe/London)
                                           ISO UTC: 2026-05-26T15:30:00.000Z"
```

The hook uses `before_prompt_build` to return `prependSystemContext`, which is cached by the provider's prompt caching — minimal token cost.

## Source Code

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const DEFAULT_TZ = "Europe/Rome";

function isValidTimezone(tz: string): boolean {
  if (typeof (Intl as any).supportedValuesOf === "function") {
    try {
      return (Intl as any).supportedValuesOf("timeZone").includes(tz);
    } catch { /* fall through */ }
  }
  try {
    Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export default definePluginEntry({
  id: "time-inject",
  name: "Time Inject",
  description: "Injects current wall-clock time as prependSystemContext...",
  register(api) {
    api.on("before_prompt_build", (_event, ctx) => {
      const now = new Date();
      const pluginConfig = (ctx as any).pluginConfig;
      const rawTz = pluginConfig?.timezone;
      const tz = rawTz && isValidTimezone(rawTz) ? rawTz : DEFAULT_TZ;

      const raw = new Intl.DateTimeFormat("it-IT", {
        timeZone: tz,
        weekday: "long", year: "numeric", month: "long",
        day: "numeric", hour: "2-digit", minute: "2-digit",
      }).format(now);

      const formatted = `Oggi è ${raw.replace(" alle ", ", ore ")} (${tz})`;

      return {
        prependSystemContext: `${formatted}\nISO UTC: ${now.toISOString()}`,
      };
    });
  },
});
```

## Development

```bash
npm install        # installs TypeScript
npx tsc            # compiles src/ → dist/
npx tsc --watch    # watch mode
```

## Related

- [GitHub Issue #82968 — Agents need reliable wall-clock time](https://github.com/openclaw/openclaw/issues/82968)
- [OpenClaw Plugin SDK Docs](https://docs.openclaw.ai/plugins/sdk-overview)

## License

MIT — do what you want, contributions welcome.
