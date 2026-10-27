# Spec Delta

## MODIFIED Requirements

### Requirement: Entities come from the card config
The card SHALL take every displayed entity from its config, grouped by role: the four air streams (temperature,
relative humidity, absolute humidity each), fans (level, supply flow, exhaust flow, ventilation mode), bypass
(position, mode, next change), status (operating mode, profile target temperature, temperature profile, next fan
change, filter days remaining, power, running mean outdoor temperature, saved heating power, saved cooling power,
moisture recovery, moisture put outside), pre-heater (power, energy, after temperature, after humidity) and seasons
(heating, cooling).

#### Scenario: Card configured for another unit
- **WHEN** the config points the roles at a different unit's entities
- **THEN** each label shows the state of the configured entity for its role

#### Scenario: Pre-heater roles
- **WHEN** the config sets `pre_heater.power` and `pre_heater.energy`
- **THEN** the coil on the drawing follows the power entity and the status grid shows the energy entity

#### Scenario: Pre-heater after roles
- **WHEN** the config sets `pre_heater.temperature_after` and `pre_heater.humidity_after` and the pre-heater runs
- **THEN** the saving badge and the rings show the figures of the shared calculation with the exchanger's inlet after
  the pre-heater, and no label shows the two entities

### Requirement: Labels on the drawing
Each stream's temperature and humidities SHALL be shown next to that stream's end on the drawing, the bypass
position at the top of the exchanger, just inside its outline, the saving badge on its centre and, on an ERV, the
moisture recovery figure right of the exchanger, at the height of its centre and the house symbol's, and the moisture
put-outside figure left of the exchanger, between the outdoor symbol and the bypass path. The supply and exhaust flow
SHALL be shown below the tip of the supply and the exhaust arrow, clear of the bypass path. With the automatic
layout, labels SHALL NOT overlap each other or the arrowheads and SHALL NOT extend outside the card at any card width
from 280 px.

#### Scenario: Stream labels
- **WHEN** the outdoor air entities are configured
- **THEN** the outdoor temperature and humidities are shown next to the outdoor end of the outdoor-to-supply stream

#### Scenario: Flow labels
- **WHEN** the supply and exhaust flow entities are configured and the layout is full
- **THEN** the supply flow is shown below the supply arrow's tip and the exhaust flow below the exhaust arrow's tip,
  clear of the bypass path at 100 % and of the corner labels

#### Scenario: ERV at the narrowest width
- **WHEN** the type is ERV, the bypass is at 50 % and the card is 280 px wide
- **THEN** the bypass position and the badge are inside the exchanger, the moisture recovery figure right of it,
  between the exchanger and the house symbol, and the moisture put-outside figure left of it, between the outdoor
  symbol and the bypass path, without overlapping

### Requirement: Visual editor
The card SHALL offer a visual editor with an exchanger type choice first, then one entity picker per role, grouped
in collapsible sections per group, with the four temperatures marked as required, an animation switch and an effectiveness switch. Pickers
SHALL only offer entities of a fitting domain. The smoothing window, air density, cold and warm colours, layout
choice, show-unavailable switch, nominal flow, stopped states, pre-heater maximum power and glow colour and the next fan change, next bypass change, target temperature,
temperature profile, saved heating power, saved cooling power, moisture recovery and moisture put-outside pickers SHALL be advanced settings.

#### Scenario: Editing the card
- **WHEN** the user opens the card's editor with the advanced settings off
- **THEN** an exchanger type choice (HRV or ERV) comes first, then the roles grouped per air stream, fans, bypass,
  status, pre-heater and seasons, followed by the animation switch and the effectiveness switch
- **AND** the season pickers only offer binary sensors
- **AND** the fan level picker offers sensors, fans and selects, and the flow pickers sensors
- **AND** the fans section has a ventilation mode picker after the fan level, offering sensors, binary sensors and
  selects, and no stopped states field
- **AND** the pre-heater power picker offers sensors, binary sensors and switches, and the energy, after temperature
  and after humidity pickers sensors
- **AND** the status section shows no next fan change, next bypass change, target temperature, temperature
  profile, saved heating power, saved cooling power, moisture recovery or moisture put-outside picker
- **AND** the pre-heater section shows no maximum power or glow colour

