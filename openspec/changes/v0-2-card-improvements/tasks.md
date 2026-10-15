# Tasks

## 1. Bar cards

- [x] 1.1 Remove the water entry from the recovery legend (`recoveryView`) and delete `RECOVERY.water` and
  `RECOVERY.waterKeptOut`; verify the `recovery-view` unit tests cover the "Water recovered" and "Water kept out"
  scenarios (two lanes and the scale, no water entry) and `npm run check` passes
- [x] 1.2 Replace the lane border with a divider row in `src/cards/bar.ts` (design: "Equal lanes"); verify a
  test in `bar.browser.test.ts` that renders a two-lane bar at device pixel ratio 1 and 2 and asserts equal lane
  heights, and that the one-lane bar is unchanged at 22 px
- [x] 1.3 Give the moisture card the fixed title "Moisture Recovery" and a muted direction subtitle
  (`MoistureView.subtitle`, `MOISTURE.subtitles`, `.title-block` and `.subtitle` in `barStyles`); verify the
  `moisture-view` unit tests for the drying, gaining, neutral and no-value scenarios, a card test that the subtitle
  renders under the title in the secondary text colour, and that the strings test still passes (title case for
  the title, sentence case for the subtitle)
- [x] 1.4 Update the recovery and moisture sections of `README.md` (legend and title texts) and the card behaviour
  section of `docs/hrv-ventilation.md`; verify the README tests pass and no doc mentions "Water Recovered" or the
  "Moisture: House Drying" title any more
- [x] 1.5 Review the group: run `/code-review` on this group's changes and fix every confirmed finding; verify
  `npm run check` passes, then commit the group

## 2. Airflow card layout fixes

- [x] 2.1 Make labels inline flex boxes with the icon centred on the text and the ellipsis on a `.value` span
  (design: "Icon alignment"); verify a browser test at 400 and 600 px that every top row and status grid icon's
  vertical centre is within 1 px of its text's centre, and that a long status value still ends in an ellipsis with
  its full text in the tooltip
- [x] 2.2 Centre each status value in its cell; verify a browser test that the fan level and filter days in the
  first column share a horizontal centre within 1 px, and that the existing no-overlap tests at 280, 320, 350, 400
  and 600 px still pass
- [x] 2.3 Update the diagram section of `README.md` and `docs/hrv-ventilation.md` where they describe the top row
  and the status grid; verify the README tests pass
- [x] 2.4 Review the group: run `/code-review` on this group's changes and fix every confirmed finding; verify
  `npm run check` passes, then commit the group

## 3. Airflow card: exchanger type, moisture figure and tap targets

- [x] 3.1 Add the `exchanger_type` choice option (`hrv` default, `erv`) to `DIAGRAM_OPTIONS` and draw the
  exchanger fill by type (design: "Exchanger type"); verify unit tests for the default, `erv` and the error for
  `rotary` (it names the option and both choices), and a browser test that the ERV fill differs from the HRV fill
  and the text on it has a contrast of at least 4.5:1 in the light and dark preview themes
- [x] 3.2 Add `moistureFigure` next to `savingBadge` and render it at the bottom of the exchanger on an ERV in both
  layouts, with `DIAGRAM.moisture` and the tooltips in `src/strings.ts`; verify unit tests for 120 g/h, -418 g/h
  ("−418 g/h", magnitude in the tooltip), an unavailable input (hidden, or "n/a" with show-unavailable), HRV (none) and
  missing badge inputs (none), and a browser test at 280 px with the bypass at 50 % that the bypass position, the
  badge and the figure stay inside the exchanger without overlapping
- [x] 3.3 Add the optional roles `status.saving` and `status.moisture_recovery` (`RolePath`, `ROLE_LABELS`, editor
  field names) and let the badge and the moisture figure open them, focusable only while configured; verify card
  tests that a tap on the badge opens the saving entity, that without the role it opens nothing (not the supply
  air temperature) and has no `tabindex`, the same for the moisture figure, and that neither role adds a status
  grid cell or a top row label
- [x] 3.4 Add the exchanger type choice first in `DIAGRAM_SCHEMA`, with the labels "Heat recovery (HRV)" and
  "Energy recovery (ERV)", and the two new pickers as advanced fields in the status section; verify the editor
  tests for "Editing the card" and "Advanced settings on" from the airflow spec
- [x] 3.5 Add an exchanger type control to the preview page (`dev/`) and check HRV and ERV at 280 to 600 px in
  both themes there; verify by a screenshot of each width with ERV in the light and dark theme
- [x] 3.6 Update the diagram's options table in `README.md` (`exchanger_type`, `status.saving`,
  `status.moisture_recovery`) and the diagram section of `docs/hrv-ventilation.md` (HRV and ERV, the moisture
  figure, what the badge opens); verify the README tests pass
- [x] 3.7 Review the group: run `/code-review` and `/simplify` on this group's changes and fix every confirmed
  finding; verify `npm run check` passes, then commit the group

