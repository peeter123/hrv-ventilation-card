# Spec Delta

## MODIFIED Requirements

### Requirement: Sensible-only units
Without humidity entities the card SHALL show the sensible parts only and SHALL leave the moisture parts out of its
legend.

#### Scenario: Unit without humidity sensors
- **WHEN** no humidity entities are configured
- **THEN** the bar has only the temperature lane and the legend has no moisture entries

### Requirement: Diverging segment layout
The bar SHALL have a zero line in the centre and two lanes on the same scale, divided by a line: the temperature
(sensible) lane on top and, with humidity, the moisture (latent) lane below it. The two lanes SHALL be equally high
and the dividing line SHALL NOT take height from either one. Each lane SHALL show its recovered part and then its
lost part, each a segment whose width is proportional to its absolute value; positive parts grow to the right and
negative parts to the left. Recovered parts SHALL be solid and lost parts hatched, both in the lane's colour.

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

### Requirement: Legend
The legend SHALL show each lane, in the lanes' order: its name ("Temperature", "Moisture"), its recovered power
with a solid swatch ("Recovered X W") and its lost power with a hatched swatch ("Lost X W"). While free cooling the
two read "Cooling X W" and "Missed X W": the supply air delivers cooling, and what it falls short of fully outdoor
air is missed potential, not a loss. After the lanes it SHALL show the scale. It SHALL NOT show the moisture
recovery rate in g/h, which the moisture balance card and the airflow diagram show.

#### Scenario: Free cooling legend
- **WHEN** the calculation reports free cooling with 974 W sensible cooling and 51 W sensible lost
- **THEN** the temperature lane's legend reads "Cooling 974 W" and "Missed 51 W"

#### Scenario: Water recovered
- **WHEN** humidity is configured and the calculated moisture recovery rate is 120 g/h
- **THEN** the legend shows the two lanes and the scale, and no "Water Recovered" entry

#### Scenario: Water kept out
- **WHEN** humidity is configured and the calculated moisture recovery rate is -418 g/h
- **THEN** the legend shows the two lanes and the scale, and no "Water Kept Out" entry
