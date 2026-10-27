import { describe, expect, test } from 'vitest';
import { preHeaterRunning } from '../../src/lib/preheater';

const power = (state: string, unit = 'W') => ({ state, attributes: { unit_of_measurement: unit } });

describe('preHeaterRunning', () => {
  test('a power above 0 W runs', () => {
    expect(preHeaterRunning(power('350'))).toBe(true);
    expect(preHeaterRunning(power('0.5', 'kW'))).toBe(true);
  });

  test('0 W or less does not run', () => {
    expect(preHeaterRunning(power('0'))).toBe(false);
    expect(preHeaterRunning(power('-5'))).toBe(false);
  });

  test('on runs and off does not', () => {
    expect(preHeaterRunning({ state: 'on', attributes: {} })).toBe(true);
    expect(preHeaterRunning({ state: 'off', attributes: {} })).toBe(false);
  });

  test('no reading is undefined', () => {
    expect(preHeaterRunning({ state: 'unavailable', attributes: {} })).toBeUndefined();
    expect(preHeaterRunning({ state: 'unknown', attributes: {} })).toBeUndefined();
    expect(preHeaterRunning({ state: 'heating', attributes: {} })).toBeUndefined();
    expect(preHeaterRunning(undefined)).toBeUndefined();
  });

  test('a power in an unsupported unit is undefined', () => {
    expect(preHeaterRunning(power('350', 'BTU/h'))).toBeUndefined();
  });
});
