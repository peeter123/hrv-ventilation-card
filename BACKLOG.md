# Backlog

Ideas for later OpenSpec changes, outside the change in progress. Pick one up with `/opsx:propose`.

Order (decided 2026-10-15): first a v0.2 of the cards with improvements; the integration and packaging below wait
until after that.

v0.2 was released on 2026-10-15 and v0.3 on 2026-10-20 (OpenSpec change `v0-3-preheater-and-effectiveness`: the
editor's shown defaults, the pre-heater on the airflow card and the effectiveness rings). Next is the integration,
then packaging.

- **Exchanger inlet after the pre-heater** (before the integration, which copies the formulas). While a
  pre-heater runs, the recovery calculation counts its electric heat as recovered: it takes the outdoor air
  temperature, measured before the pre-heater, as the exchanger's inlet. Recovered heat (thermal saving, sensible
  part) is then too high by up to the pre-heater's heat into the supply air, and the sensible effectiveness (inner
  ring) is too high and can reach the cap. Moisture recovery and the outer ring are unaffected (heating does not
  change absolute humidity). The fix: a new optional role `pre_heater.temperature_after` (the ComfoAir Q exposes
  "pre-heater temperature after"; its outdoor air temperature is measured before the pre-heater). When it is set, the
  exchanger's inlet is that temperature: effectiveness (supply - after) / (extract - after), recovered heat
  flow x cp x (supply - after), with the pre-heater's own energy kept as a separate figure (`pre_heater.energy`).
  Touches `src/calc/recovery.ts` (rings and bars), the formula macro and template sensors of an installation, new
  sets in `test/vectors.json`, and the docs. Mostly matters with an HRV core: with an ERV core the moisture exchange
  lowers the frost risk, so the pre-heater rarely runs. Check against real data from a run of the pre-heater.
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
- **Non-breaking space in entity tooltips.** The tooltips built by `roleTitle` with `formatState` (`src/lib/hass.ts`)
  show Home Assistant's `formatEntityState` output, which joins the number and the unit with a plain space (for
  example "Pre-heater: 0 W"), and the fallback in `formatState` does the same. That breaks the rule from
  `src/strings.ts` that a number and its unit stay together with a non-breaking space. Possible fix: replace the
  space between the number and the unit with a non-breaking space in `formatState`. Found during the v0.3 live
  check; not a regression.
