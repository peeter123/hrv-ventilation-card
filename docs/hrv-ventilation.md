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
- **Effectiveness** (supply side; part of the recovery result, for the airflow card's effectiveness rings and the
  planned integration), in %:
  - **Total:** recovered / (recovered + lost) of the total (sensible plus latent) of the paragraphs above, per m³ and
    before rounding. It is the recovery balance card's header percentage in every mode (a test keeps the two equal).
    Heating `(h_sup - h_out) / (h_ext - h_out)`, cooling against the outdoor air the same ratio, free cooling
    `(h_ext - h_sup) / (h_ext - h_out)`, the share of the cooling delivered. Without humidity the enthalpies are
    sensible only and it is the temperature ratio.
  - **Why latent heat counts:** the latent heat of extracted moisture that the exchanger does not return is lost, so
    an HRV or a poor ERV scores lower than its temperature ratio, as the physics says. This holds for every
    exchanger type, as the recovery card counts latent heat whenever humidity is configured. Example 0/17/21 °C
    (outdoor/supply/extract) with 4.0/6.5/7.5 g/m³: 78 % (temperature ratio 81 %); with the supply at the outdoor
    humidity, as for an HRV, 60 %.
  - **Moisture:** `(AH_sup - AH_out) / (AH_ext - AH_out)`, from the smoothed absolute humidity, and it needs
    humidity for all three streams.
  - **Cap:** each figure is limited to 0-100 %. A sensor offset or fan heat (about +0.5 to 1 K on the supply side)
    can push the raw ratio past 100 %, and a supply colder or drier than the outdoor air past 0 %; neither is a
    real effectiveness.
  - **Enthalpy gate (total):** the figure is left out while `|h_ext - h_out| < ρ · 1006 · 3` J/m³ (3.6 kJ/m³ at
    1.2 kg/m³), the enthalpy of 3 K of dry air, in either direction, because with a small gradient the ratio is
    noise. A humid summer day with 1 K between the temperatures but a clear enthalpy difference still gets a figure.
  - **Potential gate:** neither figure is given while the potential rounds to 0 (a supply flow of 0, or the extracted
    moisture rounding to 0 g/h), as the recovery card's header shows no percentage then; the rings are empty.
  - **Moisture gate:** `|AH_ext - AH_out| < 1.5 g/m³` (on 2026-09-30 the moisture gradient went from 0.72 to
    0.03 g/m³ within an hour). The two figures are gated separately.
  - **No bypass gate:** the figures are calculated at any bypass position. With the bypass closed they describe the
    exchanger. While the bypass modulates, the supply air is a mix of exchanger air and bypassed outdoor air, so
    the figures fall with the bypass and describe the unit as a whole, not the exchanger. Read them together with
    the bypass position.
  - **Difference from gated sensors:** an effectiveness sensor built on the same ratio in a template helper (as on
    the author's installation) is uncapped, rounded to an integer, and unknown unless the bypass is fully
    closed and the gradient passes the gate. It keeps the exchanger meaning for charts. The calculated figure can
    therefore differ from it: it shows a value while the bypass is open, where the sensor has none, and it stays
    within 0-100 %, where the sensor can leave it. The moisture figure is compared with it in the golden vectors
    where the sensor is within 0-100 %; the total is compared with the vectors' own recovered and lost powers.

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
- **Effectiveness rings (`show_effectiveness`, off by default).** Two rings that are parts of the exchanger, drawn
  between its fill and its outlines (order: fill, moisture ring, outlines, total ring with its track), with the
  streams on top, so the streams cover them (drawn above the streams, the rings would cut the air paths in four
  places and read as the foreground; a fill level in the core would sit under the badge and lower its contrast).
  The paths are in the exchanger's 400 by 200 coordinates (`MOISTURE_RING` and `TOTAL_RING` in
  `src/diagram/drawing.ts`) and start at the top centre, running clockwise. Each path has `pathLength="100"` and
  `stroke-dasharray: <figure> 100`, so the dash length is the figure in %, with no geometry in the code.
  - **Rim geometry and clip:** the inner hexagon is not a parallel offset of the outer one: the rim is 12 units wide
    at the top and bottom and 9.7 to 13.2 units on the slanted sides, so a thin stroke on the midline left its
    edges uncovered. The moisture ring is a 14 unit stroke on the midline, wider than the rim anywhere, clipped to the
    rim by a `clipPath` of both hexagons with `clip-rule: evenodd` (its ID is per card instance, in `DrawingIds`,
    as several cards share a page's IDs). A full ring so fills the rim from outline to outline and never spills over,
    and the outlines drawn after it give it crisp edges. The empty rim is its track. The total ring (3 units) runs
    on the inner outline, over a track: the same path at full length, in a mix of 25 % of the ring colour with
    `--secondary-background-color`.
  - **When drawn:** only with the option and the inputs of the sensible calculation (`RINGS_REQUIREMENTS` in
    `src/diagram/badge.ts`: the badge's requirements without the humidities); without them (say no
    `fans.supply_flow`) nothing is drawn, as the rings could never fill. The moisture ring only on an ERV with a
    humidity for every stream (`rings.moisture` in the card's settings, which is undefined while no ring is drawn);
    an HRV, or an ERV without humidity, has the total ring alone. A ring is empty below its gate or while the
    calculation has no result (see Effectiveness under Formulas). No bypass gate.
  - **Colours and contrast rule:** the moisture ring is `--erv-ring`, defined next to `--erv-fill` on `.drawing`:
    the secondary background mixed with 44 % of `#3d78ae` (the exchanger has 25 % of `#4f86b8`). On a light theme it is a
    clearly darker blue than the exchanger, on a dark theme lighter. The total ring is the mode's colour
    (the cold colour in cooling and free cooling, the warm colour otherwise, also when there is no result;
    `modeColor` in `src/diagram/badge.ts`, which the badge's tint uses too; unlike the badge it never turns grey at a
    low saving) mixed with `--primary-text-color` (`TOTAL_RING_SHARE`, 45 %): darker on a light theme, lighter on a
    dark one. The rule, measured by the browser test in the light and the dark preview theme, on the HRV and the ERV
    fill: the total ring has at least 3:1 (the WCAG contrast for graphics) against the core fill and against the
    moisture ring, and the filled rim at least 1.5:1 (light theme) or 1.3:1 (dark theme) against the empty rim (measured about 1.53 and 1.36). The mode colour's share (45 %) is the largest, so the text colour's the smallest, that meets it for
    the default warm and cold colours (the unmixed cold colour on the ERV fill was about 1.9:1). Colours are set
    inline on the elements.
  - **Tooltip box.** `.on-drawing.effectiveness` is an HTML box over the exchanger (x 145 to 255, y 26 to 174),
    clipped to the hexagon, `role="img"`, with `title` and `aria-label` from `effectivenessLabel` in
    `src/diagram/badge.ts` (texts in `src/strings.ts`). The total is named by the mode (heat, cooling, free
    cooling) and followed by its absolute values as magnitudes, the recovered total and the potential in W (the
    recovery card's header figures); the moisture by the recovered and the extracted moisture in g/h, as magnitudes
    like the moisture figure, except that the recovered value gets a minus sign (U+2212) while it works against the
    potential (the ratio is clamped to 0 %), e.g. "free cooling 0 % (−120 / 1,000 W), moisture 0 % (−100 / 800 g/h)";
    an overshoot (clamped to 100 %) stays magnitudes. Example: "Effectiveness: heat 92 % (1,200 / 1,304 W), moisture 65 % (390 / 600 g/h)".
    "not measurable" stands for a ring without a value, for example "free cooling 61 % (610 / 1,000 W), moisture not
    measurable (bypass 40 %)". The bypass position follows while above 0 % (from the calculation's own bypass
    input; whole percent from 1 %, one decimal below, so a bypass that already turns the ring cold is named); the
    moisture part only where the moisture ring is drawn. It is not tappable. It is first in the DOM, so the bypass
    position, the badge and the moisture figure stay on top of it with their own tooltips and taps.
  - **Position of the other texts.** The bypass position is at `top: 21.5%` to clear the inner ring. The moisture
    figure and the flow labels are described below.
  - **Browser tests** (`test/cards/ventilation-card.browser.test.ts`, "effectiveness rings"): at 280 to 600 px in
    both preview themes, with both rings drawn, the badge and the bypass position must clear every ring strictly; the
    bypass position and the moisture figure keep 4.5:1 against the background they sit on and the badge against its
    own fill; the contrast rule above; the compact layout draws the rings and tracks at 320 px. A change to the ring
    geometry or colours has to keep them passing.
- **Exchanger type.** `exchanger_type` only changes the drawing, not the calculation or the bar cards (an HRV with
  humidity sensors still gets latent figures). HRV fills the exchanger with the theme's secondary background, ERV
  with `--erv-fill`, `color-mix(in srgb, var(--secondary-background-color) 75%, #4f86b8)`: a blue-grey that stays
  light in light themes and dark in dark ones. The browser test checks the text on it at 4.5:1 or more in both
  preview themes.
- **Moisture figure (ERV).** Right of the exchanger, centred at y 100 (the height of the exchanger's centre and the
  house symbol's) and halfway between the exchanger's right vertex (x 255) and the house symbol's circle (x 344), in
  the wedge the streams leave there, in both layouts. It sits outside the exchanger because inside the rings' slanted
  sides crossed it on narrow cards. It shows the magnitude of the
  calculation's recovered moisture rate after an icon: `mdi:water-sync` while moisture is recovered (0 or more),
  `mdi:water-remove` while it is kept out, so no sign is shown. The icon is drawn like the top row's, as high as the
  text and centred on it. The tooltip names the direction with the magnitude ("Moisture recovered: 120 g/h",
  "Moisture kept out: 418 g/h"). At a card width of 400 px or less (`MOISTURE_TWO_LINES`) the unit goes on a second
  line under the number, as a four-digit figure with its icon needs about 65 px at the 11 px minimum and the gap is
  about 55 px at 280 px; the wedge has room for two 11 px lines. The browser test measures it at 280 to 600 px in
  both layouts with three and four digits. Without a role entity it is `role="img"`, so its label is read out. It
  needs the badge's inputs and follows the badge when one has no value. It sits on the same calculation result as the
  badge, computed once per render.
- **Flow labels.** Both the supply and the exhaust flow sit below their arrowheads (from y 158), the supply label
  right-aligned at `right: 15%` between the bypass path and the corner labels, the exhaust label at `left: 18.5%`.
  They were above the supply arrow's tip, in the wedge the moisture figure now uses. Below 340 px card width (the
  forced full layout) the supply label is a little lower (`top: 82%` instead of 79%) so it clears the bypass path
  as it rises to the supply arrow at 100 % bypass.
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
