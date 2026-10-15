# Design

## Context

See proposal.md (Why). Current state:

- `dist/hrv-ventilation-card.js` (about 440 lines, plain `HTMLElement`, no build) defines the three cards. The
  picture card builds a `picture-elements` config in code and renders it through `window.loadCardHelpers()`;
  it rebuilds that config only when the rounded bypass opacity changes. The two bar cards render their own
  shadow DOM and skip rendering when none of their input states changed.
- Entity IDs are constants: the integration prefix `zehnder_comfoair_q_<serial>_` for raw sensors and
  `sensor.comfoair_q450_*` for the derived template helpers. Power sensors are assumed to be in kW.
- The live installation uses the cards without options on two storage-mode dashboards (see
  `docs/hrv-ventilation.md`, Dashboards). The Lovelace resource points at
  `/local/custom/hrv-ventilation-card/hrv-ventilation-card.js?v=N`.
- The workspace deploy script uploads `dist/` to `/config/www/custom/hrv-ventilation-card/`. Its edit hook only
  uploads the file that was edited, but a run without a file path uploads every mapped file that differs from the
  host, including anything a build tool wrote to `dist/`.
- The bar cards and the badge read derived sensors: template helpers on the `comfoair_q450.jinja` macro, which
  reads 10-minute time-weighted averages of the absolute humidities (filter helpers), because the unit reports
  relative humidity in whole percent and raw absolute humidity jumps in steps of about 0.2 g/m3 (about 50 g/h).
- The unit reports its season as two binary sensors, heating season and cooling season. Both are off between the
  seasons; there is no entity for that third state and no entity for the limits.

## Goals / Non-Goals

**Goals:**
- A source layout and toolchain that other contributors recognise (TypeScript, Lit, npm scripts, unit tests).
- Card configs whose shape maps one to one onto the visual editor, so YAML and UI stay in step.
- Cards that work on any HRV/ERV with temperature, humidity and flow sensors, without helpers.
- The same values as today on the live installation after migration, within the tolerance of the smoothing; the
  bar cards look the same, the picture card is redrawn (see proposal.md).

**Non-Goals:**
- Changing the formulas, or the template helpers and charts that use them (the integration change replaces those).
- Editor elements of our own beyond one thin wrapper around HA's `ha-form` (no own entity pickers or inputs).
- Supporting Home Assistant versions without `ha-form` in the card editor.

## Decisions

### Toolchain: TypeScript + Lit 3, built with Vite in library mode
One entry `src/index.ts`, output a single ES module `hrv-ventilation-card.js` (same file name, so the Lovelace
resource URL stays valid). Lit is bundled; HA does not expose its own copy to custom cards. Vitest runs the tests
with the same config.
- `npm run build` writes to `build/` (git-ignored, not mapped by the deploy script), so a work-in-progress bundle
  can never reach the live host through a deploy run without a path, and Vite's emptying of its output folder
  cannot touch `dist/`. `npm run release` builds into `dist/`; only the release task runs it.
- Alternatives: Rollup (the classic choice for HACS cards, but needs separate plugins for TypeScript, resolve
  and terser, and a separate test runner); esbuild alone (fast, but no test runner or dev server).

### Tests: happy-dom for logic, browser mode for rendering
Vitest runs two projects. `unit` uses happy-dom for pure functions, config checks and DOM structure (attributes,
gradient IDs, events). `browser` uses Vitest browser mode with Playwright and Chromium for everything that needs
real layout or CSS media queries, which happy-dom does not have:
- the diagram rendered at 280, 320, 340, 360, 400 and 600 px in a light and a dark theme: no two label boxes intersect and
  no label lies outside the card;
- the compact switch at 340 px card width with `layout: auto`;
- with reduced motion emulated, no overlay has a running animation while the paths are still drawn.

The per-edit hook runs only the `unit` project, so it stays fast; `npm run check` runs both. The same Playwright
setup drives a capture script (`npm run capture`) that takes the README screenshots and GIF frames from the
preview page and encodes the GIF in Node (for example with `gifenc`), so no system tools are needed.
- Alternatives: happy-dom only, with mocked sizes (cannot catch real overlap); a separate Playwright test suite
  (a second runner and config for the same job).

### Linting and formatting: ESLint + Prettier
ESLint flat config with `typescript-eslint` (strict, type-checked), `eslint-plugin-lit` (template binding mistakes,
duplicate attributes, invalid expressions) and `eslint-plugin-wc` (custom element rules), with
`eslint-config-prettier` so formatting is left to Prettier. Prettier formats TypeScript, JavaScript, JSON and YAML.
Markdown is excluded: the docs are hand-wrapped prose, and Prettier turns wrapped lines that start with `+` or `-`
into list items and unindents multi-line code spans, which changes what the docs say.
`npm run check` runs type check, lint, format check and tests in one command, and is what a later CI job runs.
- Alternative: Biome (one fast tool for lint and format, fewer dependencies), but it has no Lit or web component
  rules, which are the most useful ones for this code. HA's own frontend also uses ESLint and Prettier.

