# Tasks

## 1. Fan level from a fan entity

- [x] 1.1 Add `fanLevelText(stateObj)` to `src/lib/hass.ts` and the level names (`Away`, `Low`, `Medium`, `High`) to
  `src/strings.ts` (design: "Fan level text"): a step for a three-speed fan, the percentage with NBSP and `%`
  otherwise, `undefined` for a non-fan, unavailable entity, missing or non-numeric `percentage` or a missing
  `percentage_step`; verify unit tests for "Three-speed fan at medium" (66 and 33.333333333333336, the live shape),
  "Three-speed fan at the lowest level", "Rounded percentage" (33, 67, 100, and a clamp above 100), "Fan with
  another number of speeds" (NBSP), "Fan without a percentage", and the strings and NBSP tests
- [x] 1.2 Use it in `label()` in `src/cards/ventilation-card.ts` for `fans.level` only, for the value and the
  tooltip; verify card tests for "Three-speed fan at medium" (label "Medium", title "Fan level: Medium"), "Tapping a
  fan level from a fan entity" (opens the fan entity), "Fan level sensor" (unchanged), an unavailable fan entity
  (hidden as any unavailable label, and shown as unavailable with `show_unavailable`), and that a fan entity set as
  another role still shows Home Assistant's state
- [x] 1.3 Add `fanLevelField` with the domains `sensor`, `fan` and `select` to `src/editor/fields.ts` and use it for
  `level` in `src/editor/diagram-schema.ts`; verify the editor test for "Editing the card" (the fan level picker
  offers sensors, fans and selects, the flow pickers sensors) and a config test that a `fan.` and a `select.` level
  ID load without error
- [x] 1.4 Add the "fan level kind" choice (sensor, fan entity, select) to the preview page's fans fieldset, with a
  mock fan entity whose `percentage` follows the flow's level (design: "Preview page"); verify a screenshot of the
  preview page with each kind at away, low, medium and high, inspected by an agent, showing the same level name for
  all three kinds
