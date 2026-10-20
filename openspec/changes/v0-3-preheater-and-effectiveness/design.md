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
- Existing configs render as in v0.2, apart from the moisture figure and the flow labels, which move for every config
  (see "Moisture figure and flow labels"): rings off by default, no coil without the role.
- Every new state can be shown on the preview page, because the live pre-heater stays off.

**Non-Goals:**

- No change to the recovered and lost power, the moisture rates or the smoothing.
- No animation of the coil or the rings.

## Decisions

### Effectiveness is part of the recovery result

`RecoveryResult` gets `effectiveness: { total?: number; moisture?: number }`, computed in `calculateRecovery` from the
same inputs (raw temperatures, smoothed absolute humidity), capped to 0-100, and left out below its gradient or, for
moisture, while latent figures are unknown. There is no bypass gate.

- *Total:* the recovered total divided by the recovered and lost total, per m³ and before any rounding: the recovery
  balance card's recovered percentage, in every mode. Heating gives (h_sup - h_out) / (h_ext - h_out), cooling against
  the outdoor air the same ratio, and free cooling (h_ext - h_sup) / (h_ext - h_out), the share of the cooling
  delivered, as the card's header says then. Without humidity the enthalpies are sensible only, so it is the
  temperature ratio. The gate is the enthalpy difference of extract and outdoor air: at least air density × 1006 × 3
  J/m³, the 3 K of dry air the temperature figure had, so a humid summer day with 1 K between the temperatures still
  gets a figure.
- *Moisture:* (AH_sup - AH_out) / (AH_ext - AH_out), gated at 1.5 g/m³, unchanged.

- *Why the total and not the temperature ratio?* The user decided (2026-10-20, after group 3) that the ring must
  match the recovery card's percentage and follow the physics: the latent heat of extracted moisture that is not
  returned is lost, so an HRV or a poor ERV scores lower than its temperature ratio. This holds for every exchanger
  type, as the recovery card counts latent heat whenever humidity is configured. Example: 0/17/21 °C with 4.0/6.5/7.5
  g/m³ gives 78 % (temperature ratio 81 %); with the supply at the outdoor humidity, as for an HRV, 60 %.
- *Why in the result and not a separate function?* The rings need the badge's inputs (less the humidities), at the
  same moment. One calculation per render keeps the badge, the moisture figure and the rings consistent. A missing
  input then empties both rings, which the spec states.
- *Why no bypass gate, unlike the macro?* The user chose (2026-10-19) to show the figure while the bypass modulates.
  It then describes the unit as a whole. The docs say so, and the macro's gated sensors keep their meaning.

The vectors: `test/vectors.json` has `eff_sensible` and `eff_moisture` per set, rendered from the macro in Home
Assistant on 2026-10-20 (task 2.2). The total figure is compared with the macro's own power figures, recovered total
/ (recovered total + lost total) of the `expected` block, capped to 0-100, on every set above the gate; `eff_moisture`
stays the reference for the moisture figure, compared where the macro gives 0 to 100. `eff_sensible` is no longer
compared and leaves the file and its description. A test also checks that the figure equals the recovery card's
header percentage on every set, so the two cards cannot drift apart.

### The rings: part of the exchanger

The rings are drawn as the exchanger's own parts, between its fill and its outlines, so they line up with it exactly.
The first version ran an 8-unit stroke on the rim's midline, which left the rim's edges uncovered, because the inner
hexagon is not a parallel offset of the outer one: the rim is 12 units wide at the top and bottom and 9.7 to 13.2
units on the slanted sides. The drawing order is: the exchanger's fill, the moisture ring, the outlines (outer and
inner), the total ring's track and the total ring, then the streams, which stay on top (the "background" the user
asked for). Both rings start at the top centre and run clockwise:

- Moisture: a path along the rim's midline (from (200, 32)) with a stroke of 14 units, wider than the rim anywhere,
  clipped to the rim: a `clipPath` of the outer and the inner hexagon with `clip-rule: evenodd`. Its ID is per card
  instance, next to the gradient IDs in `DrawingIds`. So a full ring fills the rim from outline to outline and never
  spills over, and the outlines drawn after it give it crisp edges. Its track is the empty rim itself, in the ERV fill.
- Total: along the inner outline, from (200, 38), stroke about 3 units, over a faint full-length track (the same path
  in a 25 % mix of the ring colour with the secondary background), drawn over the inner outline.

