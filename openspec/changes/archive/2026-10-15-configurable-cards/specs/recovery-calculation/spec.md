# Spec Delta

## Purpose

The live calculation shared by the cards: from a ventilation unit's raw sensors, how much heat or cooling the
exchanger recovers and loses (sensible and latent), and how much moisture is extracted, recovered and put outside,
without derived sensors or helpers in Home Assistant.

## ADDED Requirements

### Requirement: Inputs from raw sensors
The calculation SHALL take the temperature and absolute humidity of the outdoor, supply and extract air, the
supply flow and the bypass position. Without a bypass position the bypass SHALL count as 0 %.

#### Scenario: Unit without a bypass sensor
- **WHEN** no bypass position entity is configured
- **THEN** the calculation runs with the bypass at 0 %

### Requirement: Configurable air density
The calculation SHALL use an air density from the config for the sensible part of the enthalpy, default
1.2 kg/m³, the value the macro uses.

#### Scenario: Default density
- **WHEN** no air density is configured
- **THEN** the results equal the macro's for the same inputs

#### Scenario: Unit at altitude
- **WHEN** the air density is set to 1.0 kg/m³
- **THEN** the dry-air part of every sensible part is 1.0 / 1.2 of its value at the default density (the small
  vapour term in the sensible part does not depend on the density), and latent parts and moisture rates are
  unchanged

### Requirement: Units of the inputs
Temperatures SHALL be accepted in °C and °F, flows in m³/h, L/s and ft³/min, absolute humidity in g/m³ and
relative humidity and bypass position in %. An input with another unit SHALL count as having no value.

#### Scenario: Flow in litres per second
- **WHEN** the supply flow entity reports 64 L/s
- **THEN** the calculation uses 230.4 m³/h

### Requirement: Absolute humidity from relative humidity
When a stream has a relative humidity but no absolute humidity entity, the calculation SHALL compute its absolute
humidity from the relative humidity and the stream's temperature with the Magnus formula.

#### Scenario: Relative humidity only
- **WHEN** the extract air is 22.3 °C at 55 % relative humidity and has no absolute humidity entity
- **THEN** its absolute humidity is 10.86 g/m³ within 0.01 g/m³

### Requirement: Heating or cooling mode
The calculation SHALL be in cooling mode while the bypass is above 0 % or the outdoor air has a higher enthalpy
than the extract air, and in heating mode otherwise. It SHALL report free cooling while the bypass is above 0 % and
the extract air has the higher enthalpy: the recovered figures are then the cooling the supply air brings compared
with the indoor air, not what the exchanger recovers.

#### Scenario: Bypass open on a mild day
- **WHEN** the bypass is at 40 % and the outdoor air has a lower enthalpy than the extract air
- **THEN** the calculation is in cooling mode and reports free cooling

#### Scenario: Cooling without bypass
- **WHEN** the bypass is at 0 % and the outdoor air has a higher enthalpy than the extract air
- **THEN** the calculation is in cooling mode and does not report free cooling

### Requirement: Recovered and lost power
The calculation SHALL give, for the active mode, the signed sensible and latent power recovered by the exchanger
and still lost with the ventilation air, with the same formulas as the `comfoair_q450.jinja` macro, so that
recovered plus lost equals the load without recovery. The total saving SHALL be the recovered sum clamped at 0.

#### Scenario: Winter heating
- **WHEN** outdoor air is 0 °C / 4.0 g/m³, supply 17 °C / 6.5 g/m³, extract 21 °C / 7.5 g/m³, the supply flow
  230 m³/h and the bypass 0 %
- **THEN** the mode is heating, recovered is 1324 W sensible plus 400 W latent and lost is 314 W sensible plus
  160 W latent, within 1 W
- **AND** moisture recovered is 575 g/h, put outside 230 g/h and extracted 805 g/h

#### Scenario: Opposite signs
- **WHEN** the supply air is cooled while moisture is added, as in the documented case of 2026-09-30 12:00
- **THEN** the sensible part is negative and the latent part positive

### Requirement: Moisture rates
The calculation SHALL give in g/h the moisture extracted (supply flow times extract minus outdoor absolute
humidity), recovered (supply minus outdoor) and put outside (extract minus supply), signed, so that extracted
equals recovered plus put outside.

#### Scenario: House gaining moisture
- **WHEN** the outdoor air is more humid than the extract air
- **THEN** extracted is negative and still equals recovered plus put outside

### Requirement: Same results as the macro
The calculation SHALL reproduce the macro's results for a fixed table of input sets within 1 W and 1 g/h.

#### Scenario: Golden vectors
- **WHEN** the unit tests run the calculation on every input set in the vector table
- **THEN** every result matches the macro's result for that set within 1 W and 1 g/h

### Requirement: Sensible-only without humidity
Without humidity for any of the three streams, the calculation SHALL run on temperatures alone, give 0 W for all
latent parts and report that latent and moisture figures are unknown. A humidity for only some of the streams
SHALL be a configuration error.

#### Scenario: Temperatures only
- **WHEN** no humidity entities are configured
- **THEN** sensible parts are calculated, latent parts are 0 W and no moisture figures are given

### Requirement: Humidity smoothing
The calculation SHALL use a time-weighted moving average of each stream's absolute humidity over a configurable
window (default 10 minutes, 0 turns smoothing off), seeded from Home Assistant's history when a card loads and
extended with live updates. Until the history has loaded, or when it cannot be loaded, the current value SHALL be
used and the window filled from live updates.

#### Scenario: One whole-percent step
- **WHEN** the relative humidity steps by 1 % and stays there
- **THEN** the smoothed absolute humidity moves towards the new value over the window instead of jumping

#### Scenario: Smoothing off
- **WHEN** the smoothing window is 0
- **THEN** the calculation uses the current absolute humidity

#### Scenario: History not available
- **WHEN** loading the history fails
- **THEN** the card shows figures from the current values without an error

### Requirement: No value without complete inputs
When a required input has no value, the calculation SHALL give no figures rather than figures from the remaining
inputs.

#### Scenario: Supply flow unavailable
- **WHEN** the supply flow entity is unavailable
- **THEN** the calculation gives no figures
