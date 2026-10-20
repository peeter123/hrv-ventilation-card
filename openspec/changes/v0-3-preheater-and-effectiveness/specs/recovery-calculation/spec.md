# Spec Delta

## ADDED Requirements

### Requirement: Effectiveness of the unit
The calculation SHALL give the unit's supply-side temperature effectiveness, (supply - outdoor) / (extract -
outdoor) of the temperatures, and its moisture effectiveness, the same ratio of the absolute humidities, in %. Each
figure SHALL be capped to 0-100 %. Both SHALL be given at any bypass position, so with the bypass open they describe
the unit as a whole, not the exchanger alone.

#### Scenario: Winter heating
- **WHEN** outdoor air is 0 °C / 4.0 g/m³, supply 17 °C / 6.5 g/m³, extract 21 °C / 7.5 g/m³ and the bypass 0 %
- **THEN** the temperature effectiveness is 81 % and the moisture effectiveness 71 %, within 1 %

#### Scenario: Bypass modulating
- **WHEN** the bypass is at 40 %, outdoor air is 12 °C, supply 17 °C and extract 22 °C
- **THEN** the temperature effectiveness is 50 %

#### Scenario: Outdoor air more humid
- **WHEN** outdoor air is 14.0 g/m³, supply 13.0 g/m³ and extract 12.0 g/m³
- **THEN** the moisture effectiveness is 50 %, positive: the unit keeps half of the extra moisture out

#### Scenario: Ratio below 0
- **WHEN** the gradient is large enough but the supply air is further from the extract air than the outdoor air is,
  for example outdoor 10.0 °C, supply 9.5 °C and extract 20.0 °C
- **THEN** the temperature effectiveness is 0 %

#### Scenario: Ratio above 100
- **WHEN** fan heat puts the supply air above the extract air, for example outdoor 5 °C, supply 21.5 °C and extract
  21 °C
- **THEN** the temperature effectiveness is 100 %

### Requirement: Effectiveness needs a gradient
The temperature effectiveness SHALL be given only while the extract and outdoor temperatures differ by at least
3 K, and the moisture effectiveness only while their absolute humidities differ by at least 1.5 g/m³ and every
stream has a humidity. Below its gradient a figure SHALL be absent, as not measurable, independently of the other.

#### Scenario: Small temperature gradient
- **WHEN** the extract air is 22 °C and the outdoor air 20 °C
- **THEN** no temperature effectiveness is given

#### Scenario: One figure gated
- **WHEN** the temperatures differ by 8 K and the absolute humidities by 0.7 g/m³
- **THEN** the temperature effectiveness is given and the moisture effectiveness is absent

#### Scenario: No humidity configured
- **WHEN** no humidity entities are configured and the temperatures differ by 10 K
- **THEN** the temperature effectiveness is given and the moisture effectiveness is absent

### Requirement: Effectiveness matches the macro
For every input set in the vector table with the bypass at 0 %, a gradient above the gate and a macro result
between 0 and 100 %, the calculation's effectiveness SHALL match the macro's `eff_sensible` and `eff_moisture`
within 1 %.

#### Scenario: Golden vectors
- **WHEN** the unit tests run the calculation on the vector table
- **THEN** both effectiveness figures match the macro's on every set where the macro gives a value from 0 to 100 %
