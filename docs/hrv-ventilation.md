# How the HRV ventilation cards calculate

Background for whoever maintains these cards, human or agent: why the cards calculate their own figures, the
formulas, how to read the moisture figures, how accurate they are, and the points that matter when changing a card.
What each card shows and every option are in [`README.md`](../README.md).

The cards were built for a Zehnder ComfoAir Q450 with an enthalpy exchanger (so strictly an ERV), connected through
ESPHome. The measured examples below come from that unit.

## Why the cards calculate themselves

- **The unit's own "avoided heating/cooling" sensors are misleading while the bypass modulates.** Example,
  2026-09-27 10:40: bypass 63 %, outdoor 17.5 °C, extract 22.6 °C, supply 21.0 °C. The unit reported 0.0 kW avoided
  cooling and 0.34 kW avoided heating, while free cooling was actually being delivered. The cards therefore compute
  everything from the measured air states.
- **No helpers.** The first version of these cards read about twenty derived sensors (template helpers on a Jinja
  macro, plus humidity filter helpers) that only existed on the author's installation. Nobody else could use the
  cards without recreating them by hand. The cards now take the unit's raw sensors from their config and run the
  formulas themselves (`src/calc/`).
- **One source of truth for the formulas.** `src/calc/recovery.ts` is a TypeScript port of the author's template
  macro, checked against golden vectors rendered from that macro in Home Assistant (`test/vectors.json`). A formula
  change has to keep those vectors passing, or regenerate them from a corrected macro. A custom integration that
  creates the same figures as sensors, for history and energy statistics, is planned (`README.md`, "Roadmap").

## Formulas

- **Inputs:** outdoor, supply and extract temperature, the same three streams' absolute humidity (smoothed, see
  below), the supply flow and the bypass position.
- **Enthalpy** per m³: `h [J/m³] = ρ · 1006 · T + AH · (2501 + 1.86 · T)`, with `T` in °C, `AH` in g/m³ and the air
  density `ρ` (option `air_density`, 1.2 kg/m³ by default). Latent heat comes in through the absolute humidity
  (AH g/m³ × 2501 J/g). Power: `P [W] = flow [m³/h] / 3600 · Δh`.
- **Mode:** cooling while the bypass is open or the outdoor air has a higher enthalpy than the extract air,
  otherwise heating. The unit's own heating and cooling season flags are not used: both are off between seasons.
- **Reference state:** heating = outdoor air; cooling = extract or outdoor air, whichever has the higher enthalpy.
  Recovered: heating `h_sup - h_ref`, cooling `h_ref - h_sup`. Using the measured supply enthalpy is what makes this
  correct for a modulating bypass.
- **Free cooling:** the bypass is open and the extract air has the higher enthalpy. The same figures are then the
  cooling the supply air brings compared with the indoor air, of what fully outdoor air would bring.
- **Split:** `latent = 2501 · ΔAH` (same sign convention as the total), `sensible = total - latent` (this includes
  the small vapour term `1.86 · T · AH`). So sensible + latent = total exactly.
- **Parts are signed**, and can have opposite signs. 2026-09-30 12:00 (bypass closed, outdoor 26.3 °C / 11.4 g/m³,
  room 25.2 °C / 12.1 g/m³) was heating mode by enthalpy, with sensible -58 W (the supply was cooled) and latent
  +52 W (moisture added), net about 0. That is why the bars are diverging, not a donut.
