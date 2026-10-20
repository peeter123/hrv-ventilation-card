# Spec Delta

## ADDED Requirements

### Requirement: Editor shows defaults without writing them
Each card's visual editor SHALL show every option the config leaves unset at its default value, without writing
that default into the config. The config SHALL only change at the field the user edits. A section that was in the
config SHALL stay in it, also when it ends up empty. A default the config already sets SHALL stay in it.

#### Scenario: Shown default
- **WHEN** a user opens the editor of an airflow diagram card whose config sets no `exchanger_type` or `layout`
- **THEN** the exchanger type shows HRV, and with the advanced settings on, the layout shows automatic

#### Scenario: Unrelated edit writes no default
- **WHEN** the user then picks a supply flow entity and saves
- **THEN** the saved config contains the supply flow but no `exchanger_type`, `layout` or other default

#### Scenario: Empty section kept
- **WHEN** the config has an `animation` section with only `nominal_flow`, and the user clears the nominal flow
- **THEN** the saved config still contains an empty `animation` section

#### Scenario: Typing the default into an unset field
- **WHEN** the config sets no smoothing window and the user enters 10, its default
- **THEN** the saved config contains no smoothing window

#### Scenario: Default already set
- **WHEN** the config sets `exchanger_type: hrv` and the user changes another field
- **THEN** the saved config still contains `exchanger_type: hrv`
