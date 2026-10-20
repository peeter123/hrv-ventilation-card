# Spec Delta

## MODIFIED Requirements

### Requirement: Entities come from the card config
The card SHALL take every displayed entity from its config, grouped by role: the four air streams (temperature,
relative humidity, absolute humidity each), fans (level, supply flow, exhaust flow), bypass (position, mode, next
change), status (operating mode, profile target temperature, temperature profile, next fan change, filter days
remaining, power, running mean outdoor temperature, saved heating power, saved cooling power, moisture recovery), pre-heater (power, energy) and seasons (heating, cooling).

#### Scenario: Card configured for another unit
- **WHEN** the config points the roles at a different unit's entities
- **THEN** each label shows the state of the configured entity for its role

#### Scenario: Pre-heater roles
- **WHEN** the config sets `pre_heater.power` and `pre_heater.energy`
- **THEN** the coil on the drawing follows the power entity and the status grid shows the energy entity

### Requirement: Top row and status grid
The season icon, power and running mean outdoor temperature SHALL be shown in a top row above the drawing: the icon
at the left, power centred on the card and the running mean outdoor temperature at the right. The status values
SHALL be shown below the drawing in a grid of three equal columns, one subject each, with a fixed cell per value:
the fans (fan level, next fan change, filter days), the bypass (bypass mode, next bypass change, pre-heater energy) and comfort
(operating mode, temperature profile, profile target temperature), top to bottom. A value SHALL keep its cell
whatever the states, and an unconfigured value SHALL leave its cell empty, so nothing shifts. A value SHALL be
centred in its cell. A value too long for its cell SHALL be cut off with an ellipsis; its tooltip gives it in full.
Only the running mean outdoor temperature keeps a text prefix ("RMOT "), where an icon alone would not say what the
value is. A line SHALL separate the top row from the drawing and the drawing from the status grid, each as wide as
the content, from the left to the right corner stack, and the status grid SHALL be centred on the card. Every
label of these two rows SHALL have an icon in front, as high as its text and centred vertically on it: power
`mdi:lightning-bolt`, running mean outdoor temperature `mdi:thermometer-lines`, fan level `mdi:fan`, bypass mode
`mdi:shuffle-variant`, next bypass change and next fan change `mdi:timer-outline`, operating mode `mdi:cog-outline`,
profile target temperature `mdi:thermometer`, temperature profile `mdi:thermostat`, filter days
`mdi:air-filter`, and pre-heater power and pre-heater energy `mdi:heating-coil`. Every label SHALL have a tooltip with its name and state, e.g. "Next bypass change: 01:30".

#### Scenario: Label icons
- **WHEN** power and the fan level are configured
- **THEN** power shows as a lightning bolt followed by its state, and the fan level as a fan followed by its state

#### Scenario: Status grid
- **WHEN** the fan level and status entities are configured and the card is 500 px wide
- **THEN** they are shown in the grid below the drawing, not on the drawing, the fan level in the first column's
  top cell and the profile target temperature in the third column's bottom cell

#### Scenario: Unconfigured value
- **WHEN** no next fan change entity is configured
- **THEN** its cell stays empty and the filter days stay in the first column's bottom cell

#### Scenario: Pre-heater energy cell
- **WHEN** `pre_heater.energy` is configured and reports 12 kWh
- **THEN** the second column's bottom cell shows a heating coil followed by "12 kWh", with the tooltip
  "Pre-heater energy: 12 kWh"

#### Scenario: Icon centred on its text
- **WHEN** the card is shown at 400 px and at 600 px wide
- **THEN** the vertical centre of every top row and status grid icon is within 1 px of the centre of its label's text

#### Scenario: Centred cells
- **WHEN** the first column shows a fan level "2" and filter days "120 d"
- **THEN** both values are centred in the first column, so their horizontal centres line up

### Requirement: Rows follow the config
The top row SHALL be shown while at least one of power, running mean outdoor temperature, pre-heater power or a season entity is
configured, and the status grid while at least one of its roles is configured, regardless of the current states.
A row with none of its roles configured SHALL NOT be shown.

#### Scenario: No top row roles
- **WHEN** no power, running mean outdoor temperature, pre-heater power or season entity is configured
- **THEN** no top row is shown and the card starts with the drawing

#### Scenario: Only season entities, between seasons
- **WHEN** only the two season entities of the top row are configured and both are off
- **THEN** the top row is shown with the between-seasons icon

#### Scenario: Only pre-heater power, pre-heater off
- **WHEN** of the top row's roles only `pre_heater.power` is configured and it reports 0 W
- **THEN** the top row is shown, empty, so the card keeps its height when the pre-heater switches on

#### Scenario: No status roles
- **WHEN** none of the status grid's roles is configured
- **THEN** no status grid is shown and the card ends with the drawing

