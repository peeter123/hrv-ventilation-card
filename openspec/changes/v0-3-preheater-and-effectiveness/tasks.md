# Tasks

## 1. Editor's shown defaults (spec coverage)

- [x] 1.1 Map each scenario of the card-bundle requirement "Editor shows defaults without writing them" (shown
  default, unrelated edit writes no default, empty section kept, typing the default into an unset field, default
  already set) to a test in `test/editor/`, naming the scenario in the test title as the other spec tests do, and
  add the missing ones (at least "Typing the default into an unset field" through the editor element, not only
  `withoutShownDefaults`); verify `npm run check` passes and each scenario name occurs in a test title
- [x] 1.2 Describe the shown defaults in the editor part of `README.md` (an unset option shows its default and stays
  unset) and in `docs/hrv-ventilation.md` (points that matter when changing the editor); verify the README tests
  pass
- [x] 1.3 Review the group: run `/code-review` on this group's changes and fix every confirmed finding; verify
  `npm run check` passes, then commit the group

## 2. Effectiveness in the calculation

- [x] 2.1 Add `effectiveness` to `RecoveryResult` in `src/calc/recovery.ts` (design: "Effectiveness is part of the
  recovery result"): both ratios, capped to 0-100, gated at 3 K and 1.5 g/m³, moisture absent without humidity, no
  bypass gate; verify unit tests for every recovery-calculation scenario in the change ("Winter heating", "Bypass
  modulating", "Outdoor air more humid", "Ratio below 0", "Ratio above 100", "Small temperature gradient", "One
  figure gated", "No humidity configured")
- [x] 2.2 Render `eff_sensible` and `eff_moisture` for every set in `test/vectors.json` from the macro in Home
  Assistant (macro inline in `ha_eval_template`, as the vectors' description says), add them to the file and its
  description, and compare them in the vector test where the macro gives 0 to 100; verify the "Golden vectors"
  scenario passes and the description names the render date
- [x] 2.3 Document the effectiveness of the unit in `docs/hrv-ventilation.md` ("Formulas": the cap, the gates, no
  bypass gate and why it then describes the unit rather than the exchanger, the difference from gated sensors);
  verify the doc no longer says the cards do not show effectiveness
- [x] 2.4 Review the group: run `/code-review` on this group's changes and fix every confirmed finding; verify
  `npm run check` passes, then commit the group

## 3. Effectiveness rings on the diagram

- [x] 3.1 Add the `show_effectiveness` option to `DIAGRAM_OPTIONS` and draw the two rings and their tracks in
  `drawing()` between the exchanger and the streams (design: "The rings"), the moisture ring only on an ERV with
  humidity for every stream, coloured by mode; verify unit tests for "Heating with both figures" (dash lengths 92
  and 65), "Option off" (no ring elements), "Not a boolean", "HRV with humidity sensors", "ERV without humidity",
  "Cooling mode", "Small temperature gradient" and "Input unavailable" (empty ring, track drawn)
- [x] 3.2 Add `effectivenessLabel` and the `.on-drawing.effectiveness` box with `title`, `aria-label` and
  `role="img"`, below the other boxes, with the texts in `src/strings.ts` (NBSP before %); verify unit tests for
  "Bypass closed" and "Bypass modulating", the strings and NBSP tests, and a card test that a tap on the box opens
  nothing while the badge and the moisture figure keep their taps
- [x] 3.3 Browser tests for the rings: in the light and dark preview themes, the badge, the moisture figure and the
  bypass position keep a contrast of at least 4.5:1 and are not covered by a ring at 280 to 600 px (scenario "Text
  on the exchanger"), and the rings are drawn in the compact layout at 320 px ("Both layouts"); verify the tests
  pass, moving the bypass position down if the measurement calls for it (design: risks)
- [x] 3.4 Add the effectiveness switch after the animation section in `DIAGRAM_SCHEMA` (basic), and on the preview
  page a `show_effectiveness` switch and the "small gradient" scenario (design: "Preview page"); verify the editor
  test for "Editing the card" and a screenshot of the preview page with HRV and ERV, bypass 0 % and 50 % and the
  small gradient, inspected by an agent
- [x] 3.5 Document the rings in `README.md` (options table: `show_effectiveness`; what the rings show, the gates,
  HRV versus ERV) and in the diagram section of `docs/hrv-ventilation.md` (geometry, colours, why the streams cover
  them, the tooltip box); verify the README tests pass
- [x] 3.6 Review the group: run `/code-review` and `/simplify` on this group's changes and fix every confirmed
  finding; verify `npm run check` passes, then commit the group

## 4. Rings, moisture figure and flow labels after the review of groups 2 and 3

- [x] 4.1 Replace `effectiveness.temperature` with `effectiveness.total` in `src/calc/recovery.ts` (design:
  "Effectiveness is part of the recovery result"): recovered / (recovered + lost) of the total, as the recovery
  card's header, in every mode, capped to 0-100 and gated on an extract-outdoor enthalpy difference of
  rho × 1006 × 3 J/m³; compare it in the vector test with the macro's recovered and lost totals, and drop
  `eff_sensible` from `test/vectors.json` and its description; verify unit tests for "Winter heating", "Latent heat
  counts", "Free cooling", "Ratio below 0", "Ratio above 100", "Small gradient", "Humid summer day", "One figure
  gated", "No humidity configured" and "Golden vectors", and a test that the figure equals the recovery card's
  header percentage within 1 % on every vector set
- [x] 4.2 Fuse the rings with the exchanger in `drawing()` (design: "The rings"): the moisture ring along the rim's
  midline at the rim's widest width, clipped to the rim (a clip ID per card instance), the empty rim as its track and
  the outlines drawn over it, in `--erv-ring`; the total ring on the inner outline in the mode colour mixed with the
  theme's primary text colour; set the preview page's "small gradient" scenario to 2 K and 0.3 g/m³ (design:
  "Preview page"); verify the updated unit tests for "Heating with both figures", "Option off", "HRV with humidity
  sensors", "ERV without humidity", "Cooling mode" and "Input unavailable", and that two cards get different clip IDs
- [x] 4.3 Name the mode (heat, cooling, free cooling) and add the absolute values to `effectivenessLabel`: the
  recovered total and the potential in W for the total figure (sensible plus latent, as the recovery card's header),
  the recovered and the extracted moisture in g/h for the moisture figure, both as magnitudes; texts in
  `src/strings.ts` (NBSP before the units); verify unit tests for "Bypass closed", "Bypass modulating", "Figure not
  measurable" and "Moisture kept out of the house", and the strings and NBSP tests
- [x] 4.4 Move the moisture figure right of the exchanger, centred at y 100 between the exchanger and the house
  symbol, with `mdi:water-sync` while recovering and `mdi:water-remove` while keeping moisture out, and the magnitude
  without a sign (the unit on a second line where it does not fit); remove the halo (`HALO_SHADOW`, its padding, and
  the `rings` class if nothing else uses it); move both flow labels below their arrowheads (design: "Moisture figure
  and flow labels"); verify unit tests for "Moisture recovered", "Moisture kept out", "Input unavailable" and "HRV",
  and the card test that a tap on the figure opens `status.moisture_recovery`
- [x] 4.5 Rewrite the browser tests for the rings, the moisture figure and the flow labels: in the light and dark
  preview themes, the total ring at least 3:1 against the core fill and the moisture ring for the default warm and
  cold colours on the HRV and ERV fills; the filled rim at least 1.2:1 against the empty rim; the moisture ring
  covering the rim at 100 % and nothing outside it; at 280 to 600 px in both layouts, the moisture figure (three and
  four digits) clear of the exchanger, the house symbol, the streams and the corner stacks, and the flow labels clear
  of the arrowheads, the bypass path at 100 % and the corner stacks ("Flow labels", "ERV at the narrowest width",
  "Four-digit rate on a narrow card", "Text on the exchanger"); verify the tests pass
- [x] 4.6 Update `README.md` (options table, rings and their tooltip, moisture figure, flow labels; the images are
  retaken in group 7) and `docs/hrv-ventilation.md` ("Formulas": the total effectiveness, the enthalpy gate, why lost
  latent heat counts; diagram: the rim geometry and clip, the colours and contrast rule, the tooltip's absolute
  values, the figure's place and icons, the flow labels); verify the README tests pass and no doc still mentions the
  halo, the teal ring or a temperature ring
- [x] 4.7 Feedback round: start `npm run dev` for the user, show screenshots of the preview page (HRV and ERV;
  heating, cooling, free cooling and small gradient; bypass 0 % and 50 %; 280, 400 and 600 px; light and dark)
  inspected by an agent, and apply the user's feedback; verify the user approves before the review
- [x] 4.8 Review the group: run `/code-review` and `/simplify` on this group's changes and fix every confirmed
  finding; verify `npm run check` passes, then commit the group

## 5. Pre-heater coil

- [x] 5.1 Add the `pre_heater` group to `RolePath` (`power`, `energy`), `ROLE_LABELS` and the `pre_heater.max_power`
  option (1 to 4000 W, no default); verify config tests that both roles are optional, "Pre-heater roles" maps
  them, and `pre_heater.max_power: 0` is a configuration error naming the option ("Invalid maximum")
- [x] 5.2 Add `preHeaterLevel(state, maxPower)` (design: "The pre-heater coil"); verify unit tests for "Modulating
  pre-heater" (0.25), "No maximum" (1), "On/off entity" (1), "Off" (0), "Unavailable" (0), a power in kW, and the
  0.1 minimum
- [x] 5.3 Draw the coil and its glow in `drawing()` and add the `.on-drawing.pre-heater` box with tooltip, accessible
  name and the tap through `this.tap()`; verify card tests for "Coil drawn", "No pre-heater", "Hover" ("Pre-heater:
  350 W") and "Tap" (opens `pre_heater.power`, nothing in sample mode)
- [x] 5.4 Browser tests: the coil's box clear of the outdoor labels, the flow labels and the bypass position at 280
  to 600 px in both layouts ("Narrow card with all outdoor labels"), and the off coil distinguishable from the
  stream in the light and dark preview themes ("Off"); verify the tests pass
- [x] 5.5 Add the "pre-heater" fieldset to the preview page (kind, power slider, maximum power, energy, the
  availability entries) and the "frost (pre-heater on)" scenario (design: "Preview page"); verify a screenshot of
  the coil off, at 250 of 1000 W, without a maximum and as an on/off entity in both themes, inspected by an agent
- [x] 5.6 Document the coil in `README.md` (the two roles, `pre_heater.max_power`, how the glow reads) and the
  diagram section of `docs/hrv-ventilation.md` (position, colours, the 0.1 minimum, the tap box); verify the README
  tests pass
- [x] 5.7 Feedback round: start `npm run dev` for the user, show screenshots of the preview page (the coil off, at
  250 of 1000 W, without a maximum and as an on/off entity; the frost scenario; both layouts; 280, 400 and 600 px;
  light and dark) inspected by an agent, and apply the user's feedback; verify the user approves before the review
- [x] 5.8 Review the group: run `/code-review` on this group's changes and fix every confirmed finding; verify
  `npm run check` passes, then commit the group

## 6. Pre-heater in the top row, the status grid and the editor

- [x] 6.1 Add the pre-heater label to the top row's centre cell, given only while the pre-heater is on and
  available, and let `pre_heater.power` count for showing the top row (design: "Pre-heater in the top row and the
  status grid"); verify label model tests for "Pre-heater on", "On/off entity on", "Pre-heater off" and "Only
  pre-heater power, pre-heater off", and a card test that a tap on it opens `pre_heater.power`
- [x] 6.2 Add `pre_heater.energy` to `STATUS_ROLES` at column 2, row 3, with `mdi:heating-coil`; verify tests for
  "Pre-heater energy cell" and that the existing "Status grid", "Unconfigured value" and "Centred cells" tests
  still pass
- [x] 6.3 Browser tests: the top row at 280 px with power 1032 W, the pre-heater at 1000 W and RMOT -3.5 °C has no
  overlaps ("Narrow card"), and the coil icons are centred on their text at 400 and 600 px ("Icon centred on its
  text"); verify the tests pass
- [ ] 6.4 Add the `pre_heater` section to `DIAGRAM_SCHEMA` after the status section, with a power picker for
  sensors, binary sensors and switches (a new field helper), an energy picker and the maximum power as an advanced
  number, and the labels in `src/strings.ts`; verify the editor tests for "Editing the card" and "Advanced settings
  on"
- [ ] 6.5 Add `pre_heater.power` (0 W) and `pre_heater.energy` (8 kWh) to `src/lib/sample.ts`; verify the
  card-preview tests (every full-layout role in the sample, no tap targets) and `npm run check:ids`
- [ ] 6.6 Document the top row figure, the energy cell and the editor section in `README.md` and the top row and
  status grid points in `docs/hrv-ventilation.md` (why the figure is left out rather than kept invisible, why no
  sum or share); verify the README tests pass
- [ ] 6.7 Feedback round: start `npm run dev` for the user, show screenshots of the preview page (the top row with
  the pre-heater on and off, the pre-heater energy cell, the editor's pre-heater section with advanced settings off
  and on; 280, 400 and 600 px; light and dark) inspected by an agent, and apply the user's feedback; verify the user
  approves before the review
- [ ] 6.8 Review the group: run `/code-review` on this group's changes and fix every confirmed finding; verify
  `npm run check` passes, then commit the group

## 7. Release and live migration

- [ ] 7.1 Retake the README images with `npm run capture`, adding an ERV image with the rings and an image of the
  frost scenario with the coil glowing and the pre-heater figure in the top row, and retake the README GIF with
  physically possible values in every frame (user, 2026-10-20: the exhaust is now hotter than the extract while the
  outdoor air is much colder; each frame's exhaust must lie between outdoor and extract, and the supply likewise);
  verify every image the README links exists and shows the v0.3 behaviour, and the GIF's frames pass that check
- [ ] 7.2 Set the version to `0.3.0` in `package.json`, run `npm run release` and commit `dist/`; verify
  `npm run release` and `npm run check` pass from a clean checkout and produce the committed bundle
- [ ] 7.3 Deploy `dist/` with the workspace's deploy script and bump the Lovelace resource `?v=`; verify with
  Playwright (service workers blocked) on both dashboards that the existing cards render as in v0.2, apart from the moved moisture figure and flow
  labels
- [ ] 7.4 With the user's choice of energy sensor and maximum power (design: "Open Questions"), add
  `show_effectiveness: true`, `pre_heater.power`, `pre_heater.energy` and, if known, `pre_heater.max_power` to the
  diagram cards on both dashboards (`python_transform`, cards located by type, IDs from `private/installation.md`);
  verify with Playwright, reading the card and `hass.states` in one `page.evaluate`, that the inner ring
  matches the recovery balance card's percentage and the outer ring the installation's moisture effectiveness sensor
  within 1 % while the bypass is closed, the coil is dim with the tooltip
  "Pre-heater: 0 W" and opens the power sensor, the energy cell shows the sensor's state, and the top row shows no
  pre-heater figure; screenshots at desktop and phone width
- [ ] 7.5 Update `private/installation.md` (resource `?v=`, the new config keys, the pre-heater sensors and that
  they have never been above 0, the rollback to v0.2.0) and the release line in `BACKLOG.md`; verify no tracked
  file holds an entity ID with the device serial, a helper or a dashboard ID (`npm run check:ids` and a `git grep`
  for the serial prefix)
- [ ] 7.6 Feedback round: show screenshots of both live dashboards after the migration (desktop and phone width,
  light and dark) inspected by an agent, and apply the user's feedback; verify the user approves before the review
- [ ] 7.7 Review the group: run `/code-review` on this group's changes and fix every confirmed finding; verify
  `npm run check` passes and `git status` is clean after the commit
- [ ] 7.8 With the user's confirmation before each outward step, push `main` and the tag `v0.3.0` to
  `peeter123/hrv-ventilation-card` (never `private/history`); the user publishes the release from the tag in the
  GitHub UI; verify the remote `main` equals the local one, no pushed commit holds an installation identifier, and
  `v0.3.0` is the latest release

## Workflow follow-up

- Archive the change with `/opsx:archive` after the review requirements are met, and sync its specs.
- Verify the archived specs: `openspec validate --specs --strict`.
