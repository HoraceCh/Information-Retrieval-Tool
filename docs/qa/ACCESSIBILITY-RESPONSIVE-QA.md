# Accessibility and Responsive QA

Status: **PASS WITH WARNINGS** for the tested local scope; this is not WCAG certification.

## Environment and method

Playwright 1.56.1, axe-core/playwright 4.11.0, Linux system Chromium 156.0.8172.50, local built previews. Both themes tested at desktop 1440×1000, tablet 768×1024 and mobile 390×844. The source build includes the UI changes through `421c456`; the 30-state harness is commit `5e66583`. Speech/UI combined branch includes PR14 `268d0cb` and that UI source; integration merge is local and is not a production release.

## Results

- UI PR alone: **30 captured states, zero axe violations, zero document/control overflow, zero uncaught page errors**.
- Combined UI/runtime preview: **30 captured states, zero axe violations, zero document/control overflow, zero uncaught page errors**. This specifically caught and repaired the runtime's added service-URL label contrast.
- Keyboard regression: **7 checks passed** on both standalone UI and the combined preview: skip navigation, configuration dialog entry/forward/reverse trap/Escape/focus return, visible focus outline, history dialog, offline dialog, and both themes with root font 200% at 640px.
- Keyword editing: keyboard activation excludes the chosen synonym, preserves the remaining term, and checks the excluded-control state in each theme/viewport. Excluded toggles now keep readable text and expose pressed state.
- Existing browser smoke passed, including guide navigation, offline export injection filtering, unmatched offline search, URL search and clearing the search.
- Flat semantic token contrasts meet the specified 4.5:1 text and 3:1 interactive-border thresholds; see [token specification](../DESIGN_TOKENS.md). Opaque token calculations do not replace composited DOM checks.

[Standalone axe evidence](evidence/ui-accessibility.json), [combined axe evidence](evidence/integration-ui.json), [keyboard evidence](evidence/ui-keyboard.json), [combined keyboard evidence](evidence/integration-keyboard.json), [screenshots](BEFORE_AFTER.md).

## Repaired issues

Mobile speech text no longer collapses vertically; model/database/template selects shrink within cards. Light controls and informational guidance use semantic surfaces/text. Dialogs receive and contain focus, close on Escape and restore focus. Icon controls are named. Core form controls are labelled. Query-tree regions/leaf controls support keyboard input. Tiny targets were enlarged. Syntax/validation status uses text and icons as well as color. Missing Boolean-operator translations are repaired. Reduced-motion settings are honored.

The tests deliberately remain strict. Initial failures included unsupported Playwright installation on moving Ubuntu 26.04, type errors in the query-tree language union, contrast failures, small targets, missing names, narrow enlarged-text overflow and excluded-synonym opacity. Fixes address those causes; no rule was disabled or test deleted.

## Evidence limits and remaining checks

Axe reports **474 repeated incomplete node checks** across the 30 standalone states (color-contrast and aria-prohibited-attr), separate from zero violations. These include background gradients, non-text glyphs and SVG/ARIA states for which the engine cannot give a definitive answer; they are not silently counted as passes. Focused builder and result probes retain the underlying incomplete reasons for review. Screen-reader behavior, all SVG text/background combinations, browser zoom/OS magnification, forced colors and touch-device ergonomics still need manual review.

The enlarged-text test changes the root font size; it is not a substitute for full-browser zoom certification. Current production UI, real microphones, branded Chrome/Edge and HTTPS GitHub Pages-to-loopback local-network permission behavior are outside this verified scope. The user permitted local verification while production networking remained blocked. [Provider report](https://github.com/HoraceCh/Information-Retrieval-Tool/blob/feat/local-whisper-runtime/docs/qa/PROVIDER_E2E.md) distinguishes live-service blockers from mocked browser tests.

Additional manual findings (workflow-title contrast, warning-only red/green conflict, legacy resource annotation and full-page skip-link capture artifacts) were repaired and recaptured. Unmeasured confidence/debug telemetry was removed; verification guidance is explicitly informational and readable.
