export interface TimeInjectConfig {
    timezone?: string;
}
export type TimeZoneSource = "plugin" | "openclaw" | "host" | "utc-fallback";
export interface ResolvedTimeZone {
    timeZone: string;
    source: TimeZoneSource;
    invalidConfiguredTimeZone?: string;
}
export declare function isValidTimeZone(value: string): boolean;
export declare function readTimeInjectConfig(value: unknown): TimeInjectConfig;
export declare function resolveTimeZone(pluginConfig: unknown, openClawConfig?: unknown): ResolvedTimeZone;
