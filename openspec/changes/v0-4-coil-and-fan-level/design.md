# Design

## Context

See proposal.md for the motivation. The facts below come from the code, the integration's source and the live
installation on 2026-10-22.

- Every label's text comes from `formatState(hass, entityId)` in `src/lib/hass.ts`, which returns
  `hass.formatEntityState(stateObj)` (or the state with its unit as a fallback). `label()` in
  `src/cards/ventilation-card.ts` uses that text for the value and for the tooltip (`roleTitle(role, text)`).
  `formatState` is shared by all labels and the pre-heater's box.
- michaelarnauts/home-assistant-comfoconnect (`fan.py`): the fan entity has three speeds (low, medium, high), sets
  `percentage` 0 for away and HA's `ordered_list_item_to_percentage` otherwise (33, 66, 100), is on while the
  percentage is above 0, and has presets auto and manual. Home Assistant puts `percentage` and `percentage_step`
  (100 / speed count) in a fan's attributes, not the speed count itself.
- The live installation (ESPHome, yoziru/esphome-zehnder-comfoair) has all three kinds: a text sensor
  (`Away`/`Low`/`Medium`/`High`, the one its cards use), a fan entity (`on`, `percentage: 66`,
  `percentage_step: 33.333333333333336`, no presets) and a select with those four options. Step 0 is called "Away".
- The fan level picker is `sensorField('level')` in `src/editor/diagram-schema.ts`; `src/editor/fields.ts` has
  `sensorField`, `binarySensorField` and `switchableField`, each with a fixed domain list.
- The coil (`coilWire` in `src/diagram/drawing.ts`) is one path `COIL`, 3 units wide with round caps. Off: class
  `coil off`, stroked `--secondary-text-color` at opacity 0.5 by the card's CSS. On: a blurred glow path in the glow
  colour behind a wire stroked inline with `color-mix` (the glow colour towards the secondary text colour, then
  towards white by up to 45 %). The tap box `coilBox()` comes from `coilArea()`, the wire's bounds grown by the
  glow.
- The preview page (`dev/`) has a pre-heater kind choice and the frost scenario; the fan level is a mock sensor
  (`fanLevel(flow)` in `dev/mock-hass.ts`).
- Service mode on the live unit (2026-10-22): the ventilation mode sensor goes from `Active` to `Disabled`; the fan
  level sensor, the fan entity (`on`, 66 %), the select, the operating mode (`Auto`), the status binary sensor
  (`on`) and the fan duty sensors keep their last values; the supply flow falls to about 3 m³/h and the exhaust flow
  sensor stays near 21 m³/h. The fan speed sensors fell to 10 and 40 rpm (about 1900 and 1650 rpm afterwards).
- yoziru/esphome-zehnder-comfoair (`packages/text_sensors.yml`, `docs/PROTOCOL-PDO.md`): the ventilation mode text
  sensor is PDO 225 `ventilationConfiguration_sensorPresence`, with the states `Disabled` (0), `Active` (1) and
  `Overruling` (2, the fans modulate on a CO2 or humidity sensor). It is the state of sensor-based control, not a
  fan flag: it went to `Disabled` in service mode, and the firmware docs do not say whether it also reads `Disabled`
  on a unit without such sensors. Service mode itself (message code 80, or 76 on firmware 1.4.0) and standby
  (PDO 16 = 6) are not exposed as entities; the status binary sensor is the ESPHome connection, not the unit.
- Stream speeds come from `flowSpeed(flow, nominalFlow)` in `src/diagram/flow.ts`, passed as `speeds` to the
  drawing; `speedProperties` in `src/diagram/drawing.ts` pauses a stream whose speed is 0. Options are declared in
  `DIAGRAM_OPTIONS` (`src/diagram/options.ts`) with the kinds number, colour, boolean and choice
  (`src/lib/options.ts`); an option may sit inside a role group (`pre_heater.max_power`). The exchanger spans x 145
  to 255, y 26 to 174 of the 400 by 200 drawing; the bypass position label sits just below its top
  (`.bypass-position`, top 21.5 %), the saving badge on its centre.

## Goals / Non-Goals

**Goals:**

- The fan level text is a pure function, unit-tested on the integration's real attribute shapes.
- Existing configs render exactly as in v0.3, apart from the coil's centreline.
- The fan entity path is checked on the live installation without changing a dashboard.
- Whether ventilation is disabled is decided once, by a pure function, and every effect on the card reads that one
  result.

**Non-Goals:**

- Reading the fan level from a select's options or a fan's presets: a select already formats as its state.
- Changing how any other role is formatted.

## Decisions

### Fan level text: a role-specific formatter in front of `formatState`

A new pure function `fanLevelText(stateObj)` (in `src/lib/hass.ts`, next to `formatState`) returns a text or
`undefined`:

- `undefined` unless the entity is a `fan.*`, available, with a finite `percentage` and a positive
  `percentage_step`;
- with `round(100 / percentage_step) === 3`: the step `round(percentage / percentage_step)`, clamped to 0..3, named
  from `FAN_LEVELS` in `src/strings.ts` (`Away`, `Low`, `Medium`, `High`);
- otherwise the percentage, rounded, with NBSP and `%`.

`label()` uses `fanLevelText(...) ?? formatState(...)` for the `fans.level` role only, so the tooltip and the value
share the text. Unavailability is untouched: a fan entity that is unavailable gets `undefined` and falls through to
the existing hidden or "unavailable" handling, which reads the state, not the text.

Alternatives: putting the fan case inside `formatState` would change every role and the pre-heater box (a fan could
be set as any role in YAML); rejected. Reading `preset_mode` to show "Auto" next to the level: the operating mode
role covers it. Naming step 0 "Off": the unit still ventilates at away, and Zehnder's own sensors say "Away".

Rounding to the nearest step covers 33/66/100 and the 67 some integrations report; the clamp covers a percentage
above 100 or a rounding to 4.

### Fan level picker

A field helper `fanLevelField(name)` in `src/editor/fields.ts` with `domain: ['sensor', 'fan', 'select']`, used for
`level` in the fans section. Config validation already accepts any entity ID for a role, so nothing changes there;
a config test checks that a `fan.` and a `select.` ID load.

### Ventilation disabled: one role, one option, one decision

- **Role** `fans.ventilation_mode`: an entity whose state says whether the unit ventilates (a sensor, binary sensor
  or select). It is an input only: it gets no label in the top row, status grid or corners, so the label lists in
  `src/diagram/labels.ts` leave it out. Optional; without it nothing below happens.