Each path has `pathLength="100"` and `stroke-dasharray: <figure> 100`, so the figure in % is the dash length with no
geometry in the code. The rings are only rendered with `show_effectiveness: true` and the inputs of the sensible
calculation (the badge's without the humidities; without them a ring could never fill), and the moisture ring only on
an ERV with humidity for every stream. On an HRV the rim stays as it is.

Colours:

- Moisture: `--erv-ring`, defined next to `--erv-fill`: the secondary background mixed with 44 % of a darker blue
  (`#3d78ae`; the exchanger uses 25 % of `#4f86b8`). On a light theme that is a clearly darker blue-grey than the
  exchanger, as the user asked (not the teal of the moisture bar card). On a dark theme it still reads lighter than
  the fill. User decision 2026-10-20 (task 4.7): darker in the light theme, because the filled rim measured only
  1.31:1 against the empty rim; it now measures about 1.53:1 in light and 1.36:1 in dark. The browser test requires
  1.5:1 in light and 1.3:1 in dark. The ring cannot get much darker because the total ring must keep 3:1 against it.
- Total: the mode's colour (the warm colour in heating, the cold colour in cooling, as the badge) mixed with
  `--primary-text-color`: darker on a light theme, lighter on a dark one. The mode colour's share is
  `TOTAL_RING_SHARE`, 45 %: the largest share that still keeps 3:1 (the WCAG contrast for graphics) against both the
  core fill and the moisture ring, for the default warm and cold colours, on the HRV and the ERV fill, in the light and
  the dark preview theme. The browser test measures those contrasts. A larger share (it was 50 % before the moisture
  ring got darker) would fall under 3:1 against the darker moisture ring. The unmixed cold colour on the ERV fill was
  about 1.9:1, which the user found too weak.

- *Why not a fill level in the core?* The user chose rings (option C, 2026-10-19). A fill would sit under the badge
  and lower its contrast.
- *Why do the streams cover the rings?* Drawn above the streams, the rings would cut the air paths in four places
  and read as the foreground. The streams cover part of each slanted side. The top and bottom edges stay visible,
  and the numbers are in the tooltip.

The tooltip and accessible name are an HTML box over the exchanger: `.on-drawing.effectiveness` with the
exchanger's bounding box (x 145 to 255, y 26 to 174) clipped to the hexagon, `role="img"`, `aria-label` and `title`
from a pure `effectivenessLabel(result, bypass, moisture, locale)` with the texts in `src/strings.ts` (NBSP before %
and the units). The total figure is named by the mode ("heat", "cooling", "free cooling") and followed by its
absolute values as magnitudes, the recovered total and the potential in W (sensible plus latent, the recovery card's
header figures); the moisture figure by the recovered and the extracted moisture in g/h (`result.moisture`), so a
humid day's "kept out" reads as positive numbers, as the figure does. The recovered value gets a minus sign (U+2212)
when it works against the potential, which is where the ratio is clamped to 0 % (user's decision, 2026-10-20), e.g.
"free cooling 0 % (−120 / 1,000 W)", "moisture 0 % (−100 / 800 g/h)"; an overshoot (clamped to 100 %) stays magnitudes.
Neither figure is given at a potential of 0 (a supply flow of 0, or a potential or extracted moisture that rounds to
0), so a unit in standby shows empty rings and "not measurable". Example: "Effectiveness: heat 92 % (1,200 /
1,304 W), moisture 65 % (390 / 600 g/h)". `moisture` is the moisture ring's condition (an ERV with humidity for every
stream), so an HRV's label names only the total. The box comes before the other boxes in the DOM, so the bypass
position and the badge stay on top and keep their own tooltips and taps.

### Moisture figure and flow labels

