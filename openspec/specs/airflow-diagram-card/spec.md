# airflow-diagram-card Specification

## Purpose

A card that draws a ventilation unit's four air streams (outdoor, supply, extract, exhaust) around the exchanger
with their measurements, the fans, the bypass and the current saving, for any HRV/ERV whose sensors the user
selects, legible at any card width and in any theme.

## Requirements

### Requirement: Entities come from the card config
The card SHALL take every displayed entity from its config, grouped by role: the four air streams (temperature,
relative humidity, absolute humidity each), fans (level, supply flow, exhaust flow), bypass (position, mode, next
change), status (operating mode, profile target temperature, temperature profile, next fan change, filter days
remaining, power, running mean outdoor temperature, saved heating power, saved cooling power, moisture recovery) and seasons (heating, cooling).

#### Scenario: Card configured for another unit
- **WHEN** the config points the roles at a different unit's entities
- **THEN** each label shows the state of the configured entity for its role

### Requirement: Four stream temperatures are required
The card SHALL require the outdoor, supply, extract and exhaust air temperature entities and SHALL show a
configuration error naming the missing roles when any of them is absent. All other roles SHALL be optional.

#### Scenario: Temperature missing
- **WHEN** the config has no exhaust air temperature entity
- **THEN** the card shows a configuration error that names the exhaust air temperature

#### Scenario: Optional role missing
- **WHEN** the config has no power entity
- **THEN** the card renders without the power label and without an error

### Requirement: Diagram drawn by the card
The card SHALL draw the exchanger, the outdoor-to-supply and extract-to-exhaust streams as crossing arrows, and an
outdoor and a house symbol itself, without loading image files. The drawing SHALL scale to the card's width with a
fixed aspect ratio and SHALL NOT force a fixed card height; the card's height SHALL follow its content.

#### Scenario: Wide and narrow card
- **WHEN** the same card is shown 600 px and 300 px wide
- **THEN** the diagram fills the width in both cases with the same proportions and stays sharp

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

#### Scenario: Status grid
- **WHEN** the fan level and status entities are configured and the card is 500 px wide
- **THEN** they are shown in the grid below the drawing, not on the drawing, the fan level in the first column's
  top cell and the profile target temperature in the third column's bottom cell

#### Scenario: Unconfigured value
- **WHEN** no next fan change entity is configured
- **THEN** its cell stays empty and the filter days stay in the first column's bottom cell

#### Scenario: Icon centred on its text
- **WHEN** the card is shown at 400 px and at 600 px wide
- **THEN** the vertical centre of every top row and status grid icon is within 1 px of the centre of its label's text

#### Scenario: Centred cells
- **WHEN** the first column shows a fan level "2" and filter days "120 d"
- **THEN** both values are centred in the first column, so their horizontal centres line up

### Requirement: Rows follow the config
The top row SHALL be shown while at least one of power, running mean outdoor temperature or a season entity is
configured, and the status grid while at least one of its roles is configured, regardless of the current states.
A row with none of its roles configured SHALL NOT be shown.

#### Scenario: No top row roles
- **WHEN** no power, running mean outdoor temperature or season entity is configured
- **THEN** no top row is shown and the card starts with the drawing

#### Scenario: Only season entities, between seasons
- **WHEN** only the two season entities of the top row are configured and both are off
- **THEN** the top row is shown with the between-seasons icon

#### Scenario: No status roles
- **WHEN** none of the status grid's roles is configured
- **THEN** no status grid is shown and the card ends with the drawing

#### Scenario: All status values unavailable
- **WHEN** the status grid's roles are configured but all their entities are unavailable
- **THEN** the status grid keeps its place, so the card does not change height

### Requirement: Values formatted by Home Assistant
Each label SHALL show its entity's state formatted the way Home Assistant formats it (unit, precision, number
format, translated state), and tapping a label SHALL open the more-info dialog of its entity.

#### Scenario: Tapping a label
- **WHEN** the user taps the supply air temperature label
- **THEN** the more-info dialog of the configured supply air temperature entity opens

#### Scenario: Entity precision
- **WHEN** an entity has a display precision of 1 decimal set in Home Assistant
- **THEN** its label shows the value with 1 decimal and its unit

### Requirement: Unavailable values hidden by default
A label whose entity is missing from Home Assistant, unknown or unavailable SHALL be hidden by default. With the
show-unavailable option on, it SHALL show the state as Home Assistant formats it. Other labels SHALL keep their
values either way.

#### Scenario: One entity unavailable
- **WHEN** the outdoor relative humidity entity is unavailable
- **THEN** its label is hidden and all other labels keep their values

#### Scenario: Showing unavailable values
- **WHEN** the show-unavailable option is on and the outdoor relative humidity entity is unavailable
- **THEN** its label shows Home Assistant's text for an unavailable state

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