- **Lost:** the exchanger is not 100 % effective, so part of the potential is still lost with the ventilation air.
  Potential = the load with no recovery (supply = outdoor air) = |h_ext - h_out|, and potential = recovered + lost
  by construction. Lost: heating `h_ext - h_sup` (the supply is still colder or drier than the room); cooling with
  the extract air as reference (free cooling, outdoor cooler than the room) `h_sup - h_out`; cooling with the
  outdoor air as reference (hot outdoor) `h_sup - h_ext`. Split into latent and sensible the same way.
  Checks: winter heating 1.657 kW recovered + 0.468 kW lost = 2.125 kW load (78 % recovered); free cooling in full
  bypass 0.232 + 0.125 = 0.357 kW (65 %). Live, 2026-10-11 (bypass 67 %, outdoor 15.7 °C, indoor 24.0 °C):
  0.335 + 0.499 = 0.834 kW against 0.835 kW from the raw inputs.
  - Reading "lost" in **free cooling** (the card says "Missed"): the unit modulates the bypass to steer the supply
    temperature towards its comfort target, so much of the missed free cooling is deliberately not taken, because
    the house does not need more cooling. It means "cooling available but not used", not exchanger inefficiency.
    In **heating** with the bypass closed, "lost" is the real exchanger shortfall, and "N % recovered" approximates
    the total (enthalpy) effectiveness.
