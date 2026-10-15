# card-bundle Specification

## Purpose

One Lovelace module that delivers all ventilation cards, makes them discoverable in the dashboard UI and gives
them shared, installation-independent rules for units and unavailable sensors, without depending on other files.

## Requirements

### Requirement: Single module registers all cards
Loading the module once as a Lovelace resource SHALL register `hrv-ventilation-card`, `hrv-recovery-balance-card`
and `hrv-moisture-balance-card`. Loading it a second time (for example under another URL) SHALL NOT throw and
SHALL NOT re-register an element that is already defined.

#### Scenario: Module loaded once
- **WHEN** the module is added as a resource of type module and a dashboard is opened
- **THEN** all three custom element types are defined

#### Scenario: Module loaded twice
- **WHEN** the same module is loaded from two different URLs
- **THEN** no error is raised and each element type is defined exactly once

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

### Requirement: No installation-specific identifiers in the bundle
The built module SHALL NOT contain entity IDs, device serials or other identifiers of a particular installation.
Stub configs SHALL either leave entities empty or fill them from entities present in the user's own installation.

#### Scenario: Searching the bundle
- **WHEN** the built module is searched for entity ID patterns such as `sensor.` followed by a name
- **THEN** no installation's entity IDs are found

### Requirement: Advanced settings switch in the editor
Each card's visual editor SHALL have an "Advanced settings" switch. While it is off, the editor SHALL hide the
card's advanced settings; while it is on, each advanced setting SHALL appear in the section it belongs to. The
switch SHALL NOT be written to the card config, and SHALL start on when any advanced setting in the config differs
from its default.

#### Scenario: Default editor
- **WHEN** a user opens the editor of a card whose config only has basic settings
- **THEN** the switch is off and no advanced setting is shown

#### Scenario: Advanced value already set
- **WHEN** a user opens the editor of a card whose config sets the smoothing window to 5 minutes
- **THEN** the switch is on and the smoothing window shows 5

#### Scenario: Switch not saved
- **WHEN** the user turns the switch on and saves the card
- **THEN** the saved config contains no key for the switch

#### Scenario: Form editor not available
- **WHEN** Home Assistant's form element is not available in the editor
- **THEN** the editor shows a message to use the YAML editor instead of an empty form

### Requirement: Self-contained module
The module SHALL be a single file that needs no other files (images, stylesheets, fonts) at runtime, so it works
unchanged when served from `/local/`, from HACS or from an integration's static path.

#### Scenario: Only the module is served
- **WHEN** only the module file is available under any base path
- **THEN** all three cards render completely, without failed requests for other files

### Requirement: Installable through HACS
The repository SHALL be installable as a HACS custom repository of type Dashboard: `hacs.json` in the repository
root names it "HRV Ventilation Card", and `dist/` holds the module under the repository's name,
`hrv-ventilation-card.js`.

#### Scenario: Added as a custom repository
- **WHEN** a user adds the GitHub repository `peeter123/hrv-ventilation-card` to HACS as a custom repository of
  type Dashboard and downloads it
- **THEN** HACS lists it as "HRV Ventilation Card", installs `hrv-ventilation-card.js`, and the three cards appear
  in the card picker

### Requirement: Invalid options are reported
A card SHALL reject a config whose options have invalid values (a number outside its allowed range, a value of the
wrong type, an unknown choice) with a configuration error that names the option and what it accepts, and SHALL NOT
fall back to the default silently. An option that is left out SHALL use its default.

#### Scenario: Negative smoothing window
- **WHEN** the config sets the smoothing window to -5
- **THEN** the card shows a configuration error that names the smoothing window and its allowed range

#### Scenario: Air density as text
- **WHEN** the config sets the air density to the text "heavy"
- **THEN** the card shows a configuration error that names the air density

#### Scenario: Option left out
- **WHEN** the config has no smoothing window
- **THEN** the card uses the default of 10 minutes without an error

### Requirement: Units are read from the entities
Cards SHALL read the unit of every calculation input from the entity's unit of measurement, as listed in the
recovery-calculation spec, and SHALL display calculated power in W and moisture rates in g/h.

#### Scenario: Temperature in Fahrenheit
- **WHEN** a configured temperature entity reports 68 with unit °F
- **THEN** the card calculates with 20 °C

#### Scenario: Unsupported unit
- **WHEN** a configured flow entity reports a unit other than m³/h, L/s or ft³/min
- **THEN** the card treats that entity as unavailable

### Requirement: Unavailable inputs are shown as n/a
A card SHALL show "n/a" for a figure when an entity that figure needs is missing from Home Assistant,
unavailable, unknown or non-numeric, and SHALL NOT show figures computed from the remaining inputs. Which entities
each figure needs is defined in the card's own spec.

#### Scenario: Input of a figure unavailable
- **WHEN** an entity that a figure needs is unavailable
- **THEN** that figure shows "n/a" instead of a value computed from the other inputs

### Requirement: Numbers follow the user's locale
Numbers that a card computes itself SHALL be formatted with the Home Assistant locale settings (language and
number format), with magnitudes formatted by the locale and negative values written with a "−" sign.

#### Scenario: Thousands separator
- **WHEN** the user's number format uses a period as thousands separator and a bar shows 1250 W
- **THEN** the value reads "1.250 W"

### Requirement: Cards re-render only when their inputs change
A card SHALL re-render when its config changes, when the state or attributes of an entity in its config change,
or when the Home Assistant locale, the registry entry of one of its entities or the dark mode setting changes. It
SHALL NOT re-render for other updates from Home Assistant.

#### Scenario: Unrelated entity changes
- **WHEN** an entity that is not in a card's config changes state
- **THEN** that card does not re-render

#### Scenario: Editing the config
- **WHEN** the user changes a colour in the card's visual editor
- **THEN** the editor preview re-renders with the new colour

#### Scenario: Registry entry changed
- **WHEN** the display precision of an entity in the card's config is changed in Home Assistant
- **THEN** the card re-renders

### Requirement: Sizing in the sections view
Each card SHALL default to the full width of a section in the sections view and SHALL let its height follow its
content instead of a fixed number of grid rows.

#### Scenario: Card in a section
- **WHEN** a card is added to a section of a sections view
- **THEN** it spans the section's width and its full content is visible without clipping or empty space

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

### Requirement: Numbers stay with their units
Every text the cards write themselves SHALL join a number to its unit (W, g/h, g/m³, %) with a no-break space, so
a line never breaks between them at any card width.

#### Scenario: Narrow card
- **WHEN** the recovery balance card's header "Recovered 1,306 W of 1,768 W (74 %)" does not fit on one line
- **THEN** it breaks between words, never between "74" and "%" or between "1,306" and "W"
