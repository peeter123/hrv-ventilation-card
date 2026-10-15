# Proposal

## Why

v0.1.0 of the cards is published and running on the live installation, and using it showed rough edges. The card
picker shows only text. The diagram does not tell a heat recovery (HRV) unit from an energy recovery (ERV) unit.
Label icons sit about 2 px below their text (measured on the live dashboard). The status grid's columns look ragged.
Tapping the saving badge opens the supply air temperature. The heat bar's two lanes differ in height (12.5 px and
13.5 px, measured). The heat bar's legend repeats a water figure that belongs to the moisture card. The moisture
card's title mixes the subject with the direction. The backlog put this v0.2 before the integration and packaging.

## What Changes

- **Card picker preview.** The three cards appear in the card picker with a rendered preview next to their name and
  description (`preview: true`). A card with no entity configured at all shows built-in sample values with a muted
  "Sample values" note, instead of a configuration error. Once any entity is set, the card uses the real states and
  the usual config checks.
- **Airflow card, exchanger type.** A new `exchanger_type` option (`hrv` default, `erv`) in the editor. HRV draws
  the exchanger in grey as now. ERV draws it blue-grey and shows the calculated moisture recovery rate (g/h, negative
  while moisture is kept out) low in the exchanger, under the crossing streams.
- **Airflow card, label icons.** Icons are centred vertically on their text in the top row and the status grid.
- **Airflow card, status grid.** Each value is centred in its column. The grid stays centred on the card.
- **Airflow card, tap targets.** The saving badge no longer opens the supply air temperature. Three new optional
  roles, `status.heating_saving` and `status.cooling_saving` (power saved while heating or cooling) and
  `status.moisture_recovery`, are advanced pickers. Tapping the badge opens the saving entity of the current heating
  or cooling mode, tapping the ERV moisture figure the moisture recovery entity. Without its entity, a figure is not
  tappable.
- **Recovery balance card.** The legend no longer shows the water recovered or kept out. The two lanes of the bar
  are exactly equal in height.
- **Moisture balance card.** The title is "Moisture Recovery" in every state, in the same format as "Heat Recovery".
  The direction ("House drying", "House gaining (outdoor more humid)", "Indoor ≈ outdoor") moves to a muted
  subtitle under the title.
- **Release v0.2.0** on the existing GitHub repository, and migration of the live dashboards: their diagram cards
  get `exchanger_type: erv` and the saving and moisture recovery roles.

## Capabilities

### New Capabilities

- `card-preview`: what a card shows when it has no entities configured (sample values, the note, no tap targets),
  so the card picker and a freshly added card show a real rendering.

### Modified Capabilities

- `airflow-diagram-card`: exchanger type option and its drawing, the ERV moisture recovery figure, icon alignment,
  centred status cells, the new optional saving and moisture recovery roles and what the badge opens, and the
  editor fields for them.
- `recovery-balance-card`: the legend without the water entry, and equal lane heights.
- `moisture-balance-card`: the fixed title with the direction as a muted subtitle.
- `card-bundle`: picker entries with a preview. The title case requirement's examples move to the new titles and
  legend (no "Water Recovered", the moisture title "Moisture Recovery"), and the subtitle stays in sentence case.

## Impact

- Code: `src/index.ts` (picker entries), `src/cards/base-card.ts` (sample mode before the config check),
  a new `src/lib/sample.ts` (sample config and states), `src/cards/ventilation-card.ts` (styles, badge tap,
  moisture figure), `src/diagram/drawing.ts` (exchanger fill by type), `src/diagram/options.ts`,
  `src/lib/config.ts` (two roles), `src/editor/diagram-schema.ts`, `src/cards/bar.ts` (lane heights),
  `src/cards/recovery-view.ts`, `src/cards/moisture-view.ts`, `src/cards/moisture-balance-card.ts`,
  `src/strings.ts`, the preview page in `dev/` and the tests in `test/`.
- Config: additive only. Existing configs keep working unchanged. An existing ERV config needs
  `exchanger_type: erv` to get the blue-grey drawing and the moisture figure.
- Docs: `README.md` (options tables, screenshots, picker), `docs/hrv-ventilation.md`, `docs/images/` and
  `private/installation.md` (migration, resource `?v=`).
- Live installation: both dashboards' diagram cards, the Lovelace resource version and a release `v0.2.0` of
  `peeter123/hrv-ventilation-card`.

## Out of Scope

- Detecting a unit's entities automatically to fill the picker preview or a new card: the backlog item
  **Device auto-fill**.
- Sensors that the badge and moisture figure open by default without configuration, and history for the
  calculated figures: the backlog item **Integration for history and energy statistics**, whose sensors can then
  be set in the two new roles.
- Translations of the new texts: the backlog item **Translations** (the new texts go in `src/strings.ts` like the
  rest).
- Other differences between HRV and ERV in the calculation or the bar cards. The exchanger type only changes the
  diagram. The calculation already handles humidity for both types.
- HACS default list, badges and release automation: the backlog item **Packaging**.
