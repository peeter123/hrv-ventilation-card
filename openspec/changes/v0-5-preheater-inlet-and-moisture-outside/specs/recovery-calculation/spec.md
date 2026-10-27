# Spec Delta

## MODIFIED Requirements

### Requirement: Inputs from raw sensors
The calculation SHALL take the temperature and absolute humidity of the outdoor, supply and extract air, the
supply flow and the bypass position. Without a bypass position the bypass SHALL count as 0 %. It SHALL also take,
when configured, the pre-heater's power and the temperature and relative humidity of the air after the pre-heater.

#### Scenario: Unit without a bypass sensor
- **WHEN** no bypass position entity is configured
- **THEN** the calculation runs with the bypass at 0 %

#### Scenario: Unit without pre-heater roles
- **WHEN** none of the pre-heater roles is configured
- **THEN** the calculation gives the same figures as before this change for every input set

### Requirement: Recovered and lost power
The calculation SHALL give, for the active mode, the signed sensible and latent power recovered by the exchanger
and still lost with the ventilation air, with the same formulas as the `comfoair_q450.jinja` macro, so that
recovered plus lost equals the load without recovery, minus the pre-heater part while the pre-heater runs. The total
saving SHALL be the recovered sum clamped at 0.

#### Scenario: Winter heating
- **WHEN** outdoor air is 0 °C / 4.0 g/m³, supply 17 °C / 6.5 g/m³, extract 21 °C / 7.5 g/m³, the supply flow
  230 m³/h and the bypass 0 %
- **THEN** the mode is heating, recovered is 1324 W sensible plus 400 W latent and lost is 314 W sensible plus
  160 W latent, within 1 W
- **AND** moisture recovered is 575 g/h, put outside 230 g/h and extracted 805 g/h

#### Scenario: Opposite signs
- **WHEN** the supply air is cooled while moisture is added, as in the documented case of 2026-09-30 12:00
- **THEN** the sensible part is negative and the latent part positive

#### Scenario: Pre-heater running
- **WHEN** no humidity is configured, outdoor air is -6 °C, the air after the pre-heater -1 °C, supply 15 °C,
  extract 21 °C, the supply flow 200 m³/h, the bypass 0 % and the pre-heater power 400 W
- **THEN** recovered is 1073 W, lost 402 W and the pre-heater part 335 W, within 1 W, and the saving is 1073 W
  (1408 W without the after temperature)

### Requirement: Effectiveness needs a gradient
The total effectiveness SHALL be given only while the extract enthalpy and the exchanger's inlet enthalpy differ by
at least what 3 K of dry air gives (air density × 1006 × 3 J/m³, 3.6 kJ/m³ at 1.2 kg/m³), and the moisture
effectiveness only while the extract and outdoor absolute humidities differ by at least 1.5 g/m³ and every stream has
a humidity. Below its gradient a figure SHALL be absent, as not measurable, independently of the other.

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

#### Scenario: Gradient on the inlet
- **WHEN** no humidity is configured, the pre-heater runs, the extract air is 21 °C, the outdoor air 15 °C and the air
  after the pre-heater 19 °C
- **THEN** no total effectiveness is given: the exchanger's inlet is only 2 K from the extract air

## ADDED Requirements

### Requirement: Pre-heater running
The pre-heater SHALL count as running while its power entity is on: a numeric state above 0, or the state `on`.
Without a power entity, or while it has no value, it SHALL count as running while the air after the pre-heater is at
least 0.5 K warmer than the outdoor air. It SHALL count as running only in heating mode, and only while an after
temperature is configured.

#### Scenario: Power above 0
- **WHEN** the pre-heater power reads 350 W and the after temperature is configured
- **THEN** the pre-heater counts as running, whatever the two temperatures read

#### Scenario: Power 0 with a sensor offset
- **WHEN** the pre-heater power reads 0 W and the after temperature reads 0.3 K above the outdoor temperature
- **THEN** the pre-heater does not run and the figures equal those without the pre-heater roles

