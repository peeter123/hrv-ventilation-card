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
- **Effectiveness** (supply side, the usual datasheet definition; not shown by the cards, kept for the planned
  integration): `eff_sensible = (T_sup - T_out) / (T_ext - T_out)`, `eff_moisture = (AH_sup - AH_out) / (AH_ext -
  AH_out)`. Only meaningful with the bypass fully closed and `|T_ext - T_out| >= 3 K` (resp. `|AH_ext - AH_out| >=
  1.5 g/m³`); with small gradients the ratio is noise (on 2026-09-30 the moisture gradient went from 0.72 to 0.03
  g/m³ within an hour). Fan heat (about +0.5 to 1 K on the supply side) inflates the sensible effectiveness.

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
  negative to the left, both lanes on the scale of the fuller one. The two lanes are equally high: the line between
  them is an overlay across the bar's middle, like the zero line, because a border on the second lane sits outside
  the flex basis and made the lanes 12.5 and 13.5 px. The recovery legend shows the lanes and the scale only; the
  moisture rate in g/h belongs to the moisture bar. The moisture bar is one lane, solid recovered (or kept out) and
  hatched put outside (or entering), with the neutral band and a yellow strip for the bypass position. Its title is
  always "Moisture Recovery"; the direction ("House drying", "House gaining (outdoor more humid)", "Indoor ≈
  outdoor") is a muted subtitle under it, absent without a value. Scale = max(`min_scale`, sum of magnitudes rounded
  up to 250).
- **Diagram.** The drawing is SVG generated by the card (`src/diagram/`), so it follows the theme and the card width.
  The bypass path is drawn with a strength equal to the bypass position, and the moving dashes split between the
  exchanger and bypass paths in the same proportion. Each stream end is coloured by its temperature.
- **Top row and status grid.** The season icon (left), power (centre) and RMOT (right) sit above the drawing; the
  fan level, bypass mode, operating mode, temperature profile, target temperature, next changes and filter days sit
  in a three-column grid below it, each cell fixed so nothing moves when a value changes. Every label has an icon
  and a tooltip and opens the more-info dialog of its sensor.
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
- **Checking a change in a live Home Assistant:** load the dashboard in a fresh browser context (Playwright, service
  workers blocked), because a long-lived browser profile can keep an old module even after the resource `?v=`
  changed. To compare the cards with other sensors, read both in one `page.evaluate`: the card's shadow-root text
  and `document.querySelector('home-assistant').hass.states` give the same moment.