### Quality gates during implementation
- **Per edit:** a PostToolUse hook in this repo's `.claude/settings.json` runs `scripts/check-on-edit.mjs` after
  every edit by Claude Code. For TypeScript files under `src/`, `test/` and `dev/` it formats the file, lints it,
  type-checks the project and runs the `unit` tests related to the file; failures exit 2 so the agent sees them
  immediately. Other files are ignored, so editing docs stays fast. Project hooks only load when Claude Code is
  started in this folder (as do the `/opsx:*` commands), so implementation sessions start here.
- **Per task:** every task ends with `npm run check` green, `/code-review` on that task's changes with confirmed
  findings fixed, and a commit of the task (skipped when the task changed no files, such as a pure verification).
  Small commits keep each review's diff to one task.
- **Per task group:** every group ends with a review task: `/code-review` on the whole group's changes since the
  previous group's last commit (plus `/simplify` for the larger groups 2, 3 and 6), which catches what only shows
  across tasks, confirmed findings fixed, `npm run check` green, then a commit. The group review is also recorded
  as apply guidance in `openspec/config.yaml`; the per-task rule still has to be added there.
- Alternative considered: a multi-agent setup with persona agents (as Squad does for Copilot). Too much
  coordination overhead for a project of this size; automated checks plus one review per group catch more for
  less.

### Source layout
`src/index.ts` (registration and card picker entries), `src/cards/` (one file per card), `src/editor/`
(the shared editor element and the form schemas per card), `src/diagram/` (the SVG drawing and label layout of the picture card), `src/calc/` (the recovery
calculation, absolute humidity and smoothing), `src/lib/` (pure functions: units, availability, segment layout,
scale, config checks, re-render check, number format), `src/strings.ts` (all UI text, English). Pure functions
take plain values, not `hass`, so they can be unit tested without a DOM.

