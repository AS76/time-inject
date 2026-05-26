> **Plugin:** `time-inject` — v1.0.0
> **Repo:** [github.com/AS76/time-inject](https://github.com/AS76/time-inject) *(da creare)*

Dopo aver aperto questa issue (#82968), ho scritto un **plugin OpenClaw** che risolve il problema alla radice: inietta il wall-clock time reale (`new Date()` + timezone IANA) come `prependSystemContext` in **ogni model call**, non solo all'avvio della sessione.

### Come funziona
- Si aggancia a `before_prompt_build` → restituisce `prependSystemContext`
- Formatta data/ora in italiano leggibile + ISO UTC
- Timezone configurabile via `plugins.entries.time-inject.config.timezone`
- Validazione IANA a 2 livelli (`Intl.supportedValuesOf` + fallback `try/catch`)
- Fallback sicuro: se il timezone non è valido, usa `Europe/Rome`
- 0 dipendenze esterne, solo `Intl` nativo

### Output nel system prompt
```
Oggi è martedì 26 maggio 2026, ore 17:30 (Europe/London)
ISO UTC: 2026-05-26T15:30:00.000Z
```

### Perché plugin, non patch al core
- **Sopravvive agli update** — non tocca il gateway
- **Configurabile per utente** — ogni deploy può avere il suo timezone
- **Minimo overhead** — sfrutta il prompt caching del provider

### Installazione
1. Copiare la cartella plugin in `plugins/`
2. `npm install && npx tsc`
3. Aggiungere a `openclaw.json` → `plugins.entries."time-inject"`
4. Riavviare

README completo e source nel repo. Feedback, fork e PR benvenuti.