## 4. Sample values and card picker preview

- [x] 4.1 Add `src/lib/sample.ts` with the sample config and states (design: "Sample mode"), with `hrv_sample.*`
  IDs; verify a unit test that runs the calculation on the sample (heating mode, a saving above the badge
  threshold, positive extracted and recovered moisture) and that `npm run check:ids` passes with the sample in
  the bundle
- [x] 4.2 Implement sample mode in `HrvCard.setConfig` and the render path of the three cards: the option check
  only, sample config with smoothing off, merged states, no tap targets and the "Sample values" note; verify card
  tests for each card with `{}` (renders, note shown, no history request, a tap opens nothing), with only
  `exchanger_type: erv` (ERV sample), with an invalid option (configuration error) and with one entity set (the
  missing-roles error, no note)
- [x] 4.3 Set `preview: true` in `CARD_ENTRIES`; verify the `index` tests (each entry has a preview, still
  registered once when loaded twice)
- [x] 4.4 Add a no-entities slot to the preview page; verify a screenshot of the three cards in sample mode in
  both themes
- [x] 4.5 Document sample mode and the picker preview in `README.md` (how to leave the sample: pick any entity)
  and `docs/hrv-ventilation.md`; verify the README tests pass
- [x] 4.6 Review the group: run `/code-review` on this group's changes and fix every confirmed finding; verify
  `npm run check` passes, then commit the group

## 5. Saving roles by heating or cooling mode

- [x] 5.1 Replace `status.saving` with `status.heating_saving` and `status.cooling_saving` (`RolePath`,
  `ROLE_LABELS` "Saved heating power" and "Saved cooling power", advanced pickers in the editor's status section,
  both in the sample) and let the badge open the role of the calculation's `mode` (design: "Badge and moisture figure
  open optional roles"); verify card tests for the airflow spec scenarios "Heating saving opened while heating",
  "Cooling saving opened while cooling", "Mode without its saving entity" (no `tabindex`) and "No saving entity",
  the editor tests for "Editing the card" and "Advanced settings on", and that `status.saving` is gone from `src/`
- [x] 5.2 Update the diagram's options table in `README.md` and the diagram section of `docs/hrv-ventilation.md`
  (the two saving roles and which one the badge opens); verify the README tests pass and no doc mentions
  `status.saving`
- [x] 5.3 Review the group: run `/code-review` on this group's changes and fix every confirmed finding; verify
  `npm run check` passes, then commit the group

## 6. Release and live migration

- [x] 6.1 Retake the README images with `npm run capture`, including an ERV image of the diagram card and the
  recovery bar without the water entry, taken in heating mode (the most used) instead of the free cooling scenario,
  and add a card picker screenshot taken by hand on the live installation; verify every image the README links
  exists and shows the v0.2 behaviour
  - Done: `scripts/capture.mjs` takes the diagram (HRV light, dark, compact, GIF, ERV) and both bar images from
    the preview page; `editor.png` and `card-picker.png` were taken by hand on the live installation (v0.2.0).
- [x] 6.2 Set the version to `0.2.0` in `package.json`, run `npm run release` and commit `dist/`; verify
  `npm run release` and `npm run check` pass from a clean checkout and produce the committed bundle
- [x] 6.3 Deploy `dist/` with the workspace's deploy script and bump the Lovelace resource `?v=`; verify with
  Playwright (service workers blocked) on both dashboards that the existing cards render with the fixes (centred
  icons and status cells, equal lanes, no water entry, moisture subtitle) and the same values as before
- [x] 6.4 Add `exchanger_type: erv`, `status.heating_saving`, `status.cooling_saving` and
  `status.moisture_recovery` to the diagram cards on both
  dashboards (`python_transform`, cards located by type, IDs from `private/installation.md`); verify with
  Playwright screenshots the blue-grey exchanger and the moisture figure at desktop and phone width, that tapping
  the badge opens the saving sensor of the current mode and the figure the moisture recovery sensor, and that "Add card" lists the
  three cards with sample previews
- [x] 6.5 Update `private/installation.md` (resource `?v=`, the new config keys, the rollback to v0.1.0) and remove
  the v0.2 line from `BACKLOG.md`; verify no tracked file holds an entity ID with the device serial, a helper or a
  dashboard ID (`npm run check:ids` and a `git grep` for the serial prefix)
- [x] 6.6 Review the group: run `/code-review` on this group's changes and fix every confirmed finding; verify
  `npm run check` passes and `git status` is clean after the commit
- [ ] 6.7 With the user's confirmation before each outward step, push `main` and the tag `v0.2.0` to
  `peeter123/hrv-ventilation-card` (never `private/history`); the user publishes the release from the tag in the
  GitHub UI; verify the remote `main` equals the local one, no pushed commit holds an installation identifier, and
  `v0.2.0` is the latest release

## Workflow follow-up

- Archive the change with `/opsx:archive` after the review requirements are met, and sync its specs.
- Verify the archived specs: `openspec validate --specs --strict`.
