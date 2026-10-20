# Design

## Context

See proposal.md for the motivation. The facts below come from the code and the live installation on 2026-10-19.

- The drawing is one `aria-hidden` SVG in a 400 by 200 view box (`src/diagram/drawing.ts`). Everything that is read
  or tapped is HTML on top of it, placed in % of the drawing band (`.on-drawing` boxes in
  `src/cards/ventilation-card.ts`). Taps go through one `activate` handler on the card that reads `data-entity`,
  and `this.tap()` adds `role`, `tabindex` and `data-entity` only outside sample mode.
- The exchanger is two hexagons: `EXCHANGER` (outer, filled by type) and `EXCHANGER_INNER` (outline only). The rim
  between them is about 12 units wide. The streams are drawn after the exchanger and cross it, so they cover part
  of both outlines. The bypass position sits just below the inner outline's top (`top: 20.5%`, y 41), the moisture
  figure's bottom edge at y 152, the inner outline's bottom at y 162.
- The outdoor stream starts at (86, 62) and is 14 units wide. The outdoor corner stack is HTML in px, so in view-box
  units it grows as the card narrows. At 280 px three lines reach about y 61 and x 70.
- `calculateRecovery` gives no result while an input lacks a value. The macro's `eff_sensible` and `eff_moisture`
  are `(X_s - X_o) / (X_e - X_o) * 100`, rounded to an integer, `None` unless the bypass is 0 and the gradient is at
  least 3 K or 1.5 g/m³. They are not clamped.
- `convertedState(state, 'power')` already converts W and kW (used by the saving roles).
- The live unit's pre-heater sensors (power, energy this year, energy since start) all read 0, and have never read
  otherwise, so its pre-heater's on states cannot be seen live.
- The preview page (`dev/`) drives mock states from controls: temperatures, humidities, flow, bypass, season,
  config set, exchanger type, layout and an availability switch per entity. It has no pre-heater and no
  effectiveness control.
- The editor's shown defaults (`withShownDefaults` and `withoutShownDefaults` in `src/editor/schema.ts`) and their
  tests exist since the v0.2 group 6 review. The card-bundle delta only specifies them.

## Goals / Non-Goals

**Goals:**

- Pure functions for every new figure (effectiveness, glow level, tooltips), unit-tested, with the card only placing
  them. Browser tests that measure placement, as for the moisture figure.
- Existing configs render exactly as in v0.2: rings off by default, no coil without the role.
- Every new state can be shown on the preview page, because the live pre-heater stays off.

**Non-Goals:**

- No change to the recovered and lost power, the moisture rates or the smoothing.
- No animation of the coil or the rings.

## Decisions

### Effectiveness is part of the recovery result

`RecoveryResult` gets `effectiveness: { temperature?: number; moisture?: number }`, computed in `calculateRecovery`
from the same inputs (raw temperatures, smoothed absolute humidity), capped to 0-100, and left out below its
gradient (3 K, 1.5 g/m³, as constants next to the formula) or, for moisture, while latent figures are unknown.
There is no bypass gate.

- *Why in the result and not a separate function?* The rings need the same inputs as the badge, at the same moment.
  One calculation per render keeps the badge, the moisture figure and the rings consistent, as for the moisture
  figure. A missing input then empties both rings, which the spec states.
- *Why no bypass gate, unlike the macro?* The user chose (2026-10-19) to show the figure while the bypass modulates.
  It then describes the unit as a whole. The docs say so, and the macro's gated sensors keep their meaning.

The vectors: each set in `test/vectors.json` gets `eff_sensible` and `eff_moisture` rendered from the macro in Home
Assistant (the macro inline in `ha_eval_template`, as when the vectors were made). The test compares only where the
macro gives a value from 0 to 100; the 1 % tolerance absorbs the macro's integer rounding. Added hand-made sets cover
the cap, the gates and an open bypass, with the expected figures worked out in the test.

### The rings: two dashed paths with `pathLength="100"`

Two paths go into the drawing between the exchanger polygons and the streams, so the streams stay on top (the
"background" the user asked for). Both start at the top centre and run clockwise:

- Moisture: along the rim's midline (the midpoints of the outer and inner vertices, from (200, 32)), stroke about
  8 units, so it stays inside the rim.
- Temperature: along the inner outline, from (200, 38), stroke about 3 units, drawn over the existing outline.

Each path has `pathLength="100"` and `stroke-dasharray: <figure> 100`, so the figure in % is the dash length with no
geometry in the code. Under each runs a track: the same path at full length in a faint mix of the ring colour and
the fill. An empty ring is the track alone. The rings are only rendered with `show_effectiveness: true`, and the
moisture ring and its track only on an ERV with humidity for every stream.

