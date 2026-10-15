# Spec Delta

## MODIFIED Requirements

### Requirement: Cards are listed in the card picker
Each card SHALL appear in the dashboard's card picker with a name, a description that does not mention a specific
installation and a rendered preview of the card, and SHALL provide a stub config so it can be added from the
picker. The preview SHALL show the card with its sample values (see the card-preview spec), not a configuration
error.

#### Scenario: Adding a card from the picker
- **WHEN** a user opens "Add card" on a dashboard with the module loaded
- **THEN** the three cards are listed with a generic name and description, each next to a preview of the card
  showing sample values
- **AND** choosing one opens its visual editor with the stub config

#### Scenario: Installation without a ventilation unit
- **WHEN** the module is loaded in an installation with no ventilation entities
- **THEN** the three previews still render with sample values and no configuration error

### Requirement: Card titles and legend items in title case
Every card title and every legend item of the bar cards SHALL be in title case: each word starts with a capital
letter, also after a colon or an opening parenthesis, except the minor words a, an, and, as, at, but, by, for, in,
nor, of, on, or, the, to and with, which stay lower case when they are not the first word. A minor word that is part
of a phrasal verb is capitalised with its verb, as in "Outdoor Air Brings In". Numbers and units (W, g/h, g/m³) keep their own
form. Other texts (headers, subtitles, notes, labels) stay in sentence case.

#### Scenario: Recovery title
- **WHEN** the recovery balance card is in heating mode
- **THEN** the title reads "Heat Recovery"

#### Scenario: Moisture title
- **WHEN** the moisture balance card shows the house drying
- **THEN** the title reads "Moisture Recovery" and the subtitle, in sentence case, "House drying"

#### Scenario: Legend items
- **WHEN** the recovery balance card shows a lost part
- **THEN** the legend reads "Lost 80 W"
