# recovery-balance-card Specification

## Purpose

A live bar that shows how much heat (or cooling) the exchanger recovers and how much is still lost with the
ventilation air, split into temperature (sensible) and moisture (latent) parts, calculated from the unit sensors
the user selects.

## Requirements

### Requirement: Entities come from the card config
The card SHALL take the outdoor, supply and extract air temperatures, their humidities (absolute or relative), the
supply flow and the bypass position from its config, and SHALL compute its figures with the shared recovery
calculation.

#### Scenario: Configured entities are used
- **WHEN** the config sets the supply air temperature entity
- **THEN** the bar is calculated from that entity's state

### Requirement: Required inputs
The card SHALL require the three temperatures and the supply flow, and SHALL show a configuration error naming the
missing roles otherwise. Humidity SHALL be configured for all three streams or for none; a partial set SHALL be a
configuration error. The bypass position SHALL be optional.

#### Scenario: Supply flow missing
- **WHEN** the config has no supply flow entity
- **THEN** the card shows a configuration error that names the supply flow

#### Scenario: Partial humidity
- **WHEN** only the outdoor and extract air have a humidity entity
- **THEN** the card shows a configuration error that names the supply air humidity

### Requirement: Sensible-only units
Without humidity entities the card SHALL show the sensible parts only and SHALL leave the moisture parts and the
water rate out of its legend.

#### Scenario: Unit without humidity sensors
- **WHEN** no humidity entities are configured
- **THEN** the bar has only the temperature lane and the legend has no moisture or water entries

### Requirement: Active mode
The card SHALL show the mode chosen by the calculation: heating, cooling or, while the calculation reports it,
free cooling.

#### Scenario: Bypass open
- **WHEN** the bypass is at 40 % and the indoor air has the higher enthalpy
- **THEN** the card shows free cooling in the cooling colours

### Requirement: Unavailable inputs
While any configured input has no value, the header SHALL show "n/a" and the bar only the zero line.

#### Scenario: Temperature unavailable
- **WHEN** the outdoor air temperature entity is unavailable
- **THEN** the header shows "n/a" and the bar shows only the zero line

### Requirement: Diverging segment layout
The bar SHALL have a zero line in the centre and two lanes on the same scale, divided by a line: the temperature
(sensible) lane on top and, with humidity, the moisture (latent) lane below it. Each lane SHALL show its recovered
part and then its lost part, each a segment whose width is proportional to its absolute value; positive parts grow
to the right and negative parts to the left. Recovered parts SHALL be solid and lost parts hatched, both in the
lane's colour.

#### Scenario: Two lanes
- **WHEN** humidity is configured with 500 W sensible and 100 W latent recovered and 120 W and 40 W lost
- **THEN** the top lane shows a solid 500 W and a hatched 120 W segment in the temperature colour, and the lane below
  a solid 100 W and a hatched 40 W segment in the moisture colour

#### Scenario: Opposite signs
- **WHEN** sensible recovered is 200 W and latent recovered is -50 W
- **THEN** a solid segment of 200 W grows right of the zero line in the temperature lane and one of 50 W grows left of
  it in the moisture lane

### Requirement: Bar scale
Half of the bar SHALL represent the scale, which is the larger of the minimum scale and the larger lane's sum of the
absolute values of its parts, rounded up to a multiple of 250 W. The minimum scale SHALL default to 500 W and be
configurable.

#### Scenario: Small values
- **WHEN** the parts of the fuller lane sum to 120 W in absolute value
- **THEN** the scale is 500 W

#### Scenario: Large values
- **WHEN** the parts of the fuller lane sum to 760 W in absolute value
- **THEN** the scale is 1000 W

### Requirement: Header
The title SHALL read "Heat Recovery" in heating mode and "Cooling Recovery" in cooling mode. The header SHALL read
"Recovered X W of Y W (N %)" where Y is recovered plus lost, or "Recovered X W" when Y is not positive. While the
calculation reports free cooling, the title SHALL read "Free Cooling" and the header "Cooling X W of Y W (N %)" or
"Cooling X W", because the figures are the cooling the supply air brings, of what fully outdoor air would bring.

#### Scenario: Positive potential
- **WHEN** recovered is 300 W and lost is 100 W
- **THEN** the header reads "Recovered 300 W of 400 W (75 %)"

#### Scenario: Free cooling
- **WHEN** the calculation reports free cooling with 1220 W recovered and 61 W lost
- **THEN** the title reads "Free Cooling" and the header "Cooling 1,220 W of 1,281 W (95 %)"

### Requirement: Legend
The legend SHALL show each lane, in the lanes' order: its name ("Temperature", "Moisture"), its recovered power
with a solid swatch ("Recovered X W") and its lost power with a hatched swatch ("Lost X W"). While free cooling the
two read "Cooling X W" and "Missed X W": the supply air delivers cooling, and what it falls short of fully outdoor
air is missed potential, not a loss. After the lanes it SHALL show the water recovered (the calculated moisture recovery rate)
in g/h when humidity is configured, and the scale. While the moisture recovery rate is negative
(the outdoor air is more humid and the exchanger keeps water out), the legend SHALL show its magnitude as the water
kept out, in the moisture balance card's words.

#### Scenario: Free cooling legend
- **WHEN** the calculation reports free cooling with 974 W sensible cooling and 51 W sensible lost
- **THEN** the temperature lane's legend reads "Cooling 974 W" and "Missed 51 W"

#### Scenario: Water recovered
- **WHEN** humidity is configured and the calculated moisture recovery rate is 120 g/h
- **THEN** the legend shows "Water Recovered 120 g/h"

#### Scenario: Water kept out
- **WHEN** humidity is configured and the calculated moisture recovery rate is -418 g/h
- **THEN** the legend shows "Water Kept Out 418 g/h"

### Requirement: Configurable colours
The card SHALL use a red pair of colours for heating and a blue pair for cooling by default, and SHALL accept other
colours per mode in its config.

#### Scenario: Custom heating colour
- **WHEN** the config sets a heating colour
- **THEN** the heating segments, swatches and header use that colour

### Requirement: Visual editor
The card SHALL offer a visual editor with collapsible sections for the outdoor, supply and extract air (temperature,
relative and absolute humidity pickers), the supply flow and bypass position pickers, the smoothing window, air
density, the minimum scale and the colours per mode. Pickers SHALL only offer sensors. The absolute humidity
pickers, smoothing window, air density, minimum scale and colours SHALL be advanced settings.

#### Scenario: Editing the card
- **WHEN** the user opens the card's editor with the advanced settings off
- **THEN** an outdoor, a supply and an extract section each show a temperature and a relative humidity picker

#### Scenario: Advanced settings on
- **WHEN** the user turns the advanced settings on
- **THEN** each stream section also shows an absolute humidity picker, and the smoothing window, air density,
  minimum scale and colours appear
