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
  below), the supply flow and the bypass position; optionally the air after the pre-heater (see Pre-heater below).
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
- **Pre-heater (inlet of the exchanger).** A pre-heater warms the outdoor air before the exchanger, so the exchanger's
  inlet is then the air after the pre-heater, not the outdoor air. The ComfoAir Q sensors: T20 (PDO 276) is the
  outdoor air before the pre-heater, T21 / H21 (PDO 277 / 293) the temperature and humidity after it (in Home
  Assistant "pre-heater temperature after" and "pre-heater humidity after"; the roles `pre_heater.temperature_after`
  and `pre_heater.humidity_after`). Both roles are optional; without them nothing below applies and every figure is
  as before.
  - **Running rule.** In heating mode only, the pre-heater runs when its power (`pre_heater.power`) is above 0 or the
    entity is on. Without a power entity, or while it has no value (unavailable, unknown), it runs when the after
    temperature is at least 0.5 K above the outdoor temperature (`MIN_PRE_HEATER_RISE_K`). In cooling mode it is
    never counted. A power entity that reads 0 or off decides "not running" by itself.
  - **Why the 0.5 K gate.** A steady offset between the two sensors would otherwise show as a phantom pre-heater:
    0.2 K at 200 m³/h is about 13 W. On a unit with a power entity the entity decides, so only the fallback needs
    the gate. A unit whose sensors differ by 0.5 K or more without a power entity shows a phantom pre-heater; set
    `pre_heater.power`.
  - **Inlet.** While running, the inlet is the air at the after temperature with the after pair's absolute humidity
    when `pre_heater.humidity_after` is set (smoothed like the other streams, from its relative humidity and the
    after temperature), else the outdoor absolute humidity: heating does not change the absolute humidity. Not
    running, the inlet is the outdoor air.
  - **Three parts.** In heating the load (the potential) is `h_ext - h_out`, and with the inlet it splits into
    **pre-heater** `h_in - h_out` + **recovered** `h_sup - h_in` + **lost** `h_ext - h_sup`, each into sensible and
    latent like every other part, so pre-heater + recovered + lost = load in each lane. The latent part of the
    pre-heater is `2501 · (AH_in - AH_out)`: 0 with only the after temperature, and the disagreement of the two
    humidity sensors otherwise. Without a running pre-heater the pre-heater part is 0 and recovered + lost is the
    load, as before. Totals (`recoveryTotals`) stay recovered + lost: the pre-heater part is outside the potential.
  - **Total effectiveness** is the exchanger's own: `(h_sup - h_in) / (h_ext - h_in)`, gated on `|h_ext - h_in|` with
    the same 3 K of dry air as above. It is not the free share recovered / load, because a running pre-heater is not
    the exchanger's fault: the recovered part is a smaller share of the load, and the bar shows that share visually.
    The mode, the moisture rates and the moisture effectiveness stay on the outdoor air.
  - **Where the pre-heater's heat goes.** With an exchanger of effectiveness `e`, raising the inlet by `dT` raises
    the supply by only `(1 - e) · dT`: the rest leaves with the exhaust, because the exchanger recovers less from a
    warmer inlet. Example `e = 0.8`, pre-heater 300 W: the supply gets about 60 W warmer and about 240 W goes out
    with the exhaust. The pre-heater part of the bar is therefore where the supply air's heat came from (the
    electricity, not the exchanger), not heat the house gained.
  - **No figures** while the pre-heater runs by its power and the after temperature has no value (and, with
    `pre_heater.humidity_after` set, while the after humidity has none): the inlet is unknown, and falling back to the
    outdoor air would show the pre-heater's heat as recovered.
  - **Macro.** The author's template macro applies the same running rule and inlet, except that it reads only a
    numeric power (an on/off power entity, a switch or binary sensor, counts as absent there and the 0.5 K gate
    decides, while the cards read on/off), and that it treats an
    unavailable after temperature as not running (its helpers keep a value, so the energy totals have no gap), where
    the cards show no figures. It does not take the after humidity: the inlet uses the outdoor absolute humidity.
  - **No hysteresis.** The 0.5 K gate keeps no state (the calculation is pure), so an after temperature hovering
    around 0.5 K above the outdoor air makes the pre-heater part flicker; configure the power entity to avoid it.
  - **Inlet temperature.** While running, the inlet is the higher of the after and the outdoor temperature: a
    pre-heater does not cool, so a lagging after sensor does not turn into a negative pre-heater part.
  - **Vectors.** `test/vectors.json` has pre-heater sets: the ones with only an after temperature rendered by the
    macro in Home Assistant, the ones with an after humidity computed from these formulas and noted as such in the
    table.