- [x] 1.5 Document it in `README.md` (the `level` row of the fans table: a sensor, fan or select entity, and how a fan
  entity's level is named; a note for michaelarnauts/home-assistant-comfoconnect users to pick the fan entity) and in
  the status grid part of `docs/hrv-ventilation.md` (the formatter, why it is limited to the role, why "Away");
  verify the README tests pass
- [ ] 1.6 Add the option kind `list` to `src/lib/options.ts`, the option `fans.stopped_states` (default
  `['Disabled']`) to `DIAGRAM_OPTIONS`, the role `fans.ventilation_mode` to the config roles (left out of every
  label list in `src/diagram/labels.ts`), and `ventilationDisabled(stateObj, stoppedStates)` to
  `src/diagram/flow.ts` (design: "Ventilation disabled"); verify unit tests for the option (default, a custom list,
  an empty or non-list value falling back to the default), for `ventilationDisabled` ("Service mode on an ESPHome
  unit", "Ventilating normally" with Active and Overruling, "Custom stopped states", "Default stopped states and a
  binary sensor", "Mode entity unavailable" with unavailable and unknown, trimming and case), that the role loads in
  a config and gets no label, and the strings and NBSP tests
- [ ] 1.7 Use it in the card (`src/cards/ventilation-card.ts`): the fan level label's text "Stopped" (`FAN_STOPPED`
  in `src/strings.ts`) ahead of `fanLevelText`, both speeds 0, and the alert above the exchanger (`mdi:alert` in
  `--warning-color`, "Ventilation disabled" from `src/strings.ts`, its tooltip and its tap); verify card tests for
  "Service mode on an ESPHome unit" (label, title, both streams paused with flows above 0, the alert),
  "Ventilating normally", "Mode entity unavailable", "Tapping the alert", "Tapping the stopped fan level",
  "Animation off", "No mode entity" (no alert, nothing else changed) and "Ventilation disabled with flow readings"
  (the bypass path paused too), and a browser test that the alert lies inside the card and above the exchanger's top
  in both layouts at 280 and 600 px
- [ ] 1.8 Add the editor fields (`src/editor/fields.ts`, `src/editor/diagram-schema.ts`): a `ventilation_mode`
  picker in the fans section after `level` (sensor, binary sensor, select) and `stopped_states` in the fans section
  as an advanced setting; first check that Home Assistant's `text` selector with `multiple: true` edits a list in the
  card editor (in the preview page's editor and the live editor), else use a comma-separated text field that the
  option parses (design: "Ventilation disabled"); verify the editor tests for "Editing the card" (the picker and its
  domains, no stopped states field) and "Advanced settings on" (the stopped states with the default `Disabled`), and
  a round trip: a list edited in the editor lands in the config as a list
- [ ] 1.9 Add the "ventilation" control (active, disabled) to the preview page's fans fieldset, with a mock
  ventilation mode sensor set as `fans.ventilation_mode` (design: "Preview page"); feedback round: start
  `npm run dev` for the user and show screenshots inspected by an agent (active and disabled; the bypass closed and
  open; both layouts; 280, 400 and 600 px; light and dark), and apply the user's feedback on the alert's look and
  place; verify the user approves before the docs
- [ ] 1.10 Document it in `README.md` (the `ventilation_mode` row of the fans table and `stopped_states` with its
  default; the ESPHome states `Disabled`, `Active`, `Overruling` and that `Disabled` means sensor-based control is
  off, seen in service mode, so set the role only if the entity reads `Active` or `Overruling` in normal use; a
  binary sensor needs `off` in the stopped states) and in `docs/hrv-ventilation.md` (what ventilation disabled
  changes, why one decision, why the raw state, why unavailable is not disabled, why not the flows or the fan speeds);
  verify the README tests pass
- [ ] 1.11 Live check without changing a dashboard, after the bundle with this group is deployed (deploy script,
  resource `?v=` bump): with Playwright (service workers blocked) on a live dashboard page, create a card element in
  `page.evaluate` from the installation's diagram config, give it the page's `hass`, and read the fan level label's
  text and title, the streams' animation state and the alert. First with `fans.level` set to the installation's fan
  entity (done on `?v=14`: "Medium" and "Fan level: Medium" for the sensor, the fan entity at 66 % and the select;
  repeat it on the new bundle), then with `fans.ventilation_mode` set to the installation's ventilation mode sensor:
  as it reports (`Active`: no alert), and with a copy of `hass` whose state of that sensor is `Disabled` ("Stopped",
  streams paused, the alert); verify they agree (IDs from `private/installation.md`, none written to a tracked file)
- [ ] 1.12 Review the group: run `/code-review` on this group's changes and fix every confirmed finding; verify
  `npm run check` passes, then commit the group

## 2. Pre-heater coil centreline

- [ ] 2.1 Add the `coil-core` path to `coilWire` in `src/diagram/drawing.ts` (design: "Coil centreline"): stroke
  width 1 along the wire's path, after the wire, in both states, with the off wire and centreline in a
  `<g class="coil off">` carrying the 0.5 opacity; move the CSS in `src/cards/ventilation-card.ts` to match; verify
  unit tests for "Off coil", "Glowing coil" (the glow path and its attributes unchanged), "Inside the wire" (same
  `d`, width below the wire's) and "No pre-heater", and that `coilBox()` is unchanged
- [ ] 2.2 Browser tests: in the light and dark preview themes the centreline is darker (lower relative luminance)
  than the wire around it, off and at 250 and 1000 of 1000 W, and the off coil stays distinguishable from the stream
  (the existing "Off" test); verify the tests pass
- [ ] 2.3 Document the centreline in the diagram section of `docs/hrv-ventilation.md` (its colours per state, why
  the off opacity sits on a group, why darker and not a highlight) and, if the README describes the coil's look, in
  `README.md`; verify the README tests pass
- [ ] 2.4 Feedback round: start `npm run dev` for the user, show screenshots of the preview page (the coil off, at
  250 of 1000 W and at full; the frost scenario; both layouts; 280, 400 and 600 px; light and dark) inspected by an
  agent, and apply the user's feedback (the shares, the width, or a highlight instead); verify the user approves
  before the review
- [ ] 2.5 Review the group: run `/code-review` on this group's changes and fix every confirmed finding; verify
  `npm run check` passes, then commit the group

## 3. Release

- [ ] 3.1 Retake the README images that show the coil (`diagram-frost.png`, and any other with a pre-heater) with
  `npm run capture`; verify every image the README links exists and the frost image shows the centreline
- [ ] 3.2 Set the version to `0.4.0` in `package.json`, run `npm run release` and commit `dist/`; verify
  `npm run release` and `npm run check` pass from a clean checkout and produce the committed bundle
- [ ] 3.3 Deploy `dist/` with the workspace's deploy script and bump the Lovelace resource `?v=`; with the user's
  confirmation before each dashboard save, add `fans.ventilation_mode` (the ventilation mode sensor) to both live
  diagram cards; verify with Playwright (service workers blocked) on both dashboards that the cards render as in
  v0.3 apart from the coil's centreline, the fan level label still shows the sensor's state, no alert shows while
  the mode is `Active`, and the coil's tooltip and tap work; screenshots at desktop and phone width, light and dark,
  inspected by an agent
- [ ] 3.4 Update `private/installation.md` (resource `?v=`, the fan entity and select as alternative fan level
  sources, the ventilation mode role in both cards and what the unit reported in service mode, the rollback to
  v0.3.0), remove the two entries from `BACKLOG.md` and update its release line; verify no
  tracked file holds an entity ID with the device serial, a helper or a dashboard ID (`npm run check:ids` and a
  `git grep` for the serial prefix)
- [ ] 3.5 Feedback round: show the user the live screenshots from 3.3 and apply their feedback; verify the user
  approves before the review
- [ ] 3.6 Review the group: run `/code-review` on this group's changes and fix every confirmed finding; verify
  `npm run check` passes and `git status` is clean after the commit
- [ ] 3.7 With the user's confirmation before each outward step, push `main` and the tag `v0.4.0` to
  `peeter123/hrv-ventilation-card` (never `private/history`); the user publishes the release from the tag in the
  GitHub UI; verify the remote `main` equals the local one, no pushed commit holds an installation identifier, and
  `v0.4.0` is the latest release

## Workflow follow-up

- Reply to the user who reported the fan level (the GitHub issue, if there is one) once v0.4.0 is published.
- Archive the change with `/opsx:archive` after the review requirements are met, and sync its specs.
- Verify the archived specs: `openspec validate --specs --strict`.
