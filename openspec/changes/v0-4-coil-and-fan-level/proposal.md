# Proposal

## Why

A user with a ComfoAir Q350 on [michaelarnauts/home-assistant-comfoconnect](https://github.com/michaelarnauts/home-assistant-comfoconnect)
reported (2026-10-22) that the status grid shows the fan level as "On" or "Off". That integration has no fan level
sensor. Its only source is the fan entity `fan.comfoairq`, whose state is just on or off; the level is in its
`percentage` attribute. The card shows every label as Home Assistant formats its state, so the level is lost. The
editor's fan level picker also offers only sensors, so the user had to set the entity in YAML. Separately, the
pre-heater coil drawn in v0.3 looks flat: a single stroke that does not read as a wire.

## What Changes

- **Fan level from a fan entity (airflow card).** `fans.level` may be a `fan` entity. The card then shows the level
  as a named step from its `percentage` and `percentage_step`: Away, Low, Medium or High for a fan with three speeds,
  matching what Zehnder's own fan level sensors report. A fan with another number of speeds shows its percentage.
  While the entity is unavailable or has no percentage, the label shows the state as Home Assistant formats it, as
  any other label. The label's tooltip shows the same text, and a tap still opens the fan's more-info dialog.
- **Fan level picker.** The editor's fan level picker offers sensors, fans and selects (a select with the levels as
  options, as ESPHome firmware has, already shows the level as its state).
- **Darker centreline on the pre-heater coil.** A thin line darker than the wire runs along its centre, so the coil
  reads as a wire with depth. It is drawn while the coil is off and while it glows, in light and dark themes, and
  stays inside the wire (it changes nothing about the coil's box, glow or tap).
- **Release v0.4.0** on the existing GitHub repository. The live dashboards need no config change: the live unit has
  a fan level sensor, and the coil change applies to the existing config.
- **Backlog.** Both entries move into this change and leave `BACKLOG.md`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `airflow-diagram-card`: the fan level from a fan entity (and its exception to the rule that labels show Home
  Assistant's formatted state), the editor's fan level picker domains, and the coil's centreline.

## Impact

- Code: `src/lib/hass.ts` or `src/diagram/labels.ts` (the fan level text), `src/cards/ventilation-card.ts` (label
  text and tooltip, the coil's CSS), `src/diagram/drawing.ts` (the centreline), `src/editor/diagram-schema.ts` and
  `src/editor/fields.ts` (the picker), `src/strings.ts` (the level names), the preview page in `dev/` (a fan entity
  kind for the level), and the tests in `test/`.
- Config: none. Existing configs render as before, apart from the coil's centreline.
- Docs: `README.md` (the `fans.level` row, supported integrations, the coil), `docs/hrv-ventilation.md` (status grid,
  the coil's colours), `docs/images/` (retaken where the coil shows), `private/installation.md` (resource `?v=`),
  and `BACKLOG.md`.
- Live installation: the Lovelace resource version and a release `v0.4.0` of `peeter123/hrv-ventilation-card`.
  The fan entity path is checked live by rendering a card with the installation's own fan entity as `fans.level`,
  without changing a dashboard.

## Out of Scope

- A fan level for the bar cards: they have no fan level. No follow-up is planned.
- Translating the level names: the backlog item **Translations** (the names go in `src/strings.ts`).
- Showing the fan entity's preset (auto or manual) next to the level: the operating mode role already shows auto or
  manual from a sensor. No follow-up is planned.
- Picking the fan level entity automatically from the device: the backlog item **Device auto-fill**.
- The non-breaking space in entity tooltips: stays the backlog item **Non-breaking space in entity tooltips**.