### Visual editor: one thin editor element around `ha-form`, with an advanced-settings toggle
Each card's `getConfigElement()` returns the shared editor element `hrv-card-editor`, configured with that card's
schema. The editor renders an "Advanced settings" switch above HA's own `ha-form`, and passes `ha-form` the schema
with the advanced fields left out while the switch is off. Fields are entity selectors (with domain filters),
number fields and text fields for colours; groups use `type: "expandable"` with a `name`, which nests their data
under that key, so the config shape is defined by the schema. A section that only groups top-level options in the
editor (the calculation section with `smoothing` and `air_density`) uses `flatten: true`, which keeps its fields at
the top level; the live editor check (task 8.5) confirms it on the installation, as the spike did not cover it.
- Every schema field is marked basic or advanced. Advanced fields stay in their own section (an advanced
  absolute humidity picker appears inside its stream's section), and a section with only advanced fields appears
  only with the switch on.
- The switch is editor state, never written to the config. It starts on when any advanced value in the config
  differs from its default, and cannot be turned off while one does, so a saved custom setting is never hidden.
  The switch is itself a one-field `ha-form` with a boolean selector, so the editor needs no other HA element.
- Advanced: humidity smoothing, air density, minimum scale, neutral threshold, all colours, layout, show
  unavailable values, nominal flow, the absolute humidity pickers of the bar cards (relative humidity plus
  temperature is enough; the unit's own sensor is the alternative), and the picture card's next fan change, next
  bypass change, target temperature and temperature profile. Everything else is basic, including the picture
  card's absolute humidity pickers (they are displayed labels) and the animation switch.
- The editor only uses `ha-form`, which HA's built-in form editor uses too, and gives it the config, `hass`, the
  schema and the label and helper callbacks. If `ha-form` is not defined, the editor tells the user to use the
  YAML editor.
- Why not the built-in form editor (`getConfigForm()`): HA calls it once, without `hass` or the config, so the
  fields cannot change with a switch. `ha-form` has `visible` conditions per field, but a named expandable section
  only receives its own slice of the data, so a field inside `outdoor` cannot see a switch at the top level, and
  the switch would be saved in the YAML.
- Alternatives: `visible` conditions with a saved `show_advanced` key (switch in the YAML; per-stream fields cannot
  be hidden); one collapsed "Advanced" section at the bottom (no switch, values not in their own sections); a Lit
  editor with HA's `ha-entity-picker` (more code, and it relies on more of HA's internal elements being loaded).

### Config shape (snake_case keys, nested per editor group)
All three cards use the same keys for the unit's sensors, so these blocks can be copied between cards:
`outdoor`, `supply`, `extract`, `exhaust` (each `temperature`, `humidity` for relative humidity,
`absolute_humidity`), `fans.supply_flow`, `bypass.position`, `smoothing` (minutes, default 10, 0 = off) and
`air_density` (kg/m3, default 1.2).

- Picture card: the stream blocks, `fans` (`level`, `supply_flow`, `exhaust_flow`), `bypass` (`position`, `mode`,
  `next_change`), `status` (`operating_mode`, `target_temperature`, `temperature_profile`, `next_fan_change`,
  `filter_days`, `power`, `rmot`), `seasons` (`heating`, `cooling`), `smoothing`, `air_density`, `colors` (`cold`, `warm`),
  `animation` (`enabled`, default true; `nominal_flow`, optional, in the unit of the flow entities), `layout`
  (`auto`, `full` or `compact`, default `auto`), `show_unavailable` (default false). The former `savings` block
  is gone: the badge is calculated.
- Recovery bar: `outdoor`, `supply`, `extract`, `fans.supply_flow`, `bypass.position`, `smoothing`, `air_density`, `heating` and
  `cooling` (each `color`, `color_latent`), `min_scale`.
- Moisture bar: `outdoor`, `supply`, `extract`, `fans.supply_flow`, `bypass.position`, `smoothing`, `air_density`,
  `neutral_threshold`, `min_scale`, `drying_color`, `gaining_color`.

Required roles:
- Picture card: the four stream temperatures. The badge additionally needs the calculation inputs (below); without
  them no badge is shown, and the fan flows are otherwise only used for the status grid and the animation speed.
- Recovery bar: outdoor, supply and extract temperature and the supply flow. Humidity is all or nothing: either
  each of the three streams has a humidity (absolute, or relative), or none has, which makes the card
  sensible-only. A partial set is a configuration error.
- Moisture bar: a humidity for each of the three streams (absolute, or relative plus temperature) and the supply
  flow.
- The bypass position is optional everywhere; without it the calculation uses 0 %.

Required roles are checked in `setConfig`, which throws an error naming the missing roles (HA shows it as an error
card). Options are checked there too: a value outside its range, of the wrong type or an unknown choice throws an
error naming the option and what it accepts (one shared validator in `src/lib/`, with each card's option table:
type, range or choices, default); a missing option uses its default. The calculation keeps its own fallbacks, so it
never computes from an invalid value even if a config reaches it unchecked. The form's `assertConfig` does not throw for missing entities, so the visual editor stays usable while the
user fills them in. Stub configs are empty apart from the type.

### Calculations in the card (`src/calc/`)
The cards compute their figures live from the raw sensors, with a TypeScript port of `comfoair_q450.jinja`:
- Inputs: temperature (degrees C) and absolute humidity (g/m3) of outdoor, supply and extract air, supply flow
  (m3/h), bypass position (%, 0 without entity).
- Same constants and rules as the macro: `h = rho * 1006 * T + AH * (2501 + 1.86 * T)` in J/m3, with the air
  density `rho` from `air_density` (default 1.2 kg/m3, the macro's fixed value; at about 1500 m it is about 1.0,
  and the fixed value would overstate the sensible parts by about 17 %); cooling when the
  bypass is above 0 or `h_out > h_ext`, otherwise heating; the cooling reference is extract or outdoor air,
  whichever has the higher enthalpy; free cooling when the bypass is above 0 and the extract air is that reference
  (the figures are then the cooling delivered against the indoor air, and the recovery bar says "Free Cooling",
  "Cooling X W of Y W" and, for the lost parts, "Missed"); signed sensible and latent parts of recovered and lost power, 0 outside their
  mode; heating and cooling totals clamped at 0; moisture extracted `flow * (AH_ext - AH_out)`, recovered
  `flow * (AH_sup - AH_out)`, put outside `flow * (AH_ext - AH_sup)`.
- Output in W and g/h, unrounded; the cards round for display. The effectiveness and the exhaust-side moisture
  check are not ported, because no card shows them.
- Sensible-only: without humidity for the three streams, the calculation runs on temperatures alone (all latent
  parts 0) and reports that latent is unknown, so the recovery bar leaves the moisture parts and the water rate
  out of its legend.
- Golden vectors: a table of input sets with expected outputs, generated once by rendering the macro's formulas
  in Home Assistant with fixed inputs, is stored in `test/vectors.json` and checked by unit tests within 1 W and
  1 g/h. It covers heating, cooling through the bypass, cooling with the outdoor air as reference (hot day, also
  with the bypass open and with an asymmetric supply humidity), opposite signs, a house gaining moisture, a negative
  total clamped at 0, zero flow and full bypass, plus the moments discussed in `docs/hrv-ventilation.md`
  (2026-09-27 10:40, 2026-09-30 12:00, 2026-10-06 13:00), with their eight inputs read from the recorder history
  (the doc only quotes some of them, partly as hourly means) and checked against the helpers' recorded values. The
  September moments predate the averaged humidity and the sensible/latent helpers (2026-10-04), so they use the raw
  absolute humidity; 2026-09-30 is checked against the totals helper, 2026-09-27 not (older formula then). An extra
  moment with the bypass modulating (2026-10-12 18:30, bypass 76 %) is checked against every helper, including the
  losses (since 2026-10-11). A first vector, rendered from the macro's formulas: outdoor 0 C / 4.0 g/m3, supply
  17 C / 6.5, extract 21 C / 7.5, 230 m3/h, bypass 0 gives heating, recovered 1324 W sensible + 400 W latent, lost
  314 + 160 W, moisture 575 g/h recovered, 230 put outside, 805 extracted. The integration change reuses the same
  file, so both implementations stay in step.
- Alternatives: keep reading derived sensors (the bar cards stay useless without about twenty helpers); accept
  both derived sensors and raw inputs (two config models and two code paths for the same figures).

### Absolute humidity
Per stream the calculation takes the `absolute_humidity` entity (g/m3). When only `humidity` (relative, %) is
configured, it computes absolute humidity from it and the stream temperature with the Magnus formula,
`AH = 6.112 * exp(17.67 * T / (T + 243.5)) * RH * 2.1674 / (273.15 + T)`. On the live unit this reproduces the
unit's own absolute humidity sensors within 0.003 g/m3 (extract 22.3 C / 55 %: 10.860 vs 10.857; outdoor
14.7 C / 87 %: 10.949 vs 10.948), so both paths give the same figures.

