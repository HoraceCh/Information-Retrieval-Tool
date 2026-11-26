# Server-only UI browser regression

Run against a built local preview:

```sh
CHROMIUM_PATH=/usr/bin/chromium \
PLAYWRIGHT_MODULE=/workspace/browser-qa/node_modules/playwright/index.mjs \
UI_BASE=http://127.0.0.1:4173/ \
UI_EVIDENCE=artifacts/server-ui-targeted \
node scripts/server-ui-regression.mjs
```

The saved report records the preview asset and browser version. The nine checks cover legacy settings cleanup, model preservation, missing/unsafe URL rejection before microphone/network access, connection recovery, reload persistence, browser permission denial, recording recovery, and forced-colors mobile controls. Only synthetic legacy values are seeded. The report records request paths and field names, never request contents or credentials.

The permission-denial case uses Chromium's native Permissions and MediaDevices APIs with a browser-enforced denied policy. Granting permission then exercises a browser-generated synthetic audio device, recording, a fixture transcription reply and insertion into the input. This is not a physical microphone test or a live cloud-provider test. The model connection reply is also a fixture.

The forced-colors check confirms active forced-colors media, visible controls, a 3px keyboard outline and no mobile field overflow. Its saved screenshot was inspected. It does not establish full WCAG compliance or Windows/Edge high-contrast compatibility.

`settings-persisted.png`, `native-microphone-denied.png` and `mobile-forced-colors.png` show accepted states from the successful run. The last image includes a temporary fixture-transcript success notice. No failure screenshots from harness setup attempts are published here.
