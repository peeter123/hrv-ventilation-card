# Spec Delta

## Purpose

What a card shows before any of its entities are configured: built-in sample values instead of an error, so the
dashboard's card picker and a freshly added card show what the card looks like.

## ADDED Requirements

### Requirement: Sample values without entities
A card whose config has no entity role set SHALL render with built-in sample values for every role it shows,
instead of a configuration error. Options in that config SHALL still apply. Invalid options SHALL still be
reported as configuration errors.

#### Scenario: Empty config
- **WHEN** a card is given a config with only its type
- **THEN** it renders completely with sample values and no configuration error

#### Scenario: Options without entities
- **WHEN** an airflow diagram card's config sets only `exchanger_type: erv`
- **THEN** it renders the sample values with the ERV drawing

#### Scenario: Invalid option without entities
- **WHEN** a card's config sets only the smoothing window to -5
- **THEN** the card shows a configuration error that names the smoothing window

### Requirement: Real states once an entity is set
As soon as the config sets any entity role, the card SHALL use only the configured entities and their states, with
the usual checks for required roles. It SHALL NOT mix sample values with real ones.

#### Scenario: First entity picked
- **WHEN** the user picks only the outdoor air temperature in the airflow diagram card's editor
- **THEN** the preview shows the configuration error naming the missing supply, extract and exhaust air
  temperatures

### Requirement: Sample values are marked
A card showing sample values SHALL show a muted note "Sample values" on the card, so they are not mistaken for
measurements.

#### Scenario: Note shown
- **WHEN** a card renders with sample values
- **THEN** the note "Sample values" is visible on the card

#### Scenario: No note with real entities
- **WHEN** a card is fully configured
- **THEN** no sample note is shown

### Requirement: Sample values are a typical heating day
The sample SHALL describe one consistent operating point for all three cards. It SHALL be a heating day with the
bypass closed. The house is drying, the exchanger recovers heat and moisture, and the fans run at a medium flow. The
airflow card's sample SHALL include every role it shows in the full layout.

#### Scenario: Three cards side by side
- **WHEN** the three cards show sample values on the same dashboard
- **THEN** the diagram shows a warm saving badge, the recovery card shows "Heat Recovery" with both lanes, and the
  moisture card shows the house drying

### Requirement: Sample cards are not interactive
While a card shows sample values, its labels, badge and season icon SHALL NOT open a more-info dialog. The sample
SHALL NOT request history from Home Assistant.

#### Scenario: Tapping a sample label
- **WHEN** the user taps the supply air temperature label of a card with sample values
- **THEN** no more-info dialog opens

### Requirement: Sample values hold no installation identifiers
The sample SHALL use made-up identifiers that cannot name a real Home Assistant entity, and the bundle SHALL still
pass the check for installation identifiers.

#### Scenario: Searching the bundle
- **WHEN** the built module is searched for entity ID patterns of Home Assistant domains
- **THEN** no sample identifier matches