- **Effectiveness** (supply side; part of the recovery result, for the airflow card's effectiveness rings and the
  planned integration), in %:
  - **Total:** recovered / (recovered + lost) of the total (sensible plus latent) of the paragraphs above, per m³ and
    before rounding. It is the recovery balance card's header percentage in every mode (a test keeps the two equal).
    Heating `(h_sup - h_out) / (h_ext - h_out)`, cooling against the outdoor air the same ratio, free cooling
    `(h_ext - h_sup) / (h_ext - h_out)`, the share of the cooling delivered. Without humidity the enthalpies are
    sensible only and it is the temperature ratio. With a running pre-heater the outdoor state `h_out` is replaced by
    the inlet `h_in` (see Pre-heater).
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
- **Pre-heater segment on the recovery bar.** While the pre-heater runs, each lane has a third segment after the lost
  part: its sensible part in the temperature lane and its latent part in the moisture lane (a lane whose part rounds
  to 0 W shows none). It is solid, in `pre_heater.color` (default `#ff9800`), on the same scale as the other parts,
  and the legend gets a swatch with "Pre-Heater" and its total in W from 1 W. It comes last on purpose: the recovered
  segment keeps starting at the zero line, and the recovered and the lost part stay adjacent, which is how the
  header's percentage reads them. The physical order (pre-heater, then recovered, then lost) was considered and
  rejected because it would move the recovered segment away from the zero line. The header's Y and its percentage
  leave the pre-heater out: they are the exchanger's effectiveness (see Pre-heater above).
- **Diagram.** The drawing is SVG generated by the card (`src/diagram/`), so it follows the theme and the card width.
  The bypass path is drawn with a strength equal to the bypass position, and the moving dashes split between the
  exchanger and bypass paths in the same proportion. Each stream end is coloured by its temperature.
