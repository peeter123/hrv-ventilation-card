# Spec Delta

## ADDED Requirements

### Requirement: Fan level from a fan entity
`fans.level` MAY be a `fan` entity. While it has a numeric `percentage` and a `percentage_step` that gives three
speeds, the fan level label SHALL show the step it is at: Away at 0 %, else Low, Medium or High, the nearest step by
percentage / step. With another number of speeds it SHALL show the percentage with its unit. Unavailable, or without
a percentage, it SHALL show the state as Home Assistant formats it. The tooltip SHALL show the same text.

#### Scenario: Three-speed fan at medium
- **WHEN** `fans.level` is a fan entity that is on with `percentage: 66` and `percentage_step: 33.33`
- **THEN** the fan level label shows "Medium"
- **AND** its tooltip is "Fan level: Medium"

#### Scenario: Three-speed fan at the lowest level
- **WHEN** `fans.level` is a fan entity that is off with `percentage: 0` and `percentage_step: 33.33`
- **THEN** the fan level label shows "Away"

#### Scenario: Rounded percentage
- **WHEN** `fans.level` is a fan entity with `percentage: 67` or `percentage: 33` and `percentage_step: 33.33`
- **THEN** the fan level label shows "Medium" or "Low"

#### Scenario: Fan with another number of speeds
- **WHEN** `fans.level` is a fan entity with `percentage: 40` and `percentage_step: 10`
- **THEN** the fan level label shows "40 %" with a no-break space before the unit

#### Scenario: Fan without a percentage
- **WHEN** `fans.level` is a fan entity that has no `percentage` attribute, or is unavailable
- **THEN** the fan level label shows its state as Home Assistant formats it, as any other label
- **AND** while unavailable it follows the rules for unavailable values

#### Scenario: Tapping a fan level from a fan entity
- **WHEN** the user taps the fan level label of a fan entity
- **THEN** the more-info dialog of that fan entity opens

#### Scenario: Fan level sensor
- **WHEN** `fans.level` is a sensor with the state "Medium"
- **THEN** the fan level label shows "Medium", as Home Assistant formats it

### Requirement: Pre-heater coil centreline
The coil's wire SHALL have a thin centreline along its whole length, darker than the wire and narrower than it, so
the coil reads as a wire with depth. The centreline SHALL be drawn while the coil is off and while it glows, SHALL
stay inside the wire, and SHALL NOT change the coil's glow, its tap box or its tooltip.

#### Scenario: Off coil
- **WHEN** the pre-heater power is 0 W
- **THEN** a centreline darker than the dim wire runs along the wire, in light and dark themes

#### Scenario: Glowing coil
- **WHEN** the pre-heater is on at any level
- **THEN** a centreline darker than the lightened wire runs along it, and the glow behind the wire is unchanged

#### Scenario: Inside the wire
- **WHEN** the coil is drawn
- **THEN** the centreline follows the wire's path and is narrower than the wire, so no part of it lies outside the
  wire

#### Scenario: No pre-heater
- **WHEN** no `pre_heater.power` is configured
- **THEN** neither the coil nor its centreline is drawn

### Requirement: Ventilation mode role
`fans.ventilation_mode` MAY be set to a sensor, binary sensor or select. Ventilation SHALL count as disabled while
that entity is available and its state, trimmed and ignoring case, equals one of `fans.stopped_states` (default:
`Disabled`). The role SHALL have no label of its own.

#### Scenario: Role without a label
- **WHEN** `fans.ventilation_mode` is configured
- **THEN** no label in the top row, status grid or on the drawing shows its state

### Requirement: Ventilation disabled
While ventilation is disabled, the fan level label SHALL show "Stopped", both air streams SHALL stand still whatever
the flow entities report, and the drawing SHALL show an alert icon with the text "Ventilation disabled" above the
exchanger. Otherwise the card SHALL behave as without the role.

#### Scenario: Service mode on an ESPHome unit
- **WHEN** `fans.ventilation_mode` is a sensor with the state "Disabled", the fan level sensor reports "Medium" and
  both flow entities report more than 0
- **THEN** the fan level label shows "Stopped" and its tooltip is "Fan level: Stopped"
- **AND** neither the supply nor the exhaust stream moves, while the paths are drawn at their strengths as before
- **AND** an alert icon with "Ventilation disabled" is shown above the exchanger

#### Scenario: Ventilating normally
- **WHEN** `fans.ventilation_mode` reports "Active" or "Overruling"
- **THEN** the card shows the fan level and moves the air as without the role, and shows no alert

#### Scenario: Custom stopped states
- **WHEN** `fans.ventilation_mode` is a binary sensor that is off and `fans.stopped_states` is `["off"]`
- **THEN** ventilation counts as disabled

#### Scenario: Default stopped states and a binary sensor
- **WHEN** `fans.ventilation_mode` is a binary sensor that is off and `fans.stopped_states` is not set
- **THEN** ventilation does not count as disabled

#### Scenario: Mode entity unavailable
- **WHEN** the `fans.ventilation_mode` entity is unavailable or unknown
- **THEN** the card shows the fan level and moves the air as without the role, and shows no alert

#### Scenario: Tapping the alert
- **WHEN** the user taps the alert
- **THEN** the more-info dialog of the `fans.ventilation_mode` entity opens
- **AND** the alert's tooltip is "Ventilation disabled: " followed by that entity's state as Home Assistant formats it

