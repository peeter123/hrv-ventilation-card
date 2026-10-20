# Spec Delta

## ADDED Requirements

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
