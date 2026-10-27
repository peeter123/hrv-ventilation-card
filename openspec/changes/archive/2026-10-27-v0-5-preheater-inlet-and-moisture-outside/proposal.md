# Proposal

## Why

While a pre-heater runs, the recovery calculation counts its electric heat as recovered. It takes the outdoor air
temperature, which the ComfoAir Q measures before the pre-heater (T20), as the exchanger's inlet. Recovered heat (the
saving badge, the recovery bar, the thermal saving sensors of an installation) is then too high by up to the
pre-heater's heat, and the total effectiveness is too high and can reach the cap. This has to be fixed before the
planned integration copies the formulas. The ComfoAir Q reports the air after the pre-heater as T21 / H21 (PDO 277 /
293, "pre-heater temperature/humidity after" in Home Assistant), so the inlet can be measured.

Separately, the airflow diagram shows on an ERV how much moisture the exchanger recovers (right of the exchanger), but
not how much the ventilation still puts outside. The calculation already has that figure (`moisture.outside`), and the
moisture balance card shows it; the diagram does not.

## What Changes

- **Exchanger inlet after the pre-heater (shared calculation).** Two new optional roles, `pre_heater.temperature_after`
  and `pre_heater.humidity_after`. While the pre-heater runs, the exchanger's inlet is the air after the pre-heater:
  its temperature from `temperature_after`, its absolute humidity from the after pair when `humidity_after` is set and
  else from the outdoor pair (heating does not change absolute humidity). The pre-heater counts as running while
  `pre_heater.power` is on (above 0 W, or `on`); without a power entity, while the after temperature is at least
  0.5 K above the outdoor temperature, so a small offset between the two sensors does not show as a pre-heater. Only
  in heating mode. Without the roles, or while the pre-heater does not run, nothing changes.
- **Pre-heater as its own part.** The ventilation load then splits into three parts: pre-heater (outdoor to inlet),
  recovered (inlet to supply) and lost (supply to extract). Recovered plus lost is the exchanger's potential; the
  pre-heater part is neither recovered nor lost.
- **Effectiveness of the exchanger.** The total effectiveness (the inner ring and the recovery bar's percentage) is
  recovered / (recovered + lost), so with the pre-heater running (supply - inlet) / (extract - inlet): the core's own
  effectiveness, which does not drop when the pre-heater switches on. The moisture effectiveness, the moisture rates
  and the moisture balance card are unchanged.
- **Recovery balance bar.** While the pre-heater part is above 0 W, the temperature lane gets a third segment, first from
  the zero line, in a pre-heater colour (option `pre_heater.glow_color`, default the coil's orange `#ff9800`), the legend a
  "Pre-heater X W" entry. The header keeps "Recovered X W of Y W (N %)" with Y = recovered + lost. The card gets the
  pre-heater roles (power, temperature after, humidity after) in its config and editor.
- **Moisture put outside on the airflow diagram (ERV).** A second moisture figure left of the exchanger, centred in the
  space between the outdoor symbol and the bypass path (not mirrored from the right figure: the mirrored spot is too
  close to the bypass path), with the magnitude of `moisture.outside` in g/h after a direction icon:
  `mdi:water-remove` while moisture is put outside, `mdi:water-plus` while the ventilation brings it
  in (outdoor air more humid). Same conditions as the recovered figure (ERV with the badge's inputs). A new optional
  advanced role `status.moisture_outside` sets what a tap opens.
- **Installation.** The formula macro of the author's installation takes T21 and the pre-heater power the same way
  (the live pre-heater works but has not been needed, so the energy totals do not change). With the user's confirmation the live
  cards get the new roles.
- **Release v0.5.0** on the existing GitHub repository. The backlog entry "Exchanger inlet after the pre-heater"
  moves into this change.

Assumptions (defaults chosen in the explore session, open to the user's feedback rounds): the two icons, the tap
role, the pre-heater segment's place (moved first, before
recovered, on the user's feedback) and its colour, and the 0.5 K gate.

## Out of scope

- Air density from pressure and the unit's altitude setting: its own backlog entry and change, also before the
  integration.
- Deriving the inlet from the pre-heater power when no after temperature exists: dropped in the explore session; the
  power entity only gates and cross-checks.
- Showing the pre-heater part on the airflow diagram (the coil, its tooltip and the top row already show the
  pre-heater's power) and on the moisture balance card (heating adds no moisture).
- The moisture put-outside figure on an HRV: it follows the recovered figure (ERV only); a later change can widen
  both.
- The integration and packaging: later backlog entries.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `recovery-calculation`: the pre-heater roles as inputs, the running rule, the exchanger inlet, the pre-heater part,
  and the total effectiveness and its gate on the inlet instead of the outdoor air.
- `recovery-balance-card`: the pre-heater roles in its config and editor, the third segment, its legend entry and
  colour option.
- `airflow-diagram-card`: the pre-heater roles in its config and editor (the badge and the rings follow the
  calculation), the moisture put-outside figure, its tap role, and the labels requirement that places it.

## Impact

- Code: `src/calc/recovery.ts` (inlet, pre-heater part, effectiveness), `src/calc/inputs.ts` (the new roles, the
  running rule, smoothing of the after humidity), `src/lib/config.ts` (role paths), `src/diagram/preheater.ts` (the
  on rule reused), `src/cards/recovery-view.ts` and its card (segment, legend, colour), `src/diagram/badge.ts` and
  `src/cards/ventilation-card.ts` (the second figure, its CSS and tap), `src/editor/*` (pre-heater sections),
  `src/strings.ts`, the preview page in `dev/` (pre-heater after temperature, bypass at 100 %), and the tests in
  `test/` (new synthetic sets in `test/vectors.json`).
- Docs: `README.md`, `docs/hrv-ventilation.md` (formulas, the (1 - effectiveness) note on where the pre-heater heat
  goes, the second figure), `private/installation.md`, `BACKLOG.md`.
- Installation: `private/templates/comfoair_q450.jinja` (deployed over SSH), the live diagram and recovery cards
  (new roles, with confirmation), the Lovelace resource `?v=`.
