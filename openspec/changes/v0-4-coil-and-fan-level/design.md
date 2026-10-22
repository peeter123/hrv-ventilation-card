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

## Goals / Non-Goals

**Goals:**

- The fan level text is a pure function, unit-tested on the integration's real attribute shapes.
- Existing configs render exactly as in v0.3, apart from the coil's centreline.
- The fan entity path is checked on the live installation without changing a dashboard.

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
same level as `fanLevel(flow)`: 0, 33, 66 or 100, `percentage_step` 33.33, state off at 0) and select. The coil needs
nothing new: the pre-heater kinds and the frost scenario show it off and glowing.

## Risks / Trade-offs

- [The centreline makes a dim coil look busier or reads as a groove] → feedback round in light and dark at 280 to
  600 px, off and at 250 of 1000 W; the shares and the width are constants.
- [A fan entity with a speed count of 3 that is not a ComfoAir maps to Away/Low/Medium/High] → acceptable: the role
  is the unit's fan level, and the names are those of the unit's speeds.
- [`percentage_step` is missing on fans without set-speed support] → `fanLevelText` returns `undefined` and the
  label shows Home Assistant's state, as before.
- [The off coil's opacity moves to a group] → a browser test that the off coil stays distinguishable from the stream
  (the existing "Off" test) still passes.

## Migration Plan

1. Deploy `dist/` and bump the Lovelace resource `?v=`. No dashboard config changes: the live diagram cards keep the
   fan level sensor.
2. Check the fan path live with Playwright: create a `hrv-ventilation-card` in the page with the live `hass` and the
   installation's config with `fans.level` set to its fan entity, and read the label text, without saving anything.
3. Rollback: set the resource back to the v0.3.0 bundle (the previous `?v=` in `private/installation.md`).
