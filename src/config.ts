export interface TimeInjectConfig {
  timezone?: string;
}

export type TimeZoneSource = "plugin" | "openclaw" | "host" | "utc-fallback";

export interface ResolvedTimeZone {
  timeZone: string;
  source: TimeZoneSource;
  invalidConfiguredTimeZone?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isValidTimeZone(value: string): boolean {
  const timeZone = value.trim();
  if (!timeZone) {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en", { timeZone }).format(0);
    return true;
  } catch {
    return false;
  }
}

export function readTimeInjectConfig(value: unknown): TimeInjectConfig {
  if (!isRecord(value)) {
    return {};
  }

  const timezone = typeof value.timezone === "string" ? value.timezone.trim() : undefined;
  return timezone ? { timezone } : {};
}

function readOpenClawUserTimeZone(value: unknown): string | undefined {
  if (!isRecord(value) || !isRecord(value.agents)) {
    return undefined;
  }

  const defaults = value.agents.defaults;
  if (!isRecord(defaults) || typeof defaults.userTimezone !== "string") {
    return undefined;
  }

  const timeZone = defaults.userTimezone.trim();
  return isValidTimeZone(timeZone) ? timeZone : undefined;
}

function resolveHostTimeZone(): string | undefined {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return typeof timeZone === "string" && isValidTimeZone(timeZone) ? timeZone : undefined;
}

export function resolveTimeZone(pluginConfig: unknown, openClawConfig?: unknown): ResolvedTimeZone {
  const configured = readTimeInjectConfig(pluginConfig).timezone;

  if (configured && isValidTimeZone(configured)) {
    return { timeZone: configured, source: "plugin" };
  }

  const openClawTimeZone = readOpenClawUserTimeZone(openClawConfig);
  if (openClawTimeZone) {
    return {
      timeZone: openClawTimeZone,
      source: "openclaw",
      ...(configured ? { invalidConfiguredTimeZone: configured } : {}),
    };
  }

  const host = resolveHostTimeZone();
  if (host) {
    return {
      timeZone: host,
      source: "host",
      ...(configured ? { invalidConfiguredTimeZone: configured } : {}),
    };
  }

  return {
    timeZone: "UTC",
    source: "utc-fallback",
    ...(configured ? { invalidConfiguredTimeZone: configured } : {}),
  };
}
