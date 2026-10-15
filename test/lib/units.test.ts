import { describe, expect, test } from 'vitest';
import { toCalcUnit } from '../../src/lib/units';

describe('toCalcUnit', () => {
  test('card-bundle "Temperature in Fahrenheit": 68 °F is 20 °C', () => {
    expect(toCalcUnit('temperature', 68, '°F')).toBeCloseTo(20, 10);
  });

  test('temperature in °C is unchanged', () => {
    expect(toCalcUnit('temperature', 21.4, '°C')).toBe(21.4);
  });

  test('recovery-calculation "Flow in litres per second": 64 L/s is 230.4 m³/h', () => {
    expect(toCalcUnit('flow', 64, 'L/s')).toBeCloseTo(230.4, 10);
  });

  test('flow in ft³/min converts to m³/h', () => {
    expect(toCalcUnit('flow', 100, 'ft³/min')).toBeCloseTo(169.901, 3);
  });

  test('flow in m³/h, absolute humidity in g/m³ and percentages are unchanged', () => {
    expect(toCalcUnit('flow', 230, 'm³/h')).toBe(230);
    expect(toCalcUnit('absolute_humidity', 7.5, 'g/m³')).toBe(7.5);
    expect(toCalcUnit('relative_humidity', 55, '%')).toBe(55);
    expect(toCalcUnit('percentage', 40, '%')).toBe(40);
  });

  test('card-bundle "Unsupported unit": a flow in another unit has no value', () => {
    expect(toCalcUnit('flow', 230, 'L/min')).toBeUndefined();
    expect(toCalcUnit('flow', 230, 'gal/min')).toBeUndefined();
  });

  test('other unsupported units and a missing unit have no value', () => {
    expect(toCalcUnit('temperature', 293.15, 'K')).toBeUndefined();
    expect(toCalcUnit('absolute_humidity', 0.0075, 'kg/m³')).toBeUndefined();
    expect(toCalcUnit('relative_humidity', 0.55, undefined)).toBeUndefined();
    expect(toCalcUnit('percentage', 40, '')).toBeUndefined();
  });

  test('names of object prototype members are not units', () => {
    for (const unit of ['constructor', 'toString', 'valueOf', '__proto__', 'hasOwnProperty']) {
      expect(toCalcUnit('flow', 230, unit)).toBeUndefined();
    }
  });

  test('ASCII and single-character spellings of the same units, and surrounding spaces, are accepted', () => {
    expect(toCalcUnit('flow', 230, 'm3/h')).toBe(230);
    expect(toCalcUnit('flow', 230, ' m³/h ')).toBe(230);
    expect(toCalcUnit('flow', 100, 'ft3/min')).toBeCloseTo(169.901, 3);
    expect(toCalcUnit('absolute_humidity', 7.5, 'g/m3')).toBe(7.5);
    expect(toCalcUnit('temperature', 21, '℃')).toBe(21);
    expect(toCalcUnit('temperature', 68, '℉')).toBeCloseTo(20, 10);
    expect(toCalcUnit('temperature', 21, 'ºC')).toBe(21);
    expect(toCalcUnit('temperature', 68, 'ºF')).toBeCloseTo(20, 10);
    expect(toCalcUnit('flow', 64, 'l/s')).toBeCloseTo(230.4, 10);
    expect(toCalcUnit('flow', 64, 'L/S')).toBeCloseTo(230.4, 10);
  });

  test('a value that is not a finite number has no value, whatever the unit', () => {
    expect(toCalcUnit('temperature', Number.NaN, '°F')).toBeUndefined();
    expect(toCalcUnit('flow', Number.POSITIVE_INFINITY, 'm³/h')).toBeUndefined();
    expect(toCalcUnit('flow', Number.NEGATIVE_INFINITY, 'L/s')).toBeUndefined();
  });

  test('a unit of another quantity does not convert', () => {
    expect(toCalcUnit('temperature', 55, '%')).toBeUndefined();
    expect(toCalcUnit('flow', 21, '°C')).toBeUndefined();
  });
});