### Humidity smoothing
The Zehnder unit reports relative humidity in whole percent, so raw absolute humidity moves in steps of about
0.2 g/m3, about 50 g/h of moisture and 30 W of latent power per step. The calculation therefore uses a
time-weighted simple moving average of each stream's absolute humidity over `smoothing` minutes (default 10,
0 = off), the same filter as the helpers the macro reads today.
- A module-level store keeps one series per input entity, shared by all cards on the page. On first use it loads
  the window's history with the frontend's `history/history_during_period` WebSocket command (`minimal_response`,
  `no_attributes`) and then appends each new state from the `hass` updates. When absolute humidity is computed
  from relative humidity, the store keeps the computed series.
- Like the filter helper, the average is recomputed when an input changes, not on a timer. It covers the window
  ending at the latest update of the card's inputs (server time), so a stepped humidity that stays gains weight as
  the other inputs update; at the time of a series' own latest sample it equals the helper (checked against a
  recorded hour: within 0.0005 g/m3).
- Until the history has loaded, the cards use the current value; if the call fails or comes back empty (for
  example because the recorder excludes the entity), the window fills from live updates and the load is tried again
  after 5 minutes. A card that asks for a larger window than was loaded loads the history again.
- Request and response, as confirmed by the spike on HA 2026.10.1: `hass.callWS({ type:
  'history/history_during_period', start_time, end_time, entity_ids: [id], minimal_response: true,
  no_attributes: true })` (ISO times) returns `{ [entity_id]: [{ s, lu }, ...] }`, sorted by time. `s` is the
  state as a string (`"11.0959701538086"`), `lu` the last-updated time in epoch seconds with a fraction. When the
  entity had a state before the window, the first item is that state with `lu` equal to `start_time` exactly; the
  others are the changes in the window. The spike saw only `s` and `lu`, but HA's compressed format can add keys
  (`lc` when last-changed differs, `a` for attributes). The store therefore:
  - reads only `s` and `lu` and ignores other keys;
  - treats a missing entity key (`{}`, for example an entity the recorder excludes) like a failed call: no history,
    the window fills from live updates;
  - does not assume the first item is at `start_time` (a new entity, or purged rows, starts later); the average
    covers only the time from the first item on;
  - treats a non-numeric `s` (`unavailable`, `unknown`) as a gap that is left out of the average, not as a value.
- Users who already have averaged sensors pick those and set `smoothing: 0`. The live installation uses the raw
  absolute humidity entities with the default smoothing (what other users get) and is compared against the
  template helpers.
- Alternatives: require the user to create filter helpers (the setup step this change removes); exponential
  smoothing per update (depends on how often a unit reports); no smoothing (jumps of 50 g/h).

### Picture card draws its own SVG diagram with an HTML label layer
The card renders, in Lit, three rows in normal flow: a top row, the drawing band and a status grid. Only the
drawing band holds the inline SVG (hexagonal exchanger, two crossing curved arrows, bypass path, outdoor and house
symbols); all text is HTML.

```
+---------------------------------------------------+
| [season]            [bolt] 32 W   [therm] RMOT 14.2 |  top row (power centred)
+---------------------------------------------------+
| outdoor 12.1 C                     extract 21.4 C |
| 78 % 8.2 g/m3     +---40 %----+     45 % 8.6 g/m3 |
|        \          |           |          /        |  drawing band
|         \---------| <120 W>   |---------/         |  (SVG at a fixed
|  175 m3/h   /-----|           |-----\  180 m3/h   |   ratio, labels
|        <---/      +-----------+      \--->        |   overlaid)
| exhaust 13.0 C                     supply 19.8 C  |
| 90 % 8.4 g/m3                       55 % 8.3 g/m3 |
+---------------------------------------------------+
| [fan] Medium     [shuffle] auto   [cog] Auto       |  status grid
| [timer] -        [timer] 01:30    [tstat] Comfort  |  (fixed cells,
| [filter] 64 d                     [therm] 21.0 C   |   3 columns)
+---------------------------------------------------+
```

