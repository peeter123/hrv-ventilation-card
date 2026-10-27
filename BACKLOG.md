# Backlog

Ideas for later OpenSpec changes, outside the change in progress. Pick one up with `/opsx:propose`.

Released so far:

- v0.2 on 2026-10-15.
- v0.3 on 2026-10-20 (change `v0-3-preheater-and-effectiveness`: the editor's shown defaults, the pre-heater on the airflow card and the effectiveness rings).
- v0.4 on 2026-10-22 (change `v0-4-coil-and-fan-level`: the fan level from a fan entity, ventilation disabled and the coil's centreline).
- v0.5 on 2026-10-27 (change `v0-5-preheater-inlet-and-moisture-outside`: the exchanger inlet after the pre-heater and the moisture put-outside figure).

Order now: the air density entry below, then the integration, then packaging.

- **Air density from pressure, elevation and the unit's altitude setting** (before the integration, which copies
  the formulas). The sensible terms use a fixed `air_density` (1.2 kg/m³), right near sea level but about 25 % too
  high at 2000 m. Two parts:
  - The actual density of the supply air, `ρ = p / (287.05 · T_supply)`: from an optional pressure sensor, else
    the standard pressure at Home Assistant's elevation (`hass.config.elevation`, barometric formula), else 1.2.
    `air_density`, when set, stays a manual override. The sensor must report station pressure, not sea-level
    pressure (Netatmo, for example, reports sea-level pressure; at 2000 m that brings back the full error): say so
    in the docs, and maybe warn when the sensor reads far (more than about 60 hPa) above the elevation's standard
    pressure. Pressure alone moves ρ by ±3 % near sea level, and supply temperature by a few percent more.
  - How the unit measures flow. The ComfoAir Q has ebm-papst fans with a flow ring (differential pressure:
    `Q = k · √(ρ_ref/ρ) · √Δp`, k calibrated at 1.2 kg/m³) and an altitude setting that is part of commissioning:
    RMI VENTILATIONCONFIG `0x1E`, subunit 1, property `0x07` (`altitudeProfile`), with bands 0 = 0-500 m,
    1 = 500-1000 m, 2 = 1000-1500 m, 3 = 1500-2000 m. So the firmware corrects the flow to one density per band, and
    the mass flow is `Q_rep · √(ρ_ref · ρ)`, with `ρ_ref` the density the firmware assumes for the band. A new
    optional input for the band (an entity or a fixed 0-3; default: the band of the HA elevation) gives `ρ_ref`,
    and the calculation uses `ρ_eff = √(ρ_ref · ρ)`. An option for units that report true volume uses plain ρ.
    Which altitude inside a band the firmware assumes is unknown (take the middle; at most about ±1.5 % in mass
    flow); above 2000 m the top band leaves an error that grows with altitude.
  Exposing `altitudeProfile` as an entity is a separate change in the ESPHome ComfoAir Q component (an RMI read at
  startup and after config changes, not a PDO); it also makes a wrong commissioning visible. Touches
  `src/calc/recovery.ts` and `src/calc/inputs.ts`, the editor's calculation section, the formula macro of an
  installation, new `test/vectors.json` sets with densities other than 1.2, and the formulas section of the docs.
  Sources: the Q450 technical specification (sensors, flow ring, flow control), the ebm-papst inlet ring datasheet
  (density term), and the ESPHome component's protocol docs (`PROTOCOL-RMI-app.md`, `PROTOCOL-RMI.md`).
- **Integration for history and energy statistics.** A custom integration that creates power, energy,
  effectiveness and moisture rate sensors from the raw unit sensors with the same formulas as the cards, checked
  against the same `test/vectors.json`, replacing the `comfoair_q450.jinja` macro and the template, filter and
  Riemann helpers of the author's installation, with a plan to carry over the existing energy totals. The cards do
  not depend on it.
- **Packaging** (after the integration). Inclusion in the HACS default list, README badges (HACS, release,
  downloads), release automation, and whether the integration ships the cards. HACS installation as a custom
  repository and manual releases exist since v0.1.0.

- **Translations.** The cards' own texts (titles, legends, the status strip's labels, the editor and the config
  errors) are English only. Numbers and entity states already follow Home Assistant's locale. All texts are in
  `src/strings.ts`, with `test/strings.test.ts` keeping display text out of other files, so a language is one more
  table: choose it from `hass.language` with English as the fallback, and test that every language has every key.
  Dutch first.
- **Device auto-fill.** Pick a ComfoAir device in the editor and fill in all its entities.
- **Non-breaking space in entity tooltips.** The tooltips built by `roleTitle` (`src/cards/ventilation-card.ts`) with `formatState` (`src/lib/hass.ts`)
  show Home Assistant's `formatEntityState` output, which joins the number and the unit with a plain space (for
  example "Pre-heater: 0 W"), and the fallback in `formatState` does the same. That breaks the rule from
  `src/strings.ts` that a number and its unit stay together with a non-breaking space. Possible fix: replace the
  space between the number and the unit with a non-breaking space in `formatState`. Found during the v0.3 live
  check; not a regression.