- **Pre-heater coil (`pre_heater.power`, drawn only with it).** A smooth wave wire on the outdoor
  stream's straight lead (`coilPoints()` in `src/diagram/drawing.ts`), the segment the outdoor air shares before the
  bypass splits off (where a pre-heater physically sits), x 91.8 to 114.2 of the 400 by 200 drawing (22.4 units, the
  lead's middle). Each stream end has a straight lead of 34 units (`LEAD`): the outdoor lead is x 86 to 120 at y 62
  and starts both the supply path and the bypass; the supply path and the bypass share a lead into the supply arrow
  (272 to 306), and the extract and exhaust ends mirror them. `PATHS` and the coil are built from the same constants
  (`IN`, `OUT`, `LEAD`, `SPLIT`, `MERGE`), so they cannot drift. The wire is `y = 62 - 7 cos(5 pi s)` (48 samples, `s`
  running 0 to 1): its first and last points (round caps) sit exactly on the upper and lower borders of the stream
  (three crests on each side, as the first zigzag; the second draft had two, which no longer read as a coil). Its
  extent is about y 55 to 69; it is right of the outdoor stack (x 70 at most) at every width and left of the
  split, so with the bypass open it still lies on the stream. Its level comes from the pure `preHeaterLevel(state, maxPower)` in
  `src/diagram/preheater.ts`, 0 to 1:
  - a number (converted to W): 0 at or below 0 W; with `pre_heater.max_power`, `max(power / max, 0.1)` capped at 1;
    without it, 1;
    `max_power` is the unit's rated pre-heater power, e.g. Zehnder ComfoAir Q450: 1740 W; it differs per unit, so take it
    from the unit's documentation;
  - `on`: 1, `off`: 0; anything else (unavailable, unknown, text, an unknown unit): 0.
  - **Colours.** At level 0 the coil is `--secondary-text-color` at opacity 0.5: visible as a coil in both themes and
    clearly off. Black would disappear on a dark theme; the secondary text colour follows the theme. Above 0 the
    stroke is `color-mix(in srgb, <glow colour> <share>%, var(--secondary-text-color))` with `share = 30 + 70 x
    level` (`glowShare()`), and a blurred copy of the coil (half again as wide, 4.5 instead of 3, in the glow colour, with a blur of 1.5) lies behind it at
    opacity `share / 100` as the glow. The blur is an SVG `<filter>` with `feGaussianBlur` (id `hrv-blur-N`, one per
    card instance like the gradient IDs), not a CSS `filter`, which some WebKit versions (e.g. Home Assistant's iOS app)
    do not apply to SVG children. The share starts at 30 % because a share equal to the level made a quarter
    power nearly grey (25 % colour); 250 of 1,000 W is now 47.5 %. The glow colour is `pre_heater.glow_color`
    (default `#ff9800`, a warm orange, validated as a CSS colour), not the card's `colors.warm`: red-ish warm reads as
    a hot stream, orange as a heating element, and it stands out on the outdoor stream, which is cold whenever a
    pre-heater runs. The editor field is advanced, labelled "Glow colour" (a distinct name from the recovery cards'
    `color`, because editor labels are looked up by field name).
  - **Filament core.** Full-power orange on an orange halo had too little contrast (user's feedback). The wire is now
    that mix lightened towards white: `color-mix(in srgb, <mix above> (100 - 45 x level)%, white)`, so at full it is
    55 % glow colour and 45 % white (a hot, light core), at a quarter 11 % white (still clearly partial). The halo copy
    stays the pure glow colour, so the glow colour option drives both. Checked in light and dark: the pale core reads
    against the orange halo and against the blue stream on both themes.
  - **Centreline.** A second path `path.coil-core` with the same `d` as the wire lies over it (after it in the SVG),
    stroke width 1 (a third of the wire's 3), round caps, so the coil reads as a tube with a dark line along its
    middle. Its colour is a darker shade of the glow colour, in OKLCH relative colour that keeps hue and chroma:
    `oklch(from <base> calc(l * 0.9) c h)` (`CORE_LIGHTNESS`), with the wire's glow colour before the white
    lightening as the base while lit (the glow colour toward the text colour by the level, so it follows the level,
    stays a warm amber and is darker than the wire at every level: the wire is that colour mixed with white) and the
    secondary text colour while off. It was first a mix with black, which looked muddy and clashed with the glow.
    Relative colour needs Chrome and Edge, Safari 16.4+ or Firefox 128+, as Home Assistant frontends run; older
    browsers get a `color-mix` fallback (the base 80 % with black). Both live in the card CSS, on the base colour in the
    custom property `--coil-core-base` (set inline on the lit path, by `.coil.off` while off): `.coil-core` has the
    `color-mix` stroke by default and the relative colour only inside `@supports (color: oklch(from red l c h))`.
    The guard matters: both values would parse everywhere (they contain `var()`), so without `@supports` the
    relative colour would always win and, unsupported, turn invalid at computed-value time and drop the stroke. The off opacity of 0.5 sits on a group,
    `<g class="coil off">` around wire and centreline, not on the wire alone: with the opacity on the wire only, the
    centreline would be drawn at full opacity, as solid as the text colour, while the wire around it is dimmed. On
    the group, both dim together and the centreline is darker than the wire as drawn. It is darker, not a highlight
    (a lighter line, as on a shaded cylinder), because the lit core of the glowing coil is already lighter than its
    halo. The centreline is narrower than the wire and
    follows its path, so it stays inside the wire and inside `coilArea()`: the tap box and the glow filter region are
    unchanged. `.coil` keeps the round caps for both paths and `.coil.off` sits on the group.
  - **Pulse.** While the coil is on and the card's animation is on, the glow copy pulses: `.coil-glow` runs the
    keyframes `hrv-glow` (2.5 s, ease-in-out, infinite) from its level down to 60 % of it and back. The level is the
    CSS custom property `--glow-opacity` set on the glow path (the same value as its `opacity` attribute, which
    stays for the static case). It is stopped exactly like the flow animation: `.still .coil-glow` (the
    `animation.enabled: false` class) and `@media (prefers-reduced-motion: reduce)`. An off coil has no glow copy, so
    nothing pulses.
  - **The 0.1 minimum.** A modulating heater at a few percent of its maximum would otherwise be mixed so little that
    it looks off. Any power above 0 reads as on.
  - **Tap box.** The SVG is `aria-hidden`, so it can carry neither a name nor a tap target; an HTML box `.on-drawing.pre-heater` lies over it; its
    left, top, width and height in percent are derived from the bounds of `coilPoints()` plus the glow's reach
    (`coilBox()`, set inline), so they follow the coil. It carries `title` and `aria-label`
    ("Pre-heater: " plus the state as Home Assistant formats it) and, through `this.tap()`, `data-entity` for
    `pre_heater.power`, so the tap, the focus and sample mode work as for every other label.
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
  fan level, bypass mode, operating mode, temperature profile, target temperature, next changes, filter days and the
  pre-heater energy sit in a three-column grid below it, each cell fixed so nothing moves when a value changes, each value centred in its
  column. Every label has an icon and a tooltip and opens the more-info dialog of its sensor. A label is an inline
  flex box, so its icon is centred on the text whatever the font (`vertical-align` left Home Assistant's icon 2 px
  low, and `middle` centres on the x-height); the ellipsis of a value too long for its cell is on the `.value` span,
  because a flex box applies no `text-overflow` to its children. The top row's cells are flex boxes centring their
  content: a label's baseline (its icon's bottom edge) would otherwise leave power and RMOT 2 px above the season
  icon. The preview's `ha-icon` stub has Home Assistant's structure (an inline host around an inline-flex icon box
  aligned to the middle), and the browser test measures the svg each icon draws, not its host, so it catches an
  offset of the drawn icon.
  - **Pre-heater figure.** The centre cell holds power and, after it, the pre-heater state with `mdi:heat-wave`
    ("Pre-heater: <state>", tap opens `pre_heater.power`), a centred flex box with a gap, so the pair widens around
    the middle. It is given only while the level is above 0 and the entity is available, and otherwise left out of
    the DOM rather than kept invisible like other labels: an invisible label would push power off-centre all summer.
    The top row's height does not depend on it, so leaving it out changes no height. While it is shown, an
    unavailable (invisible) power is left out too, so the figure stays centred. Its label class is `pre-heater-power`
    (the energy label `pre-heater-energy`), not `power`, which stays the unit's power. `pre_heater.power` counts for
    showing the top row.
  - **Energy cell.** `pre_heater.energy` is a status role in column 2, row 3 (the cell under the next bypass change;
    the filter days stay in column 1's bottom cell), with the heat wave icon, the tooltip "Pre-heater energy: <state>" and its tap.
  - **No sum, no share.** The figure stands side by side with power. Whether a unit's power reading includes its
    pre-heater differs per unit and could not be confirmed on the live one, so adding the two or showing a share
    could double count or understate. No follow-up is planned (the proposal's "Out of Scope").
- **Fan level text.** The fan level may be a fan entity (the comfoconnect integration has no fan level sensor).
  `label()` runs `fanLevelText` in front of `formatState`, for the `fans.level` role only: `formatState` is shared by
  all labels and the pre-heater box, and a fan could be set as any role in YAML, so the fan formatting must not
  leak into the others. `fanLevelText` returns the percentage divided by `percentage_step`, rounded, as Away (0), Low,
  Medium or High when the fan has three speeds (`round(100 / step) == 3`), else the rounded percentage; it returns
  undefined (falling back to `formatState`) for a non-fan, an unavailable state or missing attributes. A fan that is on below half a step shows Low (Away only at 0 %). Step 0 is
  "Away" because the unit still ventilates at away, and Zehnder's own sensors say "Away", not "Off".
- **Ventilation disabled.** One decision, `ventilationDisabled(stateObj, stoppedStates)` in `src/diagram/flow.ts`,
  drives four effects. It is true only while `fans.ventilation_mode` exists, is not unavailable or unknown, and its
  raw state, trimmed, equals one of `fans.stopped_states` ignoring case (default `['Disabled']`; blank entries are
  dropped and an empty list falls back to it; numbers and YAML booleans are read as text, `false` and `true` as `off`
  and `on`; a value that is not a list of those is an invalid option, as for the other option kinds). The card
  normalises the list once, when the config is set.
  - **Effects.** The fan level label reads "Stopped" (value, aria label and tooltip) ahead of `fanLevelText`; its
    visibility rules and tap still use the level entity. Both stream speeds are 0, so the streams pause while the
    paths, the bypass strength and the colours are drawn as before. An alert (`mdi:alert` in `--warning-color`
    with "Ventilation disabled") sits centred over the exchanger, between the separator under the top row (the row
    of top labels and icons above the drawing) and the exchanger's top edge; without a top row, between the
    drawing's top and the exchanger's top. It has the tooltip "Ventilation disabled: <formatted state>" and a tap
    that opens the mode entity. It shows with the animation off too: it reports the unit, not the motion. The role
    is an input only and gets no label. The card decides once per render and shares the result with every label.
    The badge, the moisture figure and the rings show no recovery: the calculator is called with `noAirflow`, which
    makes the supply flow 0, so they render as with a flow of 0 (badge "0 W", moisture "0 g/h", rings without a
    figure). The flow sensors read non-zero with the fans stopped, so otherwise a stopped unit would show recovery.
    The flow labels keep showing the sensors. The recovery and moisture bar cards do not read the role.
  - **Why the raw state.** The formatted state depends on the user's language; the raw one does not.
  - **Why unavailable is not disabled.** A missing reading says nothing about the unit, and the card does not claim
    a stop it cannot see.
  - **Why not the flows or the fan speeds.** The exhaust flow sensor read about 21 m³/h with the fans stopped, so a
    flow threshold would be guesswork per unit. Fan speed (rpm) sensors measure the fans on any integration, but
    need two more roles and a threshold; the mode entity was chosen and is opted into per card.
  - **Why a list of states.** Other integrations word it differently, and a binary sensor reports `off`.
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