- **Effectiveness** (supply side, the usual datasheet definition; part of the recovery result, for the airflow card's
  effectiveness rings and the planned integration): temperature `(T_sup - T_out) / (T_ext - T_out)`, moisture
  `(AH_sup - AH_out) / (AH_ext - AH_out)`, in %. The temperature figure uses the raw temperatures, the moisture
  figure the smoothed absolute humidity, and the moisture figure needs humidity for all three streams.
  - **Cap:** the figure is limited to 0-100 %. A sensor offset or fan heat (about +0.5 to 1 K on the supply side,
    which inflates the sensible figure) can push the raw ratio past 100 %, and a supply colder than the outdoor air
    (or drier, for moisture) past 0 %; neither is a real effectiveness.
  - **Gate:** a figure is left out while `|T_ext - T_out| < 3 K` (resp. `|AH_ext - AH_out| < 1.5 g/m³`), in either
    direction, because with a small gradient the ratio is noise (on 2026-09-30 the moisture gradient went from 0.72
    to 0.03 g/m³ within an hour). The two figures are gated separately.
  - **No bypass gate:** the figure is calculated at any bypass position. With the bypass closed it describes the
    exchanger. While the bypass modulates, the supply air is a mix of exchanger air and bypassed outdoor air, so the
    figure falls with the bypass and describes the unit as a whole, not the exchanger. Read it together with the
    bypass position.
  - **Difference from gated sensors:** an effectiveness sensor built on the same ratio in a template helper (as on
    the author's installation) is uncapped, rounded to an integer, and unknown unless the bypass is fully
    closed and the gradient passes the gate. It keeps the exchanger meaning for charts. The calculated figure can
    therefore differ from it: it shows a value while the bypass is open, where the sensor has none, and it stays
    within 0-100 %, where the sensor can leave it. Where the sensor is within 0-100 % they agree within its
    rounding (the golden vectors compare them).

## Moisture

All rates in g/h, signed, relative to the outdoor air: **extracted = recovered + put outside**.

| Figure | Formula | Meaning |
|---|---|---|
| Extracted | flow · (AH_ext - AH_out) | Moisture the extract air carries above the outdoor level: what a plain HRV would remove. |
| Recovered | flow · (AH_sup - AH_out) | Moisture the exchanger hands back to the supply air: the saving compared with an HRV. |
| Put outside | flow · (AH_ext - AH_sup) | Net moisture the ventilation takes out of the house. |

- Recovered / extracted is the moisture effectiveness. An open bypass lowers recovered on purpose.
- **Negative values are normal.** When the outdoor air is more humid than the indoor air, every sign flips: the
  house gains moisture, "recovered" is moisture the exchanger keeps out, and "put outside" is moisture that still
  enters (the moisture card then says "Kept Out" and "Enters"). Example 2026-10-06 13:00-14:00, hourly means
  (outdoor 13.10, supply 12.54, indoor 12.01 g/m³): extracted -248, put outside -122, recovered -126 g/h, so the ERV
  halved the moisture gain. 460 g/h is about 11 L/day.
- With the bypass at 100 % the unit still recovered a steady 15-20 % of the indoor-outdoor moisture difference
  (2026-10-05 00:00-06:00: 110-130 g/h), constant across gradients from 1 to 3 g/m³. It looks like real partial
  flow through the core (the bypass probably does not divert all air), not a sensor offset. Not confirmed with the
  manufacturer.
- Use the words above consistently. Before they were settled, the same sensors were called "HRV equivalent",
  "loss", "returned" and "escaping" in different places, which made the figures unreadable.

## Accuracy and smoothing

- Many units report relative humidity in whole percent, so absolute humidity moves in steps of about 0.2 g/m³:
  about 50 g/h of moisture and 30 W of latent power per step at 230 m³/h. The cards therefore average absolute
  humidity over `smoothing` minutes (10 by default), time-weighted like Home Assistant's
  `time_simple_moving_average` filter, because a sample-counting low-pass misbehaves on sensors that only report
  on change. The window is seeded from the recorder history when the card loads. One smoothed series per source
  entity is shared by all cards on a page, so its history is requested once (`src/calc/smoothing.ts`).
- A filter helper with the same settings only recomputes when its source reports, so after a quiet period it still
  holds older values. Compared with such helpers, the cards are the more accurate: on 2026-10-15 a helper fed by an
  extract sensor that had not changed for 10 minutes read 11.398 g/m³ against a true average of 11.334 g/m³, which
  put the helper-based moisture figures 10-17 g/h off; with that average corrected the card was within 4 g/h.
- Each RH sensor is about ±2-3 % RH, i.e. ±0.4-0.6 g/m³ at room conditions, and 0.1 g/m³ is about 23 g/h.
  Differences under about 1 g/m³ between two different sensors are dominated by sensor offset (on 2026-10-04 in full
  bypass the exhaust read 0.49 g/m³ drier than the extract, which is physically impossible). Smoothing removes the
  jumping, not these offsets. That is why the moisture card has a neutral band (`neutral_threshold`, 0.3 g/m³ by
  default): within it the card says "within sensor accuracy" instead of a percentage. In winter the indoor-outdoor
  difference is 3-6 g/m³ and the figures become meaningful.

## Cards: points that matter when changing them

- **Calculation in the card.** The recovery bar, the moisture bar and the diagram's badge use the same calculation,
  so they agree with each other. A stream may give relative humidity instead of absolute humidity; it is converted
  with the stream's temperature.
- **Free cooling** (recovery bar): the title reads "Free Cooling", the header "Cooling X W of Y W" and the lost parts
  "Missed". Otherwise "Heat Recovery" or "Cooling Recovery" with "Recovered" and "Lost".
- **Bars.** The recovery bar has one lane per kind: temperature, and moisture when every stream has a humidity.
  Each lane has its solid recovered part and its hatched lost part, positive to the right of the centre line and
  negative to the left, both lanes on the scale of the fuller one. The two lanes are equally high, 13 px each in a
  29 px bar, with the 1 px line between them as a row of its own. A border on the second lane sits outside the flex
  basis (lanes of 12.5 and 13.5 px), and a line laid over the middle of a 28 px bar covers a pixel row of one lane
  (25 rows cannot split evenly), so the browser test counts the painted rows of each lane. The recovery legend shows the lanes and the scale only; the
  moisture rate in g/h belongs to the moisture bar. The moisture bar is one lane, solid recovered (or kept out) and
  hatched put outside (or entering), with the neutral band and a yellow strip for the bypass position. Its title is
  always "Moisture Recovery"; the direction ("House drying", "House gaining (outdoor more humid)", "Indoor ≈
  outdoor") is a muted subtitle under it, absent without a value. Scale = max(`min_scale`, sum of magnitudes rounded
  up to 250).
- **Diagram.** The drawing is SVG generated by the card (`src/diagram/`), so it follows the theme and the card width.
  The bypass path is drawn with a strength equal to the bypass position, and the moving dashes split between the
  exchanger and bypass paths in the same proportion. Each stream end is coloured by its temperature.
- **Effectiveness rings (`show_effectiveness`, off by default).** Two dashed SVG paths drawn between the exchanger
  polygons and the streams, so the streams cover them (drawn above the streams, the rings would cut the air paths in
  four places and read as the foreground; a fill level in the core would sit under the badge and the moisture figure
  and lower their contrast). The paths are in the exchanger's 400 by 200 coordinates (`MOISTURE_RING`,
  `TEMPERATURE_RING` in `src/diagram/drawing.ts`) and start at the top centre, running clockwise.
  - **Geometry:** the moisture ring (8 units wide) runs on the midline of the exchanger's rim, the midpoints of the
    outer and inner vertices, so it stays inside the rim. The temperature ring (3 units) runs on the inner outline,
    over its 1.5 unit line. Each path has `pathLength="100"` and `stroke-dasharray: <figure> 100`, so the dash length
    is the figure in %, with no geometry in the code. Under each runs a track: the same path at full length, in a mix
    of 25 % of the ring colour with `--secondary-background-color`. An empty ring is the track alone.
  - **When drawn:** only with the option. The moisture ring and its track only on an ERV with a humidity for every
    stream (`moistureRing`); an HRV, or an ERV without humidity, has the temperature ring alone. A ring is empty
    below its gate or while the calculation has no result (see Effectiveness under Formulas). No bypass gate.
  - **Colours:** the temperature ring is the cold colour while the calculation's mode is cooling and the warm colour
    otherwise, also when there is no result; unlike the badge it never turns grey at a low saving. The moisture ring is the fixed teal `#00897b`, the colour the author's charts use for recovered
    moisture, distinct from the default red and blue. Both are set inline on the elements, and the track is mixed
    from them.
  - **Tooltip box.** `.on-drawing.effectiveness` is an HTML box over the exchanger (x 145 to 255, y 26 to 174),
    clipped to the hexagon, `role="img"`, with `title` and `aria-label` from `effectivenessLabel` in
    `src/diagram/badge.ts` (texts in `src/strings.ts`): whole percents, "not measurable" for a ring without a
    value, the bypass position while above 0 %, and the moisture figure only where the moisture ring is drawn. It is
    not tappable. It is first in the DOM, so the bypass position, the badge and the moisture figure stay on top of it
    with their own tooltips and taps.
  - **Position of the other texts.** The bypass position is at `top: 21.5%` (it was 20.5%) to clear the inner ring.
    The moisture figure keeps its size (11 px at least) and, while the rings are on (a `rings` class on the drawing),
    gets a halo: `-webkit-text-stroke: 9px var(--erv-fill)` with `paint-order: stroke fill`, so 4.5 px of the stroke
    shows around the glyphs, in the exchanger's fill (`--erv-fill`, the ERV fill, defined on `.drawing` and used by the
    exchanger polygon too). It masks a ring where it meets the digits on a narrow card: a four-digit rate meets the
    rings up to 3.9 px deep, a three-digit one 2.1 px (the largest overlaps measured at 280 to 600 px, with Arial, whose
    digits are as wide as Roboto's; the test font gives 3.7 and 1 px). It sits inside `@supports (paint-order:
    stroke fill) and (-webkit-text-stroke: 1px red)`: where `paint-order` does not apply to HTML text the stroke
    would be painted over the glyphs, so the figure then has no halo. The value's padding, undone by an equal
    negative margin, keeps its overflow clip (for the ellipsis) from cutting the halo of the first and last glyph.
    The halo may notch a stream's edge by up to 1.5 px on a 280 px card with a four-digit figure. Without the rings
    nothing changes.
  - **Browser tests** (`test/cards/ventilation-card.browser.test.ts`, "effectiveness rings"): at 280 to 600 px in
    both preview themes, with both rings drawn, the badge and the bypass position must clear every ring strictly; the
    bypass position and the moisture figure keep 4.5:1 against the exchanger fill and the badge against its own fill;
    the halo must be at least as wide as the overlap measured between the rings and the
    glyph boxes of the three and the four-digit figure (plus 0.5 px), and notch no stream by more than 1.5 px;
    without the rings the figure has no halo; the compact layout draws the rings and tracks at 320 px. A change to
    the ring geometry, the figure's position or font size has to keep them passing.
- **Exchanger type.** `exchanger_type` only changes the drawing, not the calculation or the bar cards (an HRV with
  humidity sensors still gets latent figures). HRV fills the exchanger with the theme's secondary background, ERV
  with `--erv-fill`, `color-mix(in srgb, var(--secondary-background-color) 75%, #4f86b8)`: a blue-grey that stays
  light in light themes and dark in dark ones. The browser test checks the text on it at 4.5:1 or more in both
  preview themes.
- **Moisture figure (ERV).** At `bottom: 24%` (bottom edge at y 152 of 200), under the crossing streams, in both
  layouts. It shows the calculation's recovered moisture rate with its sign, negative while moisture is kept out;
  the tooltip names the direction with the magnitude. It has no icon: at 11 px text below 400 px card width a
  four-digit rate with an icon reached the exchanger's slanted outline, so the text sits a little higher than the
  bypass position's mirror image instead, and a test checks a four-digit kept-out rate between the slanted sides
  and clear of the streams at 280 to 600 px (measured: from 26 % it touches the streams). Without a role entity it
  is `role="img"`, so its label is read out. It needs the badge's inputs and follows the badge when one has no
  value. It sits on the same calculation result as the badge, computed once per render.
- **Top row and status grid.** The season icon (left), power (centre) and RMOT (right) sit above the drawing; the
  fan level, bypass mode, operating mode, temperature profile, target temperature, next changes and filter days sit
  in a three-column grid below it, each cell fixed so nothing moves when a value changes, each value centred in its
  column. Every label has an icon and a tooltip and opens the more-info dialog of its sensor. A label is an inline
  flex box, so its icon is centred on the text whatever the font (`vertical-align` left Home Assistant's icon 2 px
  low, and `middle` centres on the x-height); the ellipsis of a value too long for its cell is on the `.value` span,
  because a flex box applies no `text-overflow` to its children. The top row's cells are flex boxes centring their
  content: a label's baseline (its icon's bottom edge) would otherwise leave power and RMOT 2 px above the season
  icon. The preview's `ha-icon` stub has Home Assistant's structure (an inline host around an inline-flex icon box
  aligned to the middle), and the browser test measures the svg each icon draws, not its host, so it catches an
  offset of the drawn icon.
