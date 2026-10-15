# Spec Delta

## ADDED Requirements

### Requirement: Exchanger type
The card SHALL have an `exchanger_type` option, `hrv` (heat recovery) or `erv` (energy recovery), defaulting to
`hrv`. HRV SHALL draw the exchanger with a grey fill. ERV SHALL draw it with a blue-grey fill, distinct from the HRV
fill and legible in light and dark themes. Any other value SHALL be a configuration error naming the option.

#### Scenario: Default type
- **WHEN** the config has no `exchanger_type`
- **THEN** the exchanger is drawn with the grey HRV fill and no moisture recovery figure is shown

#### Scenario: ERV
- **WHEN** the config sets `exchanger_type: erv`
- **THEN** the exchanger is drawn with the blue-grey ERV fill in a light and in a dark theme

#### Scenario: Unknown type
- **WHEN** the config sets `exchanger_type: rotary`
- **THEN** the card shows a configuration error that names `exchanger_type` and its choices hrv and erv

### Requirement: Moisture recovery figure on ERV
With `exchanger_type: erv` and the badge's inputs configured, the card SHALL show the calculated moisture recovery
rate in g/h low in the exchanger, under the crossing streams, without an icon. A negative rate SHALL show its sign,
as moisture kept out, and the tooltip SHALL name the direction with the magnitude.

#### Scenario: Moisture recovered
- **WHEN** the type is ERV and the calculated moisture recovery rate is 120 g/h
- **THEN** the bottom of the exchanger shows "120 g/h", with the tooltip "Moisture recovered: 120 g/h"

#### Scenario: Moisture kept out
- **WHEN** the type is ERV and the calculated moisture recovery rate is -418 g/h
- **THEN** the bottom of the exchanger shows "−418 g/h", with the tooltip "Moisture kept out: 418 g/h"

#### Scenario: Four-digit rate on a narrow card
- **WHEN** the type is ERV, the rate is -1500 g/h and the card is 280 to 600 px wide
- **THEN** the figure's text stays between the exchanger's slanted sides, clear of the streams and the badge

#### Scenario: Input unavailable
- **WHEN** the type is ERV and the supply flow entity is unavailable
- **THEN** the moisture figure is hidden, or shows "n/a" when the show-unavailable option is on, like the badge

#### Scenario: HRV
- **WHEN** the type is HRV and humidity is configured for the three streams
- **THEN** no moisture recovery figure is shown

### Requirement: Saving and moisture recovery entities
The card SHALL take three more optional roles from its config: a saved heating power entity
(`status.heating_saving`), a saved cooling power entity (`status.cooling_saving`) and a moisture recovery entity
(`status.moisture_recovery`). They do not change any figure. They only set what the badge and the moisture figure
open.

#### Scenario: Roles configured
- **WHEN** the config sets `status.heating_saving`, `status.cooling_saving` and `status.moisture_recovery`
- **THEN** the card renders as before, with the same calculated badge and moisture figure

### Requirement: Badge and moisture figure open their entity
Tapping the saving badge SHALL open the more-info dialog of the saving entity for the calculation's current mode:
`status.heating_saving` while the calculation is in heating mode, `status.cooling_saving` while it is in cooling mode.
Tapping the ERV moisture figure SHALL open the `status.moisture_recovery` entity. While the role it would open is not
configured, or the badge shows no calculated saving, a figure SHALL NOT be tappable or focusable and SHALL NOT open
any dialog.

#### Scenario: Heating saving opened while heating
- **WHEN** both saving roles are configured, the calculation is in heating mode and the user taps the badge
- **THEN** the more-info dialog of the heating saving entity opens

#### Scenario: Cooling saving opened while cooling
- **WHEN** both saving roles are configured, the calculation is in cooling mode and the user taps the badge
- **THEN** the more-info dialog of the cooling saving entity opens

#### Scenario: Mode without its saving entity
- **WHEN** only `status.heating_saving` is configured and the calculation is in cooling mode
- **THEN** the badge is not tappable or focusable and a tap opens no dialog

#### Scenario: No saving entity
- **WHEN** neither saving role is configured and the user taps the badge
- **THEN** no more-info dialog opens, also not the supply air temperature's

## MODIFIED Requirements

### Requirement: Entities come from the card config
The card SHALL take every displayed entity from its config, grouped by role: the four air streams (temperature,
relative humidity, absolute humidity each), fans (level, supply flow, exhaust flow), bypass (position, mode, next
change), status (operating mode, profile target temperature, temperature profile, next fan change, filter days
remaining, power, running mean outdoor temperature, saved heating power, saved cooling power, moisture recovery) and seasons (heating, cooling).

#### Scenario: Card configured for another unit
- **WHEN** the config points the roles at a different unit's entities
- **THEN** each label shows the state of the configured entity for its role

### Requirement: Labels on the drawing
Each stream's temperature and humidities SHALL be shown next to that stream's end on the drawing, the bypass
position at the top of the exchanger, just inside its outline, the saving badge on its centre and, on an ERV, the
moisture recovery figure low in the exchanger, under the crossing streams. The supply and exhaust flow SHALL
be shown above the tip of the supply and the exhaust arrow, clear of the bypass path. With the automatic layout,
labels SHALL NOT overlap each other or the arrowheads and SHALL NOT extend outside the card at any card width from
280 px.

#### Scenario: Stream labels
- **WHEN** the outdoor air entities are configured
- **THEN** the outdoor temperature and humidities are shown next to the outdoor end of the outdoor-to-supply stream