The moisture figure leaves the exchanger (user's decision, 2026-10-20): in the exchanger it met the rings' slanted
sides on narrow cards and needed a halo of text shadows, which the user found ugly. It now sits right of the
exchanger, centred at y 100, the height of the exchanger's centre and the house symbol's, horizontally centred
between the exchanger's right vertex (x 255) and the house symbol's circle (x 344). The streams leave a wedge there,
from the exhaust stream (bottom edge about y 76 at x 275) to the supply stream (top edge about y 126).

- It shows the rate's magnitude after an icon, `mdi:water-sync` while moisture is recovered (0 or more) and
  `mdi:water-remove` while it is kept out, so it needs no minus sign. The icon is drawn like the top row's icons, as
  high as the text and centred on it. The tooltip keeps its words ("Moisture recovered: 120 g/h", "Moisture kept out:
  418 g/h") and the tap keeps opening `status.moisture_recovery`.
- Icon choice (user's decision, 2026-10-20): the first draft used a water drop with a plus and a minus, which is not
  clear on a figure that shows no sign. `mdi:water-sync` (moisture is exchanged back into the house) and
  `mdi:water-remove` (moisture is kept out) say what happens.
- At 280 px the gap is about 55 px; a four-digit figure with its icon needs about 65 px at the 11 px minimum. Where it
  does not fit, the unit goes to a second line under the number (the wedge is about 31 px high at 280 px, room for
  two 11 px lines). The browser test measures it at 280 to 600 px in both layouts with three and four digits.
- The halo goes (`HALO_SHADOW`, its padding and margin, and the `rings` class if nothing else needs it).

The supply flow label sat in that wedge (above the supply arrow's tip), so both flow labels move below their
arrowheads (y 152 and lower), the exhaust flow for symmetry. On the right, the bypass path rises through about
(285, 150) to the arrow at (306, 138), and the supply corner labels start at about y 155 from x 340, so the label is
right-aligned under the head, between the bypass path and the corner labels. The left side has more room: the bypass
path is right of x 144 there.

This changes every ERV config's drawing and every config's flow labels, so v0.3 does not render existing configs
exactly as v0.2 did. The user accepted that with the move.

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
(number, `pre_heater.max_power`, 1 to 4000, no default), so the shared validator reports bad values. The editor gets
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
  (outdoor and extract 2 K and 0.3 g/m³ apart, below both gates; the 0.7 g/m³ of task 3.4 is above the total
  figure's enthalpy gate), next to the existing heating, cooling and bypass scenarios.

So every spec scenario that the live unit cannot show (coil glowing, the top row figure, empty rings, rings while
the bypass modulates) can be checked by hand and by the browser tests on the same page.

## Risks / Trade-offs

- [The inner ring touches the bypass position, whose box starts at y 41, 1.5 units below the ring's edge] → the
  browser test that checks the text on the exchanger also measures the bypass position's text against the ring at
  280 to 600 px. If it touches, the bypass position moves down by the measured amount.
  *Measured (task 3.3):* the bypass position's glyphs cleared the inner ring by only 0.14 px at 280 px in the test
  font, so it moved from `top: 20.5%` to `21.5%` (always, with or without rings). It now clears every ring by at
  least 0.56 px (0.29 px with Arial, whose digits are as wide as Roboto's). The same test found that the moisture
  figure meets the inner ring's slanted side by up to 1 px at 280 to 400 px; group 3 covered that with a halo, and
  group 4 moves the figure out of the exchanger instead (see "Moisture figure and flow labels").
- [A four-digit moisture figure does not fit between the exchanger and the house symbol at 280 px] → its unit goes
  to a second line; the browser test measures both forms at 280 to 600 px in both layouts.
- [A flow label below its arrowhead meets the bypass path or the bottom corner labels on a narrow card] → the browser
  test measures both flow labels against the arrowheads, the bypass path at 100 % and the corner labels at 280 to
  600 px. If the right one collides, the measurements and options go to the user in the feedback round (task 4.7)
  rather than a silent workaround.
- [The streams hide the end of a ring on a slanted side, so 40 % and 45 % can look alike] → the numbers are in the
  tooltip, and the rings read as a rough gauge. Accepted by the user's choice of rings on the outlines.
- [The coil collides with the outdoor stack at some width or font] → a browser test measures the coil's box
  against the outdoor labels, the flow labels and the bypass position at 280 to 600 px, as for the moisture figure.
- [The top row overflows at 280 px while the pre-heater is on] → a browser test at 280 px with 1032 W, 1000 W and
  RMOT -3.5 °C. The labels already end in an ellipsis rather than overlap.
- [The ring readings differ from the installation's gated effectiveness sensors] → the inner ring is the total
  figure, so it differs from the sensible effectiveness sensor whenever humidity counts, and both rings differ while
  the bypass is open. The docs explain it; the inner ring matches the recovery card instead. The sensors keep their
  bypass gate for the charts.
- [The live installation cannot show the pre-heater on] → the preview page emulates it, and the live check covers
  the off state, the energy cell and the rings.

## Migration Plan

1. Release: `npm run release`, version `0.3.0` in `package.json`, commit `dist/`.
2. Deploy `dist/` with the workspace's deploy script and bump the Lovelace resource `?v=` (number in
   `private/installation.md`). Existing configs render as in v0.2, apart from the moved moisture figure and flow
   labels.
3. On both dashboards' diagram cards, add `show_effectiveness: true`, and `pre_heater.power` and
   `pre_heater.energy` pointing at the unit's pre-heater power and energy sensors (IDs in `private/installation.md`).
   Use `python_transform` with the latest `config_hash`, locating the cards by type.
4. Check with Playwright (service workers blocked): the inner ring matching the recovery balance card's percentage
   and the outer ring the installation's moisture effectiveness sensor while the bypass is closed, the dim coil and its tooltip, the tap on the coil, the energy
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
