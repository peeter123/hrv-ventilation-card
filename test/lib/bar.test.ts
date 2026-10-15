import { describe, expect, test } from 'vitest';
import { barScale, layoutSegments } from '../../src/lib/bar';

describe('barScale', () => {
  test('recovery-balance-card "Small values": parts summing to 120 W give the 500 W minimum', () => {
    expect(barScale([80, 20, 15, 5], 500)).toBe(500);
  });

  test('recovery-balance-card "Large values": parts summing to 760 W give 1000 W', () => {
    expect(barScale([500, 100, 120, 40], 500)).toBe(1000);
  });

  test('the sum is of absolute values, so opposite signs add up', () => {
    expect(barScale([600, -160], 500)).toBe(1000);
  });

  test('moisture-balance-card "Drying": 150 + 100 g/h on the 250 g/h minimum', () => {
    expect(barScale([150, 100], 250)).toBe(250);
  });

  test('a sum on a multiple of 250 is not rounded further', () => {
    expect(barScale([750], 500)).toBe(750);
    expect(barScale([751], 500)).toBe(1000);
  });

  test('a configured minimum scale applies when it is larger than the rounded sum', () => {
    expect(barScale([10], 750)).toBe(750);
    expect(barScale([], 500)).toBe(500);
  });

  test('float noise just above a step does not add a step', () => {
    const noisy = 0.1 * 3 * 2500; // 750.0000000000001
    expect(noisy).toBeGreaterThan(750);
    expect(barScale([noisy], 500)).toBe(750);
  });

  test('values and a minimum that are not finite count as 0', () => {
    expect(barScale([100, Number.NaN, Number.POSITIVE_INFINITY], 500)).toBe(500);
    expect(barScale([600], Number.NaN)).toBe(750);
  });

  test('a minimum below the step still gives the rounded sum', () => {
    expect(barScale([10], 100)).toBe(250);
    expect(barScale([0], 100)).toBe(100);
  });
});

describe('layoutSegments', () => {
  test('recovery-balance-card "Opposite signs": 200 W grows right and -50 W grows left of the zero line', () => {
    expect(layoutSegments([200, -50], 500)).toEqual([
      { left: 50, width: 20 },
      { left: 45, width: 5 },
    ]);
  });

  test('positive parts stack rightwards in order', () => {
    expect(layoutSegments([100, 50, 25], 250)).toEqual([
      { left: 50, width: 20 },
      { left: 70, width: 10 },
      { left: 80, width: 5 },
    ]);
  });

  test('negative parts stack leftwards in order', () => {
    expect(layoutSegments([-100, -50], 250)).toEqual([
      { left: 30, width: 20 },
      { left: 20, width: 10 },
    ]);
  });

  test('mixed signs keep their own side and order', () => {
    expect(layoutSegments([100, -50, 25, -25], 250)).toEqual([
      { left: 50, width: 20 },
      { left: 40, width: 10 },
      { left: 70, width: 5 },
      { left: 35, width: 5 },
    ]);
  });

  test('a full scale fills exactly one half', () => {
    const [segment] = layoutSegments([500], barScale([500], 500));
    expect(segment).toEqual({ left: 50, width: 50 });
  });

  test('a scale smaller than the values keeps every segment inside its half', () => {
    const segments = layoutSegments([400, 300, -600], 500);
    expect(segments).toEqual([
      { left: 50, width: 40 },
      { left: 90, width: 10 },
      { left: 0, width: 50 },
    ]);
    for (const { left, width } of segments) {
      expect(left).toBeGreaterThanOrEqual(0);
      expect(left + width).toBeLessThanOrEqual(100);
    }
  });

  test('stacked segments touch without gaps and end exactly at the sum', () => {
    const segments = layoutSegments([100, 100, 100, 100, 100, 100, 100], 750);
    for (let i = 1; i < segments.length; i++) {
      const previous = segments[i - 1];
      const current = segments[i];
      expect(current?.left).toBeCloseTo((previous?.left ?? 0) + (previous?.width ?? 0), 10);
    }
    const last = segments.at(-1);
    expect((last?.left ?? 0) + (last?.width ?? 0)).toBeCloseTo(50 + (700 / 750) * 50, 12);
  });

  test('a value that is not finite takes no width', () => {
    expect(layoutSegments([Number.NaN, 100], 250)).toEqual([
      { left: 50, width: 0 },
      { left: 50, width: 20 },
    ]);
  });

  test('zero takes no width, and a scale of 0 gives no widths', () => {
    expect(layoutSegments([0], 500)).toEqual([{ left: 50, width: 0 }]);
    expect(layoutSegments([100, -100], 0)).toEqual([
      { left: 50, width: 0 },
      { left: 50, width: 0 },
    ]);
  });
});