#### Scenario: No power entity
- **WHEN** no pre-heater power is configured and the after temperature reads 0.3 K, then 0.6 K above the outdoor
  temperature
- **THEN** the pre-heater does not run at 0.3 K and runs at 0.6 K

#### Scenario: Cooling mode
- **WHEN** the bypass is at 40 % and the pre-heater power reads 100 W
- **THEN** the pre-heater does not count as running and the figures equal those without the pre-heater roles

### Requirement: Exchanger inlet after the pre-heater
While the pre-heater runs, the exchanger's inlet SHALL be the air after the pre-heater instead of the outdoor air in
the recovered and lost parts and the total effectiveness. Its temperature SHALL be the after temperature. Its
absolute humidity SHALL come from the after temperature and humidity when an after humidity is configured, smoothed
as the streams' humidities, and from the outdoor air otherwise. The mode, the moisture rates and the moisture
effectiveness SHALL keep using the outdoor air.

#### Scenario: Only the after temperature
- **WHEN** the pre-heater runs, humidity is configured for the three streams and no after humidity is configured
- **THEN** the latent parts equal those without the pre-heater roles, and only the sensible parts change

#### Scenario: Moisture figures unchanged
- **WHEN** the pre-heater runs with an after temperature and an after humidity configured
- **THEN** the moisture rates and the moisture effectiveness equal those without the pre-heater roles

#### Scenario: Effectiveness of the exchanger
- **WHEN** no humidity is configured, outdoor air is -6 °C, the air after the pre-heater -1 °C, supply 15 °C, extract
  21 °C and the pre-heater runs
- **THEN** the total effectiveness is 73 %, (15 - (-1)) / (21 - (-1)), instead of 78 % without the after temperature

### Requirement: Pre-heater part
The calculation SHALL give the pre-heater part, sensible and latent, in W: the enthalpy of the inlet minus that of the
outdoor air, times the supply flow, while the pre-heater runs, and 0 W otherwise. Recovered, lost and the pre-heater
part SHALL sum to the load without recovery.

#### Scenario: Parts sum to the load
- **WHEN** the pre-heater runs, with or without humidity configured
- **THEN** recovered plus lost plus the pre-heater part equals the extract minus the outdoor enthalpy times the supply
  flow, within 1 W, in the sensible and in the latent part

#### Scenario: After humidity differs from the outdoor humidity
- **WHEN** the pre-heater runs and the after pair gives 0.1 g/m³ more than the outdoor air at 200 m³/h
- **THEN** the pre-heater part has a latent part of 14 W, within 1 W, and the latent recovered part is 14 W less than
  without the after humidity

### Requirement: Pre-heater input without a value
While the pre-heater runs by its power entity and the after temperature has no value, the calculation SHALL give no
figures. While the pre-heater does not run, an after temperature or humidity without a value SHALL NOT affect the
figures. An after humidity without a value while the pre-heater runs SHALL give no figures.

#### Scenario: After temperature unavailable while off
- **WHEN** the pre-heater power reads 0 W and the after temperature is unavailable
- **THEN** the calculation gives the figures it gives without the pre-heater roles

#### Scenario: After temperature unavailable while running
- **WHEN** the pre-heater power reads 500 W and the after temperature is unavailable
- **THEN** the calculation gives no figures

### Requirement: Pre-heater vectors
The vector table SHALL hold input sets with the pre-heater running, not running with a sensor offset, and with and
without an after humidity. Sets with only the after temperature SHALL match the macro's results within 1 W; sets with
an after humidity, which the macro does not take, SHALL match values computed from the formulas and recorded in the
table.

#### Scenario: Pre-heater sets
- **WHEN** the unit tests run the calculation on the pre-heater sets of the vector table
- **THEN** every result matches its expected values within 1 W and 1 g/h, and the total effectiveness within 1 %