### Requirement: Values that do not apply
The bypass position label SHALL be hidden while the position is 0. The next bypass change and next fan change
SHALL show a dimmed dash after their icon while their state is "n/a" or unknown (nothing planned), whatever the
show-unavailable option; tapping it still opens the entity, and its tooltip gives the state. While unavailable they
follow the show-unavailable option like the other labels.

#### Scenario: Nothing planned
- **WHEN** the next bypass change entity reports "n/a"
- **THEN** its cell shows the timer icon and a dimmed dash

#### Scenario: Bypass closed
- **WHEN** the bypass position entity reports 0
- **THEN** no bypass position label is shown

### Requirement: Bypass shown as a path around the exchanger
The card SHALL draw a bypass path that carries the outdoor-to-supply stream around the exchanger with a strength of
the bypass position (0 to 100 %, clamped), and draw that stream through the exchanger with the remaining strength.
Without a bypass position entity, or when it is not numeric, the bypass strength SHALL be 0.

#### Scenario: Bypass half open
- **WHEN** the bypass position entity reports 50
- **THEN** the bypass path and the path through the exchanger are both drawn at half strength

#### Scenario: Bypass fully open
- **WHEN** the bypass position entity reports 100
- **THEN** the outdoor-to-supply stream is drawn only along the bypass path

#### Scenario: No bypass entity
- **WHEN** no bypass position entity is configured
- **THEN** no bypass path is drawn

### Requirement: Animated air flow
The card SHALL animate moving air along each drawn stream path in the direction of flow, including the bypass path,
so the share of air taking each route is visible. Each path's animation SHALL be as strong as that path's drawn
strength. A stream with a flow of 0 SHALL not move.

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

### Requirement: Animation speed follows the flow
When a nominal flow is configured, each stream's speed SHALL scale with its flow entity divided by the nominal flow,
clamped between a minimum and a maximum speed. Without a nominal flow, or without a flow entity for that stream,
the stream SHALL move at a fixed medium speed while its flow is above 0 or unknown.

#### Scenario: Flow relative to nominal
- **WHEN** the nominal flow is 400 m3/h, the supply flow is 200 m3/h and the exhaust flow is 400 m3/h
- **THEN** the exhaust stream moves twice as fast as the supply stream

#### Scenario: No flow entities
- **WHEN** no fan flow entities are configured
- **THEN** both streams move at the fixed medium speed

### Requirement: Animation can be turned off
The animation SHALL be on by default, SHALL be switchable off in the config, and SHALL be off while the browser
or operating system asks for reduced motion. With the animation off, the diagram SHALL show the same paths and
strengths without movement.

#### Scenario: Reduced motion
- **WHEN** the device has reduced motion enabled
- **THEN** no stream moves and the bypass path and strengths are still drawn

#### Scenario: Turned off in config
- **WHEN** the config sets the animation off
- **THEN** no stream moves

### Requirement: Stream colours follow temperatures
Each stream end SHALL be coloured by its temperature's position in a range centred midway between the coldest and
the warmest of the four temperatures and as wide as their spread, but at least 10 K: the bottom of the range in the cold colour, the top
in the warm colour, others interpolated, with a gradient along each stream. Defaults SHALL be blue and red; both
SHALL be configurable.

#### Scenario: Winter
- **WHEN** outdoor air is 0 °C, supply 18 °C, extract 21 °C and exhaust 3 °C
- **THEN** the outdoor end is drawn in the cold colour and the extract end in the warm colour

#### Scenario: Mild day
- **WHEN** the four temperatures are between 20.0 °C and 20.6 °C
- **THEN** all four stream ends are drawn close to the midpoint colour

#### Scenario: Summer, outdoor warmer than indoor
- **WHEN** outdoor air is 30 °C, supply 26 °C, extract 24 °C and exhaust 28 °C
- **THEN** the outdoor end is drawn towards the warm colour and the extract end towards the cold colour

### Requirement: Temperature units for the colours
Temperatures in °C and °F SHALL be compared in the same scale. When a temperature is unavailable or has another
unit, its stream end SHALL be grey.

#### Scenario: Temperatures in Fahrenheit
- **WHEN** the temperature entities report °F
- **THEN** the colours are the same as for the equivalent °C values

#### Scenario: Temperature unavailable
- **WHEN** the exhaust air temperature is unavailable
- **THEN** the exhaust end of its stream is grey

### Requirement: Follows the theme
The card SHALL take its background, text and outline colours from the active Home Assistant theme, so it is
legible in light and dark themes, without a fixed light background.

#### Scenario: Dark theme
- **WHEN** a dark theme is active
- **THEN** the card background is the theme's card background and the label text uses the theme's text colour