Colours: the temperature ring takes the configured warm colour in heating and the cold colour in cooling, as the
badge does. The moisture ring is teal `#00897b`, the colour the installation's charts already use for recovered
moisture, distinct from the default red and blue.

- *Why not a fill level in the core?* The user chose rings (option C, 2026-10-19). A fill would sit under the badge
  and the moisture figure and lower their contrast.
- *Why do the streams cover the rings?* Drawn above the streams, the rings would cut the air paths in four places
  and read as the foreground. The streams cover part of each slanted side. The top and bottom edges stay visible,
  and the numbers are in the tooltip.

*The moisture figure beside the rings (task 3.3).* The seven-glyph figure ("983 g/h") is as wide as the hexagon is
at the height it sits, so at full size its last glyphs meet the rings' slanted sides below 500 px, and moving it up
only helps from 320 px and puts a four-digit figure into the streams at 280 px. While `show_effectiveness` is on
(a `rings` class on the drawing), the figure's font size therefore shrinks on a narrow card:
`clamp(8.25px, 8.25px + (100cqi - 280px) * 0.0261, 14px)`, which is 8.25 px (three quarters of the 11 px minimum)
at 280 px, about 11.4 px at 400 px, and the usual 14 px from 500 px. Without the rings the figure is unchanged, so
existing configs render as in v0.2. The browser test measures every text against both rings at 280 to 600 px in both
themes and requires a strictly positive clearance: at least 1.0 px for the figure and the inner ring at 280 px in the
test font (0.25 px with Arial). The smaller text is below the 11 px label minimum of the diagram's layout
requirement, which needs a spec delta for the rings case.

The tooltip and accessible name are an HTML box over the exchanger: `.on-drawing.effectiveness` with the
exchanger's bounding box (x 145 to 255, y 26 to 174) clipped to the hexagon, `role="img"`, `aria-label` and `title`
from a pure `effectivenessLabel(result, bypass, moisture, locale)` with the texts in `src/strings.ts` (NBSP before
%). `moisture` is the moisture ring's condition (an ERV with humidity for every stream), so an HRV's label names only
the temperature. It comes before the other boxes in the DOM, so the bypass position, the badge and the moisture figure stay on top and
keep their own tooltips and taps.

### The pre-heater coil: SVG for the look, an HTML box for the tap

The coil is a zigzag wire across the outdoor stream, about x 100 to 128 and y 50 to 74, wider than the stream, so
the air visibly passes through it. That is right of the outdoor stack at every width (x 70 at most) and left of the
bypass path's first bend. A pure `preHeaterLevel(state, maxPower)` gives 0 to 1:

- numeric (converted to W): 0 at or below 0 W; with a maximum, `max(power / max, 0.1)` capped at 1; without one, 1;
- `on`: 1, `off`: 0; anything else (unavailable, unknown, text): 0.

The coil's stroke is `color-mix(in srgb, <warm colour> <level>%, var(--secondary-text-color))`, with a blurred copy
behind it at opacity `level` as the glow. At 0 it is the secondary text colour at reduced opacity: visible as a coil
in both themes, clearly off.

- *Why not black for off?* It disappears on a dark theme. The secondary text colour follows the theme.
- *Why the warm colour?* It is the card's own "hot" colour and stands out on the outdoor stream, which is cold
  whenever a pre-heater runs.
- *Why a minimum of 0.1?* A modulating heater at a few percent would otherwise look off.

An HTML box `.on-drawing.pre-heater` over the coil carries `title` and `aria-label` ("Pre-heater: " plus the state
as Home Assistant formats it) and, through `this.tap()`, `data-entity` for `pre_heater.power`. So the tap, the
focus and sample mode work as for every other label.

### Pre-heater in the top row and the status grid

`pre_heater.power` and `pre_heater.energy` join `RolePath` (group `pre_heater`), `ROLE_LABELS` ("pre-heater",
"pre-heater energy") and `ICONS` (`mdi:heating-coil` for both). `pre_heater.energy` joins `STATUS_ROLES` with the
cell column 2, row 3.

The top row's centre cell holds the power label and, after it, the pre-heater label. The label model gives the
pre-heater label only while `preHeaterLevel > 0` and the entity is available. When it is not given, it is not
rendered at all (not kept invisible like other labels), so power stays centred while the pre-heater is off. The cell
is a centred flex box with a gap, so the pair widens around the middle. `pre_heater.power` also counts for showing
the top row ("Rows follow the config").

- *Why not keep it invisible like other labels?* An invisible label would push power off-centre all summer. The
  top row's height does not depend on it, so leaving it out changes no height.

### Options and editor

