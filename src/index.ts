import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

import { buildTimeContext } from "./clock.js";
import { resolveTimeZone } from "./config.js";

export default definePluginEntry({
  id: "time-inject",
  name: "Time Inject",
  description: "Injects exact wall-clock time into the system context before every model call",
  register(api) {
    const resolved = resolveTimeZone(api.pluginConfig, api.config);

    if (resolved.invalidConfiguredTimeZone) {
      api.logger.warn?.(
        `time-inject: invalid IANA timezone \"${resolved.invalidConfiguredTimeZone}\"; using ${resolved.timeZone}`,
      );
    }

    api.on("before_prompt_build", () => {
      const now = new Date();
      return {
        prependSystemContext: buildTimeContext(now, resolved.timeZone),
      };
    });
  },
});
