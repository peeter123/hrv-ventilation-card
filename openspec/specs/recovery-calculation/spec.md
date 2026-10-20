# recovery-calculation Specification

## Purpose

The live calculation shared by the cards: from a ventilation unit's raw sensors, how much heat or cooling the
exchanger recovers and loses (sensible and latent), and how much moisture is extracted, recovered and put outside,
without derived sensors or helpers in Home Assistant.

## Requirements

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

### Requirement: Effectiveness of the unit
The calculation SHALL give the unit's total effectiveness, the recovered total (sensible plus latent) divided by the
recovered and lost total, which is the recovery balance card's recovered percentage, in every mode, free cooling
included; without humidity it is the sensible share. It SHALL also give the moisture effectiveness, (supply -
outdoor) / (extract - outdoor) of the absolute humidities. Both are in % and capped to 0-100 %.

#### Scenario: Winter heating
- **WHEN** outdoor air is 0 °C / 4.0 g/m³, supply 17 °C / 6.5 g/m³, extract 21 °C / 7.5 g/m³ and the bypass 0 %
- **THEN** the total effectiveness is 78 % and the moisture effectiveness 71 %, within 1 %

#### Scenario: Latent heat counts
- **WHEN** outdoor air is 0 °C / 4.0 g/m³, supply 17 °C / 4.0 g/m³, extract 21 °C / 7.5 g/m³ and the bypass 0 %,
  as for an HRV
- **THEN** the total effectiveness is 60 %, lower than the 81 % of the temperatures, because the latent heat of the
  extracted moisture is lost

#### Scenario: Matches the recovery card
- **WHEN** the recovery balance card shows a recovered percentage for the same inputs
- **THEN** the total effectiveness equals it within 1 %

#### Scenario: Outdoor air more humid
- **WHEN** outdoor air is 14.0 g/m³, supply 13.0 g/m³ and extract 12.0 g/m³
- **THEN** the moisture effectiveness is 50 %, positive: the unit keeps half of the extra moisture out

#### Scenario: Ratio below 0
- **WHEN** the gradient is large enough but the supply air is further from the extract air than the outdoor air is,
  for example outdoor 10.0 °C, supply 9.5 °C and extract 20.0 °C without humidity
- **THEN** the total effectiveness is 0 %

#### Scenario: Ratio above 100
- **WHEN** fan heat puts the supply air above the extract air, for example outdoor 5 °C, supply 21.5 °C and extract
  21 °C without humidity
- **THEN** the total effectiveness is 100 %

### Requirement: Effectiveness at any bypass position
Both effectiveness figures SHALL be given at any bypass position, so with the bypass open they describe the unit as a
whole, not the exchanger alone.

#### Scenario: Free cooling
- **WHEN** the bypass is at 40 %, no humidity is configured, outdoor air is 12 °C, supply 14 °C and extract 22 °C
- **THEN** the total effectiveness is 80 %, the share of the cooling delivered, as on the recovery balance card

### Requirement: Effectiveness needs a gradient
The total effectiveness SHALL be given only while the extract and outdoor enthalpies differ by at least what 3 K of
dry air gives (air density × 1006 × 3 J/m³, 3.6 kJ/m³ at 1.2 kg/m³), and the moisture effectiveness only while their
absolute humidities differ by at least 1.5 g/m³ and every stream has a humidity. Below its gradient a figure SHALL be
absent, as not measurable, independently of the other.

#### Scenario: Small gradient
- **WHEN** the extract air is 22 °C and the outdoor air 20 °C, both at 8.0 g/m³
- **THEN** no total effectiveness is given

#### Scenario: Humid summer day
- **WHEN** outdoor air is 24 °C / 14.0 g/m³, supply 23.2 °C / 11.0 g/m³ and extract 23 °C / 10.0 g/m³
- **THEN** the total effectiveness is given, 76 %, although the temperatures differ by only 1 K

#### Scenario: One figure gated
- **WHEN** the temperatures differ by 8 K and the absolute humidities by 0.7 g/m³
- **THEN** the total effectiveness is given and the moisture effectiveness is absent

#### Scenario: No humidity configured
- **WHEN** no humidity entities are configured and the temperatures differ by 10 K
- **THEN** the total effectiveness is given and the moisture effectiveness is absent

### Requirement: Effectiveness needs a potential
Neither effectiveness figure SHALL be given while there is no potential to recover: a supply flow of 0, or a potential
that rounds to 0 W (the total) or the extracted moisture to 0 g/h (the moisture), as the recovery balance card's header
shows no percentage at a potential of 0.

#### Scenario: Unit in standby
- **WHEN** the supply flow is 0 and the extract and outdoor air differ by 17 K and 3.5 g/m³
- **THEN** neither the total nor the moisture effectiveness is given

### Requirement: Effectiveness matches the macro
For every input set in the vector table with a gradient above the gate and a supply flow above 0, the calculation's total effectiveness SHALL
match the macro's recovered total divided by its recovered and lost totals, capped to 0-100 %, and, where the bypass is at 0 % and the
macro's `eff_moisture` is between 0 and 100 %, its moisture effectiveness SHALL match `eff_moisture`, both within 1 %.

#### Scenario: Golden vectors
- **WHEN** the unit tests run the calculation on the vector table
- **THEN** the total effectiveness matches the macro's recovered share on every set above the gate, and the moisture
  effectiveness matches `eff_moisture` on every set where the macro gives a value from 0 to 100 %
