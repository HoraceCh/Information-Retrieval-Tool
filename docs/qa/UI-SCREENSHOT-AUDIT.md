# G1.5 UI Screenshot Audit

Status: **PASS WITH WARNINGS** for the local built baseline; production capture **BLOCKED**. Captured anew 2026-11-16 from main `57739e1` before UI implementation, with system Chromium / Playwright. Production blocked by CONNECT 403; cloud browser API reported “Browser Use could not read requirements” and native input reported unavailable AT-SPI. No cloud/production screenshots are claimed. User requested proceeding with local verification.

## Flow and evidence

| Step | Surface | Initial health | Evidence |
|---|---|---|---|
| 1 | Builder and database/model/provider selectors | Needs fixes | before dark/light desktop/tablet/mobile builder screenshots |
| 2 | Restored fixture query, field-specific query, keyword tree and structure validation | Needs contrast and keyboard checks | before-qa result screenshots; rendering fixture, not a real model result |
| 3 | Injected invalid query and normalization action | Needs semantic status colors | before-qa validation-error screenshots |
| 4 | Settings and model/key configuration | Low light-theme contrast | before dark/light settings screenshots |
| 5 | Project overview | Review all themes | before dark/light about screenshots |
| 6 | Database whitelist/navigation | Review density/keyboard | before-qa whitelist screenshots |
| 7 | Offline HTML export dialog | Review modal/focus | before-qa offline-dialog screenshots |
| 8 | Speech input/provider controls | Mobile layout broken | before dark mobile builder screenshot; microphone/live service validation separate |

Exact screenshots are retained with the delivery evidence, identified by state/theme/device. Seeded history data is explicitly marked QA fixture. No API key or personal data is used.

## P0/P1/P2 register (before implementation)

| ID | Severity | Location / evidence | Finding | Required repair |
|---|---|---|---|---|
| V01 | P1 | dark-mobile-builder | Speech text squeezes into a vertical column; model select extends beyond its card | Wrap input header; constrain flex children/select width; keep buttons readable |
| V02 | P1 | light-desktop-builder | Cyan and amber text too pale against white/tinted surfaces; provider select retains dark fill | Introduce independent light semantic values and component styling; measure contrast |
| V03 | P1 | light-settings | Key storage/privacy explanation almost disappears on blue tint | Use info surface/text tokens; keep warning readable |
| V04 | P1 | dark-desktop-builder | Empty state / metadata use very dark gray and opacity stacking | Use readable muted text tokens; remove opacity from meaningful copy |
| V05 | P1 | forms / DOM | Natural-language textarea label not connected; several selects lack accessible names | Explicit label/ID or accessible name; automate axe checks |
| V06 | P1 | keyboard / DOM | Many controls remove outline; no shared focus indicator | Visible theme-aware focus ring; keyboard validation |
| V07 | P2 | all screenshots | Competing cyan, purple, yellow highlights; inconsistent card background/border choices | One cyan brand family; reserve warning/error/success colors for status and syntax |
| V08 | P2 | settings | Raw translation keys operatorStyleLabel/operatorStyleStandard visible | Repair missing i18n entries |
| V09 | P2 | modal and history / DOM | Need dialog naming/focus containment and keyboard access to restored history | Semantic dialogs, focus management, keyboard-operable history |
| V10 | P2 | small labels / motion | Tiny all-caps helper text and ornamental glow reduce hierarchy | Remove excess glow, strengthen text hierarchy; honor reduced motion |

No P0 observed in inspected local screenshots. This is not a statement that all application states are defect-free. Screenshots alone cannot certify WCAG 2.2 AA. Automated checks, DOM/keyboard checks and screen-reader/manual device checks have separate status in the final QA record.

## Final disposition

The audit expanded to 30 states per version, including keyword-exclusion and warning-only interactions. **58 original PNGs are published; two Before Whitelist images are withheld for privacy.** Baseline screenshots come from a separate immutable main worktree; source and hashes are retained in [the screenshot index](BEFORE_AFTER.md). Production capture remains BLOCKED, as authorized for local-only continuation.

V01–V09 were repaired in the checked local scope. V10 was addressed for meaningful copy/focus/reduced motion; unmeasured confidence/debug telemetry was removed; legacy utility-color bridges and spacious category layouts remain P2 maintenance work. A newly exposed V11 (excluded keyword buttons reduced to 40% opacity) was repaired with full readable text, strike-through and selected-state semantics. Enlarged-text reflow, query-tree keyboard access, service URL label contrast and the type contract were verified after their fixes.

[Final responsive/accessibility record](ACCESSIBILITY-RESPONSIVE-QA.md) documents zero detected violations/overflow for the checked states, and the incomplete/manual checks that still limit any compliance claim. [Design token specification](../DESIGN_TOKENS.md) records light/dark values, component aliases and measured token contrasts.

Manual review additionally found low-contrast workflow text, warning-only red/green status conflict and a credential-like legacy resource annotation. These were repaired and rechecked. Original annotation values are not reproduced, and the two corresponding Before images are not published. New screenshot captures reset the document scroll origin so a fixed off-screen skip link is not accidentally drawn into a full-page image.