#### Scenario: Flow labels
- **WHEN** the supply and exhaust flow entities are configured and the layout is full
- **THEN** the supply flow is shown above the supply arrow's tip and the exhaust flow above the exhaust arrow's tip

#### Scenario: ERV at the narrowest width
- **WHEN** the type is ERV, the bypass is at 50 % and the card is 280 px wide
- **THEN** the bypass position, the badge and the moisture figure are all inside the exchanger without overlapping

### Requirement: Top row and status grid
The season icon, power and running mean outdoor temperature SHALL be shown in a top row above the drawing: the icon
at the left, power centred on the card and the running mean outdoor temperature at the right. The status values
SHALL be shown below the drawing in a grid of three equal columns, one subject each, with a fixed cell per value:
the fans (fan level, next fan change, filter days), the bypass (bypass mode, next bypass change) and comfort
(operating mode, temperature profile, profile target temperature), top to bottom. A value SHALL keep its cell
whatever the states, and an unconfigured value SHALL leave its cell empty, so nothing shifts. A value SHALL be
centred in its cell. A value too long for its cell SHALL be cut off with an ellipsis; its tooltip gives it in full.
Only the running mean outdoor temperature keeps a text prefix ("RMOT "), where an icon alone would not say what the
value is. A line SHALL separate the top row from the drawing and the drawing from the status grid, each as wide as
the content, from the left to the right corner stack, and the status grid SHALL be centred on the card. Every
label of these two rows SHALL have an icon in front, as high as its text and centred vertically on it: power
`mdi:lightning-bolt`, running mean outdoor temperature `mdi:thermometer-lines`, fan level `mdi:fan`, bypass mode
`mdi:shuffle-variant`, next bypass change and next fan change `mdi:timer-outline`, operating mode `mdi:cog-outline`,
profile target temperature `mdi:thermometer`, temperature profile `mdi:thermostat` and filter days
`mdi:air-filter`. Every label SHALL have a tooltip with its name and state, e.g. "Next bypass change: 01:30".

#### Scenario: Label icons
- **WHEN** power and the fan level are configured
- **THEN** power shows as a lightning bolt followed by its state, and the fan level as a fan followed by its state

#### Scenario: Icon centred on its text
- **WHEN** the card is shown at 400 px and at 600 px wide
- **THEN** the vertical centre of every top row and status grid icon is within 1 px of the centre of its label's text

#### Scenario: Status grid
- **WHEN** the fan level and status entities are configured and the card is 500 px wide
- **THEN** they are shown in the grid below the drawing, not on the drawing, the fan level in the first column's
  top cell and the profile target temperature in the third column's bottom cell

#### Scenario: Centred cells
- **WHEN** the first column shows a fan level "2" and filter days "120 d"
- **THEN** both values are centred in the first column, so their horizontal centres line up

#### Scenario: Unconfigured value
- **WHEN** no next fan change entity is configured
- **THEN** its cell stays empty and the filter days stay in the first column's bottom cell

### Requirement: Compact layout on narrow cards
The card SHALL have a layout option: automatic (default), full or compact. The compact layout SHALL show only the
top row, the four stream temperatures and relative humidities, the saving badge, the bypass position and, on an
ERV, the moisture recovery figure, and hide the flows, the absolute humidities and the status grid. The automatic
layout SHALL be compact below 340 px card width and full from 340 px. Label text SHALL stay at least 11 px high
at every card width from 280 px up.

#### Scenario: Phone width
- **WHEN** the layout is automatic and the card is 320 px wide
- **THEN** only the top row, the four temperatures and relative humidities, the badge and the bypass position are
  shown, with no overlapping text

#### Scenario: Desktop width
- **WHEN** the layout is automatic and the card is 500 px wide
- **THEN** all configured labels are shown

#### Scenario: Narrow dashboard section
- **WHEN** the layout is automatic and the card is 350 px wide, as in a narrow sections-view column
- **THEN** all configured labels are shown, with no overlapping text

#### Scenario: Forced full layout
- **WHEN** the layout is full and the card is 300 px wide (below the automatic breakpoint)
- **THEN** all configured labels are shown

#### Scenario: ERV on a phone
- **WHEN** the type is ERV, the layout is automatic and the card is 320 px wide
- **THEN** the moisture recovery figure is shown at the bottom of the exchanger

### Requirement: Visual editor
The card SHALL offer a visual editor with an exchanger type choice first, then one entity picker per role, grouped
in collapsible sections per group, with the four temperatures marked as required, and an animation switch. Pickers
SHALL only offer entities of a fitting domain. The smoothing window, air density, cold and warm colours, layout
choice, show-unavailable switch, nominal flow and the next fan change, next bypass change, target temperature,
temperature profile, saved heating power, saved cooling power and moisture recovery pickers SHALL be advanced settings.

#### Scenario: Editing the card
- **WHEN** the user opens the card's editor with the advanced settings off
- **THEN** an exchanger type choice (HRV or ERV) comes first, then the roles grouped per air stream, fans, bypass,
  status and seasons, followed by the animation switch
- **AND** the season pickers only offer binary sensors
- **AND** the status section shows no next fan change, next bypass change, target temperature, temperature
  profile, saved heating power, saved cooling power or moisture recovery picker

#### Scenario: Advanced settings on
- **WHEN** the user turns the advanced settings on
- **THEN** the niche status pickers, including the two saved power pickers and moisture recovery, appear in the status section,
  and the colours, layout, unavailable values, nominal flow and a calculation section with smoothing and air
  density appear
