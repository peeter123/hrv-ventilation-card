# Backlog

Ideas for later OpenSpec changes, outside the change in progress. Pick one up with `/opsx:propose`.

Order (decided 2026-10-15): the integration first, then packaging. The v0.2 card improvements are released.

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
- **Pre-heater energy in the bottom status bar.** Show the electricity used by the pre-heater (the frost-protection
  heater on the fresh-air intake) in the status bar at the bottom of the airflow card, next to the existing strip.
  Data check: the unit exposes the pre-heater's temperatures and humidity before and after, but no pre-heater power
  or energy sensor. Only the unit's total power (W) and the energy totals (today, YTD, since start) are available,
  so the pre-heater part needs a source first: a smart plug or a measured sensor on the heater, or an estimate from
  the temperature rise. Seasonal: useful only in the heating season.