- **Option** `fans.stopped_states`: a list of state strings, default `['Disabled']` (the ESPHome ventilation mode
  sensor's state in service mode; never `Overruling`, when the fans modulate). A binary sensor needs `off` added by
  the user. It needs a new option kind `list` in
  `src/lib/options.ts` (a string array; blank entries are dropped and an empty list falls back to the default; a value that is not a list
  of strings is an invalid option, as for the other kinds), declared in
  `DIAGRAM_OPTIONS` at the path `fans.stopped_states`, next to the role it qualifies, as `pre_heater.max_power` is.
  An advanced setting.
- **Decision**: a pure function `ventilationDisabled(stateObj, stoppedStates)` (in `src/diagram/flow.ts`, next to
  `flowSpeed`) is true only while the entity exists, is not unavailable or unknown, and its raw state, trimmed,
  equals one of the stopped states ignoring case. The raw state, not the formatted one, so the comparison does not
  depend on the user's language. Unavailable is not disabled: the card does not claim a stop it cannot see.
- **Effects**, all from that one result:
  - the fan level label's text (value, aria label and tooltip) is "Stopped" (`FAN_STOPPED` in `src/strings.ts`),
    ahead of `fanLevelText` and `formatState`. Its visibility (the unavailable rules, which read the level entity)
    and its tap (the level entity's more-info) are unchanged;
  - both `speeds` are 0, so both streams pause; the paths and their strengths (bypass, temperature colours) are
    drawn as before, and the flow labels still show what the flow sensors report;
  - the badge, the moisture figure and the effectiveness rings show no recovery, as with no airflow: the calculation
    gets a supply flow of 0 (`noAirflow` on the calculator in `src/calc/inputs.ts`), so the badge reads "0 W", the
    moisture figure "0 g/h" and the rings have no figure. Reason: the flow sensors read non-zero with the fans
    stopped (the exhaust flow about 21 m³/h), so the figures would show heat recovered by a stopped unit. The two
    bar cards do not read `fans.ventilation_mode` and are unchanged;
  - an alert on the drawing, centred over the exchanger above its top edge (y 26): `mdi:alert` in
    `--warning-color` with the text "Ventilation disabled" (`VENTILATION_DISABLED` in `src/strings.ts`), its tooltip
    "Ventilation disabled: <the mode entity's state as Home Assistant formats it>", and a tap that opens the
    ventilation mode entity's more-info. It is shown with the animation off too: it reports the unit, not the motion.
- **Editor**: a picker `ventilation_mode` in the fans section after `level`, with the domains sensor, binary sensor
  and select (a field helper like `fanLevelField`); `stopped_states` in the fans section as an advanced setting, with
  Home Assistant's `text` selector with `multiple: true`. If that selector does not edit a list in the card editor,
  a comma-separated text field that the option parses is the fallback; decided in task 1.8.

Alternatives: deciding from the flows needs no config, but the exhaust flow sensor read about 21 m³/h with the fans
stopped, so a threshold would be guesswork per unit; rejected. Deciding from the fan speed (rpm) sensors measures
the fans on any integration, but adds two roles and a threshold; the user chose the mode entity (2026-10-22), opted
into per card, and kept rpm out of this change. Fixed states (`Disabled`, `off`) without an option:
other integrations word it differently; rejected. Showing the ventilation mode as a status grid label: the alert
says it only when it matters; rejected (see proposal, Out of Scope). Hiding the fan level label while stopped: the
level the unit returns to is still useful, but showing it as if running is wrong; "Stopped" with the level entity
on tap keeps both.

### Coil centreline: a second path over the wire

`coilWire` adds a path `coil-core` with the same `d` as the wire, stroke width 1 (a third of the wire's 3), round
caps, after the wire, in both states. Its stroke is the wire's colour mixed with black:

- off: `color-mix(in srgb, var(--secondary-text-color) 55%, black)`; the off wire's 0.5 opacity moves from the path to
  a `<g class="coil off">` around wire and centreline, so the centreline is darker than the wire as drawn rather than
  as opaque as the text colour;
- on: `color-mix(in srgb, <wire stroke> 60%, black)`, so it darkens with the wire's own colour and stays darker than
  the lightened core at every level.

The shares are starting points for the feedback round. Because the centreline follows the wire's path and is
narrower, it stays inside the wire and inside `coilArea()`, so the box, the glow filter region and the tap are
unchanged. The class names keep the existing CSS: `.coil` keeps the round caps for both paths, `.coil.off` moves to
the group.

Alternative: a lighter centreline (a highlight, as on a shaded cylinder) instead of a darker one. The backlog asks
for a darker line; the lit core of the glowing coil is already lighter than its halo. Offered in the feedback round
if the darker line reads as a groove.

### Preview page

A "fan level kind" choice in the fans fieldset: sensor (as now), fan entity (the mock fan's `percentage` from the
same level as `fanLevel(flow)`: 0, 33, 66 or 100, `percentage_step` 33.33, state off at 0) and select. A
"ventilation" control (active, disabled) drives a mock ventilation mode sensor (`Active` or `Disabled`) set as
`fans.ventilation_mode`; while disabled the mock flows keep their values, so the preview shows that the streams stand
still because of the mode, not the flows. The coil needs nothing new: the pre-heater kinds and the frost scenario
show it off and glowing.

## Risks / Trade-offs

- [The centreline makes a dim coil look busier or reads as a groove] → feedback round in light and dark at 280 to
  600 px, off and at 250 of 1000 W; the shares and the width are constants.
- [A fan entity with a speed count of 3 that is not a ComfoAir maps to Away/Low/Medium/High] → acceptable: the role
  is the unit's fan level, and the names are those of the unit's speeds.
- [`percentage_step` is missing on fans without set-speed support] → `fanLevelText` returns `undefined` and the
  label shows Home Assistant's state, as before.
- [The off coil's opacity moves to a group] → a browser test that the off coil stays distinguishable from the stream
  (the existing "Off" test) still passes.
- [The alert crowds the bypass path, the bypass position label or the top row at 280 px or in the compact layout]
  → feedback round on the preview page in both layouts at 280, 400 and 600 px, light and dark, with the bypass
  closed and open; the alert's place and size are CSS constants.
- [On a unit without CO2 or humidity sensors the ESPHome ventilation mode may read `Disabled` all the time, which
  would show the alert permanently] → the role is opt-in, and the README says to set it only if the entity reads
  `Active` (or `Overruling`) while the unit runs normally.
- [Another integration reports a stop in words the default does not cover] → `fans.stopped_states` is configurable,
  and the README names the states known per integration.
- [A ventilation mode entity that is unavailable while the unit is stopped] → the card shows the level and moving
  air as before; claiming a stop from a missing value would be worse.

## Migration Plan

1. Deploy `dist/` and bump the Lovelace resource `?v=` (group 1, for the live check, and the release).
2. Check live with Playwright, without saving anything: create a `hrv-ventilation-card` in the page with the live
   `hass` and the installation's config, first with `fans.level` set to its fan entity (done on `?v=14`), then with
   `fans.ventilation_mode` set to its ventilation mode sensor, reading the level label and the alert. If the unit is
   not in service mode then, give the card a copy of `hass` with that sensor's state set to `Disabled`.
3. At the release, add `fans.ventilation_mode` to both live diagram cards (each dashboard save confirmed by the
   user); the default stopped states fit the sensor, which reads `Active` in normal use. The fan level stays the
   sensor.
4. Rollback: remove the role from the two cards and set the resource back to the v0.3.0 bundle (the previous `?v=`
   in `private/installation.md`).
