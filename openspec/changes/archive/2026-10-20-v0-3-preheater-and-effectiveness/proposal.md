# Proposal

## Why

The airflow card shows what the unit recovers in watts and grams per hour. It does not show how well the unit
uses the indoor-outdoor difference, which is the figure people compare units by. It also ignores the pre-heater
(the frost-protection heater on the fresh-air intake), which can draw far more power than the fans in a cold spell.
The backlog's pre-heater item assumed the unit exposes no pre-heater data. The live unit does expose it: pre-heater
power (W), energy this year and energy since start (kWh). There is no daily pre-heater energy. The v0.2 editor also
shows the defaults of unset options without writing them, and no spec describes that yet.

## What Changes

- **Effectiveness rings (airflow card).** A new option `show_effectiveness` (off by default) draws two progress rings
  that are part of the exchanger. The moisture effectiveness fills the rim between the outer and the inner outline,
  in a darker shade of the ERV's blue-grey, and the total effectiveness runs along the inner outline in the mode's
  colour, mixed for contrast, both clockwise from the top centre. The total effectiveness is the recovery balance
  card's recovered percentage (latent heat included, so lost latent heat lowers it); the moisture effectiveness is
  `(AH_sup - AH_out) / (AH_ext - AH_out)`. They are capped to 0-100 %, shown also while the bypass modulates, and
  left empty below a minimum indoor-outdoor gradient (the enthalpy of 3 K of dry air, 1.5 g/m³). An HRV gets the
  total ring only. The numbers, with their absolute values (W and g/h), are in the exchanger's tooltip and accessible
  name, not drawn.
- **Effectiveness in the calculation.** The shared calculation gives both figures with their gates. The golden
  vectors are extended from the macro's `eff_moisture` kind; the total figure is checked against the macro's
  recovered and lost power.
- **Moisture figure and flow labels (airflow card).** The ERV's moisture recovery figure moves out of the exchanger
  to its right, at the height of the house symbol, with a water-sync or water-remove icon instead of a sign. The flow
  labels move below their arrowheads to make room. This changes the look of existing configs.
- **Pre-heater on the drawing.** A new optional role `pre_heater.power` takes a power sensor or an on/off entity.
  A heating coil drawn on the outdoor stream, between the outdoor symbol and the exchanger, glows by the power:
  dim while off, glowing while on, in proportion to the new option `pre_heater.max_power` when it is set. Hovering it
  shows the pre-heater's state, and tapping it opens the more-info dialog of `pre_heater.power`. Without the role,
  nothing is drawn.
- **Pre-heater in the top row.** While the pre-heater is active and available, the power label in the top row is
  followed by a second figure with the pre-heater's power (or "on"), side by side. No sum or percentage.
- **Pre-heater energy in the status grid.** A new optional role `pre_heater.energy` fills the free cell in the bypass
  column (column 2, row 3).
- **Editor.** A "Pre-heater" section with the two pickers and the maximum power (advanced), and the effectiveness
  switch. The editor's shown defaults get a requirement: an unset option shows its default without it being written,
  an unrelated edit writes no default, a section that was in the config stays even when emptied, and typing the
  default into an unset field leaves it unset.
- **Release v0.3.0** on the existing GitHub repository, and migration of the live dashboards: the diagram cards get
  the pre-heater roles and `show_effectiveness: true`.
- **Backlog.** The editor-defaults and pre-heater entries move into this change and leave `BACKLOG.md`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `airflow-diagram-card`: the effectiveness rings and their option, the pre-heater roles, the coil on the drawing,
  the pre-heater figure in the top row, the energy cell in the status grid, and the editor fields for them.
- `recovery-calculation`: the effectiveness figures for temperature and moisture, capped and gated, checked against
  the macro.
- `card-bundle`: the editor shows each unset option's default without writing it.

## Impact

- Code: `src/calc/recovery.ts` (effectiveness), `src/diagram/drawing.ts` (rings, coil), `src/diagram/labels.ts`
  (top row figure, status cell), `src/diagram/options.ts`, `src/lib/config.ts` (two roles),
  `src/cards/ventilation-card.ts`, `src/editor/diagram-schema.ts`, `src/lib/sample.ts` (pre-heater sample states),
  `src/strings.ts`, the preview page in `dev/`, `test/vectors.json` and the tests in `test/`.
- Config: additive only. Existing configs render as before, apart from the moved moisture figure and flow labels:
  the rings are off by default and the pre-heater roles are optional.
- Docs: `README.md` (options tables, screenshots), `docs/hrv-ventilation.md` (effectiveness of the unit, the
  pre-heater), `docs/images/`, `private/installation.md` (migration, resource `?v=`), and `BACKLOG.md`.
- Live installation: both dashboards' diagram cards, the Lovelace resource version and a release `v0.3.0` of
  `peeter123/hrv-ventilation-card`. The live pre-heater has used no energy so far, so only its off state can be
  checked live. The on states are checked on the preview page.

## Out of Scope

- Effectiveness and pre-heater sensors with history and energy statistics, and a daily pre-heater energy: the
  backlog item **Integration for history and energy statistics**. Until then a `utility_meter` helper gives a daily
  figure that `pre_heater.energy` can show.
- The pre-heater's share of the unit's power as a sum or percentage: whether a unit's power reading includes its
  pre-heater differs per unit and could not be confirmed on the live one. No follow-up is planned. The figures
  stay side by side.
- Effectiveness or pre-heater figures on the recovery and moisture bar cards. No follow-up is planned.
- Translations of the new texts: the backlog item **Translations** (the texts go in `src/strings.ts`).
- Detecting a unit's pre-heater entities automatically: the backlog item **Device auto-fill**.