- **Seasons.** With both season sensors configured and both off, the top row shows the "between seasons" icon.
- **Layout.** `layout: auto` switches to compact below 340 px card width. A narrow desktop sections column is about
  350 px and a full-width card on a 360 px phone about 344 px, so both show the full layout.
- **Unavailable values, per card.** Diagram: a label whose sensor has no value is hidden, or shows Home Assistant's
  text with `show_unavailable: true`; the badge is hidden (or "n/a") while one of its inputs has no value; the next
  changes show a dimmed dash while nothing is planned. Recovery bar: "n/a" when any input it reads has no value or a
  unit it does not know. Moisture bar: the whole card shows "n/a", because the neutral band and the bypass strip
  decide how the figures may be read.
- **Badge.** The diagram's badge shows the recovery bar's total in W, tinted warm in heating and cold in cooling
  above 0.5 W, otherwise grey.
- **What the badge and the figure open.** The badge opens the saving entity that reads the higher power
  (`status.heating_saving` or `status.cooling_saving`, both converted to W, so kW and W compare). The saving sensors
  decide heating or cooling on their own inputs, while the card's mode follows its smoothed inputs; near the switch
  point they disagree for minutes, and the mode alone would open a sensor reading 0. With one role configured, a
  state that is not a number, or equal readings, the badge opens the role of the calculation's current mode instead.
  When that role is not configured, or the badge shows no calculated saving (hidden or "n/a"), it opens nothing. The
  choice is `savingTarget` in `src/diagram/badge.ts`. The moisture figure opens `status.moisture_recovery`. All three
  roles are optional and never a label or a grid cell; what cannot open anything gets no `role="button"`, `tabindex`
  or `data-entity`, so it is not focusable and a tap opens nothing. The badge used to open the supply air
  temperature: a dialog unrelated to the figure tapped, which is why there is no fallback. The pointer cursor follows
  `data-entity`, so only what opens a dialog shows it.