#### Scenario: Tapping the stopped fan level
- **WHEN** ventilation is disabled and the user taps the fan level label
- **THEN** the more-info dialog of the `fans.level` entity opens

#### Scenario: Animation off
- **WHEN** ventilation is disabled and the animation is off or reduced motion is on
- **THEN** the alert and "Stopped" are still shown

#### Scenario: No mode entity
- **WHEN** `fans.ventilation_mode` is not configured
- **THEN** the card renders as in v0.3, apart from the other changes in v0.4

### Requirement: Recovery while ventilation disabled
While ventilation is disabled, the saving badge, the moisture figure and the effectiveness rings SHALL show no
recovery, as with no airflow, because the flow entities still read above 0 with the fans stopped. The flow labels
SHALL keep showing what the flow entities report.

#### Scenario: Recovery while ventilation disabled
- **WHEN** `fans.ventilation_mode` reads a stopped state and the flow entities read more than 0
- **THEN** the badge, the moisture figure and the rings show no recovery, as with no airflow
- **AND** the flow labels still show what the flow entities report

## MODIFIED Requirements

### Requirement: Entities come from the card config
The card SHALL take every displayed entity from its config, grouped by role: the four air streams (temperature,
relative humidity, absolute humidity each), fans (level, supply flow, exhaust flow, ventilation mode), bypass
(position, mode, next change), status (operating mode, profile target temperature, temperature profile, next fan
change, filter days remaining, power, running mean outdoor temperature, saved heating power, saved cooling power,
moisture recovery), pre-heater (power, energy) and seasons (heating, cooling).

#### Scenario: Card configured for another unit
- **WHEN** the config points the roles at a different unit's entities
- **THEN** each label shows the state of the configured entity for its role

#### Scenario: Pre-heater roles
- **WHEN** the config sets `pre_heater.power` and `pre_heater.energy`
- **THEN** the coil on the drawing follows the power entity and the status grid shows the energy entity

### Requirement: Animated air flow
The card SHALL animate moving air along each drawn stream path in the direction of flow, including the bypass path,
so the share of air taking each route is visible. Each path's animation SHALL be as strong as that path's drawn
strength. A stream with a flow of 0 SHALL not move, and no stream SHALL move while ventilation is disabled (see
"Ventilation disabled").

#### Scenario: Bypass half open
- **WHEN** the bypass position is 50 and the supply flow is above 0
- **THEN** air moves both through the exchanger and along the bypass path, each at half strength

#### Scenario: Bypass fully open
- **WHEN** the bypass position is 100
- **THEN** outdoor air moves only along the bypass path and none through the exchanger on the supply side
- **AND** extract air still moves through the exchanger to the exhaust

#### Scenario: Fans stopped
- **WHEN** the supply flow entity reports 0
- **THEN** the outdoor-to-supply stream does not move, while the extract-to-exhaust stream follows its own flow

#### Scenario: Ventilation disabled with flow readings
- **WHEN** ventilation is disabled and the exhaust flow entity still reports 21 m3/h
- **THEN** no stream moves, including the bypass path

### Requirement: Values formatted by Home Assistant
Each label SHALL show its entity's state formatted the way Home Assistant formats it (unit, precision, number
format, translated state), except the fan level of a fan entity (see "Fan level from a fan entity") and the fan
level while ventilation is disabled (see "Ventilation disabled"), and tapping a label SHALL open the more-info
dialog of its entity.

#### Scenario: Tapping a label
- **WHEN** the user taps the supply air temperature label
- **THEN** the more-info dialog of the configured supply air temperature entity opens

#### Scenario: Entity precision
- **WHEN** an entity has a display precision of 1 decimal set in Home Assistant
- **THEN** its label shows the value with 1 decimal and its unit

### Requirement: Visual editor
The card SHALL offer a visual editor with an exchanger type choice first, then one entity picker per role, grouped
in collapsible sections per group, with the four temperatures marked as required, an animation switch and an effectiveness switch. Pickers
SHALL only offer entities of a fitting domain. The smoothing window, air density, cold and warm colours, layout
choice, show-unavailable switch, nominal flow, stopped states, pre-heater maximum power and glow colour and the next fan change, next bypass change, target temperature,
temperature profile, saved heating power, saved cooling power and moisture recovery pickers SHALL be advanced settings.

#### Scenario: Editing the card
- **WHEN** the user opens the card's editor with the advanced settings off
- **THEN** an exchanger type choice (HRV or ERV) comes first, then the roles grouped per air stream, fans, bypass,
  status, pre-heater and seasons, followed by the animation switch and the effectiveness switch
- **AND** the season pickers only offer binary sensors
- **AND** the fan level picker offers sensors, fans and selects, and the flow pickers sensors
- **AND** the fans section has a ventilation mode picker after the fan level, offering sensors, binary sensors and
  selects, and no stopped states field
- **AND** the pre-heater power picker offers sensors, binary sensors and switches, and the energy picker sensors
- **AND** the status section shows no next fan change, next bypass change, target temperature, temperature
  profile, saved heating power, saved cooling power or moisture recovery picker
- **AND** the pre-heater section shows no maximum power or glow colour

#### Scenario: Advanced settings on
- **WHEN** the user turns the advanced settings on
- **THEN** the niche status pickers, including the two saved power pickers and moisture recovery, appear in the status section,
  the stopped states (showing the default `Disabled`) appear in the fans section,
  the maximum power and the glow colour (showing its orange default) appear in the pre-heater section,
  and the colours, layout, unavailable values, nominal flow and a calculation section with smoothing and air
  density appear
