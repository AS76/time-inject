const PARTS_FORMATTER_LOCALE = "en-CA";
function parseNumberPart(parts, type) {
    const value = parts.find((part) => part.type === type)?.value;
    if (!value) {
        throw new Error(`Missing ${type} while formatting wall-clock time`);
    }
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
        throw new Error(`Invalid ${type} while formatting wall-clock time`);
    }
    return parsed;
}
function getZonedDateParts(now, timeZone) {
    const parts = new Intl.DateTimeFormat(PARTS_FORMATTER_LOCALE, {
        timeZone,
        calendar: "iso8601",
        numberingSystem: "latn",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    }).formatToParts(now);
    return {
        year: parseNumberPart(parts, "year"),
        month: parseNumberPart(parts, "month"),
        day: parseNumberPart(parts, "day"),
        hour: parseNumberPart(parts, "hour"),
        minute: parseNumberPart(parts, "minute"),
        second: parseNumberPart(parts, "second"),
    };
}
function pad(value, width = 2) {
    return String(value).padStart(width, "0");
}
function formatOffset(offsetMinutes) {
    const sign = offsetMinutes < 0 ? "-" : "+";
    const absolute = Math.abs(offsetMinutes);
    const hours = Math.floor(absolute / 60);
    const minutes = absolute % 60;
    return `${sign}${pad(hours)}:${pad(minutes)}`;
}
export function formatLocalIso(now, timeZone) {
    const parts = getZonedDateParts(now, timeZone);
    const localAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    const instantAtWholeSecond = Math.floor(now.getTime() / 1000) * 1000;
    const offsetMinutes = Math.round((localAsUtc - instantAtWholeSecond) / 60_000);
    return [
        `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}`,
        `T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}.${pad(now.getUTCMilliseconds(), 3)}`,
        formatOffset(offsetMinutes),
    ].join("");
}
export function buildTimeContext(now, timeZone) {
    return [
        "## Exact Wall-Clock Time",
        `UTC: ${now.toISOString()}`,
        `Local: ${formatLocalIso(now, timeZone)}`,
        `Time zone: ${timeZone}`,
        "Use this block as the authoritative value of 'now' for this model call. Uptime/session age are elapsed-duration signals, not wall-clock time.",
    ].join("\n");
}
