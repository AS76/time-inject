import assert from "node:assert/strict";
import test from "node:test";

import { buildTimeContext, formatLocalIso } from "../dist/clock.js";
import { isValidTimeZone, resolveTimeZone } from "../dist/config.js";

test("formats DST-aware Europe/Rome time", () => {
  const instant = new Date("2026-09-15T14:41:12.345Z");
  assert.equal(formatLocalIso(instant, "Europe/Rome"), "2026-09-15T16:41:12.345+02:00");
});

test("formats UTC without locale-dependent output", () => {
  const instant = new Date("2026-01-05T03:04:05.006Z");
  assert.equal(formatLocalIso(instant, "UTC"), "2026-01-05T03:04:05.006+00:00");
});

test("builds a compact authoritative clock block", () => {
  const instant = new Date("2026-09-15T14:41:12.345Z");
  const context = buildTimeContext(instant, "Europe/Rome");
  assert.match(context, /UTC: 2026-09-15T14:41:12\.345Z/);
  assert.match(context, /Local: 2026-09-15T16:41:12\.345\+02:00/);
  assert.match(context, /Time zone: Europe\/Rome/);
  assert.match(context, /Uptime\/session age/);
});

test("validates IANA timezone identifiers", () => {
  assert.equal(isValidTimeZone("Europe/Rome"), true);
  assert.equal(isValidTimeZone("Not/A_Timezone"), false);
});

test("prefers plugin timezone over OpenClaw user timezone", () => {
  assert.deepEqual(
    resolveTimeZone(
      { timezone: "Europe/London" },
      { agents: { defaults: { userTimezone: "Europe/Rome" } } },
    ),
    { timeZone: "Europe/London", source: "plugin" },
  );
});

test("uses OpenClaw userTimezone when plugin timezone is omitted", () => {
  assert.deepEqual(
    resolveTimeZone({}, { agents: { defaults: { userTimezone: "Europe/Rome" } } }),
    { timeZone: "Europe/Rome", source: "openclaw" },
  );
});
