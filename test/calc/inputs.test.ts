import { beforeEach, describe, expect, test } from 'vitest';
import { absoluteHumidity } from '../../src/calc/humidity';
import { createCalculator } from '../../src/calc/inputs';
import { calculateRecovery } from '../../src/calc/recovery';
import { SmoothingStore, type SmoothingHass } from '../../src/calc/smoothing';
import type { CardConfig } from '../../src/lib/config';
import type { HassEntityState } from '../../src/lib/hass';

const NOW = Date.parse('2026-10-13T12:00:00Z');

const state = (entity_id: string, value: string, unit?: string, time = NOW): HassEntityState => ({
  entity_id,
  state: value,
  attributes: unit ? { unit_of_measurement: unit } : {},
  last_updated: new Date(time).toISOString(),
});

// The winter_design golden vector as entity states.
const STATES = [
  state('sensor.outdoor_t', '0', '°C'),
  state('sensor.outdoor_ah', '4.0', 'g/m³'),
  state('sensor.supply_t', '17', '°C'),
  state('sensor.supply_ah', '6.5', 'g/m³'),
  state('sensor.extract_t', '21', '°C'),
  state('sensor.extract_ah', '7.5', 'g/m³'),
  state('sensor.supply_flow', '230', 'm³/h'),
  state('sensor.bypass', '0', '%'),
];

const COMPLETE: CardConfig = {
  outdoor: { temperature: 'sensor.outdoor_t', absolute_humidity: 'sensor.outdoor_ah' },
  supply: { temperature: 'sensor.supply_t', absolute_humidity: 'sensor.supply_ah' },
  extract: { temperature: 'sensor.extract_t', absolute_humidity: 'sensor.extract_ah' },
  fans: { supply_flow: 'sensor.supply_flow' },
  bypass: { position: 'sensor.bypass' },
};

const hassWith = (states: HassEntityState[]): SmoothingHass => ({
  states: Object.fromEntries(states.map((s) => [s.entity_id, s])),
  // History never arrives in these tests: the store uses the current values.
  callWS: () => new Promise(() => undefined),
});

/** One calculation with a calculator built for the call (cards keep one per config). */
const calculateFromConfig = (config: CardConfig, hass: SmoothingHass, store: SmoothingStore) =>
  createCalculator(config, store)(hass);

const replace = (states: HassEntityState[], next: HassEntityState): HassEntityState[] =>
  states.map((s) => (s.entity_id === next.entity_id ? next : s));