- **Editor and shown defaults.** The visual editor (`src/editor/`) shows every option the config leaves unset at its
  default, because `ha-form` draws no `default` of a selector for missing data, and writes none of them. The default
  of a field is the `default` in its schema entry (`src/editor/*-schema.ts`); a new option with a fallback in the
  card must declare it there too. Without it the field shows blank, and `differsFromDefault` treats any non-empty
  value as non-default: a YAML value equal to the card's fallback turns the advanced switch on, and
  `withoutShownDefaults` never strips it (an entity picker has no default, which is fine). `withShownDefaults` fills
  the defaults into the config only for `ha-form`'s data, over the fields currently visible, so an advanced default
  appears once the switch is on. `withoutShownDefaults` runs on every `value-changed`: it takes out a value that
  equals the default of a field the saved config did not set, which is why typing the default into an unset field
  leaves it unset. It compares numbers as numbers and text without case, and a section that was in the config stays,
  also when its last field is removed (`withValueAt` removes only parents it created). A default the config sets is
  never touched. To pin a default, the user sets it in YAML.
  Clearing a field: `ha-form` reports it as `{ name: undefined }` (not as a removed key). The editor drops undefined
  values from the config and its nested sections (not from arrays) before it fires `config-changed`
  (`withoutUndefined`, so an emptied section saves as `{}`), and remembers the cleared paths (`clearedPaths`,
  `_emptied`): a cleared field is not refilled with its default, because the box would show 10 again and typing 5
  would give 105. It stays empty until the config is set from outside with a different value (`setConfig`, e.g. the
  code editor) or the advanced switch changes, so a field that is hidden and shown again shows its default;
  `setConfig` with the config the editor just fired does not count. Do not change the config anywhere else than at
  the edited field, and keep the editor's tests for these cases (`test/editor/`) passing.
