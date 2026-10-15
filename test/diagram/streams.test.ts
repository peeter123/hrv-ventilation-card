import { describe, expect, test } from 'vitest';
import {
  bypassStrength,
  mixColor,
  NO_TEMPERATURE_COLOR,
  temperatureColors,
  temperaturePositions,
} from '../../src/diagram/streams';
import type { Stream } from '../../src/lib/config';
import type { EntityStateLike } from '../../src/lib/hass';

const COLORS = { cold: '#039be5', warm: '#db4437' };

const temperatures = (
  values: [number | string, number | string, number | string, number | string],
  unit = '°C',
): Record<Stream, EntityStateLike> => {
  const state = (value: number | string): EntityStateLike => ({
    state: String(value),
    attributes: { unit_of_measurement: unit },
  });
  const [outdoor, supply, extract, exhaust] = values;
  return { outdoor: state(outdoor), supply: state(supply), extract: state(extract), exhaust: state(exhaust) };
};

describe('bypassStrength', () => {
  test('airflow-diagram-card "Bypass half open" and "Bypass fully open"', () => {
    expect(bypassStrength({ state: '50' })).toBe(0.5);
    expect(bypassStrength({ state: '100' })).toBe(1);
  });

  test('airflow-diagram-card "No bypass entity": strength 0, also for a state that is not numeric', () => {
    expect(bypassStrength(undefined)).toBe(0);
    expect(bypassStrength({ state: 'unavailable' })).toBe(0);
    expect(bypassStrength({ state: 'open' })).toBe(0);
  });

  test('the position is clamped to 0 to 100 %', () => {
    expect(bypassStrength({ state: '-5' })).toBe(0);
    expect(bypassStrength({ state: '140' })).toBe(1);
  });
});

describe('temperatureColors', () => {
  test('airflow-diagram-card "Winter": outdoor in the cold colour, extract in the warm colour', () => {
    const colors = temperatureColors(temperatures([0, 18, 21, 3]), COLORS);
    expect(colors.outdoor).toBe(COLORS.cold);
    expect(colors.extract).toBe(COLORS.warm);
    expect(colors.supply).toBe('color-mix(in srgb, #db4437 85.7%, #039be5)');
  });

  test('airflow-diagram-card "Mild day": all four ends close to the midpoint', () => {
    const positions = temperaturePositions(temperatures([20.0, 20.4, 20.6, 20.2]));
    for (const position of Object.values(positions)) expect(Math.abs((position ?? 0) - 0.5)).toBeLessThan(0.04);
  });

  test('airflow-diagram-card "Summer, outdoor warmer than indoor": outdoor towards warm, extract towards cold', () => {
    const positions = temperaturePositions(temperatures([30, 26, 24, 28]));
    expect(positions.outdoor).toBeCloseTo(0.8);
    expect(positions.extract).toBeCloseTo(0.2);
  });

  test('the range is centred midway between the coldest and warmest, not on the mean', () => {
    // The mean is 5 °C; centred on it, the three 0 °C ends would not reach the cold colour.
    const positions = temperaturePositions(temperatures([0, 0, 0, 20]));
    expect(positions).toEqual({ outdoor: 0, supply: 0, extract: 0, exhaust: 1 });
    expect(temperaturePositions(temperatures([18, 20, 20, 20])).outdoor).toBeCloseTo(0.4);
  });

  test('airflow-diagram-card "Temperatures in Fahrenheit": the same colours as the °C values', () => {
    const fahrenheit = temperatureColors(temperatures([32, 64.4, 69.8, 37.4], '°F'), COLORS);
    expect(fahrenheit).toEqual(temperatureColors(temperatures([0, 18, 21, 3]), COLORS));
  });

  test('airflow-diagram-card "Temperature unavailable": that end is grey, the others use the rest', () => {
    const colors = temperatureColors(temperatures([0, 18, 21, 'unavailable']), COLORS);
    expect(colors.exhaust).toBe(NO_TEMPERATURE_COLOR);
    expect(colors.outdoor).toBe(COLORS.cold);
    expect(colors.extract).toBe(COLORS.warm);
  });

  test('a temperature in another unit, or a missing entity, is grey', () => {
    const states = temperatures([0, 18, 21, 3]);
    states.supply = { state: '291', attributes: { unit_of_measurement: 'K' } };
    const colors = temperatureColors({ ...states, extract: undefined }, COLORS);
    expect(colors.supply).toBe(NO_TEMPERATURE_COLOR);
    expect(colors.extract).toBe(NO_TEMPERATURE_COLOR);
  });

  test('no usable temperature at all gives four grey ends', () => {
    const colors = temperatureColors(temperatures(['unknown', 'unknown', 'unknown', 'unknown']), COLORS);
    expect(new Set(Object.values(colors))).toEqual(new Set([NO_TEMPERATURE_COLOR]));
  });
});

describe('mixColor', () => {
  test('mixes between the two configured colours, whatever their syntax', () => {
    const colors = { cold: 'var(--blue-color)', warm: 'orange' };
    expect(mixColor(0.5, colors)).toBe('color-mix(in srgb, orange 50%, var(--blue-color))');
    expect(mixColor(0, colors)).toBe('var(--blue-color)');
    expect(mixColor(1, colors)).toBe('orange');
    expect(mixColor(undefined, colors)).toBe(NO_TEMPERATURE_COLOR);
  });
});
