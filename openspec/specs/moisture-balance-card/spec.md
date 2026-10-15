# moisture-balance-card Specification

## Purpose

A live bar that shows, relative to the outdoor air, how much moisture the ventilation extracts from the house,
how much of it the exchanger recovers and how much is put outside, calculated from the unit sensors the user
selects.

## Requirements

### Requirement: Entities come from the card config
The card SHALL take the outdoor, supply and extract air humidities (absolute, or relative with the stream's
temperature), the supply flow and the bypass position from its config, and SHALL compute the moisture extracted,
recovered and put outside (signed, positive when moisture leaves the house) with the shared recovery calculation.
A humidity per stream and the supply flow SHALL be required, with a configuration error naming any missing one;
the bypass position SHALL be optional.

#### Scenario: Required humidity missing
- **WHEN** the config has no humidity entity for the supply air
- **THEN** the card shows a configuration error that names the supply air humidity

#### Scenario: Relative humidity without temperature
- **WHEN** the supply air has only a relative humidity entity and no temperature entity
- **THEN** the card shows a configuration error that names the supply air temperature

#### Scenario: No bypass entity
- **WHEN** no bypass position entity is configured
- **THEN** the card renders without the bypass strip

### Requirement: All configured inputs must have a value
The card SHALL show "n/a" in the header, only the zero line in the bar and no bypass strip while any configured
input entity (humidities, the temperatures they need, supply flow, bypass position) is missing, unavailable,
unknown or non-numeric, because the neutral band and the bypass note decide how the figures may be read.

#### Scenario: Configured input unavailable
- **WHEN** the configured bypass position entity is unavailable
- **THEN** the header shows "n/a" and no figures are shown

### Requirement: Direction of the moisture flow
The card SHALL treat a negative extracted rate as the house gaining moisture and a non-negative one as the house
drying. While drying the colour SHALL be teal and while gaining purple by default; both SHALL be configurable.

#### Scenario: House gaining
- **WHEN** the extracted rate is -120 g/h
- **THEN** the card is in the gaining state and uses the gaining colour

### Requirement: Segment layout and scale
The bar SHALL have a zero line in the centre with a solid recovered segment and a hatched put-outside segment,
each growing right when positive and left when negative. Half the bar SHALL represent the larger of the minimum
scale (default 250 g/h, configurable) and the sum of the absolute values of both rates rounded up to 250 g/h.

#### Scenario: Drying
- **WHEN** recovered is 150 g/h and put outside is 100 g/h
- **THEN** a solid 150 g/h segment and a hatched 100 g/h segment grow right of the zero line on a 250 g/h scale

### Requirement: Header with direction words
The header SHALL show magnitudes without minus signs. Drying: title "Moisture: House Drying", text "Recovered X of Y
g/h (N %)". Gaining: title "Moisture: House Gaining (Outdoor More Humid)", text "Kept out X of Y g/h (N %)". The
percentage SHALL be omitted when Y is not positive.

#### Scenario: Drying header
- **WHEN** extracted is 250 g/h and recovered is 150 g/h
- **THEN** the title reads "Moisture: House Drying" and the text "Recovered 150 of 250 g/h (60 %)"

### Requirement: Neutral band
When the smoothed extract (indoor) and outdoor absolute humidity differ by less than the neutral threshold (default 0.3 g/m3, configurable), the title SHALL read "Moisture: Indoor ≈ Outdoor" and the text
"within sensor accuracy", without a percentage.

#### Scenario: Within sensor accuracy
- **WHEN** indoor absolute humidity is 8.1 g/m3 and outdoor 7.9 g/m3
- **THEN** the title reads "Moisture: Indoor ≈ Outdoor" and no percentage is shown

### Requirement: Bypass strip
When a bypass position entity is configured and above 0, the card SHALL show a strip under the bar filled to the
bypass position with an explanation line, and SHALL append ", with bypass N %" to the header percentage. At 0, or
without the entity, the strip SHALL be hidden.

#### Scenario: Bypass open
- **WHEN** the bypass position is 40 and the header shows a percentage
- **THEN** the strip is filled to 40 % and the percentage reads "(N %, with bypass 40 %)"

### Requirement: Legend
The legend SHALL show the swatches with direction words, the flow line ("Extracted Y → Recovered X + Outside Z
g/h" while drying, "Outdoor Air Brings In Y → Kept Out X + Enters Z g/h" while gaining), the smoothed indoor and
outdoor absolute humidity, and the scale.

#### Scenario: Gaining legend
- **WHEN** the card is in the gaining state
- **THEN** the flow line starts with "Outdoor Air Brings In"

### Requirement: Visual editor
The card SHALL offer a visual editor with collapsible sections for the outdoor, supply and extract air
(temperature, relative and absolute humidity pickers), the supply flow (required) and bypass position pickers, and
fields for the smoothing window, air density, neutral threshold, minimum scale and colours. Pickers SHALL only offer
sensors. The absolute humidity pickers and all fields SHALL be advanced settings.

#### Scenario: Editing the card
- **WHEN** the user opens the card's editor with the advanced settings off
- **THEN** each stream section shows a temperature and a relative humidity picker, the supply flow picker is
  marked required and every picker only offers sensors

#### Scenario: Advanced settings on
- **WHEN** the user turns the advanced settings on
- **THEN** each stream section also shows an absolute humidity picker, and the smoothing window, air density,
  neutral threshold, minimum scale and colours appear
