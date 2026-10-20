import { describe, expect, test } from 'vitest';
import { coilPoints, glowShare, PATHS } from '../../src/diagram/drawing';

// The supply path's centreline: its cubic Bezier sampled finely, to measure the coil's distance from it.
const [x0, y0, x1, y1, x2, y2, x3, y3] = (/^M (.+) C (.+)$/.exec(PATHS.supply) ?? [])
  .slice(1)
  .join(' ')
  .split(' ')
  .map(Number) as [number, number, number, number, number, number, number, number];
const CENTRE = Array.from({ length: 2001 }, (_, i) => {
  const t = i / 2000;
  const u = 1 - t;
  return {
    x: u ** 3 * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3 * x3,
    y: u ** 3 * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * y3,
  };
});
const HALF_WIDTH = 7;
const distance = (point: { x: number; y: number }): number =>
  Math.min(...CENTRE.map((c) => Math.hypot(c.x - point.x, c.y - point.y)));

describe('the pre-heater coil geometry', () => {
  const points = coilPoints();

  test('airflow-diagram-card "Coil drawn": the first and last points sit on the stream borders', () => {
    const [first, last] = [points[0], points[points.length - 1]] as [(typeof points)[0], (typeof points)[0]];
    expect(Math.abs(distance(first) - HALF_WIDTH)).toBeLessThan(0.5);
    expect(Math.abs(distance(last) - HALF_WIDTH)).toBeLessThan(0.5);
    // On opposite borders: the first above the centreline, the last below it.
    const above = (p: { x: number; y: number }): boolean =>
      p.y < CENTRE.reduce((a, b) => (Math.abs(b.x - p.x) < Math.abs(a.x - p.x) ? b : a)).y;
    expect(above(first)).toBe(true);
    expect(above(last)).toBe(false);
  });

  test('airflow-diagram-card "Coil drawn": the wave stays within the stream width, over x 100 to 128', () => {
    for (const point of points) {
      expect(distance(point)).toBeLessThanOrEqual(HALF_WIDTH + 0.5);
      expect(point.x).toBeGreaterThan(99);
      expect(point.x).toBeLessThan(129);
    }
  });

  test('airflow-diagram-card "Coil drawn": three crests on each side', () => {
    const side = points.map((p) => distance(p) > HALF_WIDTH - 0.3);
    const crests = side.filter((near, i) => near && !side[i - 1]).length;
    expect(crests).toBe(6);
  });
});

describe('glowShare', () => {
  test('airflow-diagram-card "Partial glow": 30 + 70 x level', () => {
    expect(glowShare(0.25)).toBeCloseTo(47.5);
    expect(glowShare(0.1)).toBeCloseTo(37);
    expect(glowShare(1)).toBe(100);
  });
});
