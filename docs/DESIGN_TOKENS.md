# Design Tokens

Semantic foundations and component aliases are defined in `src/index.css`. Both themes use the same contract. Cyan is the primary brand accent; success, warning, error and info have independent meanings. Syntax highlighting retains distinct operator colors.

## Foundations

| Token | Light | Dark |
|---|---|---|
| `--background` | `#f4f7fb` | `#080d16` |
| `--surface` | `#ffffff` | `#111b2a` |
| `--surface-elevated` | `#ffffff` | `#192638` |
| `--surface-muted` | `#eef3f8` | `#0c1422` |
| `--border` | `#76879c` | `#60748d` |
| `--border-subtle` | `#ccd5e1` | `#2c3e55` |
| `--text-primary` | `#172435` | `#f1f5f9` |
| `--text-secondary` | `#3e526c` | `#c1ccdb` |
| `--text-muted` | `#536780` | `#a3b2c7` |
| `--primary` | `#07627b` | `#67d9ef` |
| `--primary-hover` | `#034b61` | `#a5edfa` |
| `--primary-active` | `#043e50` | `#38bdd9` |
| `--primary-solid` | `#086b83` | `#08758e` |
| `--on-primary` | `#ffffff` | `#ffffff` |
| `--secondary-accent` | `#67439a` | `#c8b6fa` |
| `--brand-surface` | `#e6f4f8` | `#153542` |
| `--success` | `#17643c` | `#7de0b0` |
| `--success-surface` | `#e9f6ee` | `#113428` |
| `--warning` | `#79500a` | `#f4cd83` |
| `--warning-surface` | `#fff4df` | `#392b15` |
| `--error` | `#a0283b` | `#ffa4ae` |
| `--error-surface` | `#fff0f2` | `#3e2029` |
| `--info` | `#235687` | `#99caff` |
| `--info-surface` | `#eaf3fd` | `#1a3049` |
| `--focus` | `#086b83` | `#99e9fc` |

## Component contract

| Component | Aliases / implementation |
|---|---|
| Button | `--button-background/text/border`, `--primary-solid`, `--on-primary`; hover/active use explicit theme values |
| Input | `--input-background/text/border`; placeholder uses text-muted |
| Select | `--select-background/text`; input-border, native options inherit the theme |
| Card | `--card-background/border` (`ui-card`) |
| Modal | `--modal-background/overlay` (`ui-dialog`), focus containment, Escape and launcher focus return |
| Navigation | `--navigation-background/active-background`, aria-current and skip navigation |
| Badge | `--badge-background/text`; status badges use semantic tokens |
| Code editor | `--code-background/text`, syntax operator classes |
| Validation result | `--validation-success-background/error-background`; explicit errors, warning copy and icons |
| Speech controls | `--speech-background/text`; recording uses error family, processing brand, completed success |

## Measured flat token contrasts

These are opaque token pairs, not proof of every composed DOM state. Axe validates rendered states separately. Subtle card separators are decorative; interactive field boundaries use the stronger border token.

| Pair | Light | Dark | Minimum |
|---|---|---|---|
| text-primary / surface | 15.67:1 | 15.79:1 | 4.5:1 |
| text-secondary / surface | 7.99:1 | 10.65:1 | 4.5:1 |
| text-muted / surface | 5.8:1 | 8.03:1 | 4.5:1 |
| primary / brand-surface | 6.13:1 | 7.87:1 | 4.5:1 |
| success / success-surface | 6.46:1 | 8.51:1 | 4.5:1 |
| warning / warning-surface | 6.5:1 | 9.09:1 | 4.5:1 |
| error / error-surface | 6.64:1 | 7.74:1 | 4.5:1 |
| on-primary / primary-solid | 6.1:1 | 5.32:1 | 4.5:1 |
| border / surface | 3.67:1 | 3.61:1 | 3:1 |

## Interaction and migration

Focus-visible uses a 3px theme focus outline plus separation from the surface. Controls have at least 24px targets; feedback stars are 28px. Reduced-motion preferences suppress ornamental animation. Input/header flex children can shrink at narrow widths and enlarged text. Existing spacing/radii and information architecture are retained.

Core builder, input, speech, navigation, validation, settings and important secondary views use component classes. A documented compatibility bridge remains for legacy utility-based colors; new components should consume semantic aliases directly. The bridge is a transitional maintenance cost, not a claim that every view was fully rewritten.