describe('calculateFromConfig', () => {
  let store: SmoothingStore;
  beforeEach(() => {
    store = new SmoothingStore();
  });

  test('a complete config gives the figures of the calculation for its entities', () => {
    const { inputs, result } = calculateFromConfig(COMPLETE, hassWith(STATES), store);
    expect(inputs).toEqual({
      temperature: { outdoor: 0, supply: 17, extract: 21 },
      absoluteHumidity: { outdoor: 4.0, supply: 6.5, extract: 7.5 },
      supplyFlow: 230,
      bypass: 0,
      airDensity: 1.2,
    });
    expect(result).toEqual(calculateRecovery(inputs));
    expect(Math.round(result?.recovered.sensible ?? NaN)).toBe(1324);
  });

  test('a relative-humidity-only config computes absolute humidity from relative humidity and temperature', () => {
    const states = [
      state('sensor.outdoor_t', '14.7', '°C'),
      state('sensor.outdoor_rh', '87', '%'),
      state('sensor.supply_t', '19', '°C'),
      state('sensor.supply_rh', '70', '%'),
      state('sensor.extract_t', '22.3', '°C'),
      state('sensor.extract_rh', '55', '%'),
      state('sensor.supply_flow', '230', 'm³/h'),
    ];
    const config = {
      outdoor: { temperature: 'sensor.outdoor_t', humidity: 'sensor.outdoor_rh' },
      supply: { temperature: 'sensor.supply_t', humidity: 'sensor.supply_rh' },
      extract: { temperature: 'sensor.extract_t', humidity: 'sensor.extract_rh' },
      fans: { supply_flow: 'sensor.supply_flow' },
    };
    const { inputs, result } = calculateFromConfig(config, hassWith(states), store);
    expect(inputs.absoluteHumidity?.extract).toBeCloseTo(absoluteHumidity(22.3, 55) ?? NaN, 9);
    expect(inputs.absoluteHumidity?.outdoor).toBeCloseTo(10.949, 3);
    // recovery-calculation "Unit without a bypass sensor": the bypass counts as 0 %.
    expect(inputs.bypass).toBe(0);
    expect(result?.latentKnown).toBe(true);
  });

  test('a temperatures-only config is sensible-only', () => {
    const config = {
      outdoor: { temperature: 'sensor.outdoor_t' },
      supply: { temperature: 'sensor.supply_t' },
      extract: { temperature: 'sensor.extract_t' },
      fans: { supply_flow: 'sensor.supply_flow' },
    };
    const { inputs, result } = calculateFromConfig(config, hassWith(STATES), store);
    expect(inputs.temperature.outdoor).toBe(0);
    expect(inputs.absoluteHumidity).toBeUndefined();
    expect(result?.latentKnown).toBe(false);
    expect(result?.moisture).toBeUndefined();
  });

  test('one unavailable input has no value and gives no figures', () => {
    const states = replace(STATES, state('sensor.supply_flow', 'unavailable'));
    const { inputs, result } = calculateFromConfig(COMPLETE, hassWith(states), store);
    expect(inputs.supplyFlow).toBeUndefined();
    expect(result).toBeUndefined();
  });

  test('a configured bypass or humidity without a value gives no figures', () => {
    const noBypass = calculateFromConfig(COMPLETE, hassWith(replace(STATES, state('sensor.bypass', 'unknown'))), store);
    expect(noBypass.inputs.bypass).toBeUndefined();
    expect(noBypass.result).toBeUndefined();

    const noHumidity = calculateFromConfig(
      COMPLETE,
      hassWith(replace(STATES, state('sensor.extract_ah', 'unavailable'))),
      new SmoothingStore(),
    );
    expect(noHumidity.inputs.absoluteHumidity?.extract).toBeUndefined();
    expect(noHumidity.result).toBeUndefined();
  });

  test('units are converted: °F, L/s', () => {
    const states = replace(
      replace(STATES, state('sensor.supply_t', String((17 * 9) / 5 + 32), '°F')),
      state('sensor.supply_flow', '63.8889', 'L/s'),
    );
    const { inputs } = calculateFromConfig(COMPLETE, hassWith(states), store);
    expect(inputs.temperature.supply).toBeCloseTo(17, 9);
    expect(inputs.supplyFlow).toBeCloseTo(230, 3);
  });

  test('an input in an unknown unit has no value', () => {
    const states = replace(STATES, state('sensor.supply_flow', '230', 'L/min'));
    expect(calculateFromConfig(COMPLETE, hassWith(states), store).inputs.supplyFlow).toBeUndefined();
  });

  test('the air density from the config is used; an invalid one falls back to the default, like smoothing', () => {
    const altitude = calculateFromConfig({ ...COMPLETE, air_density: 1.0 }, hassWith(STATES), store);
    expect(altitude.inputs.airDensity).toBe(1.0);
    expect(altitude.result).toBeDefined();
    for (const air_density of ['heavy', null, 0, -1, 3]) {
      expect(calculateFromConfig({ ...COMPLETE, air_density }, hassWith(STATES), store).inputs.airDensity).toBe(1.2);
    }
  });

  test('a smoothing window too large for a date does not throw', () => {
    expect(() => calculateFromConfig({ ...COMPLETE, smoothing: 1e12 }, hassWith(STATES), store)).not.toThrow();
  });

  test('a humidity that becomes unavailable gives no figures, even with earlier samples in the shared store', () => {
    expect(calculateFromConfig(COMPLETE, hassWith(STATES), store).result).toBeDefined();
    const unavailable = replace(STATES, state('sensor.extract_ah', 'unavailable', undefined, NOW + 60_000));
    const { inputs, result } = calculateFromConfig(COMPLETE, hassWith(unavailable), store);
    expect(inputs.absoluteHumidity?.extract).toBeUndefined();
    expect(result).toBeUndefined();
  });

  test('a humidity entity that disappears gives no figures, not the old average', () => {
    expect(calculateFromConfig(COMPLETE, hassWith(STATES), store).result).toBeDefined();
    const gone = STATES.filter((s) => s.entity_id !== 'sensor.extract_ah');
    const { inputs, result } = calculateFromConfig(COMPLETE, hassWith(gone), store);
    expect(inputs.absoluteHumidity?.extract).toBeUndefined();
    expect(result).toBeUndefined();
  });

  test('the smoothing time only counts the entities the calculation uses', () => {
    // Relative humidity is configured next to absolute humidity but not used; its update must not move the time.
    const config = { ...COMPLETE, extract: { ...(COMPLETE['extract'] as object), humidity: 'sensor.extract_rh' } };
    const calculate = createCalculator(config, store);
    const states = [...STATES, state('sensor.extract_rh', '55', '%', NOW + 60 * 60_000)];
    expect(calculate(hassWith(states)).result).toBeDefined();
  });

  test('smoothing uses the config window at the latest update of any input', async () => {
    const smoothed = { ...COMPLETE, smoothing: 10 };
    // No history (the call fails), so the window fills from live states.
    const failing = (states: HassEntityState[]): SmoothingHass => ({
      ...hassWith(states),
      callWS: () => Promise.reject(new Error('no history')),
    });
    calculateFromConfig(
      smoothed,
      failing(replace(STATES, state('sensor.extract_ah', '7.5', 'g/m³', NOW - 60 * 60_000))),
      store,
    );
    await Promise.resolve();
    await Promise.resolve();
    // The extract humidity steps to 7.7 at NOW and stays; the supply flow updates 5 minutes later. The average is
    // taken at that later update: 7.5 for 5 of the 10 minutes, 7.7 for the other 5.
    const later = replace(
      replace(STATES, state('sensor.extract_ah', '7.7', 'g/m³', NOW)),
      state('sensor.supply_flow', '230', 'm³/h', NOW + 5 * 60_000),
    );
    const { inputs } = calculateFromConfig(smoothed, failing(later), store);
    expect(inputs.absoluteHumidity?.extract).toBeCloseTo(7.6, 9);
  });

  describe('the pre-heater', () => {
    const AFTER_STATES = [
      ...STATES,
      state('sensor.after_t', '5', '°C'),
      state('sensor.after_rh', '60', '%'),
      state('sensor.pre_heater_power', '350', 'W'),
    ];
    // The derived series is stamped with the later of its two entities, so both start an hour back.
    const EARLIER = replace(
      replace(AFTER_STATES, state('sensor.after_rh', '60', '%', NOW - 3600_000)),
      state('sensor.after_t', '5', '°C', NOW - 3600_000),
    );
    const withPreHeater = (preHeater: Record<string, string>): CardConfig => ({ ...COMPLETE, pre_heater: preHeater });
    const TEMPERATURE_ONLY = withPreHeater({ temperature_after: 'sensor.after_t', power: 'sensor.pre_heater_power' });
    const BOTH = withPreHeater({
      temperature_after: 'sensor.after_t',
      humidity_after: 'sensor.after_rh',
      power: 'sensor.pre_heater_power',
    });

    test('without the roles the inputs have no pre-heater block', () => {
      expect(calculateFromConfig(COMPLETE, hassWith(AFTER_STATES), store).inputs).not.toHaveProperty('preHeater');
      // The power and the humidity alone do not make a block: it needs the temperature after.
      const config = withPreHeater({ power: 'sensor.pre_heater_power', humidity_after: 'sensor.after_rh' });
      expect(calculateFromConfig(config, hassWith(AFTER_STATES), store).inputs).not.toHaveProperty('preHeater');
    });

    test('the temperature after alone gives a block without the humidity key', () => {
      const { inputs } = calculateFromConfig(TEMPERATURE_ONLY, hassWith(AFTER_STATES), store);
      expect(inputs.preHeater).toEqual({ on: true, temperatureAfter: 5 });
      expect(inputs.preHeater).not.toHaveProperty('absoluteHumidityAfter');
    });

    test('without a power entity the pre-heater state is undefined', () => {
      const config = withPreHeater({ temperature_after: 'sensor.after_t' });
      expect(calculateFromConfig(config, hassWith(AFTER_STATES), store).inputs.preHeater?.on).toBeUndefined();
    });

    test('the humidity after is derived from its relative humidity and temperature, smoothed over the window', async () => {
      const smoothed = { ...BOTH, smoothing: 10 };
      const failing = (states: HassEntityState[]): SmoothingHass => ({
        ...hassWith(states),
        callWS: () => Promise.reject(new Error('no history')),
      });
      expect(
        calculateFromConfig(BOTH, hassWith(AFTER_STATES), new SmoothingStore()).inputs.preHeater?.absoluteHumidityAfter,
      ).toBeCloseTo(absoluteHumidity(5, 60) ?? NaN, 9);

      calculateFromConfig(smoothed, failing(EARLIER), store);
      await Promise.resolve();
      await Promise.resolve();
      // The relative humidity steps to 80 % at NOW; the supply flow updates 5 minutes later, so half the window each.
      const later = replace(
        replace(AFTER_STATES, state('sensor.after_rh', '80', '%', NOW)),
        state('sensor.supply_flow', '230', 'm³/h', NOW + 5 * 60_000),
      );
      const { inputs } = calculateFromConfig(smoothed, failing(later), store);
      const expected = ((absoluteHumidity(5, 60) ?? NaN) + (absoluteHumidity(5, 80) ?? NaN)) / 2;
      expect(inputs.preHeater?.absoluteHumidityAfter).toBeCloseTo(expected, 9);
    });

    test('the pre-heater entities move the smoothing time', async () => {
      const smoothed = { ...BOTH, smoothing: 10 };
      const failing = (states: HassEntityState[]): SmoothingHass => ({
        ...hassWith(states),
        callWS: () => Promise.reject(new Error('no history')),
      });
      calculateFromConfig(smoothed, failing(EARLIER), store);
      await Promise.resolve();
      await Promise.resolve();
      const later = replace(
        replace(AFTER_STATES, state('sensor.after_rh', '80', '%', NOW)),
        state('sensor.pre_heater_power', '350', 'W', NOW + 5 * 60_000),
      );
      const { inputs } = calculateFromConfig(smoothed, failing(later), store);
      const expected = ((absoluteHumidity(5, 60) ?? NaN) + (absoluteHumidity(5, 80) ?? NaN)) / 2;
      expect(inputs.preHeater?.absoluteHumidityAfter).toBeCloseTo(expected, 9);
    });

    test.each([
      ['350', 'W', true],
      ['0', 'W', false],
      ['on', undefined, true],
      ['off', undefined, false],
      ['unavailable', undefined, undefined],
    ])('the power entity reading %s %s gives on %s', (value, unit, on) => {
      const states = replace(AFTER_STATES, state('sensor.pre_heater_power', value, unit));
      expect(calculateFromConfig(TEMPERATURE_ONLY, hassWith(states), store).inputs.preHeater?.on).toBe(on);
    });

    test('a running pre-heater changes the recovered figures, a stopped one does not', () => {
      const plain = calculateFromConfig(COMPLETE, hassWith(AFTER_STATES), store).result;
      const running = calculateFromConfig(BOTH, hassWith(AFTER_STATES), store).result;
      const stopped = calculateFromConfig(
        BOTH,
        hassWith(replace(AFTER_STATES, state('sensor.pre_heater_power', '0', 'W'))),
        new SmoothingStore(),
      ).result;
      expect(running?.recovered.sensible).not.toBeCloseTo(plain?.recovered.sensible ?? NaN, 3);
      expect(stopped?.recovered).toEqual(plain?.recovered);
    });
  });
});
