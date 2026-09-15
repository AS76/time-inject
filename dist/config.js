function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function isValidTimeZone(value) {
    const timeZone = value.trim();
    if (!timeZone) {
        return false;
    }
    try {
        new Intl.DateTimeFormat("en", { timeZone }).format(0);
        return true;
    }
    catch {
        return false;
    }
}
export function readTimeInjectConfig(value) {
    if (!isRecord(value)) {
        return {};
    }
    const timezone = typeof value.timezone === "string" ? value.timezone.trim() : undefined;
    return timezone ? { timezone } : {};
}
function readOpenClawUserTimeZone(value) {
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
function resolveHostTimeZone() {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return typeof timeZone === "string" && isValidTimeZone(timeZone) ? timeZone : undefined;
}
export function resolveTimeZone(pluginConfig, openClawConfig) {
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