- **Sample mode.** A card whose config sets no entity role at all (only `type`, optionally options) renders the
  built-in sample values of `src/lib/sample.ts`: a heating day (outdoor 2 °C, supply 18.5 °C, extract 21.5 °C,
  exhaust 5.5 °C, 200 m³/h, bypass closed, house drying) on made-up IDs in the non-HA domain `hrv_sample.*`, so
  nothing collides with a real entity. A muted "Sample values" note sits at the bottom right, so the sample is not
  mistaken for live data. Options still apply (`exchanger_type: erv` draws the ERV with the moisture figure) and
  invalid options still give a configuration error. Nothing in a sample card opens a more-info dialog, and no
  history is requested (smoothing is off). As soon as any role has a value, valid or not, the card uses only the
  configured entities with the usual required-role checks, so picking one entity in the editor shows the
  missing-entities error until the required ones are set; the sample is never mixed with real values. The cards are
  in the card picker with `preview: true`, and `getStubConfig()` returns `{}`, so a card added from the picker opens
  in sample mode with an empty editor. The preview page has a "no entities (sample values)" row per theme.
- **Checking a change in a live Home Assistant:** load the dashboard in a fresh browser context (Playwright, service
  workers blocked), because a long-lived browser profile can keep an old module even after the resource `?v=`
  changed. To compare the cards with other sensors, read both in one `page.evaluate`: the card's shadow-root text
  and `document.querySelector('home-assistant').hass.states` give the same moment.