#### Scenario: All status values unavailable
- **WHEN** the status grid's roles are configured but all their entities are unavailable
- **THEN** the status grid keeps its place, so the card does not change height

### Requirement: Visual editor
The card SHALL offer a visual editor with an exchanger type choice first, then one entity picker per role, grouped
in collapsible sections per group, with the four temperatures marked as required, an animation switch and an effectiveness switch. Pickers
SHALL only offer entities of a fitting domain. The smoothing window, air density, cold and warm colours, layout
choice, show-unavailable switch, nominal flow, pre-heater maximum power and the next fan change, next bypass change, target temperature,
temperature profile, saved heating power, saved cooling power and moisture recovery pickers SHALL be advanced settings.

#### Scenario: Editing the card
- **WHEN** the user opens the card's editor with the advanced settings off
- **THEN** an exchanger type choice (HRV or ERV) comes first, then the roles grouped per air stream, fans, bypass,
  status, pre-heater and seasons, followed by the animation switch and the effectiveness switch
- **AND** the season pickers only offer binary sensors
- **AND** the pre-heater power picker offers sensors, binary sensors and switches, and the energy picker sensors
- **AND** the status section shows no next fan change, next bypass change, target temperature, temperature
  profile, saved heating power, saved cooling power or moisture recovery picker
- **AND** the pre-heater section shows no maximum power

#### Scenario: Advanced settings on
- **WHEN** the user turns the advanced settings on
- **THEN** the niche status pickers, including the two saved power pickers and moisture recovery, appear in the status section,
  the maximum power appears in the pre-heater section,
  and the colours, layout, unavailable values, nominal flow and a calculation section with smoothing and air
  density appear

## ADDED Requirements

### Requirement: Effectiveness rings
With `show_effectiveness: true` (default false) and the calculation's inputs configured (humidity only for the moisture
ring), the card SHALL draw two progress
rings on the exchanger, both starting at the top centre and running clockwise: the moisture effectiveness along the
outer rim and the temperature effectiveness along the inner outline. Each SHALL be as long as its figure from the
shared calculation, 0 to 100 % of the way round, over a faint full-length track.

#### Scenario: Heating with both figures
- **WHEN** the type is ERV, the option is on and the temperature effectiveness is 92 % and the moisture effectiveness
  65 %
- **THEN** the inner ring runs 92 % of the way round the inner outline and the outer ring 65 % of the way round the
  rim

#### Scenario: Option off
- **WHEN** the config does not set `show_effectiveness`
- **THEN** the exchanger is drawn as before, without rings or tracks

#### Scenario: Not a boolean
- **WHEN** the config sets `show_effectiveness: "yes"`
- **THEN** the card shows a configuration error that names `show_effectiveness`

#### Scenario: Both layouts
- **WHEN** the option is on and the card is 320 px wide with the automatic layout
- **THEN** the rings are drawn as in the full layout

### Requirement: Rings by exchanger type
An HRV SHALL show only the temperature ring, with the rim left as it is. An ERV SHALL show both rings while every
stream has a humidity, and only the temperature ring otherwise.

#### Scenario: HRV with humidity sensors
- **WHEN** the type is HRV, the option is on and humidity is configured for the three streams
- **THEN** only the inner ring and its track are drawn

#### Scenario: ERV without humidity
- **WHEN** the type is ERV, the option is on and no humidity entities are configured
- **THEN** only the inner ring and its track are drawn

### Requirement: Ring colours
The temperature ring SHALL be drawn in the warm colour in heating mode and the cold colour in cooling mode, the
moisture ring in a blue-teal distinct from both. Both rings SHALL stay visible against the HRV and the ERV fill in
light and dark themes, and SHALL NOT reduce the contrast of the badge or the moisture figure.

#### Scenario: Cooling mode
- **WHEN** the calculation is in cooling mode and the option is on
- **THEN** the inner ring is drawn in the configured cold colour

#### Scenario: Text on the exchanger
- **WHEN** the option is on and the type is ERV, in the light and the dark preview theme
- **THEN** the badge and the moisture figure keep a contrast of at least 4.5:1, and the rings and the streams do not
  cover the badge or the bypass position; where a ring meets the moisture figure on a narrow card, the figure has a
  halo in the exchanger's colour, so it keeps 4.5:1 against its halo and stays at least 11 px high