#### Scenario: Advanced settings on
- **WHEN** the user turns the advanced settings on
- **THEN** the niche status pickers, including the two saved power pickers, moisture recovery and moisture put
  outside, appear in the status section,
  the stopped states (showing the default `Disabled`) appear in the fans section,
  the maximum power and the glow colour (showing its orange default) appear in the pre-heater section,
  and the colours, layout, unavailable values, nominal flow and a calculation section with smoothing and air
  density appear

### Requirement: Saving and moisture recovery entities
The card SHALL take four more optional roles from its config: a saved heating power entity
(`status.heating_saving`), a saved cooling power entity (`status.cooling_saving`), a moisture recovery entity
(`status.moisture_recovery`) and a moisture put-outside entity (`status.moisture_outside`). They do not change any
figure. They only set what the badge and the two moisture figures open.

#### Scenario: Roles configured
- **WHEN** the config sets `status.heating_saving`, `status.cooling_saving`, `status.moisture_recovery` and
  `status.moisture_outside`
- **THEN** the card renders as before, with the same calculated badge and moisture figures

### Requirement: Recovery while ventilation disabled
While ventilation is disabled, the saving badge, the two moisture figures and the effectiveness rings SHALL show no
recovery, as with no airflow, because the flow entities still read above 0 with the fans stopped. The flow labels
SHALL keep showing what the flow entities report.

#### Scenario: Recovery while ventilation disabled
- **WHEN** `fans.ventilation_mode` reads a stopped state and the flow entities read more than 0
- **THEN** the badge, the two moisture figures and the rings show no recovery, as with no airflow
- **AND** the flow labels still show what the flow entities report

## ADDED Requirements

### Requirement: Moisture put-outside figure on ERV
Under the same conditions as the moisture recovery figure, the card SHALL show the calculated moisture put outside in
g/h left of the exchanger: its magnitude without a sign after a direction icon, `mdi:water-remove` while
moisture is put outside (0 or more) and `mdi:water-plus` while the ventilation brings it in. The tooltip
SHALL name the direction with the magnitude. Where the figure does not fit on one line, its unit SHALL go to a second
line.

#### Scenario: Moisture put outside
- **WHEN** the type is ERV and the calculated moisture put outside is 230 g/h
- **THEN** left of the exchanger a water-remove icon is followed by "230 g/h", with the tooltip "Moisture put outside:
  230 g/h"

#### Scenario: Moisture brought in
- **WHEN** the type is ERV and the calculated moisture put outside is -200 g/h
- **THEN** left of the exchanger a water-plus icon is followed by "200 g/h", without a minus sign, with the tooltip
  "Moisture brought in: 200 g/h"

#### Scenario: Input unavailable
- **WHEN** the type is ERV and the supply flow entity is unavailable
- **THEN** the put-outside figure is hidden, or shows "n/a" when the show-unavailable option is on, like the moisture
  recovery figure

#### Scenario: HRV
- **WHEN** the type is HRV and humidity is configured for the three streams
- **THEN** no moisture put-outside figure is shown

### Requirement: Moisture put-outside figure clear of the bypass
The put-outside figure SHALL be centred in the space between the outdoor symbol and the bypass path at 100 %, at the
height of the exchanger's centre, and SHALL stay clear of the bypass path at any bypass position, the outdoor symbol,
the pre-heater coil, the streams and the corner labels, with its text at least 11 px high.

#### Scenario: Four-digit figure with the bypass open
- **WHEN** the type is ERV, the put-outside figure is -1500 g/h, the bypass is at 100 %, the pre-heater coil is drawn
  and the card is 280 to 600 px wide, in both layouts
- **THEN** the figure does not overlap the bypass path, the outdoor symbol, the coil, the streams or the corner
  labels, and its text stays at least 11 px high

### Requirement: Moisture put-outside figure opens its entity
Tapping the put-outside figure SHALL open the more-info dialog of the `status.moisture_outside` entity. Without that
role configured, the figure SHALL NOT be tappable or focusable and SHALL NOT open any dialog.

#### Scenario: Entity configured
- **WHEN** `status.moisture_outside` is configured and the user taps the put-outside figure
- **THEN** the more-info dialog of that entity opens

#### Scenario: No entity
- **WHEN** `status.moisture_outside` is not configured
- **THEN** the put-outside figure has no `tabindex` and a tap opens no dialog
