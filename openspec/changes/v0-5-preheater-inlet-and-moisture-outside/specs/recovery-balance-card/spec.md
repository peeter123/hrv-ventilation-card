# Spec Delta

## MODIFIED Requirements

### Requirement: Entities come from the card config
The card SHALL take the outdoor, supply and extract air temperatures, their humidities (absolute or relative), the
supply flow, the bypass position and the pre-heater's power and after temperature and humidity from its config, and
SHALL compute its figures with the shared recovery calculation.

#### Scenario: Configured entities are used
- **WHEN** the config sets the supply air temperature entity
- **THEN** the bar is calculated from that entity's state

#### Scenario: Pre-heater roles
- **WHEN** the config sets `pre_heater.power`, `pre_heater.temperature_after` and `pre_heater.humidity_after`
- **THEN** the bar is calculated with the exchanger's inlet after the pre-heater while it runs

### Requirement: Diverging segment layout
The bar SHALL have a zero line in the centre and two lanes on the same scale, divided by a line: the temperature
(sensible) lane on top and, with humidity, the moisture (latent) lane below it. The two lanes SHALL be equally high
and the dividing line SHALL NOT take height from either one. Each lane SHALL show its recovered part, its lost part
and then its pre-heater part, each a segment whose width is proportional to its absolute value; positive parts grow
to the right and negative parts to the left. Recovered parts SHALL be solid, lost parts hatched, both in the lane's
colour, and pre-heater parts solid in the pre-heater colour.

#### Scenario: Two lanes
- **WHEN** humidity is configured with 500 W sensible and 100 W latent recovered and 120 W and 40 W lost
- **THEN** the top lane shows a solid 500 W and a hatched 120 W segment in the temperature colour, and the lane below
  a solid 100 W and a hatched 40 W segment in the moisture colour

#### Scenario: Opposite signs
- **WHEN** sensible recovered is 200 W and latent recovered is -50 W
- **THEN** a solid segment of 200 W grows right of the zero line in the temperature lane and one of 50 W grows left of
  it in the moisture lane

#### Scenario: Equal lanes
- **WHEN** humidity is configured and the card is shown at a device pixel ratio of 1 and of 2
- **THEN** the temperature and the moisture lane have the same rendered height

#### Scenario: Pre-heater running
- **WHEN** the calculation gives 1073 W recovered, 402 W lost and a pre-heater part of 335 W, all sensible
- **THEN** the temperature lane shows a solid 1073 W and a hatched 402 W segment in the temperature colour, then a
  solid 335 W segment in the pre-heater colour

#### Scenario: Pre-heater not running
- **WHEN** the pre-heater part is 0 W
- **THEN** each lane shows only its recovered and lost segments, as without the pre-heater roles

### Requirement: Header
The title SHALL read "Heat Recovery" in heating mode and "Cooling Recovery" in cooling mode. The header SHALL read
"Recovered X W of Y W (N %)" where Y is recovered plus lost, without the pre-heater part, or "Recovered X W" when Y is
not positive. While the calculation reports free cooling, the title SHALL read "Free Cooling" and the header
"Cooling X W of Y W (N %)" or "Cooling X W", because the figures are the cooling the supply air brings, of what fully
outdoor air would bring.

#### Scenario: Positive potential
- **WHEN** recovered is 300 W and lost is 100 W
- **THEN** the header reads "Recovered 300 W of 400 W (75 %)"

#### Scenario: Free cooling
- **WHEN** the calculation reports free cooling with 1220 W recovered and 61 W lost
- **THEN** the title reads "Free Cooling" and the header "Cooling 1,220 W of 1,281 W (95 %)"

#### Scenario: Pre-heater running
- **WHEN** recovered is 1073 W, lost 402 W and the pre-heater part 335 W
- **THEN** the header reads "Recovered 1,073 W of 1,475 W (73 %)"

### Requirement: Legend
The legend SHALL show each lane, in the lanes' order: its name ("Temperature", "Moisture"), its recovered power
with a solid swatch ("Recovered X W") and its lost power with a hatched swatch ("Lost X W"). While free cooling the
two read "Cooling X W" and "Missed X W": the supply air delivers cooling, and what it falls short of fully outdoor
air is missed potential, not a loss. While the pre-heater part (sensible plus latent) rounds to 1 W or more, it SHALL
then show "Pre-Heater X W" with a solid swatch in the pre-heater colour. After that it SHALL show the scale. It SHALL
NOT show the moisture recovery rate in g/h, which the moisture balance card and the airflow diagram show.

#### Scenario: Free cooling legend
- **WHEN** the calculation reports free cooling with 974 W sensible cooling and 51 W sensible lost
- **THEN** the temperature lane's legend reads "Cooling 974 W" and "Missed 51 W"

#### Scenario: Water recovered
- **WHEN** humidity is configured and the calculated moisture recovery rate is 120 g/h
- **THEN** the legend shows the two lanes and the scale, and no "Water Recovered" entry

#### Scenario: Water kept out
- **WHEN** humidity is configured and the calculated moisture recovery rate is -418 g/h
- **THEN** the legend shows the two lanes and the scale, and no "Water Kept Out" entry

#### Scenario: Pre-heater entry
- **WHEN** the pre-heater part is 335 W
- **THEN** the legend shows the lanes, then "Pre-Heater 335 W" with a swatch in the pre-heater colour, then the scale

#### Scenario: No pre-heater entry
- **WHEN** the pre-heater part is 0 W
- **THEN** the legend shows the lanes and the scale only

### Requirement: Configurable colours
The card SHALL use a red pair of colours for heating and a blue pair for cooling by default, and SHALL accept other
colours per mode in its config. The pre-heater colour SHALL default to `#ff9800`, the airflow card's default coil
glow, and SHALL be configurable as `pre_heater.color`.

#### Scenario: Custom heating colour
- **WHEN** the config sets a heating colour
- **THEN** the heating segments, swatches and header use that colour

#### Scenario: Custom pre-heater colour
- **WHEN** the config sets `pre_heater.color: '#ffc107'` and the pre-heater runs
- **THEN** the pre-heater segments and swatch use that colour

### Requirement: Visual editor
The card SHALL offer a visual editor with collapsible sections for the outdoor, supply and extract air (temperature,
relative and absolute humidity pickers), the supply flow and bypass position pickers, a pre-heater section (power,
after temperature and after humidity pickers, and the pre-heater colour), the smoothing window, air density, the
minimum scale and the colours per mode. Pickers SHALL only offer sensors, except the pre-heater power picker, which
also offers binary sensors and switches. The absolute humidity pickers, smoothing window, air density, minimum scale
and colours SHALL be advanced settings.

#### Scenario: Editing the card
- **WHEN** the user opens the card's editor with the advanced settings off
- **THEN** an outdoor, a supply and an extract section each show a temperature and a relative humidity picker
- **AND** a pre-heater section shows the power, after temperature and after humidity pickers, without the colour

#### Scenario: Advanced settings on
- **WHEN** the user turns the advanced settings on
- **THEN** each stream section also shows an absolute humidity picker, and the smoothing window, air density,
  minimum scale and colours appear, the pre-heater colour (showing its orange default) in the pre-heater section
