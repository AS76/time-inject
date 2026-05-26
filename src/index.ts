import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const DEFAULT_TZ = "Europe/Rome";

/**
 * Valida che una stringa timezone sia IANA valida e supportata dal runtime.
 * Usa Intl.supportedValuesOf (Node 18+) se disponibile, altrimenti
 * try/catch su DateTimeFormat come fallback universale.
 */
function isValidTimezone(tz: string): boolean {
  // Metodo 1: Intl.supportedValuesOf (Node 18+)
  if (typeof (Intl as Record<string, unknown>).supportedValuesOf === "function") {
    try {
      const zones = (
        Intl as unknown as Record<string, (cat: string) => string[]>
      ).supportedValuesOf("timeZone");
      return zones.includes(tz);
    } catch {
      // supportedValuesOf potrebbe non supportare "timeZone" su runtime datati
    }
  }

  // Metodo 2: try/catch con DateTimeFormat (fallback universale)
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
  description:
    "Injects current wall-clock time as prependSystemContext before every model call",
  register(api) {
    api.on("before_prompt_build", (_event, ctx) => {
      const now = new Date();

      // Legge il timezone dalla config del plugin (runtime), default Europe/Rome
      const pluginConfig = (
        ctx as { pluginConfig?: { timezone?: string } }
      ).pluginConfig;
      const rawTz = pluginConfig?.timezone;
      const tz = rawTz && isValidTimezone(rawTz) ? rawTz : DEFAULT_TZ;

      const raw = new Intl.DateTimeFormat("it-IT", {
        timeZone: tz,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(now);

      // "martedì 26 maggio 2026 alle 17:30" → "Oggi è martedì 26 maggio 2026, ore 17:30 (Europe/London)"
      const formatted = `Oggi è ${raw.replace(" alle ", ", ore ")} (${tz})`;

      return {
        prependSystemContext: `${formatted}\nISO UTC: ${now.toISOString()}`,
      };
    });
  },
});