- The SVG has a fixed `viewBox` and `width: 100%`, so it sets the drawing band's height and scales with the card.
  It only uses theme variables (`--card-background-color`, `--primary-text-color`, `--divider-color`) and the
  configured cold and warm colours, so it works in dark themes.
- Labels are not drawn in the SVG, because SVG text shrinks with the drawing and becomes unreadable on phones.
- The drawing band overlays only its own labels: four corner stacks (temperature, relative and absolute humidity
  of each stream end), the bypass position at the top of the exchanger just inside its outline, the saving badge on
  its centre, and the supply and exhaust flow above the tips of their arrows (slightly smaller). That is at most
  three lines per corner, which fit the band at 400 px (about 190 px high). The exchanger is narrow enough, and the
  bypass curve runs close enough to it, that the exhaust flow label fits between the outdoor symbol and the bypass
  path. Font sizes use `clamp()` with an 11 px minimum.
- The top row is a three-column grid: season icon left, power centred on the card, RMOT right. The status grid has
  three equal columns of a fixed width (9em, narrower when the card is), centred, one subject each, and a fixed
  cell per value (`STATUS_CELLS` in `labels.ts`): fans (level,
  next fan change, filter days), bypass (mode, next change) and comfort (operating mode, profile, target). A wrapping
  strip moved values between lines as they came and went and gave no hint what a bare value was; fixed cells keep
  each value in one place. An unconfigured value leaves its cell empty; a long value ends in an ellipsis. Every
  label of the two rows has an mdi icon in front (`ha-icon` at 1.15em, on the text's baseline), set in the label
  model next to the prefixes; only RMOT keeps a text prefix. A tooltip names each label. A next change with nothing
  planned shows a dimmed dash; a label with nothing to show keeps its place, invisible, so no row changes size with
  the states. A line in the divider colour separates the top row from the drawing and the drawing from the
  status grid, each spanning the content width (the corner stacks' outer edges). The card's height is the sum of the three rows, so text never has to fit inside the
  drawing.
- Whether a row exists depends on the config, not on the current states: the top row is rendered while at least
  one of power, RMOT or a season entity is configured, the status grid while at least one of its roles is
  configured. So the card does not change height when a season flips or a value becomes unavailable. Items whose
  role is not configured are left out.
- Season: the two season binary sensors give three states. Heating season (heating on) shows
  `mdi:sun-thermometer` in the warm colour, cooling season (cooling on) `mdi:snowflake-thermometer` in the cold
  colour, and between seasons (both configured, both off) `mdi:sun-snowflake-variant` in the secondary text colour.
  Both on, which the unit should not report, counts as heating. With only one season entity configured and off,
  there is no icon, because "between seasons" cannot be told apart from the other season. The icon has a title and
  an accessible name ("Heating season", "Cooling season", "Between seasons"); tapping it opens the more-info dialog
  of the season entity that is on, or of the heating one between seasons.
- `show_unavailable` (default false): a label whose entity is missing, unknown or unavailable is hidden; with true
  it shows the state as HA formats it. A required temperature that is unavailable also turns its stream end grey.
  The rows stay in place either way.
- `layout: auto` (default) sets a `compact` state below 340 px card width via a `ResizeObserver`; `full` and
  `compact` force one layout, for example on a wall tablet. The switch was 400 px until the live migration showed a
  sections-view column of about 350 px on a 1440 px desktop with three columns; the full layout fits without
  overlaps from 320 px (measured), so 340 px keeps that column and phones (about 360 px) in the full layout and
  leaves compact for the narrowest cards. Compact
  keeps the top row and hides the status grid, the flows and the absolute humidities, so each corner stack has the
  temperature and relative humidity, plus the badge and the bypass position. The breakpoint is a pure function of width and layout option instead of a CSS container
  query, which keeps the rule unit-testable and identical in every browser HA supports.
- Labels show `hass.formatEntityState(stateObj)` (HA's own formatting: unit, display precision, number format,
  translated states) and fire `hass-more-info` with the entity ID on tap, which is what `state-label` did.
- Bypass: the outdoor-to-supply stream is drawn twice, through the exchanger with opacity `1 - p` and along a
  bypass curve around the exchanger with opacity `p` (p = bypass position / 100, clamped; 0 without entity). The
  extract-to-exhaust stream is unaffected.
- Stream colours: each of the four stream ends gets a colour interpolated between cold and warm by its position
  in a range centred midway between the coldest and the warmest of the four temperatures, as wide as their spread
  but at least 10 K (`(min + max) / 2 +- max(max - min, 10 K) / 2`). With a spread of 10 K or more the coldest
  end is the cold colour and the warmest the warm colour; with a smaller spread the colours stay near the midpoint,
  so 0.5 K of difference on a mild day does not look like winter. Temperatures are converted to degrees C first (degrees C and F, by unit); any
  other unit, or an unavailable temperature, gives grey. Each stream is an SVG `linearGradient` between its two
  ends. Gradient and path IDs carry a per-instance suffix, because several cards on one page share the document's
  ID space for `url(#...)` references.
- Badge: the calculated saving (`src/calc/`) in W, formatted with the locale, on a hexagon shaped like the
  exchanger (CSS `clip-path`, with the outline as the clipped background and the fill inset by its width). Heating
  mode with a saving above 0.5 W gives a warm badge, cooling mode above 0.5 W a cold badge, otherwise a grey badge
  with the value (for example "0 W"). The warm and cold badges are tinted with the configured colour, as
  `color-mix(in srgb, <colour> 25%, var(--card-background-color))` with a border in the colour and the theme's
  text colour, so they stay legible in light and dark themes with any configured colour. The grey badge uses
  `--secondary-background-color`. When a calculation input has no value, the badge is hidden; with
  `show_unavailable: true` it is a grey "n/a" badge. Tapping it opens the more-info dialog of the supply air
  temperature. Without the calculation inputs configured there is no badge.
- The label model (which labels, where, with which prefix, visible or not), the bypass strength, the colour mapping
  and the badge choice are pure functions in `src/diagram/`; the Lit element only renders their output.
- Animated flow: each drawn path gets an overlay path with the same geometry, a dashed stroke (short dashes,
  longer gaps, tinted towards the card background so they stay visible on the stream in a light and a dark theme)
  and a CSS animation of `stroke-dashoffset`, so the dashes move in the flow direction. The overlay uses the same opacity as its path, so the bypass split shows as the share of
  moving air on each route. Speed is set through a CSS custom property per stream (animation duration =
  base duration / speed factor, factor = flow / nominal flow clamped to 0.25 to 2; 1 without nominal flow or flow
  entity; `animation-play-state: paused` at flow 0). Only the custom properties change on state updates, so the
  animation does not restart. `@media (prefers-reduced-motion: reduce)` and `animation.enabled: false` remove the
  overlays' animation; paths and opacities stay.
- CSS animations run on the compositor and browsers throttle them in background tabs, so there is no per-frame
  JS. Alternatives: SMIL `<animateMotion>` particles (harder to control speed without restarting), a
  `requestAnimationFrame` loop (keeps the main thread busy on wall tablets that show the dashboard all day).
- The current PNGs are kept in `docs/reference/` as the visual reference for proportions and style (moved to the
  git-ignored `private/reference/` before publishing, as they are the manufacturer's artwork).
- Alternatives: keep composing `picture-elements` with an SVG data URI as image (fixes theming and sharpness, not
  the overlapping labels and fixed height); draw everything with HTML/CSS (curved crossing arrows are awkward
  without SVG); put the labels inside the SVG (scales down to unreadable text on narrow cards); overlay all labels
  on the drawing, as the old card does (the centre column alone holds up to 12 lines, which do not fit the
  drawing's height at 400 to 500 px).

### Bar cards render with Lit templates
The shared bar (lanes of segments, zero line, hatch pattern, legend layout) becomes one Lit template function used
by both cards. The moisture bar has one lane; the recovery bar a temperature lane and, with humidity, a moisture
lane, each its recovered part solid and its lost part hatched in one colour, so temperature and moisture stay in
one bar but each reads on its own, also with opposite signs. One scale serves both lanes. The bar, the line between
the lanes and the legend swatches share a 1 px outline in the theme's secondary text colour at half strength, which
stands out from the card in light and dark themes. The recovery legend has one row per lane in aligned columns
(name, "Recovered", "Lost") from 400 px of card content; narrower, a group per lane with the name above its two
items, side by side when two fit. Every legend item keeps its swatch, words and value on one line.

Each segment clips a fill element that covers the whole bar, so every fill has the same box and all stripes run as
one pattern, also across the lanes. (Sizing and moving each segment's own background to the bar does not: Chrome
lays the stripes out from each segment's box, which drifts by up to a few pixels.)

### Re-render rule (all cards)
`shouldUpdate` returns true when:
- the config changed (this is also what makes the editor preview follow edits);
- `hass.states[id]` of a configured entity is a different object than at the last render (HA replaces the state
  object on every state or attribute change, so unit changes are covered);
- `hass.locale`, `hass.entities[id]` of a configured entity (display precision, name) or `hass.themes.darkMode`
  changed;
- the card's own state changed (for example the smoothing history finished loading, or the compact state).

Other `hass` updates are skipped. The list of configured entity IDs is computed once per config. The rule is one
pure helper in `src/lib/`, shared by the three cards. Registry entries are compared by their fields, because HA
builds new entry objects for every entity on each registry update; and the comparison is against the `hass` of the
last render (stored by the card), not Lit's previous value, so skipped updates cannot hide a change.

### Units, availability and number format in one place
`src/lib/units.ts` converts by `unit_of_measurement` into the units the calculation uses: degrees C and F to
degrees C, m3/h, L/s and ft3/min to m3/h, g/m3 for absolute humidity, % for relative humidity and the bypass
position. Anything else counts as unavailable. Labels do not use it; they use HA's formatting. `src/lib/availability.ts` turns missing, `unknown`, `unavailable` and non-numeric states into "no
value"; cards render "n/a" from that. Numbers the cards compute themselves (bar headers and legends) are formatted
with the HA locale (`hass.locale`: language and number format setting): the magnitude is formatted, the sign is
written as "−".

Which inputs a figure needs is decided per card:
- **Recovery bar:** the calculation decides the mode, and heating and cooling share the same inputs, so there is
  no longer a mode that can stay usable while the other's sensors fail. The card shows "n/a" while any configured
  calculation input (temperatures, humidities, supply flow, bypass position) has no value.
- **Moisture bar:** every configured input must have a value (the three humidities, the temperatures they need,
  the supply flow and, when configured, the bypass position). Otherwise the whole card shows "n/a", because the
  neutral band and the bypass note decide how the figures may be read.
- **Picture card:** per label, hidden by default (see `show_unavailable`). A next change with nothing planned shows
  a dimmed dash, the bypass position hides while closed, the badge hides
  without its inputs and an unavailable temperature makes its stream end grey.

### Sizing in the sections view
`getGridOptions` sets `columns: 12` and leaves `rows` unset for all three cards, so their height follows the
content (diagram ratio plus top row and strip, bar plus legend) instead of a fixed number of rows. `min_columns` is
9 for the picture card (about 330 px in a standard section) and 6 for the bars; the preview page confirms both.

### No runtime assets
The diagram replaces the only images, and styles live in the components, so the build output is one file. This
also settles where HACS or an integration has to place assets: nowhere.

### README modelled on power-flow-card-plus
`README.md` becomes user-facing, following the structure of the power-flow-card-plus README: title, hero GIF,
features, scope and requirements, installation (HACS custom repository, and the manual resource), usage
with the UI editor, options per card as tables (Name | Type | Default | Description) with a nested table per
config object, minimal and full examples, a short "how it calculates", development, roadmap. Badges (HACS,
release, downloads) wait for the packaging change, which brings default inclusion and release automation.
- Images live in `docs/images/` and are referenced relatively, so they render on GitHub and in HACS.
- The hero GIF and the theme/compact screenshots come from the preview page with mock states, captured by
  `npm run capture`: reproducible, and no installation identifiers in view. The bar cards and the editor are captured on the live installation after
  migration, checked for identifiers (the editor shows entity IDs with the device serial unless cropped).
- Every example in the README is also run through the card's config check in a unit test, so the docs cannot
  drift from the code.
- The current developer-oriented content (layout table, hard-coded list) moves to "Development" and "Roadmap".

### Build output is committed
`dist/` is committed after `npm run release`, because both the live deploy and HACS read files from the repo.
`node_modules/` and `build/` are git-ignored.

### Published through HACS as a custom repository
The repository is published on GitHub as `peeter123/hrv-ventilation-card`. The bundle is already called
`hrv-ventilation-card.js`, and a `.js` file in `dist/` named after the repository is what HACS looks for in a
Dashboard repository, so `hacs.json` needs no `filename`. `hacs.json` in the root holds the display name "HRV
Ventilation Card" and no `homeassistant` minimum until older versions are checked, so nobody is blocked by an
untested limit. Users add the repository as a custom repository of type Dashboard; HACS installs the latest GitHub
release (`v0.1.0` first), or the default branch when there is none. The workspace keeps the folder as
`hrv-ventilation/`; only its own git history is pushed. Licence: MIT, the usual choice for Lovelace cards.
- Before publishing, everything installation-specific leaves the tracked files: `docs/hrv-ventilation.md` keeps the
  general explanation (formulas, moisture model, accuracy, card behaviour), and the installation notes (entity IDs
  with the device serial, helper, dashboard and resource IDs, live card configs, deploy steps) move to
  `private/installation.md`. `private/` is git-ignored and kept only in the workspace, together with the formula
  macro (hard-coded to one unit, deployed from `private/templates/`) and the reference images (the
  manufacturer's artwork). The git history holds all of these, so it is not published: the full history stays on a
  local branch `private/history`, and the published `main` starts with one initial commit of the cleaned tree.
- Alternatives: a `filename` key with a differently named repository (unneeded when the names match); the bundle as
  a release asset instead of in `dist/` (needs release automation, packaging change).

## Risks / Trade-offs

- [The `ha-form` expandable nesting, `required: true` inside an expandable group or a selector option behaves
  differently than documented] → Verify with a minimal card on the live installation in the first task group,
  before porting the cards.
- [`ha-form` is not loaded when our editor opens, or its properties change between HA versions] → The spike runs
  the thin editor with the switch on the live installation; the editor falls back to a hint to use the YAML
  editor, and the minimum HA version is stated in the README.
- [Per-task reviews add up over 50+ tasks] → They review only one task's diff; the group reviews stay the place
  for `/simplify` and cross-task findings.
- [Browser tests need a Chromium download and are slower than happy-dom] → They run in `npm run check`, not in the
  per-edit hook.
- [A section narrower than 340 px makes `layout: auto` show the compact layout on desktop] → `layout: full` per
  card.
- [The drawn diagram looks worse than the hand-made images] → Iterate against the reference images with a local
  preview page (mock states, several widths, light and dark) before touching the live dashboards.
- [`hass.formatEntityState` is missing on older HA versions] → Fall back to state plus unit of measurement; the
  minimum HA version is stated in the README.
- [Animation is distracting or costs battery on wall tablets] → Subtle styling, respects reduced motion and can be
  switched off per card; check CPU use on the preview page with the browser's performance panel.
- [Changing a CSS animation's duration makes dashes jump] → Change the speed through a negative
  `animation-delay` adjustment or accept a small jump; checked on the preview page while moving the flow slider.
- [Interpolated colours exaggerate small differences when the four temperatures are almost equal] → The colour
  range is at least 10 K wide, so near-equal temperatures stay near the midpoint colour; covered by a unit test.
- [The release build writes `dist/` without triggering the deploy hook, so the live host can lag behind] → The
  tasks and `docs/hrv-ventilation.md` include the explicit deploy command and resource bump after every release.
- [The TypeScript port and the Jinja macro drift apart while both exist] → Golden vectors generated from the macro
  are checked in unit tests; the integration change reuses them and retires the macro.
- [The cards' figures differ from the template helpers and charts on the same dashboard] → Same formulas and the
  same 10-minute smoothing; only the window alignment differs. The live check accepts 5 W and 5 g/h.
- [The history call fails or is slow (recorder exclusions, a large database)] → The cards start with the current
  value and fill the window from live updates; the spike checks the call on the live installation.
- [Several cards on a page load the same history] → One module-level store per entity, loaded once.

## Migration Plan

1. Take screenshots of both dashboards (picture card, recovery bar, moisture bar) as the reference.
2. Build and unit-test the new bundle locally (in `build/`); do not deploy yet.
3. Add full entity configs to every instance of the three cards on both dashboards: raw unit sensors for the
   calculation inputs, the raw absolute humidity entities with the default smoothing. The current bundle ignores
   config, so nothing changes visibly.
4. Release into `dist/`, deploy it with the workspace deploy script, bump the resource `?v=`, hard-refresh and
   compare with the reference screenshots: the same values on every label, bar figures and badge within 5 W and
   5 g/h of the template helpers at the same moment; the picture card's new look checked at desktop and phone
   width and in a dark theme.
5. Directly after the final commit (the user is confident in the new bundle), delete `ventilation.png` and
   `ventilation-bypass.png` from
   `/config/www/custom/hrv-ventilation-card/` on the host (the deploy script never deletes).
6. Rollback: check out the previous `dist/` from git, deploy it and bump `?v=` again. If the images were already
   deleted from the host (step 5), copy `private/reference/*.png` back to `/config/www/custom/hrv-ventilation-card/`
   over SSH first; the deploy script does not upload them since they left `dist/`. The added configs are harmless
   for the old bundle.

## Open Questions

Open:

- Minimum Home Assistant version. `getGridOptions` (2024.11) does not set it, because older versions ignore it;
  the floor depends on the `ha-form` features the editor uses (`expandable` with `name`, selectors inside a group)
  and on `hass.formatEntityState`, which were only checked on 2026.10.1. Until a lower version is checked, the
  README says "tested on 2026.10" and names no minimum. Settled when the README is filled (task 8.8), once every
  frontend API the cards use is known.

Resolved by the spike (task 1.7, on HA 2026.10.1):

- `ha-form` in the thin editor: defined when the editor opens, also on a fresh page load straight into the
  dashboard editor (`?edit=1`). An `expandable` group with a `name` nests its fields under that key in the saved
  YAML (`outdoor: { temperature: ... }`); the editor's own switch is not saved. A field left out of the schema
  while the switch is off appears inside its own group when the switch is on. Entity selectors with `domain`
  filter the picker (a `binary_sensor` picker lists only binary sensors; a `sensor` picker finds no binary
  sensor). `required: true` inside a group marks the picker ("Select an entity *") and removes its clear button.
- `history/history_during_period`: shape noted under Humidity smoothing.
- Driving the live UI from Playwright (spike, live checks, editor screenshot): authenticate by writing
  `hassTokens` (the long-lived token from `.env`) into local storage before the page loads, and block service
  workers in the browser context. Otherwise HA's service worker takes control of the fresh context and reloads
  the page while a dialog is open. Blocking it causes one harmless page error at load in HA's `app.js`.
