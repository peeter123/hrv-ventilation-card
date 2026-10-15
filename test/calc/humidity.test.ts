import { describe, expect, test } from 'vitest';
import { absoluteHumidity } from '../../src/calc/humidity';

/** The result, failing clearly when there is none. */
const ah = (temperature: number, relativeHumidity: number): number => {
  const result = absoluteHumidity(temperature, relativeHumidity);
  expect(result).toBeDefined();
  return result ?? NaN;
};

describe('absoluteHumidity', () => {
  test('recovery-calculation "Relative humidity only": extract air 22.3 °C at 55 % is 10.86 g/m³ within 0.01', () => {
    expect(Math.abs(ah(22.3, 55) - 10.86)).toBeLessThanOrEqual(0.01);
  });

  test("design.md outdoor check: 14.7 °C at 87 % is 10.95 g/m³ (the unit's own sensor read 10.948)", () => {
    expect(Math.abs(ah(14.7, 87) - 10.95)).toBeLessThanOrEqual(0.005);
  });

  test('0 % gives 0 g/m³, and absolute humidity rises with temperature at the same relative humidity', () => {
    expect(ah(20, 0)).toBe(0);
    expect(ah(25, 50)).toBeGreaterThan(ah(15, 50));
  });

  test('below freezing uses the coefficients over water', () => {
    expect(ah(-10, 80)).toBeCloseTo(1.8896, 4);
  });

  test('100 % is accepted, a relative humidity outside 0 to 100 % has no value', () => {
    expect(ah(20, 100)).toBeCloseTo(17.3, 1);
    expect(absoluteHumidity(20, -1)).toBeUndefined();
    expect(absoluteHumidity(20, 100.5)).toBeUndefined();
    expect(absoluteHumidity(20, 255)).toBeUndefined();
  });

  test('a temperature outside -100 to 100 °C, or values that are not finite, have no value', () => {
    expect(absoluteHumidity(-100, 50)).toBeDefined();
    expect(absoluteHumidity(-243.5, 50)).toBeUndefined(); // the pole of the formula
    expect(absoluteHumidity(-250, 50)).toBeUndefined();
    expect(absoluteHumidity(-273.15, 50)).toBeUndefined();
    expect(absoluteHumidity(100.1, 50)).toBeUndefined();
    expect(absoluteHumidity(Number.NaN, 50)).toBeUndefined();
    expect(absoluteHumidity(20, Number.POSITIVE_INFINITY)).toBeUndefined();
  });
});