`DIAGRAM_OPTIONS` gets `showEffectiveness` (boolean, `show_effectiveness`, default false) and `preHeaterMaxPower`
(number, `pre_heater.max_power`, 1 to 100000, no default), so the shared validator reports bad values. The editor gets
a `pre_heater` section after the status section: a power picker for the `sensor`, `binary_sensor` and `switch`
domains (a new field helper, as `sensorField` offers sensors only), an energy picker for sensors and the maximum
power as an advanced number. `show_effectiveness` is a basic switch after the animation section. Both new options
show their defaults through the existing shown-defaults mechanism, so they fall under the new card-bundle
requirement without code of their own.

### Sample values

The sample gets `pre_heater.power` at 0 W and `pre_heater.energy` at 8 kWh (a heating day above freezing, so the
pre-heater is off), because the card-preview spec requires every role of the full layout. With
`show_effectiveness: true` the sample's gradients (19.5 K, about 4.7 g/m³) give both rings.

### Preview page: every new state can be emulated

The preview page gets, next to the existing controls:

- a "pre-heater" fieldset: the role's kind (`none`, `power sensor`, `on/off entity`), a power slider from 0 to
  1500 W, a maximum power field (empty = none) and the energy value. The mock states get a pre-heater power sensor,
  a pre-heater binary sensor and an energy sensor, and the availability control lists them;
- a `show_effectiveness` switch next to the exchanger type;
- two scenario buttons: "frost (pre-heater on)" (outdoor -8 °C, pre-heater at 600 W, heating) and "small gradient"
  (outdoor and extract 2 K and 0.7 g/m³ apart), next to the existing heating, cooling and bypass scenarios.

So every spec scenario that the live unit cannot show (coil glowing, the top row figure, empty rings, rings while
the bypass modulates) can be checked by hand and by the browser tests on the same page.

## Risks / Trade-offs

- [The inner ring touches the bypass position, whose box starts at y 41, 1.5 units below the ring's edge] → the
  browser test that checks the text on the exchanger also measures the bypass position's text against the ring at
  280 to 600 px. If it touches, the bypass position moves down by the measured amount.
  *Measured (task 3.3):* the bypass position's glyphs cleared the inner ring by only 0.14 px at 280 px in the test
  font, so it moved from `top: 20.5%` to `21.5%` (always, with or without rings). It now clears every ring by at
  least 0.56 px (0.29 px with Arial, whose digits are as wide as Roboto's). The same test found that the moisture
  figure met the inner ring's slanted side by up to 1 px at 280 to 400 px, which the figure is smaller for (see
  "The rings").
- [The streams hide the end of a ring on a slanted side, so 40 % and 45 % can look alike] → the numbers are in the
  tooltip, and the rings read as a rough gauge. Accepted by the user's choice of rings on the outlines.
- [The coil collides with the outdoor stack at some width or font] → a browser test measures the coil's box
  against the outdoor labels, the flow labels and the bypass position at 280 to 600 px, as for the moisture figure.
- [The top row overflows at 280 px while the pre-heater is on] → a browser test at 280 px with 1032 W, 1000 W and
  RMOT -3.5 °C. The labels already end in an ellipsis rather than overlap.
- [The ring readings differ from the installation's gated effectiveness sensors while the bypass is open] → the
  docs explain it. The sensors keep their bypass gate for the charts.
- [The live installation cannot show the pre-heater on] → the preview page emulates it, and the live check covers
  the off state, the energy cell and the rings.

## Migration Plan

1. Release: `npm run release`, version `0.3.0` in `package.json`, commit `dist/`.
2. Deploy `dist/` with the workspace's deploy script and bump the Lovelace resource `?v=` (number in
   `private/installation.md`). Existing configs render as in v0.2.
3. On both dashboards' diagram cards, add `show_effectiveness: true`, and `pre_heater.power` and
   `pre_heater.energy` pointing at the unit's pre-heater power and energy sensors (IDs in `private/installation.md`).
   Use `python_transform` with the latest `config_hash`, locating the cards by type.
4. Check with Playwright (service workers blocked): both rings with figures matching the installation's
   effectiveness sensors while the bypass is closed, the dim coil and its tooltip, the tap on the coil, the energy
   cell, no pre-heater figure in the top row.
5. Push `main` and the tag `v0.3.0` to `peeter123/hrv-ventilation-card`, with the user's confirmation. The user
   publishes the release in the GitHub UI.

Rollback: point the resource back at the v0.2.0 bundle (`git show v0.2.0:dist/hrv-ventilation-card.js`, deployed
under a new `?v=`). v0.2.0 ignores the new keys, so the dashboards need no change to roll back.

## Open Questions

- Which energy sensor the live card shows (this year, since start, or a new daily `utility_meter` helper): an
  installation choice at migration time.
- The live pre-heater's rated power for `pre_heater.max_power`, from the unit's documentation. Without it the coil
  glows fully at any power, which is also correct.