### Requirement: Saving badge
In the centre, the card SHALL show the saving calculated by the shared recovery calculation, in W, on a badge shaped
like the exchanger (a hexagon with flat top and bottom): a warm badge in heating mode and a cold badge in cooling
mode while the saving is above 0.5 W, otherwise a grey badge.

#### Scenario: Heating saving
- **WHEN** the calculation is in heating mode with a saving of 120 W
- **THEN** a warm badge shows "120 W"

#### Scenario: Saving below threshold
- **WHEN** the calculated saving is 0.4 W
- **THEN** a grey badge shows the saving

### Requirement: Badge inputs
The badge SHALL need the calculation's inputs (outdoor, supply and extract temperature and humidity, supply flow);
without them configured no badge SHALL be shown. While an input has no value the badge SHALL be hidden, or SHALL
show "n/a" in grey when the show-unavailable option is on.

#### Scenario: Calculation input unavailable
- **WHEN** the supply flow entity is unavailable
- **THEN** no badge is shown

#### Scenario: No calculation inputs
- **WHEN** only the four temperatures are configured
- **THEN** the card renders without a badge and without an error

### Requirement: Badge colours
The warm badge SHALL be tinted with the configured warm colour and the cold badge with the configured cold colour,
and every badge SHALL stay legible in light and dark themes with any configured colour.

#### Scenario: Custom warm colour
- **WHEN** the config sets the warm colour to orange and the heating saving is above 0.5 W
- **THEN** the badge is tinted orange and its text is legible in a light and a dark theme

### Requirement: Season icons
The card SHALL show one season icon in the top row: heating season while the heating season entity is on, cooling
season while the cooling season entity is on, and between seasons while both season entities are configured and
both are off. With both on, it SHALL show heating season. With only one season entity configured and off, it
SHALL show no icon.

#### Scenario: Heating season
- **WHEN** the heating season entity is on
- **THEN** the heating season icon is shown in the top-left corner

#### Scenario: Between seasons
- **WHEN** both season entities are configured and off
- **THEN** the between-seasons icon is shown in the top-left corner

#### Scenario: One season entity, off
- **WHEN** only the heating season entity is configured and it is off
- **THEN** no season icon is shown

### Requirement: Season icon is labelled
The season icon SHALL have a tooltip and accessible name ("Heating season", "Cooling season", "Between seasons"),
and tapping it SHALL open the more-info dialog of the season entity that is on, or of the heating season entity
between seasons.

#### Scenario: Tapping between seasons
- **WHEN** the between-seasons icon is tapped
- **THEN** the more-info dialog of the heating season entity opens

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

### Requirement: Badge opens a saving entity
Tapping the saving badge SHALL open the more-info dialog of the configured saving entity that reads the higher power,
compared in the same unit. With one saving role, a state that is not a number, or equal readings, it SHALL open the
role of the calculation's mode instead (`status.heating_saving` in heating, `status.cooling_saving` in cooling). While
that role is not configured, or the badge shows no calculated saving, the badge SHALL NOT be tappable or focusable.

#### Scenario: Higher saving opened
- **WHEN** both saving roles are configured, the heating saving reads 1.2 kW, the cooling saving 0 kW, and the user
  taps the badge
- **THEN** the more-info dialog of the heating saving entity opens, also while the calculation is already in cooling
  mode

#### Scenario: Cooling saving opened while cooling
- **WHEN** both saving roles are configured, the cooling saving reads more than the heating saving and the user taps
  the badge
- **THEN** the more-info dialog of the cooling saving entity opens

#### Scenario: Saving state not a number
- **WHEN** both saving roles are configured, the heating saving is unavailable and the calculation is in cooling mode
- **THEN** a tap on the badge opens the cooling saving entity

#### Scenario: Mode without its saving entity
- **WHEN** only `status.heating_saving` is configured and the calculation is in cooling mode
- **THEN** the badge is not tappable or focusable and a tap opens no dialog

#### Scenario: No saving entity
- **WHEN** neither saving role is configured and the user taps the badge
- **THEN** no more-info dialog opens, also not the supply air temperature's

### Requirement: Moisture figure opens its entity
Tapping the ERV moisture figure SHALL open the more-info dialog of the `status.moisture_recovery` entity. Without that
role configured, the figure SHALL NOT be tappable or focusable and SHALL NOT open any dialog.

#### Scenario: Moisture recovery entity configured
- **WHEN** `status.moisture_recovery` is configured and the user taps the moisture figure
- **THEN** the more-info dialog of the moisture recovery entity opens

#### Scenario: No moisture recovery entity
- **WHEN** `status.moisture_recovery` is not configured
- **THEN** the moisture figure has no `tabindex` and a tap opens no dialog
