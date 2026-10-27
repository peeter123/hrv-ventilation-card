# Tasks

## 1. Calculation: exchanger inlet after the pre-heater

- [ ] 1.1 Move the pre-heater state reading to `src/lib/preheater.ts` as `preHeaterRunning(state): boolean | undefined`
  (design: "The power entity's on state moves to `src/lib/`") and make `preHeaterLevel` / `preHeaterOn` in
  `src/diagram/preheater.ts` use it; verify the existing `test/diagram/preheater.test.ts` passes unchanged and new
  unit tests cover 350 W, 0 W, `on`, `off`, unavailable, unknown, text, a missing entity and an unsupported unit
- [ ] 1.2 Add the roles `pre_heater.temperature_after` and `pre_heater.humidity_after` to `RolePath` in
  `src/lib/config.ts` and their names to `ROLE_LABELS` in `src/strings.ts`; verify a config test that both load
  without error and the strings and NBSP tests pass
- [ ] 1.3 Extend `src/calc/recovery.ts` (design: "Running rule and inlet in the calculation"): the optional
  `preHeater` input block, the running rule with `MIN_PRE_HEATER_RISE_K = 0.5`, the inlet, `preHeater: PowerSplit` on
  the result, the total effectiveness and its gate on the inlet, and no figures for a missing after value while
  running; verify unit tests for every scenario of the recovery-calculation delta ("Pre-heater running" 1073 / 402 /
  335 W and saving 1073 W, "Effectiveness of the exchanger" 73 %, "Gradient on the inlet", "Power above 0", "Power 0
  with a sensor offset", "No power entity" at 0.3 and 0.6 K, "Cooling mode", "Only the after temperature", "Moisture
  figures unchanged", "Parts sum to the load" with and without humidity, "After humidity differs" 14 W, both "After
  temperature unavailable" cases, "Unit without pre-heater roles"), and that every existing vector still passes
- [ ] 1.4 Read the new roles in `src/calc/inputs.ts` (design: "After humidity smoothed like a stream"): the power's
  tri-state, the after temperature, and the after humidity through the smoothing store with a derived key, all in
  `used`; verify calculator tests with a mock `hass` (roles absent, after temperature only, both, power entity as a
  sensor and as a binary sensor, after humidity smoothed over the window)
- [ ] 1.5 Update the installation's macro `private/templates/comfoair_q450.jinja` (design: "Formula macro"): two
  optional inputs (after temperature, pre-heater power), the same running rule, the inlet with the outdoor AH,
  `eff_sensible` on the inlet and a `heating_pre_heater` kind; keep a copy of the current macro first, deploy it (the
  hook), run `homeassistant.reload_custom_templates`, and verify with `ha_eval_template` that the live helpers'
  values are unchanged (pre-heater off) and that the macro body with test variables gives the expected figures for a
  running pre-heater
- [ ] 1.6 Add the pre-heater sets to `test/vectors.json` (spec: "Pre-heater vectors"): running with only the after
  temperature (rendered by the macro in Home Assistant, as the existing sets), not running with a 0.3 K offset, no
  power entity at 0.6 K, and with an after humidity (computed from the formulas, marked as such in the description);
  extend the vector test to pass the pre-heater block and check the pre-heater part and the total effectiveness;
  verify `npm test` passes
- [ ] 1.7 Document the calculation in `docs/hrv-ventilation.md` (the formulas section: the inlet, the running rule and
  why the 0.5 K gate, the three parts, the exchanger effectiveness and why not the free share, the (1 - effectiveness)
  note on where the pre-heater heat goes, the T21 / H21 PDOs) and the new roles in `README.md`; update
  `private/installation.md` (the macro's new inputs, T21 equal to T20 on this unit); verify the README tests pass
- [ ] 1.8 Review the group: run `/code-review` on this group's changes and fix every confirmed finding; verify
  `npm run check` passes, then commit the group

## 2. Recovery balance bar: the pre-heater part

- [ ] 2.1 Add the third value per lane, the pre-heater legend entry and the `pre_heater.color` option to
  `src/cards/recovery-view.ts` and the card (design: "Recovery bar: a third value per lane"), with the texts in
  `src/strings.ts`; verify view tests for the delta's "Pre-heater running" (segments and header "Recovered 1,073 W of
  1,475 W (73 %)"), "Pre-heater not running", "Pre-heater entry", "No pre-heater entry", "Custom pre-heater colour"
  and an invalid colour reported as a configuration error, and the title-case and NBSP tests
- [ ] 2.2 Add the pre-heater section to `src/editor/recovery-schema.ts` (power as a switchable field, after
  temperature and after humidity as sensor fields, the colour as an advanced field); verify the editor tests for
  "Editing the card" and "Advanced settings on" of the recovery-balance-card delta
- [ ] 2.3 Add an after-temperature control to the preview page (`dev/`): a mock `pre_heater.temperature_after` that
  follows outdoor plus the pre-heater's power over the flow, set on the recovery card when the pre-heater is above 0;
  verify a browser test that the bar shows the third segment in the pre-heater colour with the pre-heater at 500 W
  and none at 0 W
- [ ] 2.4 Document the card's pre-heater part in `README.md` (the recovery card's options: the pre-heater keys it
  reads and `pre_heater.color`) and `docs/hrv-ventilation.md` (the bar's third segment and why it comes last); verify
  the README tests pass
- [ ] 2.5 Feedback round: start `npm run dev` for the user and show screenshots of the recovery card (pre-heater off,
  at 500 W and at full; light and dark; 280 and 600 px), inspected by an agent, and apply the user's feedback (the
  segment's place, colour or pattern); verify the user approves before the review
- [ ] 2.6 Review the group: run `/code-review` on this group's changes and fix every confirmed finding; verify
  `npm run check` passes, then commit the group

## 3. Airflow diagram: pre-heater roles and the moisture put-outside figure

- [ ] 3.1 Add the `temperature_after` and `humidity_after` sensor pickers to the pre-heater section of
  `src/editor/diagram-schema.ts`, and keep them out of every label list in `src/diagram/labels.ts`; verify the
  editor test for "Editing the card" of the airflow-diagram-card delta and a card test for "Pre-heater after roles"
  (the badge equals the calculation's saving with the inlet, no label for the two entities)
- [ ] 3.2 Add the put-outside figure function to `src/diagram/badge.ts` and its texts and icons to `src/strings.ts`
  (design: "Moisture put-outside figure"); verify unit tests for "Moisture put outside" (230 g/h), "Moisture brought
  in" (-200 g/h, no minus), a rate that rounds to 0 (put outside), "Input unavailable" (hidden, or "n/a" with
  show-unavailable) and "HRV" (none), and the strings and NBSP tests
- [ ] 3.3 Render it in `src/cards/ventilation-card.ts` left of the exchanger (class, CSS at about 22.75 % / 51.5 %, its
  own two-line container threshold), with the tap role `status.moisture_outside` (`RolePath`, advanced status picker)
  and no recovery while ventilation is disabled; verify card tests for "Entity configured", "No entity" (no
  `tabindex`), "Roles configured" and "Recovery while ventilation disabled" (both figures)
- [ ] 3.4 Browser test (spec: "Moisture put-outside figure clear of the bypass"): the figure's box does not overlap
  the bypass path at 100 %, the outdoor symbol, the coil, the streams or the corner labels, and its text is at least
  11 px, at 280, 300, 340, 400 and 600 px in both layouts with -1500 g/h and the coil drawn; if 280 px fails, apply the
  icon-above fallback from the design and test again; verify the test passes and the existing "ERV at the narrowest
  width" test covers both figures
- [ ] 3.5 Add the put-outside figure to the preview page's ERV scenarios and a bypass-at-100 % control if none exists;
  feedback round: start `npm run dev` for the user and show screenshots (bypass 0 and 100 %, the coil on and off,
  drying and gaining, both layouts, 280, 400 and 600 px, light and dark), inspected by an agent, and apply the user's
  feedback on the icons, the place and the wording; verify the user approves before the docs
- [ ] 3.6 Document it in `README.md` (the ERV figures, `status.moisture_outside`, the pre-heater after keys) and
  `docs/hrv-ventilation.md` (the figure, why it is not mirrored, the box it lives in); verify the README tests pass
- [ ] 3.7 Review the group: run `/code-review` on this group's changes and fix every confirmed finding; verify
  `npm run check` passes, then commit the group

## 4. Release

- [ ] 4.1 Retake the README images that show an ERV diagram or the recovery bar with `npm run capture`; verify every
  image the README links exists and the ERV images show both moisture figures
- [ ] 4.2 Set the version to `0.5.0` in `package.json`, run `npm run release` and commit `dist/`; verify
  `npm run release` and `npm run check` pass from a clean checkout and produce the committed bundle
- [ ] 4.3 Deploy `dist/` with the workspace's deploy script and bump the Lovelace resource `?v=`; with the user's
  confirmation before each dashboard save, add `pre_heater.temperature_after` and `pre_heater.humidity_after` to the
  live diagram and recovery cards; verify with Playwright (service workers blocked) on the dashboards that the cards
  render as in v0.4 apart from the put-outside figure, the badge and the bar are unchanged (pre-heater off), and the
  figure's tooltip matches the moisture card's "Outside" figure; screenshots at desktop and phone width, light and
  dark, inspected by an agent
- [ ] 4.4 Update `private/installation.md` (resource `?v=`, the new roles in the live cards, the macro's inputs, the
  rollback to v0.4.0), remove the "Exchanger inlet after the pre-heater" entry from `BACKLOG.md` and update its
  release line; verify no tracked file holds an entity ID with the device serial, a helper or a dashboard ID
  (`npm run check:ids` and a `git grep` for the serial prefix)
- [ ] 4.5 Feedback round: show the user the live screenshots from 4.3 and apply their feedback; verify the user
  approves before the review
- [ ] 4.6 Review the group: run `/code-review` on this group's changes and fix every confirmed finding; verify
  `npm run check` passes and `git status` is clean after the commit
- [ ] 4.7 With the user's confirmation before each outward step, push `main` and the tag `v0.5.0` to
  `peeter123/hrv-ventilation-card` (never `private/history`); the user publishes the release from the tag in the
  GitHub UI; verify the remote `main` equals the local one, no pushed commit holds an installation identifier, and
  `v0.5.0` is the latest release

## Workflow follow-up

- Archive the change with `/opsx:archive` after the review requirements are met, and sync its specs.
- Verify the archived specs: `openspec validate --specs --strict`.
