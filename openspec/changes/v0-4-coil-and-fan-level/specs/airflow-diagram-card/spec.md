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

## MODIFIED Requirements

### Requirement: Values formatted by Home Assistant
Each label SHALL show its entity's state formatted the way Home Assistant formats it (unit, precision, number
format, translated state), except the fan level of a fan entity (see "Fan level from a fan entity"), and tapping a
label SHALL open the more-info dialog of its entity.

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
choice, show-unavailable switch, nominal flow, pre-heater maximum power and glow colour and the next fan change, next bypass change, target temperature,
temperature profile, saved heating power, saved cooling power and moisture recovery pickers SHALL be advanced settings.

#### Scenario: Editing the card
- **WHEN** the user opens the card's editor with the advanced settings off
- **THEN** an exchanger type choice (HRV or ERV) comes first, then the roles grouped per air stream, fans, bypass,
  status, pre-heater and seasons, followed by the animation switch and the effectiveness switch
- **AND** the season pickers only offer binary sensors
- **AND** the fan level picker offers sensors, fans and selects, and the flow pickers sensors
- **AND** the pre-heater power picker offers sensors, binary sensors and switches, and the energy picker sensors
- **AND** the status section shows no next fan change, next bypass change, target temperature, temperature
  profile, saved heating power, saved cooling power or moisture recovery picker
- **AND** the pre-heater section shows no maximum power or glow colour

#### Scenario: Advanced settings on
- **WHEN** the user turns the advanced settings on
- **THEN** the niche status pickers, including the two saved power pickers and moisture recovery, appear in the status section,
  the maximum power and the glow colour (showing its orange default) appear in the pre-heater section,
  and the colours, layout, unavailable values, nominal flow and a calculation section with smoothing and air
  density appear
