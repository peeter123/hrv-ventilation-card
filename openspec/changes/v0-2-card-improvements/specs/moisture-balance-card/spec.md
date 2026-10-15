# Spec Delta

## ADDED Requirements

### Requirement: Title and direction subtitle
The title SHALL read "Moisture Recovery" in every state, also without a value, in the same style as the recovery
balance card's title. The direction SHALL be a subtitle directly under the title, in the theme's secondary text
colour and smaller than the title: "House drying", "House gaining (outdoor more humid)" or, in the neutral band,
"Indoor ≈ outdoor". Without a value there SHALL be no subtitle.

#### Scenario: Drying
- **WHEN** the card shows the house drying
- **THEN** the title reads "Moisture Recovery" and the muted subtitle under it "House drying"

#### Scenario: No value
- **WHEN** a configured input is unavailable
- **THEN** the title reads "Moisture Recovery", the header "n/a", and no subtitle is shown

## MODIFIED Requirements

### Requirement: Header with direction words
The header SHALL show magnitudes without minus signs. Drying: subtitle "House drying", text "Recovered X of Y g/h
(N %)". Gaining: subtitle "House gaining (outdoor more humid)", text "Kept out X of Y g/h (N %)". The percentage
SHALL be omitted when Y is not positive.

#### Scenario: Drying header
- **WHEN** extracted is 250 g/h and recovered is 150 g/h
- **THEN** the subtitle reads "House drying" and the text "Recovered 150 of 250 g/h (60 %)"

#### Scenario: Gaining header
- **WHEN** extracted is -200 g/h and recovered is -120 g/h
- **THEN** the subtitle reads "House gaining (outdoor more humid)" and the text "Kept out 120 of 200 g/h (60 %)"

### Requirement: Neutral band
When the smoothed extract (indoor) and outdoor absolute humidity differ by less than the neutral threshold (default 0.3 g/m3, configurable), the subtitle SHALL read "Indoor ≈ outdoor" and the text
"within sensor accuracy", without a percentage.

#### Scenario: Within sensor accuracy
- **WHEN** indoor absolute humidity is 8.1 g/m3 and outdoor 7.9 g/m3
- **THEN** the title reads "Moisture Recovery", the subtitle "Indoor ≈ outdoor" and no percentage is shown