### Requirement: Rings without a figure
While a figure is not measurable (its gradient below the calculation's gate) or the calculation has no value, its
ring SHALL be empty, with its track still drawn, so the exchanger does not change shape.

#### Scenario: Small temperature gradient
- **WHEN** the option is on and the extract air is 22 °C and the outdoor air 20 °C
- **THEN** the inner ring is empty and its track is drawn

#### Scenario: Input unavailable
- **WHEN** the option is on and the supply flow entity is unavailable
- **THEN** both rings are empty and their tracks are drawn

### Requirement: Rings are labelled
The rings SHALL have a tooltip and an accessible name with the figure of each drawn ring in whole percent, naming
them as the unit's effectiveness, with "not measurable" for a figure without a value. While the bypass is above 0 %
the text SHALL also give the bypass position. The rings SHALL NOT be tappable.

#### Scenario: Bypass closed
- **WHEN** the temperature effectiveness is 92 %, the moisture effectiveness 65 % and the bypass 0 %
- **THEN** the tooltip reads "Effectiveness: temperature 92 %, moisture 65 %"

#### Scenario: Bypass modulating
- **WHEN** the temperature effectiveness is 61 %, the moisture effectiveness is not measurable and the bypass 40 %
- **THEN** the tooltip reads "Effectiveness: temperature 61 %, moisture not measurable (bypass 40 %)"

### Requirement: Pre-heater coil on the drawing
With `pre_heater.power` configured, the card SHALL draw a heating coil across the outdoor-to-supply stream, between
the outdoor symbol and the exchanger, in both layouts. Without it no coil SHALL be drawn. The coil SHALL NOT overlap
a label at any card width from 280 px.

#### Scenario: Coil drawn
- **WHEN** `pre_heater.power` is configured
- **THEN** a coil is drawn on the outdoor stream, left of the exchanger

#### Scenario: No pre-heater
- **WHEN** no `pre_heater.power` is configured
- **THEN** the drawing has no coil

#### Scenario: Narrow card with all outdoor labels
- **WHEN** the card is 280 to 600 px wide and the outdoor temperature and both humidities are configured
- **THEN** the coil does not overlap the outdoor labels, the flow labels or the bypass position

### Requirement: Pre-heater coil glow
The coil SHALL be drawn dim while the pre-heater is off and glowing while it is on. A numeric power entity SHALL
count as on above 0 W, in W or kW. With `pre_heater.max_power` (W) set, the glow SHALL grow with power / maximum,
capped at full and visibly on above 0 W; without it any power above 0 W SHALL glow fully. An on/off entity SHALL
glow fully while on.

#### Scenario: Modulating pre-heater
- **WHEN** `pre_heater.max_power` is 1000 and the pre-heater power is 250 W
- **THEN** the coil glows at a quarter between dim and full

#### Scenario: No maximum
- **WHEN** no `pre_heater.max_power` is set and the pre-heater power is 120 W
- **THEN** the coil glows fully

#### Scenario: On/off entity
- **WHEN** `pre_heater.power` is a binary sensor that is on
- **THEN** the coil glows fully

#### Scenario: Off
- **WHEN** the pre-heater power is 0 W
- **THEN** the coil is drawn dim, legible as a coil in light and dark themes

#### Scenario: Unavailable
- **WHEN** the pre-heater power entity is unavailable
- **THEN** the coil is drawn dim, as off

#### Scenario: Invalid maximum
- **WHEN** the config sets `pre_heater.max_power: 0`
- **THEN** the card shows a configuration error that names `pre_heater.max_power`

### Requirement: Pre-heater coil opens its entity
The coil SHALL have a tooltip and accessible name with the pre-heater's state as Home Assistant formats it, e.g.
"Pre-heater: 350 W" or "Pre-heater: On", and tapping it SHALL open the more-info dialog of `pre_heater.power`.

#### Scenario: Hover
- **WHEN** the pre-heater power is 350 W and the user hovers the coil
- **THEN** the tooltip reads "Pre-heater: 350 W"

#### Scenario: Tap
- **WHEN** the user taps the coil
- **THEN** the more-info dialog of the `pre_heater.power` entity opens

### Requirement: Pre-heater power in the top row
While the pre-heater is on and its entity available, the top row SHALL show its state after the power label, with a
`mdi:heating-coil` icon and the tooltip "Pre-heater: " and its state, side by side with power, without a sum or a
share. Tapping it SHALL open `pre_heater.power`. While off or unavailable it SHALL NOT be shown.

#### Scenario: Pre-heater on
- **WHEN** power reads 32 W and the pre-heater power 1000 W
- **THEN** the top row's centre shows the lightning bolt with "32 W", then the heating coil with "1,000 W"

#### Scenario: On/off entity on
- **WHEN** `pre_heater.power` is a binary sensor that is on
- **THEN** the top row shows the heating coil with "On" after the power label

#### Scenario: Pre-heater off
- **WHEN** the pre-heater power is 0 W
- **THEN** the top row shows only power and the running mean outdoor temperature, as without a pre-heater

#### Scenario: Narrow card
- **WHEN** the card is 280 px wide, the pre-heater reads 1000 W, power 1032 W and RMOT -3.5 °C
- **THEN** the top row's labels and the season icon do not overlap
